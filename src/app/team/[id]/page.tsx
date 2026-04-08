import { createServiceClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/header';
import { Card, CardContent } from '@/components/ui/card';
import { TeamRoster } from '@/components/leaderboard/team-roster';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Pencil } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TeamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;
  const supabase = createServiceClient();

  const { data: entry } = await supabase
    .from('entries')
    .select(`
      *,
      entry_golfers (
        golfer:golfers (
          id, name, first_name, last_name, world_ranking, region, age_category,
          is_rookie, is_amateur, espn_athlete_id, masters_player_id,
          group:groups ( name, display_order )
        )
      )
    `)
    .eq('id', id)
    .single();

  if (!entry) return notFound();

  // Check if user can edit (token matches + entries still open)
  const canEdit = token && token === entry.edit_token;
  let isEditable = false;
  if (canEdit) {
    const { data: tournament } = await supabase
      .from('tournament_config')
      .select('status, entry_deadline')
      .eq('id', entry.tournament_id)
      .single();
    isEditable =
      tournament?.status === 'open' &&
      (!tournament?.entry_deadline || new Date(tournament.entry_deadline) > new Date());
  }

  const golferIds = entry.entry_golfers?.map((eg: any) => eg.golfer?.id).filter(Boolean) ?? [];

  const [{ data: results }, { data: scores }] = await Promise.all([
    supabase.from('golfer_results').select('*').in('golfer_id', golferIds),
    supabase.from('golfer_scores').select('*').in('golfer_id', golferIds),
  ]);

  const resultsMap = new Map((results ?? []).map((r) => [r.golfer_id, r]));
  const scoresMap = new Map<string, any[]>();
  for (const s of scores ?? []) {
    if (!scoresMap.has(s.golfer_id)) scoresMap.set(s.golfer_id, []);
    scoresMap.get(s.golfer_id)!.push(s);
  }

  const golferDetails = (entry.entry_golfers ?? [])
    .map((eg: any) => ({
      golfer: eg.golfer,
      result: resultsMap.get(eg.golfer?.id) ?? null,
      scores: scoresMap.get(eg.golfer?.id) ?? [],
    }))
    .sort((a: any, b: any) => (a.golfer?.group?.display_order ?? 99) - (b.golfer?.group?.display_order ?? 99));

  // Calculate team totals by round
  const roundTotals = [1, 2, 3, 4].map((r) => {
    return golferDetails.reduce((sum: number, gd: any) => {
      const score = gd.scores.find((s: any) => s.round_number === r);
      if (!score) return sum;
      const pts =
        (score.eagles ?? 0) * 1 +
        (score.double_eagles ?? 0) * 3 +
        (score.holes_in_one ?? 0) * 5 +
        (score.is_best_round_of_day ? 5 : 0);
      return sum + pts;
    }, 0);
  });

  const tournamentTotal = golferDetails.reduce(
    (sum: number, gd: any) => sum + (gd.result?.tournament_points ?? 0),
    0
  );

  return (
    <div className="min-h-screen bg-masters-dark">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Team Header */}
        <Card className="bg-white/95 mb-6 overflow-hidden">
          <div className="bg-masters-green p-6 text-center">
            <h1 className="font-serif text-3xl font-bold text-white mb-1">
              {entry.team_name}
            </h1>
            <p className="text-white/70">
              {entry.first_name} {entry.last_name}
            </p>
            {canEdit && isEditable && (
              <Link
                href={`/team/${id}/edit?token=${token}`}
                className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-4 py-2 rounded-full transition-colors mt-3"
              >
                <Pencil className="w-3 h-3" />
                Edit Picks
              </Link>
            )}
          </div>
          <CardContent className="py-4">
            <div className="grid grid-cols-6 text-center divide-x">
              {['Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                <div key={day} className="px-2">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">{day}</p>
                  <p className="text-lg font-bold text-masters-green">{roundTotals[i] || '-'}</p>
                </div>
              ))}
              <div className="px-2">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Tourn</p>
                <p className="text-lg font-bold text-masters-green">{tournamentTotal || '-'}</p>
              </div>
              <div className="px-2">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Total</p>
                <p className="text-lg font-bold text-masters-gold">{entry.total_points}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roster Grid + Expandable Detail */}
        <TeamRoster golferDetails={golferDetails} />
      </main>
    </div>
  );
}
