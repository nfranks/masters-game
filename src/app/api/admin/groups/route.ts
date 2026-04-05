import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const tournamentId = searchParams.get('tournament_id');

  if (!tournamentId) return NextResponse.json({ error: 'tournament_id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('display_order');

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = createServiceClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from('groups')
    .insert({
      tournament_id: body.tournament_id,
      name: body.name,
      display_order: body.display_order,
      picks_required: body.picks_required,
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
    .from('groups')
    .update({
      name: body.name,
      display_order: body.display_order,
      picks_required: body.picks_required,
    })
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

  const { error } = await supabase.from('groups').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
