import { createServiceClient } from '@/lib/supabase/server';
import { ScoreFetcher } from '@/components/admin/score-fetcher';

export const dynamic = 'force-dynamic';

export default async function ScoringPage() {
  const supabase = createServiceClient();

  const { data: tournament } = await supabase
    .from('tournament_config')
    .select('*')
    .order('year', { ascending: false })
    .limit(1)
    .single();

  const tournamentId = tournament?.id ?? '';

  const [logsRes, golferResultsRes, scoresRes] = await Promise.all([
    supabase
      .from('score_fetch_log')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('fetched_at', { ascending: false })
      .limit(20),
    supabase
      .from('golfer_results')
      .select(`
        *,
        golfer:golfers ( name, group:groups ( name ) )
      `)
      .eq('tournament_id', tournamentId)
      .order('total_points', { ascending: false }),
    supabase
      .from('golfer_scores')
      .select('golfer_id, round_number, score_to_par, eagles, double_eagles, holes_in_one, hole_scores')
      .eq('tournament_id', tournamentId),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Scoring</h1>
      <ScoreFetcher
        tournamentId={tournamentId}
        autoFetchPaused={tournament?.auto_fetch_paused ?? false}
        logs={logsRes.data ?? []}
        golferResults={golferResultsRes.data ?? []}
        golferScores={scoresRes.data ?? []}
      />
    </div>
  );
}
