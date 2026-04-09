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

    for (const competitor of competition.competitors) {
      const athleteId = getCompetitorAthleteId(competitor);

      // Match by ESPN athlete ID first, then by normalized name (strips diacritics)
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
        await supabase
          .from('golfers')
          .update({ espn_athlete_id: athleteId })
          .eq('id', golfer.id);
        // Also update our local map
        golferByEspnId.set(athleteId, golfer);
      }

      // Process each round
      for (let roundNum = 1; roundNum <= 4; roundNum++) {
        const roundData = parseCompetitorRound(competitor, roundNum);
        if (!roundData) continue;

        await supabase.from('golfer_scores').upsert(
          {
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
          },
          { onConflict: 'golfer_id,round_number' }
        );
        updated++;
      }

      // Update golfer results with position and cut status
      const isCut = competitor.status?.type?.name === 'STATUS_CUT';
      const madeCut = !isCut && competitor.linescores?.some((ls) => ls.period >= 3 && ls.value != null);

      await supabase.from('golfer_results').upsert(
        {
          golfer_id: golfer.id,
          tournament_id,
          final_position: competitor.order || null,
          made_cut: madeCut ?? false,
        },
        { onConflict: 'golfer_id,tournament_id' }
      );
    }

    // Recalculate all points
    await recalculateAll(tournament_id);

    // Log
    await supabase.from('score_fetch_log').insert({
      tournament_id,
      status: 'success',
      golfers_updated: updated,
      source,
    });

    return NextResponse.json({
      success: true,
      updated,
      matched: matched.length,
      unmatched,
      total_competitors: competition.competitors.length,
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
