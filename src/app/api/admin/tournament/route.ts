import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createServiceClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from('tournament_config')
    .insert({
      name: body.name,
      year: body.year,
      entry_fee: body.entry_fee,
      entry_deadline: body.entry_deadline,
      status: body.status,
      espn_event_id: body.espn_event_id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const supabase = createServiceClient();
  const body = await request.json();

  // Build update object with only provided fields
  const updates: Record<string, any> = {};
  const allowedFields = ['name', 'year', 'entry_fee', 'entry_deadline', 'status', 'espn_event_id', 'auto_fetch_paused'];
  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  const { data, error } = await supabase
    .from('tournament_config')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
