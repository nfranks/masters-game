import { createServiceClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/header';
import { GolferPhoto } from '@/components/shared/golfer-photo';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

function formatPar(par: number | null) {
  if (par === null || par === undefined) return '-';
  if (par === 0) return 'E';
  return par > 0 ? `+${par}` : `${par}`;
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: entry } = await supabase
    .from('entries')
    .select(`
      *,
      entry_golfers (
        golfer:golfers (
          id, name, first_name, last_name, world_ranking, region, age_category,
          is_rookie, is_amateur, espn_athlete_id, masters_player_id,
          group:groups ( name )
        )
      )
    `)
    .eq('id', id)
    .single();

  if (!entry) return notFound();

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
    .sort((a: any, b: any) => (b.result?.total_points ?? 0) - (a.result?.total_points ?? 0));

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

        {/* Golfer Cards */}
        <div className="space-y-3">
          {golferDetails.map((gd: any) => {
            const g = gd.golfer;
            if (!g) return null;
            const result = gd.result;
            const mastersUrl = g.masters_player_id
              ? `https://www.masters.com/en_US/players/player_${g.masters_player_id}.html`
              : null;

            return (
              <Card key={g.id} className="bg-white/95 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    {/* Left: Photo + Info */}
                    <div className="flex items-center gap-4 p-4 flex-1 min-w-0">
                      <GolferPhoto
                        name={g.name}
                        espnAthleteId={g.espn_athlete_id}
                        size={56}
                        className="flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {mastersUrl ? (
                            <a
                              href={mastersUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-serif font-bold text-masters-green hover:underline flex items-center gap-1 truncate"
                            >
                              {g.name}
                              <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50" />
                            </a>
                          ) : (
                            <span className="font-serif font-bold text-masters-green truncate">
                              {g.name}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-bold">
                            {g.group?.name}
                          </Badge>
                          {g.world_ranking && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              #{g.world_ranking}
                            </Badge>
                          )}
                          {g.region && (
                            <Badge
                              className={`text-[10px] px-1.5 py-0 ${
                                g.region === 'Europe'
                                  ? 'bg-blue-100 text-blue-800'
                                  : g.region === 'International'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {g.region === 'United States' ? 'USA' : g.region}
                            </Badge>
                          )}
                          {g.age_category && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-800">
                              {g.age_category}
                            </Badge>
                          )}
                          {g.is_rookie && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-800">
                              Rookie
                            </Badge>
                          )}
                        </div>
                        {/* Position + Cut */}
                        {result && (
                          <div className="flex gap-2 mt-1.5 text-xs text-gray-500">
                            {result.final_position && (
                              <span>
                                Pos: <strong className="text-gray-800">T{result.final_position}</strong>
                              </span>
                            )}
                            {result.made_cut ? (
                              <span className="text-green-600">Made Cut</span>
                            ) : result.made_cut === false ? (
                              <span className="text-red-500">Missed Cut</span>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Points Grid */}
                    <div className="flex items-center border-l">
                      <div className="grid grid-cols-6 text-center min-w-[300px]">
                        {/* Header row */}
                        <div className="text-[9px] uppercase tracking-wider text-gray-400 py-1 px-1 border-b bg-gray-50">Thu</div>
                        <div className="text-[9px] uppercase tracking-wider text-gray-400 py-1 px-1 border-b bg-gray-50">Fri</div>
                        <div className="text-[9px] uppercase tracking-wider text-gray-400 py-1 px-1 border-b bg-gray-50">Sat</div>
                        <div className="text-[9px] uppercase tracking-wider text-gray-400 py-1 px-1 border-b bg-gray-50">Sun</div>
                        <div className="text-[9px] uppercase tracking-wider text-gray-400 py-1 px-1 border-b bg-gray-50">Trn</div>
                        <div className="text-[9px] uppercase tracking-wider text-masters-gold py-1 px-1 border-b bg-masters-green/5 font-bold">Tot</div>

                        {/* Strokes row */}
                        {[1, 2, 3, 4].map((r) => {
                          const score = gd.scores.find((s: any) => s.round_number === r);
                          return (
                            <div key={`strokes-${r}`} className="py-1 px-1 text-xs text-gray-500">
                              {score?.total_strokes ?? '-'}
                            </div>
                          );
                        })}
                        <div className="py-1 px-1 text-xs text-gray-500">
                          {result?.final_position ? `T${result.final_position}` : '-'}
                        </div>
                        <div className="py-1 px-1 text-xs text-gray-400">
                          {formatPar(result?.total_score_to_par ?? null)}
                        </div>

                        {/* Points row */}
                        {[1, 2, 3, 4].map((r) => {
                          const score = gd.scores.find((s: any) => s.round_number === r);
                          if (!score) return <div key={`pts-${r}`} className="py-1 px-1 text-sm font-bold">-</div>;
                          const pts =
                            (score.eagles ?? 0) * 1 +
                            (score.double_eagles ?? 0) * 3 +
                            (score.holes_in_one ?? 0) * 5 +
                            (score.is_best_round_of_day ? 5 : 0);
                          return (
                            <div key={`pts-${r}`} className="py-1 px-1">
                              <span className={`text-sm font-bold ${pts > 0 ? 'text-masters-green' : 'text-gray-300'}`}>
                                {pts}
                              </span>
                              {((score.eagles ?? 0) > 0 || (score.holes_in_one ?? 0) > 0) && (
                                <div className="text-[9px] text-gray-400 leading-tight">
                                  {score.eagles > 0 && `${score.eagles}E`}
                                  {score.holes_in_one > 0 && ` ${score.holes_in_one}HIO`}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <div className="py-1 px-1 text-sm font-bold text-masters-green">
                          {result?.tournament_points ?? 0}
                        </div>
                        <div className="py-1 px-1 text-sm font-bold text-masters-gold bg-masters-green/5">
                          {result?.total_points ?? 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
