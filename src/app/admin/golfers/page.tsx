import { createServiceClient } from '@/lib/supabase/server';
import { CsvUploader } from '@/components/admin/csv-uploader';

export const dynamic = 'force-dynamic';

export default async function GolfersPage() {
  const supabase = createServiceClient();

  const { data: tournament } = await supabase
    .from('tournament_config')
    .select('*')
    .order('year', { ascending: false })
    .limit(1)
    .single();

  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .eq('tournament_id', tournament?.id ?? '')
    .order('display_order');

  const { data: golfers } = await supabase
    .from('golfers')
    .select('*, group:groups(name)')
    .eq('tournament_id', tournament?.id ?? '')
    .order('world_ranking', { ascending: true, nullsFirst: false });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Golfers</h1>
      <CsvUploader
        tournamentId={tournament?.id ?? ''}
        groups={groups ?? []}
        initialGolfers={golfers ?? []}
      />
    </div>
  );
}
