'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { Download, Calculator, Pause, Play, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  tournamentId: string;
  autoFetchPaused: boolean;
  logs: {
    id: string;
    status: string;
    golfers_updated: number;
    error_message: string | null;
    source: string | null;
    fetched_at: string;
  }[];
  golferResults: {
    id: string;
    total_points: number;
    daily_points: number;
    tournament_points: number;
    made_cut: boolean;
    final_position: number | null;
    golfer: { name: string; group: { name: string } | null };
  }[];
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ${diffMin % 60}m ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

function formatTimestamp(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/New_York',
  }) + ' ET';
}

export function ScoreFetcher({ tournamentId, autoFetchPaused: initialPaused, logs, golferResults }: Props) {
  const [fetching, setFetching] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [paused, setPaused] = useState(initialPaused);
  const [togglingPause, setTogglingPause] = useState(false);

  const lastSuccess = logs.find((l) => l.status === 'success');
  const lastError = logs.find((l) => l.status === 'error');
  const recentErrors = logs.filter((l) => l.status === 'error').length;
  const recentSuccesses = logs.filter((l) => l.status === 'success').length;

  // Determine overall status
  let statusColor = 'text-gray-400';
  let statusLabel = 'No Data';
  let StatusIcon = Clock;

  if (lastSuccess) {
    const minutesSinceSuccess = (Date.now() - new Date(lastSuccess.fetched_at).getTime()) / 60000;
    if (minutesSinceSuccess < 10) {
      statusColor = 'text-green-600';
      statusLabel = 'Live';
      StatusIcon = CheckCircle;
    } else if (minutesSinceSuccess < 30) {
      statusColor = 'text-yellow-600';
      statusLabel = 'Recent';
      StatusIcon = Clock;
    } else if (minutesSinceSuccess < 120) {
      statusColor = 'text-orange-500';
      statusLabel = 'Stale';
      StatusIcon = AlertTriangle;
    } else {
      statusColor = 'text-red-500';
      statusLabel = 'Stale';
      StatusIcon = XCircle;
    }
  }

  if (recentErrors >= 3 && (!lastSuccess || new Date(lastError!.fetched_at) > new Date(lastSuccess.fetched_at))) {
    statusColor = 'text-red-600';
    statusLabel = 'Failing';
    StatusIcon = XCircle;
  }

  const fetchScores = async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/scores/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournament_id: tournamentId, source: 'manual' }),
      });
      const result = await res.json();
      setLastResult(result);
      if (!res.ok) throw new Error(result.error);
      toast.success(`Updated ${result.updated} score records`);
      if (result.unmatched?.length) {
        toast.warning(`${result.unmatched.length} unmatched athletes`);
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to fetch scores');
    } finally {
      setFetching(false);
    }
  };

  const recalculate = async () => {
    setRecalculating(true);
    try {
      const res = await fetch('/api/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournament_id: tournamentId }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('All points recalculated');
    } catch {
      toast.error('Failed to recalculate');
    } finally {
      setRecalculating(false);
    }
  };

  const togglePause = async () => {
    setTogglingPause(true);
    try {
      const res = await fetch('/api/admin/tournament', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tournamentId, auto_fetch_paused: !paused }),
      });
      if (!res.ok) throw new Error('Failed');
      setPaused(!paused);
      toast.success(paused ? 'Auto-fetch resumed' : 'Auto-fetch paused');
    } catch {
      toast.error('Failed to update');
    } finally {
      setTogglingPause(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-1">
              <StatusIcon className={`w-4 h-4 ${statusColor}`} />
              <p className="text-xs uppercase tracking-wider text-gray-500">Status</p>
            </div>
            <p className={`text-2xl font-bold ${statusColor}`}>{statusLabel}</p>
            {lastSuccess && (
              <p className="text-xs text-gray-400 mt-1">
                Last success: {timeAgo(lastSuccess.fetched_at)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Auto-Fetch</p>
            <div className="flex items-center gap-3">
              <p className={`text-2xl font-bold ${paused ? 'text-red-500' : 'text-green-600'}`}>
                {paused ? 'Paused' : 'Active'}
              </p>
              <button
                onClick={togglePause}
                disabled={togglingPause}
                className={`p-1.5 rounded-md transition-colors ${
                  paused
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
                title={paused ? 'Resume auto-fetch' : 'Pause auto-fetch'}
              >
                {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {paused ? 'Cron jobs skipped' : 'Every 5 min during play, hourly off-hours'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Recent Fetches</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-green-600">{recentSuccesses}</span>
              <span className="text-sm text-gray-400">success</span>
            </div>
            {recentErrors > 0 && (
              <p className="text-xs text-red-500 mt-1">{recentErrors} errors in last {logs.length}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Golfers Scored</p>
            <p className="text-2xl font-bold text-masters-green">{golferResults.length}</p>
            <p className="text-xs text-gray-400 mt-1">
              {golferResults.filter((g) => g.made_cut).length} made cut
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={fetchScores}
          disabled={fetching}
          className="bg-masters-green hover:bg-masters-light"
          size="lg"
        >
          <Download className="w-4 h-4 mr-2" />
          {fetching ? 'Fetching...' : 'Fetch Scores from ESPN'}
        </Button>
        <Button onClick={recalculate} disabled={recalculating} variant="outline" size="lg">
          <Calculator className="w-4 h-4 mr-2" />
          {recalculating ? 'Recalculating...' : 'Recalculate All Points'}
        </Button>
      </div>

      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Last Fetch Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-48">
              {JSON.stringify(lastResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Fetch History */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fetch History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      <div>{formatTimestamp(log.fetched_at)}</div>
                      <div className="text-xs text-gray-400">{timeAgo(log.fetched_at)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          log.source === 'cron'
                            ? 'border-blue-200 text-blue-700 text-xs'
                            : 'text-xs'
                        }
                      >
                        {log.source ?? 'manual'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          log.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.golfers_updated}</TableCell>
                    <TableCell className="text-sm text-red-600 max-w-xs truncate">
                      {log.error_message}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Golfer Points */}
      {golferResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Golfer Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Golfer</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead className="text-center">Pos</TableHead>
                    <TableHead className="text-center">Cut</TableHead>
                    <TableHead className="text-right">Daily</TableHead>
                    <TableHead className="text-right">Tournament</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {golferResults.map((gr) => (
                    <TableRow key={gr.id}>
                      <TableCell className="font-medium">{gr.golfer?.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{gr.golfer?.group?.name ?? '?'}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {gr.final_position ?? '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {gr.made_cut ? 'Yes' : 'No'}
                      </TableCell>
                      <TableCell className="text-right">{gr.daily_points}</TableCell>
                      <TableCell className="text-right">{gr.tournament_points}</TableCell>
                      <TableCell className="text-right font-bold">{gr.total_points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
