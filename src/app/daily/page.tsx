'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/shared/header';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { ScoringRulesPopout } from '@/components/shared/scoring-rules';

const ROUNDS = [
  { value: '1', label: 'Thursday' },
  { value: '2', label: 'Friday' },
  { value: '3', label: 'Saturday' },
  { value: '4', label: 'Sunday' },
];

interface GolferDetail {
  name: string;
  score_to_par: number | null;
  total_strokes: number | null;
  holes_played: number;
}

interface DailyStanding {
  rank: number;
  entry: {
    id: string;
    team_name: string;
    first_name: string;
    last_name: string;
  };
  total_strokes: number;
  net_vs_par: number;
  players_played: number;
  golfer_details: GolferDetail[];
}

function formatPar(par: number | null) {
  if (par === null || par === undefined) return '-';
  if (par === 0) return 'E';
  return par > 0 ? `+${par}` : `${par}`;
}

export default function DailyPage() {
  const [round, setRound] = useState('1');
  const [data, setData] = useState<DailyStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = async (r: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/daily?round=${r}`);
      const json = await res.json();
      setData(json);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(round);
    const interval = setInterval(() => fetchData(round), 60000);
    return () => clearInterval(interval);
  }, [round]);

  return (
    <div className="min-h-screen bg-masters-dark">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Daily Winners</h1>
          <div className="flex items-center gap-3">
            <ScoringRulesPopout />
            <button onClick={() => fetchData(round)} className="text-white/50 hover:text-white">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <Tabs value={round} onValueChange={(v) => { setRound(v); setExpandedId(null); }}>
          <TabsList className="mb-4">
            {ROUNDS.map((r) => (
              <TabsTrigger key={r.value} value={r.value}>
                {r.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {ROUNDS.map((r) => (
            <TabsContent key={r.value} value={r.value}>
              <Card className="bg-white/95">
                <CardContent className="p-0">
                  {loading ? (
                    <div className="py-16 text-center text-gray-500">Loading...</div>
                  ) : data.length === 0 ? (
                    <div className="py-16 text-center text-gray-500">
                      No scores for {r.label} yet
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Team</TableHead>
                          <TableHead className="text-right w-20">O/U</TableHead>
                          <TableHead className="text-right w-20">Strokes</TableHead>
                          <TableHead className="w-8"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.map((item) => (
                          <>
                            <TableRow
                              key={item.entry.id}
                              className="cursor-pointer hover:bg-green-50"
                              onClick={() =>
                                setExpandedId(
                                  expandedId === item.entry.id ? null : item.entry.id
                                )
                              }
                            >
                              <TableCell className="font-bold">
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
                              <TableCell>
                                <div className="font-medium">{item.entry.team_name}</div>
                                <div className="text-xs text-gray-500">
                                  {item.entry.first_name} {item.entry.last_name?.slice(0, 2)}.
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                <span
                                  className={
                                    item.net_vs_par < 0
                                      ? 'text-red-600'
                                      : item.net_vs_par > 0
                                      ? 'text-blue-600'
                                      : ''
                                  }
                                >
                                  {formatPar(item.net_vs_par)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right text-gray-600">
                                {item.total_strokes}
                              </TableCell>
                              <TableCell>
                                {expandedId === item.entry.id ? (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                )}
                              </TableCell>
                            </TableRow>
                            {expandedId === item.entry.id && (
                              <TableRow key={`${item.entry.id}-detail`}>
                                <TableCell colSpan={5} className="bg-gray-50 px-6 py-3">
                                  <div className="space-y-1">
                                    {item.golfer_details.map((g) => (
                                      <div
                                        key={g.name}
                                        className="flex items-center justify-between text-sm py-1"
                                      >
                                        <span
                                          className={
                                            g.total_strokes === null
                                              ? 'text-gray-400'
                                              : 'text-gray-900'
                                          }
                                        >
                                          {g.name}
                                          {g.holes_played > 0 && g.holes_played < 18 && (
                                            <span className="text-xs text-gray-400 ml-1">
                                              (thru {g.holes_played})
                                            </span>
                                          )}
                                        </span>
                                        <span className="flex items-center gap-3">
                                          {g.total_strokes !== null ? (
                                            <>
                                              <span
                                                className={`font-medium ${
                                                  (g.score_to_par ?? 0) < 0
                                                    ? 'text-red-600'
                                                    : (g.score_to_par ?? 0) > 0
                                                    ? 'text-blue-600'
                                                    : ''
                                                }`}
                                              >
                                                {formatPar(g.score_to_par)}
                                              </span>
                                              <span className="text-gray-500 w-6 text-right">
                                                {g.total_strokes}
                                              </span>
                                            </>
                                          ) : (
                                            <span className="text-gray-400">-</span>
                                          )}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
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
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}
