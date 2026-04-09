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

  const { data: logs } = await supabase
    .from('score_fetch_log')
    .select('*')
    .eq('tournament_id', tournament?.id ?? '')
    .order('fetched_at', { ascending: false })
    .limit(20);

  const { data: golferResults } = await supabase
    .from('golfer_results')
    .select(`
      *,
      golfer:golfers ( name, group:groups ( name ) )
    `)
    .eq('tournament_id', tournament?.id ?? '')
    .order('total_points', { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Scoring</h1>
      <ScoreFetcher
        tournamentId={tournament?.id ?? ''}
        autoFetchPaused={tournament?.auto_fetch_paused ?? false}
        logs={logs ?? []}
        golferResults={golferResults ?? []}
      />
    </div>
  );
}
