import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createServiceClient();
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  // Get latest tournament
  const { data: tournament } = await supabase
    .from('tournament_config')
    .select('id')
    .order('year', { ascending: false })
    .limit(1)
    .single();

  if (!tournament) {
    return NextResponse.json({ error: 'No tournament found' }, { status: 404 });
  }

  const { data: tournament_full } = await supabase
    .from('tournament_config')
    .select('status, entry_deadline')
    .eq('id', tournament.id)
    .single();

  const { data: entry } = await supabase
    .from('entries')
    .select('id, team_name, edit_token')
    .eq('tournament_id', tournament.id)
    .eq('email', email.trim().toLowerCase())
    .eq('is_archived', false)
    .single();

  if (!entry) {
    return NextResponse.json({ error: 'No entry found for this email' }, { status: 404 });
  }

  const isEditable =
    tournament_full?.status === 'open' &&
    (!tournament_full?.entry_deadline || new Date(tournament_full.entry_deadline) > new Date());

  return NextResponse.json({
    entry_id: entry.id,
    team_name: entry.team_name,
    edit_token: entry.edit_token,
    is_editable: isEditable,
  });
}
