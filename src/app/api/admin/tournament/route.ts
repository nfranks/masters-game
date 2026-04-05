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

  const { data, error } = await supabase
    .from('tournament_config')
    .update({
      name: body.name,
      year: body.year,
      entry_fee: body.entry_fee,
      entry_deadline: body.entry_deadline,
      status: body.status,
      espn_event_id: body.espn_event_id,
    })
    .eq('id', body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
