import { createServiceClient } from '@/lib/supabase/server';
import { EntryTable } from '@/components/admin/entry-table';

export const dynamic = 'force-dynamic';

export default async function EntriesPage() {
  const supabase = createServiceClient();

  const { data: tournament } = await supabase
    .from('tournament_config')
    .select('*')
    .order('year', { ascending: false })
    .limit(1)
    .single();

  const tid = tournament?.id ?? '';

  const { data: entries } = await supabase
    .from('entries')
    .select(`
      *,
      entry_golfers (
        golfer:golfers ( id, name, region, age_category, is_rookie, is_amateur, group:groups ( name ) )
      )
    `)
    .eq('tournament_id', tid)
    .order('created_at', { ascending: false });

  const { data: rules } = await supabase
    .from('composition_rules')
    .select('*')
    .eq('tournament_id', tid);

  // Validate each entry against current rules and golfer data
  const entriesWithViolations = (entries ?? []).map((entry) => {
    const golfers = (entry.entry_golfers ?? []).map((eg: any) => eg.golfer).filter(Boolean);
    const violations: string[] = [];

    for (const rule of rules ?? []) {
      const count = golfers.filter((g: any) => {
        if (rule.field_name === 'region') return g.region === rule.field_value;
        if (rule.field_name === 'age_category') return g.age_category === rule.field_value;
        if (rule.field_name === 'is_rookie') return g.is_rookie === (rule.field_value === 'true');
        if (rule.field_name === 'is_amateur') return g.is_amateur === (rule.field_value === 'true');
        return false;
      }).length;

      if (count < rule.min_count) {
        violations.push(`${rule.label}: ${count}/${rule.min_count}`);
      }
    }

    return { ...entry, violations };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Entries</h1>
      <EntryTable
        tournamentId={tid}
        entries={entriesWithViolations}
        entryFee={tournament?.entry_fee ?? 20}
      />
    </div>
  );
}
