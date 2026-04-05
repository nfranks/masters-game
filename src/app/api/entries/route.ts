import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const tournamentId = searchParams.get('tournament_id');

  if (!tournamentId) return NextResponse.json({ error: 'tournament_id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('total_points', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = createServiceClient();
  const body = await request.json();

  const {
    tournament_id,
    first_name,
    last_name,
    email,
    team_name,
    selections, // Record<groupId, golferId[]>
  } = body;

  // Validate tournament is open
  const { data: tournament } = await supabase
    .from('tournament_config')
    .select('*')
    .eq('id', tournament_id)
    .single();

  if (!tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }

  if (tournament.status !== 'open') {
    return NextResponse.json({ error: 'Entries are not currently open' }, { status: 400 });
  }

  if (tournament.entry_deadline && new Date(tournament.entry_deadline) < new Date()) {
    return NextResponse.json({ error: 'Entry deadline has passed' }, { status: 400 });
  }

  // Check duplicate email
  const { data: existing } = await supabase
    .from('entries')
    .select('id')
    .eq('tournament_id', tournament_id)
    .eq('email', email.trim().toLowerCase())
    .single();

  if (existing) {
    return NextResponse.json({ error: 'An entry with this email already exists' }, { status: 400 });
  }

  // Validate group picks
  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .eq('tournament_id', tournament_id);

  for (const group of groups ?? []) {
    const picks = selections[group.id] ?? [];
    if (picks.length !== group.picks_required) {
      return NextResponse.json(
        { error: `Group "${group.name}" requires ${group.picks_required} picks, got ${picks.length}` },
        { status: 400 }
      );
    }
  }

  // Gather all selected golfer IDs
  const allGolferIds: string[] = Object.values(selections as Record<string, string[]>).flat();

  // Fetch selected golfers and validate composition rules
  const { data: selectedGolfers } = await supabase
    .from('golfers')
    .select('*')
    .in('id', allGolferIds);

  const { data: rules } = await supabase
    .from('composition_rules')
    .select('*')
    .eq('tournament_id', tournament_id);

  for (const rule of rules ?? []) {
    const count = (selectedGolfers ?? []).filter((g) => {
      if (rule.field_name === 'region') return g.region === rule.field_value;
      if (rule.field_name === 'age_category') return g.age_category === rule.field_value;
      if (rule.field_name === 'is_rookie') return g.is_rookie === (rule.field_value === 'true');
      if (rule.field_name === 'is_amateur') return g.is_amateur === (rule.field_value === 'true');
      return false;
    }).length;

    if (count < rule.min_count) {
      return NextResponse.json(
        { error: `Rule violation: ${rule.label} (have ${count}, need ${rule.min_count})` },
        { status: 400 }
      );
    }
  }

  // Insert entry
  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .insert({
      tournament_id,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim().toLowerCase(),
      team_name: team_name.trim(),
    })
    .select()
    .single();

  if (entryError) {
    return NextResponse.json({ error: entryError.message }, { status: 400 });
  }

  // Insert entry_golfers
  const entryGolfers = allGolferIds.map((golferId) => {
    const golfer = selectedGolfers?.find((g) => g.id === golferId);
    return {
      entry_id: entry.id,
      golfer_id: golferId,
      group_id: golfer?.group_id ?? '',
    };
  });

  const { error: egError } = await supabase.from('entry_golfers').insert(entryGolfers);

  if (egError) {
    // Rollback entry
    await supabase.from('entries').delete().eq('id', entry.id);
    return NextResponse.json({ error: egError.message }, { status: 400 });
  }

  return NextResponse.json({ entry });
}
