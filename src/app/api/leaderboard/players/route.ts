import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  let tournamentId = searchParams.get('tournament_id');

  let tournament: any = null;

  if (!tournamentId) {
    const { data } = await supabase
      .from('tournament_config')
      .select('*')
      .order('year', { ascending: false })
      .limit(1)
      .single();
    tournament = data;
    tournamentId = tournament?.id ?? null;
  } else {
    const { data } = await supabase
      .from('tournament_config')
      .select('*')
      .eq('id', tournamentId)
      .single();
    tournament = data;
  }

  if (!tournamentId) return NextResponse.json([]);

  // Don't reveal player data while entries are open
  if (tournament?.status === 'open') return NextResponse.json([]);

  // Get all golfers for this tournament
  const { data: golfers } = await supabase
    .from('golfers')
    .select('id, name, world_ranking, group:groups ( name )')
    .eq('tournament_id', tournamentId);

  if (!golfers?.length) return NextResponse.json([]);

  // Get entry counts per golfer
  const { data: entryGolfers } = await supabase
    .from('entry_golfers')
    .select('golfer_id, entry:entries!inner ( id, is_archived )')
    .in('golfer_id', golfers.map((g) => g.id));

  const entryCountMap = new Map<string, number>();
  for (const eg of entryGolfers ?? []) {
    const entry = eg.entry as any;
    if (entry?.is_archived) continue;
    entryCountMap.set(eg.golfer_id, (entryCountMap.get(eg.golfer_id) ?? 0) + 1);
  }

  // Get total active entries count
  const { count: totalEntries } = await supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId)
    .eq('is_archived', false);

  // Get golfer results
  const { data: results } = await supabase
    .from('golfer_results')
    .select('*')
    .eq('tournament_id', tournamentId);

  const resultsMap = new Map((results ?? []).map((r) => [r.golfer_id, r]));

  // Get golfer scores
  const { data: scores } = await supabase
    .from('golfer_scores')
    .select('*')
    .eq('tournament_id', tournamentId);

  const scoresMap = new Map<string, typeof scores>();
  for (const score of scores ?? []) {
    const existing = scoresMap.get(score.golfer_id) ?? [];
    existing.push(score);
    scoresMap.set(score.golfer_id, existing);
  }

  // Build player leaderboard
  const players = golfers.map((golfer) => {
    const result = resultsMap.get(golfer.id);
    const golferScores = scoresMap.get(golfer.id) ?? [];
    const entryCount = entryCountMap.get(golfer.id) ?? 0;

    const totalEagles = golferScores.reduce(
      (sum, s) => sum + (s.eagles ?? 0) + (s.double_eagles ?? 0),
      0
    );
    const totalHios = golferScores.reduce((sum, s) => sum + (s.holes_in_one ?? 0), 0);

    return {
      golfer: {
        id: golfer.id,
        name: golfer.name,
        world_ranking: golfer.world_ranking,
        group: golfer.group,
      },
      result: result
        ? {
            total_points: result.total_points,
            daily_points: result.daily_points,
            tournament_points: result.tournament_points,
            total_score_to_par: result.total_score_to_par,
            made_cut: result.made_cut,
            final_position: result.final_position,
            is_best_round_of_tournament: result.is_best_round_of_tournament,
          }
        : null,
      scores: golferScores.map((s) => ({
        round_number: s.round_number,
        total_strokes: s.total_strokes,
        score_to_par: s.score_to_par,
        eagles: s.eagles,
        double_eagles: s.double_eagles,
        holes_in_one: s.holes_in_one,
        hole_scores: s.hole_scores,
        is_best_round_of_day: s.is_best_round_of_day,
      })),
      entry_count: entryCount,
      total_entries: totalEntries ?? 0,
      total_eagles: totalEagles,
      total_hios: totalHios,
    };
  });

  // Sort by total points descending, then by score-to-par ascending
  players.sort((a, b) => {
    const ptsA = a.result?.total_points ?? 0;
    const ptsB = b.result?.total_points ?? 0;
    if (ptsB !== ptsA) return ptsB - ptsA;
    const parA = a.result?.total_score_to_par ?? 999;
    const parB = b.result?.total_score_to_par ?? 999;
    return parA - parB;
  });

  return NextResponse.json(players);
}
