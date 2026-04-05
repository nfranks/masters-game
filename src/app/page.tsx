import Link from 'next/link';
import { Header } from '@/components/shared/header';
import { createServiceClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    <div className="min-h-screen bg-green-950">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            {tournament?.name ?? 'Masters Pool'} {tournament?.year ?? 2026}
          </h1>
          <p className="text-green-200 text-lg">
            Pick your team. Track the scores. Win the pool.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-green-900 border-green-700 text-white">
            <CardHeader>
              <CardTitle className="text-yellow-400 text-lg">Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{entryCount}</p>
              <p className="text-green-300 text-sm">teams submitted</p>
            </CardContent>
          </Card>

          <Card className="bg-green-900 border-green-700 text-white">
            <CardHeader>
              <CardTitle className="text-yellow-400 text-lg">Entry Fee</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">${tournament?.entry_fee ?? 20}</p>
              <p className="text-green-300 text-sm">per team</p>
            </CardContent>
          </Card>

          <Card className="bg-green-900 border-green-700 text-white">
            <CardHeader>
              <CardTitle className="text-yellow-400 text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold capitalize">{tournament?.status ?? 'Setup'}</p>
              {deadline && (
                <p className="text-green-300 text-sm">
                  Deadline: {deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isOpen && (
            <Link href="/enter">
              <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-green-950 font-bold text-lg px-8">
                Enter Your Team
              </Button>
            </Link>
          )}
          <Link href="/leaderboard">
            <Button size="lg" variant="outline" className="border-green-500 text-green-200 hover:bg-green-800 text-lg px-8">
              View Leaderboard
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
