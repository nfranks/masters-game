import { createServiceClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/header';
import { EntryForm } from '@/components/entry-form/entry-form';

export const dynamic = 'force-dynamic';

export default async function EnterPage() {
  const supabase = createServiceClient();

  const { data: tournament } = await supabase
    .from('tournament_config')
    .select('*')
    .order('year', { ascending: false })
    .limit(1)
    .single();

  if (!tournament || tournament.status !== 'open') {
    return (
      <div className="min-h-screen bg-masters-dark">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Entries Closed</h1>
          <p className="text-white/70">
            {!tournament
              ? 'No tournament is currently configured.'
              : tournament.status === 'setup'
              ? 'The tournament is still being set up. Check back soon!'
              : 'Entries are no longer being accepted.'}
          </p>
        </main>
      </div>
    );
  }

  if (tournament.entry_deadline && new Date(tournament.entry_deadline) < new Date()) {
    return (
      <div className="min-h-screen bg-masters-dark">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Deadline Passed</h1>
          <p className="text-white/70">The entry deadline has passed. Better luck next year!</p>
        </main>
      </div>
    );
  }

  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .eq('tournament_id', tournament.id)
    .order('display_order');

  const { data: golfers } = await supabase
    .from('golfers')
    .select('*')
    .eq('tournament_id', tournament.id)
    .order('world_ranking', { ascending: true, nullsFirst: false });

  const { data: rules } = await supabase
    .from('composition_rules')
    .select('*')
    .eq('tournament_id', tournament.id);

  return (
    <div className="min-h-screen bg-masters-dark">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Enter Your Team</h1>
          <p className="text-white/70">
            {tournament.name} {tournament.year} &mdash; ${tournament.entry_fee} entry fee
          </p>
          {tournament.entry_deadline && (
            <p className="text-masters-gold text-sm mt-1">
              Deadline: {new Date(tournament.entry_deadline).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })} ET
            </p>
          )}
        </div>
        <EntryForm
          tournament={tournament}
          groups={groups ?? []}
          golfers={golfers ?? []}
          rules={rules ?? []}
        />
      </main>
    </div>
  );
}
