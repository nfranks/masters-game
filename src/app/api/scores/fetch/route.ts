import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { fetchScoreboard, fetchEventScoreboard, parseCompetitorRound, getCompetitorAthleteId, AUGUSTA_PARS } from '@/lib/espn/client';
import { recalculateAll } from '@/lib/scoring/calculator';

// Normalize names by stripping diacritics for matching (Åberg → Aberg, García → Garcia)
function normalizeName(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export async function POST(request: Request) {
  const supabase = createServiceClient();
  const body = await request.json();
  const { tournament_id, source = 'manual' } = body;

  // Get tournament config
  const { data: tournament } = await supabase
    .from('tournament_config')
    .select('*')
    .eq('id', tournament_id)
    .single();

  if (!tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }

  try {
    // Fetch from ESPN
    const espnData = tournament.espn_event_id
      ? await fetchEventScoreboard(tournament.espn_event_id)
      : await fetchScoreboard();

    if (!espnData.events?.length) {
      return NextResponse.json({ error: 'No events found from ESPN' }, { status: 400 });
    }

    const event = espnData.events[0];
    const competition = event.competitions?.[0];
    if (!competition?.competitors?.length) {
      return NextResponse.json({ error: 'No competitors found' }, { status: 400 });
    }

    // Auto-save the ESPN event ID if we didn't have one
    if (!tournament.espn_event_id && event.id) {
      await supabase
        .from('tournament_config')
        .update({ espn_event_id: event.id })
        .eq('id', tournament_id);
    }

    // Get our golfers
    const { data: golfers } = await supabase
      .from('golfers')
      .select('*')
      .eq('tournament_id', tournament_id);

    // Build lookup maps: espn ID -> golfer, normalized name -> golfer
    type GolferRow = NonNullable<typeof golfers>[number];
    const golferByEspnId = new Map<string, GolferRow>();
    const golferByName = new Map<string, GolferRow>();
    for (const g of golfers ?? []) {
      golferByName.set(normalizeName(g.name), g);
      if (g.espn_athlete_id) {
        golferByEspnId.set(g.espn_athlete_id, g);
      }
    }

    let updated = 0;
    const unmatched: string[] = [];
    const matched: string[] = [];

    // Detect cut: ESPN often has no STATUS_CUT data, so we derive it.
    // Method 1: Explicit ESPN status (ideal but often missing)
    const espnHasCutStatus = competition.competitors.some(
      (c: any) => c.status?.type?.name === 'STATUS_CUT'
    );

    // Method 2: Compute from R1+R2 totals (Masters: top 50 + ties)
    // Only applies once R2 is complete (period >= 2)
    const tournamentPeriod = competition.status?.period ?? 1;
    let computedCutLine: number | null = null;
    const competitorR2Totals = new Map<string, number>();

    if (!espnHasCutStatus && tournamentPeriod >= 2) {
      for (const c of competition.competitors) {
        const r1 = c.linescores?.find((ls: any) => ls.period === 1);
        const r2 = c.linescores?.find((ls: any) => ls.period === 2);
        if (r1?.value && r2?.value) {
          const total = r1.value + r2.value;
          const id = c.athlete?.id || c.id;
          if (id) competitorR2Totals.set(id, total);
        }
      }

      if (competitorR2Totals.size > 0) {
        const sortedTotals = [...competitorR2Totals.values()].sort((a, b) => a - b);
        if (sortedTotals.length >= 50) {
          computedCutLine = sortedTotals[49];
        }
      }
    }

    const cutHasHappened = espnHasCutStatus || computedCutLine !== null;

    // Collect all upserts in batches instead of sequential awaits
    const scoreUpserts: any[] = [];
    const resultUpserts: any[] = [];
    const espnIdUpdates: Promise<any>[] = [];

    for (const competitor of competition.competitors) {
      const athleteId = getCompetitorAthleteId(competitor);

      const golfer =
        (athleteId ? golferByEspnId.get(athleteId) : null) ??
        golferByName.get(normalizeName(competitor.athlete.fullName)) ??
        golferByName.get(normalizeName(competitor.athlete.displayName));

      if (!golfer) {
        unmatched.push(competitor.athlete.fullName);
        continue;
      }

      matched.push(golfer.name);

      // Update ESPN athlete ID for future matching if we matched by name
      if (athleteId && golfer.espn_athlete_id !== athleteId) {
        espnIdUpdates.push(
          Promise.resolve(supabase.from('golfers').update({ espn_athlete_id: athleteId }).eq('id', golfer.id))
        );
        golferByEspnId.set(athleteId, golfer);
      }

      // Collect round scores
      for (let roundNum = 1; roundNum <= 4; roundNum++) {
        const roundData = parseCompetitorRound(competitor, roundNum);
        if (!roundData) continue;

        scoreUpserts.push({
          golfer_id: golfer.id,
          tournament_id,
          round_number: roundNum,
          total_strokes: roundData.totalStrokes,
          score_to_par: roundData.scoreToPar,
          hole_scores: roundData.holeScores.length ? roundData.holeScores : null,
          hole_pars: AUGUSTA_PARS,
          eagles: roundData.eagles,
          double_eagles: roundData.doubleEagles,
          holes_in_one: roundData.holesInOne,
          source: 'espn',
        });
        updated++;
      }

      // Determine cut status
      let isCut = competitor.status?.type?.name === 'STATUS_CUT';
      if (!espnHasCutStatus && computedCutLine !== null) {
        const compId = getCompetitorAthleteId(competitor);
        const r2Total = compId ? competitorR2Totals.get(compId) : undefined;
        isCut = r2Total != null ? r2Total > computedCutLine : true;
      }
      const madeCut = cutHasHappened && !isCut;

      resultUpserts.push({
        golfer_id: golfer.id,
        tournament_id,
        final_position: competitor.order || null,
        made_cut: madeCut ?? false,
      });
    }

    // Execute all DB writes in parallel batches (Supabase upsert supports arrays)
    const BATCH_SIZE = 50;
    const dbPromises: Promise<any>[] = [...espnIdUpdates];

    for (let i = 0; i < scoreUpserts.length; i += BATCH_SIZE) {
      const batch = scoreUpserts.slice(i, i + BATCH_SIZE);
      dbPromises.push(
        Promise.resolve(supabase.from('golfer_scores').upsert(batch, { onConflict: 'golfer_id,round_number' }))
      );
    }

    for (let i = 0; i < resultUpserts.length; i += BATCH_SIZE) {
      const batch = resultUpserts.slice(i, i + BATCH_SIZE);
      dbPromises.push(
        Promise.resolve(supabase.from('golfer_results').upsert(batch, { onConflict: 'golfer_id,tournament_id' }))
      );
    }

    await Promise.all(dbPromises);

    // Recalculate all points
    await recalculateAll(tournament_id);

    // Log
    await supabase.from('score_fetch_log').insert({
      tournament_id,
      status: 'success',
      golfers_updated: updated,
      source,
    });

    // Count how many made/missed cut
    const madeCutCount = competition.competitors.filter((c) => {
      if (espnHasCutStatus) return c.status?.type?.name !== 'STATUS_CUT';
      if (computedCutLine === null) return false;
      const compId = c.athlete?.id || c.id;
      const r2Total = compId ? competitorR2Totals.get(compId) : undefined;
      return r2Total != null && r2Total <= computedCutLine;
    }).length;

    return NextResponse.json({
      success: true,
      updated,
      matched: matched.length,
      unmatched,
      total_competitors: competition.competitors.length,
      cut_detection: espnHasCutStatus ? 'espn_status' : computedCutLine ? 'computed_r2' : 'none',
      cut_line: computedCutLine,
      made_cut_count: madeCutCount,
    });
  } catch (err: any) {
    await supabase.from('score_fetch_log').insert({
      tournament_id,
      status: 'error',
      error_message: err.message,
      source,
    });

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
