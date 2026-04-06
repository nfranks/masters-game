import { createServiceClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TournamentSettings } from '@/components/admin/tournament-settings';

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

  if (tournament) {
    const [entriesRes, paidRes, groupsRes, golfersRes] = await Promise.all([
      supabase.from('entries').select('*', { count: 'exact', head: true }).eq('tournament_id', tournament.id).eq('is_archived', false),
      supabase.from('entries').select('*', { count: 'exact', head: true }).eq('tournament_id', tournament.id).eq('is_archived', false).eq('is_paid', true),
      supabase.from('groups').select('*', { count: 'exact', head: true }).eq('tournament_id', tournament.id),
      supabase.from('golfers').select('*', { count: 'exact', head: true }).eq('tournament_id', tournament.id),
    ]);
    stats = {
      entries: entriesRes.count ?? 0,
      paid: paidRes.count ?? 0,
      unpaid: (entriesRes.count ?? 0) - (paidRes.count ?? 0),
      groups: groupsRes.count ?? 0,
      golfers: golfersRes.count ?? 0,
    };
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
