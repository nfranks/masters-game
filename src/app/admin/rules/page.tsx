import { createServiceClient } from '@/lib/supabase/server';
import { RuleEditor } from '@/components/admin/rule-editor';

export const dynamic = 'force-dynamic';

export default async function RulesPage() {
  const supabase = createServiceClient();

  const { data: tournament } = await supabase
    .from('tournament_config')
    .select('*')
    .order('year', { ascending: false })
    .limit(1)
    .single();

  const { data: rules } = await supabase
    .from('composition_rules')
    .select('*')
    .eq('tournament_id', tournament?.id ?? '');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Composition Rules</h1>
      <p className="text-gray-600">
        Set the team composition requirements that entries must satisfy.
      </p>
      <RuleEditor tournamentId={tournament?.id ?? ''} initialRules={rules ?? []} />
    </div>
  );
}
