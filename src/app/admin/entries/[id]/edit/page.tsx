import { createServiceClient } from '@/lib/supabase/server';
import { EditForm } from '@/components/entry-form/edit-form';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminEditEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: entry } = await supabase
    .from('entries')
    .select('*')
    .eq('id', id)
    .single();

  if (!entry) return notFound();

  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .eq('tournament_id', entry.tournament_id)
    .order('display_order');

  const { data: golfers } = await supabase
    .from('golfers')
    .select('*')
    .eq('tournament_id', entry.tournament_id)
    .order('world_ranking', { ascending: true, nullsFirst: false });

  const { data: rules } = await supabase
    .from('composition_rules')
    .select('*')
    .eq('tournament_id', entry.tournament_id);

  const { data: entryGolfers } = await supabase
    .from('entry_golfers')
    .select('golfer_id, group_id')
    .eq('entry_id', entry.id);

  const currentSelections: Record<string, string[]> = {};
  for (const eg of entryGolfers ?? []) {
    if (!currentSelections[eg.group_id]) currentSelections[eg.group_id] = [];
    currentSelections[eg.group_id].push(eg.golfer_id);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Entry</h1>
        <p className="text-gray-500">
          {entry.team_name} &mdash; {entry.first_name} {entry.last_name} ({entry.email})
        </p>
      </div>
      <EditForm
        entry={entry}
        token={entry.edit_token}
        groups={groups ?? []}
        golfers={golfers ?? []}
        rules={rules ?? []}
        currentSelections={currentSelections}
        isEditable={true}
        adminMode={true}
      />
    </div>
  );
}
