import { createServiceClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TournamentSettings } from '@/components/admin/tournament-settings';
import { CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = createServiceClient();

  const { data: tournament } = await supabase
    .from('tournament_config')
    .select('*')
    .order('year', { ascending: false })
    .limit(1)
    .single();

  let stats = { entries: 0, paid: 0, unpaid: 0, groups: 0, golfers: 0 };
  let scoreStatus = { label: 'No Data', color: 'text-gray-400', lastSuccess: null as string | null };

  if (tournament) {
    const [entriesRes, paidRes, groupsRes, golfersRes, lastFetchRes] = await Promise.all([
      supabase.from('entries').select('*', { count: 'exact', head: true }).eq('tournament_id', tournament.id).eq('is_archived', false),
      supabase.from('entries').select('*', { count: 'exact', head: true }).eq('tournament_id', tournament.id).eq('is_archived', false).eq('is_paid', true),
      supabase.from('groups').select('*', { count: 'exact', head: true }).eq('tournament_id', tournament.id),
      supabase.from('golfers').select('*', { count: 'exact', head: true }).eq('tournament_id', tournament.id),
      supabase.from('score_fetch_log').select('status, fetched_at').eq('tournament_id', tournament.id).eq('status', 'success').order('fetched_at', { ascending: false }).limit(1),
    ]);
    stats = {
      entries: entriesRes.count ?? 0,
      paid: paidRes.count ?? 0,
      unpaid: (entriesRes.count ?? 0) - (paidRes.count ?? 0),
      groups: groupsRes.count ?? 0,
      golfers: golfersRes.count ?? 0,
    };

    const lastSuccess = lastFetchRes.data?.[0];
    if (lastSuccess) {
      const minutesAgo = (Date.now() - new Date(lastSuccess.fetched_at).getTime()) / 60000;
      scoreStatus.lastSuccess = lastSuccess.fetched_at;
      if (minutesAgo < 10) {
        scoreStatus = { label: 'Live', color: 'text-green-600', lastSuccess: lastSuccess.fetched_at };
      } else if (minutesAgo < 30) {
        scoreStatus = { label: 'Recent', color: 'text-yellow-600', lastSuccess: lastSuccess.fetched_at };
      } else if (minutesAgo < 120) {
        scoreStatus = { label: 'Stale', color: 'text-orange-500', lastSuccess: lastSuccess.fetched_at };
      } else {
        scoreStatus = { label: 'Stale', color: 'text-red-500', lastSuccess: lastSuccess.fetched_at };
      }
    }
  }

  function timeAgo(dateStr: string) {
    const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: 'Entries', value: stats.entries, color: 'text-blue-600' },
          { label: 'Paid', value: stats.paid, color: 'text-green-600' },
          { label: 'Unpaid', value: stats.unpaid, color: 'text-red-600' },
          { label: 'Groups', value: stats.groups, color: 'text-purple-600' },
          { label: 'Golfers', value: stats.golfers, color: 'text-orange-600' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${scoreStatus.color}`}>{scoreStatus.label}</p>
            {scoreStatus.lastSuccess && (
              <p className="text-xs text-gray-400 mt-1">{timeAgo(scoreStatus.lastSuccess)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tournament Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <TournamentSettings tournament={tournament} />
        </CardContent>
      </Card>
    </div>
  );
}
