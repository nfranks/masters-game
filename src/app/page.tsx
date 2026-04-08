import Link from 'next/link';
import { Header } from '@/components/shared/header';
import { createServiceClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = createServiceClient();

  const { data: tournament } = await supabase
    .from('tournament_config')
    .select('*')
    .order('year', { ascending: false })
    .limit(1)
    .single();

  let entryCount = 0;
  if (tournament) {
    const { count } = await supabase
      .from('entries')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', tournament.id);
    entryCount = count ?? 0;
  }

  const isOpen = tournament?.status === 'open';
  const deadline = tournament?.entry_deadline
    ? new Date(tournament.entry_deadline)
    : null;

  return (
    <div className="min-h-screen bg-masters-dark">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <p className="uppercase tracking-[0.3em] text-masters-gold text-sm font-medium mb-4">
            A Tradition Unlike Any Other
          </p>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
            {tournament?.name ?? 'Masters Pool'}
          </h1>
          <p className="font-serif text-xl text-white/70 italic">
            {tournament?.year ?? 2026}
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-px bg-white/10 rounded-lg overflow-hidden mb-12">
          <div className="bg-masters-green/80 p-8 text-center">
            <p className="uppercase tracking-widest text-masters-gold text-xs font-medium mb-2">Entries</p>
            <p className="text-4xl font-serif font-bold text-white">{entryCount}</p>
            <p className="text-white/50 text-sm mt-1">teams submitted</p>
          </div>
          <div className="bg-masters-green/80 p-8 text-center">
            <p className="uppercase tracking-widest text-masters-gold text-xs font-medium mb-2">Entry Fee</p>
            <p className="text-4xl font-serif font-bold text-white">${tournament?.entry_fee ?? 20}</p>
            <p className="text-white/50 text-sm mt-1">per team</p>
          </div>
          <div className="bg-masters-green/80 p-8 text-center">
            <p className="uppercase tracking-widest text-masters-gold text-xs font-medium mb-2">Status</p>
            <p className="text-4xl font-serif font-bold text-white capitalize">{tournament?.status ?? 'Setup'}</p>
            {deadline && (
              <p className="text-white/50 text-sm mt-1">
                Deadline: {deadline.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })} ET
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {isOpen && (
            <Link href="/enter" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-masters-gold hover:bg-masters-gold-deep text-masters-dark font-bold text-lg px-10 uppercase tracking-wider">
                Enter Your Team
              </Button>
            </Link>
          )}
          <Link href="/my-team" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 text-lg px-10 uppercase tracking-wider">
              View Your Team
            </Button>
          </Link>
          <Link href="/leaderboard" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 text-lg px-10 uppercase tracking-wider">
              View Leaderboard
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
