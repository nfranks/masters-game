import { createServiceClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/header';
import { EditForm } from '@/components/entry-form/edit-form';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditTeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;
  const supabase = createServiceClient();

  if (!token) {
    return (
      <div className="min-h-screen bg-masters-dark">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Missing Token</h1>
          <p className="text-white/70">You need the full edit link to modify your team.</p>
        </main>
      </div>
    );
  }

  // Verify entry and token
  const { data: entry } = await supabase
    .from('entries')
    .select('*')
    .eq('id', id)
    .eq('edit_token', token)
    .single();

  if (!entry) return notFound();

  // Get tournament
  const { data: tournament } = await supabase
    .from('tournament_config')
    .select('*')
    .eq('id', entry.tournament_id)
    .single();

  const isEditable =
    tournament?.status === 'open' &&
    (!tournament?.entry_deadline || new Date(tournament.entry_deadline) > new Date());

  // Get groups, golfers, rules, and current picks
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

  // Build current selections as Record<groupId, golferId[]>
  const currentSelections: Record<string, string[]> = {};
  for (const eg of entryGolfers ?? []) {
    if (!currentSelections[eg.group_id]) currentSelections[eg.group_id] = [];
    currentSelections[eg.group_id].push(eg.golfer_id);
  }

  return (
    <div className="min-h-screen bg-masters-dark">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isEditable ? 'Edit Your Team' : 'Your Team'}
          </h1>
          <p className="text-white/70">
            {entry.team_name} &mdash; {entry.first_name} {entry.last_name}
          </p>
          {!isEditable && (
            <p className="text-masters-gold text-sm mt-2">
              Editing is closed. The deadline has passed or entries are no longer open.
            </p>
          )}
        </div>
        <EditForm
          entry={entry}
          token={token}
          groups={groups ?? []}
          golfers={golfers ?? []}
          rules={rules ?? []}
          currentSelections={currentSelections}
          isEditable={isEditable}
        />
      </main>
    </div>
  );
}
