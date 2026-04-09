'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/shared/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronDown, ChevronRight, Search, RefreshCw } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  entries_open: boolean;
  entry: {
    id: string;
    team_name: string;
    first_name: string;
    last_name: string;
    total_points: number;
  };
  golfer_details: {
    golfer: {
      id: string;
      name: string;
      world_ranking: number | null;
      group: { name: string } | null;
    };
    result: {
      total_points: number;
      daily_points: number;
      tournament_points: number;
      total_score_to_par: number | null;
      made_cut: boolean;
      final_position: number | null;
    } | null;
    scores: {
      round_number: number;
      total_strokes: number | null;
      score_to_par: number | null;
      eagles: number;
      double_eagles: number;
      holes_in_one: number;
      hole_scores: number[] | null;
    }[];
  }[];
}

function formatPar(par: number | null) {
  if (par === null || par === undefined) return '-';
  if (par === 0) return 'E';
  return par > 0 ? `+${par}` : `${par}`;
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch {
      // silent fail on auto-refresh
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  const filtered = search
    ? data.filter(
        (d) =>
          d.entry.team_name.toLowerCase().includes(search.toLowerCase()) ||
          `${d.entry.first_name} ${d.entry.last_name}`
            .toLowerCase()
            .includes(search.toLowerCase())
      )
    : data;

  return (
    <div className="min-h-screen bg-masters-dark">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-white/50 text-xs">
                Scores as of{' '}
                {lastUpdated.toLocaleString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZone: 'America/New_York',
                })}{' '}
                ET
              </span>
            )}
            <button onClick={fetchData} className="text-white/50 hover:text-white">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search teams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/90"
            />
          </div>
        </div>

        <Card className="bg-white/95">
          <CardContent className="p-0">
            {loading ? (
              <div className="py-16 text-center text-gray-500">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-gray-500">No entries yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right w-24">Points</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <>
                      <TableRow
                        key={item.entry.id}
                        className={item.entries_open ? '' : 'cursor-pointer hover:bg-green-50'}
                        onClick={() =>
                          !item.entries_open && setExpandedId(expandedId === item.entry.id ? null : item.entry.id)
                        }
                      >
                        <TableCell className="font-bold text-lg">
                          {item.rank <= 3 ? (
                            <span
                              className={
                                item.rank === 1
                                  ? 'text-yellow-500'
                                  : item.rank === 2
                                  ? 'text-gray-400'
                                  : 'text-amber-700'
                              }
                            >
                              {item.rank}
                            </span>
                          ) : (
                            item.rank
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{item.entry.team_name}</TableCell>
                        <TableCell className="text-gray-600">
                          {item.entry.first_name} {item.entry.last_name?.slice(0, 2)}.
                        </TableCell>
                        <TableCell className="text-right font-bold text-lg">
                          {item.entry.total_points}
                        </TableCell>
                        {!item.entries_open && (
                          <TableCell>
                            {expandedId === item.entry.id ? (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                      {expandedId === item.entry.id && (
                        <TableRow key={`${item.entry.id}-detail`}>
                          <TableCell colSpan={5} className="bg-gray-50 p-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Golfer</TableHead>
                                  <TableHead>Group</TableHead>
                                  <TableHead className="text-center">Tourn</TableHead>
                                  <TableHead className="text-center">R1</TableHead>
                                  <TableHead className="text-center">R2</TableHead>
                                  <TableHead className="text-center">R3</TableHead>
                                  <TableHead className="text-center">R4</TableHead>
                                  <TableHead className="text-center">Eagles</TableHead>
                                  <TableHead className="text-center">Pos</TableHead>
                                  <TableHead className="text-right">Pts</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {item.golfer_details
                                  .sort(
                                    (a, b) =>
                                      (b.result?.total_points ?? 0) - (a.result?.total_points ?? 0)
                                  )
                                  .map((gd) => {
                                    const totalEagles = gd.scores.reduce((sum, s) => sum + (s.eagles ?? 0) + (s.double_eagles ?? 0), 0);
                                    const totalHios = gd.scores.reduce((sum, s) => sum + (s.holes_in_one ?? 0), 0);
                                    return (
                                    <TableRow key={gd.golfer.id}>
                                      <TableCell className="font-medium text-sm">
                                        {gd.golfer.name}
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className="text-xs">
                                          {gd.golfer.group?.name ?? '?'}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-center text-sm font-medium">
                                        <span className={
                                          (gd.result?.total_score_to_par ?? 0) < 0 ? 'text-red-600' :
                                          (gd.result?.total_score_to_par ?? 0) > 0 ? 'text-blue-600' : ''
                                        }>
                                          {formatPar(gd.result?.total_score_to_par ?? null)}
                                        </span>
                                      </TableCell>
                                      {[1, 2, 3, 4].map((r) => {
                                        const score = gd.scores.find(
                                          (s) => s.round_number === r
                                        );
                                        const holesPlayed = score?.hole_scores?.length ?? 0;
                                        const isComplete = holesPlayed >= 18;
                                        return (
                                          <TableCell key={r} className="text-center text-sm">
                                            {score ? (
                                              <span className={
                                                (score.score_to_par ?? 0) < 0 ? 'text-red-600' :
                                                (score.score_to_par ?? 0) > 0 ? 'text-blue-600' : ''
                                              }>
                                                {formatPar(score.score_to_par)}
                                                {!isComplete && holesPlayed > 0 && (
                                                  <span className="text-[10px] text-gray-400 ml-0.5">
                                                    ({holesPlayed})
                                                  </span>
                                                )}
                                              </span>
                                            ) : '-'}
                                          </TableCell>
                                        );
                                      })}
                                      <TableCell className="text-center text-sm">
                                        {totalEagles > 0 || totalHios > 0 ? (
                                          <span className="text-green-700 font-medium">
                                            {totalEagles > 0 && `${totalEagles}`}
                                            {totalHios > 0 && ` ${totalHios} ace`}
                                          </span>
                                        ) : '-'}
                                      </TableCell>
                                      <TableCell className="text-center text-sm">
                                        {gd.result?.final_position
                                          ? `T${gd.result.final_position}`
                                          : (gd.result?.made_cut === false && gd.scores.some((s) => s.round_number === 2 && s.total_strokes != null))
                                          ? 'MC'
                                          : '-'}
                                      </TableCell>
                                      <TableCell className="text-right font-bold text-sm">
                                        {gd.result?.total_points ?? 0}
                                      </TableCell>
                                    </TableRow>
                                    );
                                  })}
                              </TableBody>
                            </Table>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
