import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { fetchScoreboard, fetchEventScoreboard, parseCompetitorRound, AUGUSTA_PARS } from '@/lib/espn/client';
import { detectScoringEvents } from '@/lib/scoring/calculator';
import { recalculateAll } from '@/lib/scoring/calculator';

export async function POST(request: Request) {
  const supabase = createServiceClient();
  const body = await request.json();
  const { tournament_id } = body;

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

    // Get our golfers
    const { data: golfers } = await supabase
      .from('golfers')
      .select('*')
      .eq('tournament_id', tournament_id);

    // Build name -> golfer map (case-insensitive)
    const golferMap = new Map<string, typeof golfers extends (infer T)[] | null ? T : never>();
    for (const g of golfers ?? []) {
      golferMap.set(g.name.toLowerCase().trim(), g);
      if (g.espn_athlete_id) {
        golferMap.set(`espn_${g.espn_athlete_id}`, g);
      }
    }

    let updated = 0;
    const unmatched: string[] = [];

    for (const competitor of competition.competitors) {
      // Match by ESPN athlete ID first, then by name
      const golfer =
        golferMap.get(`espn_${competitor.athlete.id}`) ??
        golferMap.get(competitor.athlete.fullName.toLowerCase().trim()) ??
        golferMap.get(competitor.athlete.displayName.toLowerCase().trim());

      if (!golfer) {
        unmatched.push(competitor.athlete.fullName);
        continue;
      }

      // Update ESPN athlete ID for future matching
      if (!golfer.espn_athlete_id) {
        await supabase
          .from('golfers')
          .update({ espn_athlete_id: competitor.athlete.id })
          .eq('id', golfer.id);
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
      const madeCut = !isCut && competitor.linescores?.some((ls) => ls.period >= 3);

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
    });

    return NextResponse.json({
      success: true,
      updated,
      unmatched,
      total_competitors: competition.competitors.length,
    });
  } catch (err: any) {
    await supabase.from('score_fetch_log').insert({
      tournament_id,
      status: 'error',
      error_message: err.message,
    });

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
