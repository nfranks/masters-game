import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  let tournamentId = searchParams.get('tournament_id');

  if (!tournamentId) {
    const { data: tournament } = await supabase
      .from('tournament_config')
      .select('id')
      .order('year', { ascending: false })
      .limit(1)
      .single();
    tournamentId = tournament?.id ?? null;
  }

  if (!tournamentId) return NextResponse.json([]);

  // Get entries with their golfers and results
  const { data: entries } = await supabase
    .from('entries')
    .select(`
      *,
      entry_golfers (
        golfer_id,
        golfer:golfers (
          id, name, world_ranking, region, age_category, is_rookie,
          group:groups ( name )
        )
      )
    `)
    .eq('tournament_id', tournamentId)
    .order('total_points', { ascending: false });

  if (!entries?.length) return NextResponse.json([]);

  // Get all golfer results for this tournament
  const { data: results } = await supabase
    .from('golfer_results')
    .select('*')
    .eq('tournament_id', tournamentId);

  const resultsMap = new Map((results ?? []).map((r) => [r.golfer_id, r]));

  // Get golfer scores for details
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

  // Build leaderboard
  let rank = 0;
  let prevPoints = -1;
  let skip = 0;

  const leaderboard = entries.map((entry, index) => {
    if (entry.total_points !== prevPoints) {
      rank = index + 1;
      skip = 0;
    } else {
      skip++;
    }
    prevPoints = entry.total_points;

    return {
      rank,
      entry: {
        id: entry.id,
        team_name: entry.team_name,
        first_name: entry.first_name,
        last_name: entry.last_name,
        total_points: entry.total_points,
      },
      golfer_details: (entry.entry_golfers ?? []).map((eg: any) => ({
        golfer: eg.golfer,
        result: resultsMap.get(eg.golfer_id) ?? null,
        scores: scoresMap.get(eg.golfer_id) ?? [],
      })),
    };
  });

  return NextResponse.json(leaderboard);
}
