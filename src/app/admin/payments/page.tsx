import { createServiceClient } from '@/lib/supabase/server';
import { PaymentsView } from '@/components/admin/payments-view';

export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
  const supabase = createServiceClient();

  const { data: tournament } = await supabase
    .from('tournament_config')
    .select('*')
    .order('year', { ascending: false })
    .limit(1)
    .single();

  const { data: entries } = await supabase
    .from('entries')
    .select('*')
    .eq('tournament_id', tournament?.id ?? '')
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
      <PaymentsView entries={entries ?? []} entryFee={tournament?.entry_fee ?? 20} />
    </div>
  );
}
