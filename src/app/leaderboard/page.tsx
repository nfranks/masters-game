'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/shared/header';
import { Card, CardContent } from '@/components/ui/card';
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
import { ChevronDown, ChevronRight, Search, RefreshCw, Users, User } from 'lucide-react';
import { ScoringRulesPopout } from '@/components/shared/scoring-rules';

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

interface PlayerEntry {
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
    is_best_round_of_tournament: boolean;
  } | null;
  scores: {
    round_number: number;
    total_strokes: number | null;
    score_to_par: number | null;
    eagles: number;
    double_eagles: number;
    holes_in_one: number;
    hole_scores: number[] | null;
    is_best_round_of_day: boolean;
  }[];
  entry_count: number;
  total_entries: number;
  total_eagles: number;
  total_hios: number;
}

function formatPar(par: number | null) {
  if (par === null || par === undefined) return '-';
  if (par === 0) return 'E';
  return par > 0 ? `+${par}` : `${par}`;
}

function OwnershipBar({ count, total }: { count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-600 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-8">{pct}%</span>
    </div>
  );
}

export default function LeaderboardPage() {
  const [view, setView] = useState<'teams' | 'players'>('teams');
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [players, setPlayers] = useState<PlayerEntry[]>([]);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      const [teamsRes, playersRes] = await Promise.all([
        fetch('/api/leaderboard'),
        fetch('/api/leaderboard/players'),
      ]);
      const [teamsJson, playersJson] = await Promise.all([
        teamsRes.json(),
        playersRes.json(),
      ]);
      setData(teamsJson);
      setPlayers(playersJson);
      setLastUpdated(new Date());
    } catch {
      // silent fail on auto-refresh
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredTeams = search
    ? data.filter(
        (d) =>
          d.entry.team_name.toLowerCase().includes(search.toLowerCase()) ||
          `${d.entry.first_name} ${d.entry.last_name}`
            .toLowerCase()
            .includes(search.toLowerCase())
      )
    : data;

  const filteredPlayers = search
    ? players.filter((p) =>
        p.golfer.name.toLowerCase().includes(search.toLowerCase())
      )
    : players;

  return (
    <div className="min-h-screen bg-masters-dark">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
          <div className="flex items-center gap-3">
            <ScoringRulesPopout />
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

        {/* View Toggle */}
        <div className="flex gap-1 mb-4 bg-white/10 rounded-lg p-1 w-fit">
          <button
            onClick={() => { setView('teams'); setSearch(''); setExpandedId(null); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'teams'
                ? 'bg-white text-gray-900'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Teams
          </button>
          <button
            onClick={() => { setView('players'); setSearch(''); setExpandedId(null); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'players'
                ? 'bg-white text-gray-900'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            Players
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={view === 'teams' ? 'Search teams...' : 'Search players...'}
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
            ) : view === 'teams' ? (
              <TeamsView
                data={filteredTeams}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
              />
            ) : (
              <PlayersView
                data={filteredPlayers}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function TeamsView({
  data,
  expandedId,
  setExpandedId,
}: {
  data: LeaderboardEntry[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
}) {
  if (data.length === 0) {
    return <div className="py-16 text-center text-gray-500">No entries yet</div>;
  }

  return (
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
        {data.map((item) => (
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
                                ? gd.result.final_position
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
  );
}

function PlayersView({
  data,
  expandedId,
  setExpandedId,
}: {
  data: PlayerEntry[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
}) {
  if (data.length === 0) {
    return <div className="py-16 text-center text-gray-500">No player data yet</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Player</TableHead>
          <TableHead>Group</TableHead>
          <TableHead className="text-center">Tourn</TableHead>
          <TableHead className="text-center">R1</TableHead>
          <TableHead className="text-center">R2</TableHead>
          <TableHead className="text-center">R3</TableHead>
          <TableHead className="text-center">R4</TableHead>
          <TableHead className="text-center">Pos</TableHead>
          <TableHead className="text-center">Picked</TableHead>
          <TableHead className="text-right">Pts</TableHead>
          <TableHead className="w-8"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((player) => {
          const hasScores = player.scores.length > 0;
          return (
            <>
              <TableRow
                key={player.golfer.id}
                className="cursor-pointer hover:bg-green-50"
                onClick={() =>
                  setExpandedId(expandedId === player.golfer.id ? null : player.golfer.id)
                }
              >
                <TableCell className="font-medium">
                  {player.golfer.name}
                  {player.golfer.world_ranking && (
                    <span className="text-xs text-gray-400 ml-1.5">
                      #{player.golfer.world_ranking}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {player.golfer.group?.name ?? '?'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-medium">
                  <span
                    className={
                      (player.result?.total_score_to_par ?? 0) < 0
                        ? 'text-red-600'
                        : (player.result?.total_score_to_par ?? 0) > 0
                        ? 'text-blue-600'
                        : ''
                    }
                  >
                    {formatPar(player.result?.total_score_to_par ?? null)}
                  </span>
                </TableCell>
                {[1, 2, 3, 4].map((r) => {
                  const score = player.scores.find((s) => s.round_number === r);
                  const holesPlayed = score?.hole_scores?.length ?? 0;
                  const isComplete = holesPlayed >= 18;
                  return (
                    <TableCell key={r} className="text-center text-sm">
                      {score ? (
                        <span
                          className={
                            (score.score_to_par ?? 0) < 0
                              ? 'text-red-600'
                              : (score.score_to_par ?? 0) > 0
                              ? 'text-blue-600'
                              : ''
                          }
                        >
                          {formatPar(score.score_to_par)}
                          {!isComplete && holesPlayed > 0 && (
                            <span className="text-[10px] text-gray-400 ml-0.5">
                              ({holesPlayed})
                            </span>
                          )}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  );
                })}
                <TableCell className="text-center text-sm">
                  {player.result?.final_position
                    ? player.result.final_position
                    : player.result?.made_cut === false &&
                      player.scores.some(
                        (s) => s.round_number === 2 && s.total_strokes != null
                      )
                    ? 'MC'
                    : '-'}
                </TableCell>
                <TableCell className="text-center">
                  <OwnershipBar
                    count={player.entry_count}
                    total={player.total_entries}
                  />
                </TableCell>
                <TableCell className="text-right font-bold">
                  {player.result?.total_points ?? 0}
                </TableCell>
                <TableCell>
                  {expandedId === player.golfer.id ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </TableCell>
              </TableRow>
              {expandedId === player.golfer.id && (
                <TableRow key={`${player.golfer.id}-detail`}>
                  <TableCell colSpan={11} className="bg-gray-50 px-6 py-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Picked by</span>
                        <p className="font-semibold">
                          {player.entry_count} / {player.total_entries} teams (
                          {player.total_entries > 0
                            ? Math.round(
                                (player.entry_count / player.total_entries) * 100
                              )
                            : 0}
                          %)
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">World Ranking</span>
                        <p className="font-semibold">
                          {player.golfer.world_ranking
                            ? `#${player.golfer.world_ranking}`
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Daily Points</span>
                        <p className="font-semibold">
                          {player.result?.daily_points ?? 0}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Tournament Points</span>
                        <p className="font-semibold">
                          {player.result?.tournament_points ?? 0}
                        </p>
                      </div>
                    </div>
                    {hasScores && (
                      <div className="mt-3">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Round</TableHead>
                              <TableHead className="text-xs text-center">Strokes</TableHead>
                              <TableHead className="text-xs text-center">To Par</TableHead>
                              <TableHead className="text-xs text-center">Eagles</TableHead>
                              <TableHead className="text-xs text-center">Best Round</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {player.scores
                              .sort((a, b) => a.round_number - b.round_number)
                              .map((score) => {
                                const holesPlayed = score.hole_scores?.length ?? 0;
                                const isComplete = holesPlayed >= 18;
                                const roundEagles = (score.eagles ?? 0) + (score.double_eagles ?? 0);
                                return (
                                  <TableRow key={score.round_number}>
                                    <TableCell className="text-sm font-medium">
                                      R{score.round_number}
                                      {!isComplete && holesPlayed > 0 && (
                                        <span className="text-xs text-gray-400 ml-1">
                                          (thru {holesPlayed})
                                        </span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-center text-sm">
                                      {score.total_strokes ?? '-'}
                                    </TableCell>
                                    <TableCell className="text-center text-sm">
                                      <span
                                        className={
                                          (score.score_to_par ?? 0) < 0
                                            ? 'text-red-600'
                                            : (score.score_to_par ?? 0) > 0
                                            ? 'text-blue-600'
                                            : ''
                                        }
                                      >
                                        {formatPar(score.score_to_par)}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-center text-sm">
                                      {roundEagles > 0 ? (
                                        <span className="text-green-700">{roundEagles}</span>
                                      ) : (
                                        '-'
                                      )}
                                      {(score.holes_in_one ?? 0) > 0 && (
                                        <span className="text-amber-600 ml-1">
                                          {score.holes_in_one} ace
                                        </span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-center text-sm">
                                      {score.is_best_round_of_day && (
                                        <Badge className="bg-yellow-100 text-yellow-800 text-[10px]">
                                          Best of Day
                                        </Badge>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </>
          );
        })}
      </TableBody>
    </Table>
  );
}
