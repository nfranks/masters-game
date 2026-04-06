import { createServiceClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

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
          id, name, world_ranking, region, age_category, is_rookie,
          group:groups ( name )
        )
      )
    `)
    .eq('id', id)
    .single();

  if (!entry) return notFound();

  // Get golfer results and scores
  const golferIds = entry.entry_golfers?.map((eg: any) => eg.golfer?.id).filter(Boolean) ?? [];

  const { data: results } = await supabase
    .from('golfer_results')
    .select('*')
    .in('golfer_id', golferIds);

  const { data: scores } = await supabase
    .from('golfer_scores')
    .select('*')
    .in('golfer_id', golferIds);

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

  return (
    <div className="min-h-screen bg-masters-dark">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Card className="bg-white/95 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{entry.team_name}</CardTitle>
                <p className="text-gray-500">
                  {entry.first_name} {entry.last_name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-masters-green">{entry.total_points}</p>
                <p className="text-sm text-gray-500">total points</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-white/95">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Golfer</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead className="text-center">R1</TableHead>
                  <TableHead className="text-center">R2</TableHead>
                  <TableHead className="text-center">R3</TableHead>
                  <TableHead className="text-center">R4</TableHead>
                  <TableHead className="text-center">Pos</TableHead>
                  <TableHead className="text-center">Cut</TableHead>
                  <TableHead className="text-right">Daily</TableHead>
                  <TableHead className="text-right">Tourn</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {golferDetails.map((gd: any) => (
                  <TableRow key={gd.golfer?.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{gd.golfer?.name}</p>
                        <div className="flex gap-1 mt-1">
                          {gd.golfer?.region && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              {gd.golfer.region === 'United States' ? 'USA' : gd.golfer.region}
                            </Badge>
                          )}
                          {gd.golfer?.age_category && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              {gd.golfer.age_category}
                            </Badge>
                          )}
                          {gd.golfer?.is_rookie && (
                            <Badge className="text-[10px] px-1 py-0 bg-green-100 text-green-800">
                              Rookie
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{gd.golfer?.group?.name}</Badge>
                    </TableCell>
                    {[1, 2, 3, 4].map((r) => {
                      const score = gd.scores.find((s: any) => s.round_number === r);
                      return (
                        <TableCell key={r} className="text-center">
                          {score?.total_strokes ?? '-'}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center">
                      {gd.result?.final_position ?? '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {gd.result?.made_cut ? (
                        <Badge className="bg-green-100 text-green-800 text-xs">Yes</Badge>
                      ) : gd.result ? (
                        <Badge className="bg-red-100 text-red-800 text-xs">MC</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">{gd.result?.daily_points ?? 0}</TableCell>
                    <TableCell className="text-right">{gd.result?.tournament_points ?? 0}</TableCell>
                    <TableCell className="text-right font-bold">
                      {gd.result?.total_points ?? 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
