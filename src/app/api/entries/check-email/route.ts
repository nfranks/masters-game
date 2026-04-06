import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createServiceClient();
  const { email, tournament_id } = await request.json();

  if (!email || !tournament_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('entries')
    .select('id, team_name, is_archived')
    .eq('tournament_id', tournament_id)
    .eq('email', email.trim().toLowerCase())
    .eq('is_archived', false)
    .single();

  return NextResponse.json({ exists: !!existing, team_name: existing?.team_name ?? null });
}
