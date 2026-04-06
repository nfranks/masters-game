import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request) {
  const supabase = createServiceClient();
  const body = await request.json();

  const updates: Record<string, any> = {};
  if ('is_paid' in body) updates.is_paid = body.is_paid;
  if ('payment_method' in body) updates.payment_method = body.payment_method;
  if ('paid_to' in body) updates.paid_to = body.paid_to;
  if ('referred_by' in body) updates.referred_by = body.referred_by;
  if ('is_archived' in body) updates.is_archived = body.is_archived;

  const { data, error } = await supabase
    .from('entries')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // Delete entry_golfers first, then entry
  await supabase.from('entry_golfers').delete().eq('entry_id', id);
  const { error } = await supabase.from('entries').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
