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

  // Only show golfer details when entries are no longer being accepted
  const entriesOpen = tournament?.status === 'open';

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
    .eq('is_archived', false)
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

  const leaderboard = entries.map((entry, index) => {
    if (entry.total_points !== prevPoints) {
      rank = index + 1;
    }
    prevPoints = entry.total_points;

    return {
      rank,
      entries_open: entriesOpen,
      entry: {
        id: entry.id,
        team_name: entry.team_name,
        first_name: entry.first_name,
        last_name: entry.last_name,
        total_points: entry.total_points,
      },
      // Hide golfer details while entries are still open
      golfer_details: entriesOpen
        ? []
        : (entry.entry_golfers ?? []).map((eg: any) => ({
            golfer: eg.golfer,
            result: resultsMap.get(eg.golfer_id) ?? null,
            scores: scoresMap.get(eg.golfer_id) ?? [],
          })),
    };
  });

  return NextResponse.json(leaderboard);
}
