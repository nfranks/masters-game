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
import { RefreshCw, Download, Calculator } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  tournamentId: string;
  logs: {
    id: string;
    status: string;
    golfers_updated: number;
    error_message: string | null;
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

export function ScoreFetcher({ tournamentId, logs, golferResults }: Props) {
  const [fetching, setFetching] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const fetchScores = async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/scores/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournament_id: tournamentId }),
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

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Button
          onClick={fetchScores}
          disabled={fetching}
          className="bg-green-700 hover:bg-green-800"
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
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {new Date(log.fetched_at).toLocaleString()}
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
