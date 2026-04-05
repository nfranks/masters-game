import { createServiceClient } from '@/lib/supabase/server';
import { GroupEditor } from '@/components/admin/group-editor';

export const dynamic = 'force-dynamic';

export default async function GroupsPage() {
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
      <p className="text-gray-600">
        Configure the golfer groups and how many picks are required from each.
      </p>
      <GroupEditor
        tournamentId={tournament?.id ?? ''}
        initialGroups={groups ?? []}
      />
    </div>
  );
}
