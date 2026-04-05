import { createServiceClient } from '@/lib/supabase/server';
import { EntryTable } from '@/components/admin/entry-table';

export const dynamic = 'force-dynamic';

export default async function EntriesPage() {
  const supabase = createServiceClient();

  const { data: tournament } = await supabase
    .from('tournament_config')
    .select('*')
    .order('year', { ascending: false })
    .limit(1)
    .single();

  const { data: entries } = await supabase
    .from('entries')
    .select(`
      *,
      entry_golfers (
        golfer:golfers ( name, group:groups ( name ) )
      )
    `)
    .eq('tournament_id', tournament?.id ?? '')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Entries</h1>
      <EntryTable
        tournamentId={tournament?.id ?? ''}
        entries={entries ?? []}
        entryFee={tournament?.entry_fee ?? 20}
      />
    </div>
  );
}
