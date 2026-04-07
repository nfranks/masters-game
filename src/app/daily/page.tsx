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
import { RefreshCw } from 'lucide-react';

const ROUNDS = [
  { value: '1', label: 'Thursday' },
  { value: '2', label: 'Friday' },
  { value: '3', label: 'Saturday' },
  { value: '4', label: 'Sunday' },
];

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
}

export default function DailyPage() {
  const [round, setRound] = useState('1');
  const [data, setData] = useState<DailyStanding[]>([]);
  const [loading, setLoading] = useState(true);

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

  const formatPar = (par: number) => {
    if (par === 0) return 'E';
    return par > 0 ? `+${par}` : `${par}`;
  };

  return (
    <div className="min-h-screen bg-masters-dark">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Daily Winners</h1>
          <button onClick={() => fetchData(round)} className="text-white/50 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <Tabs value={round} onValueChange={setRound}>
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
                          <TableHead className="w-16">Rank</TableHead>
                          <TableHead>Team</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead className="text-center">Net vs Par</TableHead>
                          <TableHead className="text-center">Total Strokes</TableHead>
                          <TableHead className="text-center"># Players</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.map((item) => (
                          <TableRow key={item.entry.id}>
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
                            <TableCell className="font-medium">{item.entry.team_name}</TableCell>
                            <TableCell className="text-gray-600">
                              {item.entry.first_name} {item.entry.last_name?.slice(0, 2)}.
                            </TableCell>
                            <TableCell className="text-center font-bold">
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
                            <TableCell className="text-center">{item.total_strokes}</TableCell>
                            <TableCell className="text-center">{item.players_played}</TableCell>
                          </TableRow>
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
