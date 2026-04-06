import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const round = parseInt(searchParams.get('round') ?? '1');

  const { data: tournament } = await supabase
    .from('tournament_config')
    .select('id')
    .order('year', { ascending: false })
    .limit(1)
    .single();

  if (!tournament) return NextResponse.json([]);

  // Get all entries with their golfers
  const { data: entries } = await supabase
    .from('entries')
    .select(`
      id, team_name, first_name, last_name,
      entry_golfers ( golfer_id )
    `)
    .eq('tournament_id', tournament.id)
    .eq('is_archived', false);

  if (!entries?.length) return NextResponse.json([]);

  // Get all scores for this round
  const { data: scores } = await supabase
    .from('golfer_scores')
    .select('golfer_id, total_strokes, score_to_par')
    .eq('tournament_id', tournament.id)
    .eq('round_number', round);

  if (!scores?.length) return NextResponse.json([]);

  const scoreMap = new Map(scores.map((s) => [s.golfer_id, s]));

  // Calculate daily standings
  const standings = entries
    .map((entry) => {
      const golferIds = (entry.entry_golfers ?? []).map((eg: any) => eg.golfer_id);
      let totalStrokes = 0;
      let netVsPar = 0;
      let playersPlayed = 0;

      for (const gid of golferIds) {
        const score = scoreMap.get(gid);
        if (score?.total_strokes) {
          totalStrokes += score.total_strokes;
          netVsPar += score.score_to_par ?? 0;
          playersPlayed++;
        }
      }

      return {
        entry: {
          id: entry.id,
          team_name: entry.team_name,
          first_name: entry.first_name,
          last_name: entry.last_name,
        },
        total_strokes: totalStrokes,
        net_vs_par: netVsPar,
        players_played: playersPlayed,
      };
    })
    .filter((s) => s.players_played > 0)
    .sort((a, b) => a.net_vs_par - b.net_vs_par);

  // Assign ranks with ties
  let rank = 0;
  let prevPar = -9999;
  const ranked = standings.map((s, i) => {
    if (s.net_vs_par !== prevPar) rank = i + 1;
    prevPar = s.net_vs_par;
    return { ...s, rank };
  });

  return NextResponse.json(ranked);
}
