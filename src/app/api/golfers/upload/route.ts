import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface GolferRow {
  Name: string;
  Group: string;
  Rank: string;
  'Age Range': string;
  Region: string;
  Rookie: string;
  Amateur: string;
  'First Name'?: string;
  'Last Name'?: string;
}

export async function POST(request: Request) {
  const supabase = createServiceClient();
  const body = await request.json();
  const { tournament_id, golfers: rows } = body as {
    tournament_id: string;
    golfers: GolferRow[];
  };

  if (!tournament_id || !rows?.length) {
    return NextResponse.json({ error: 'tournament_id and golfers required' }, { status: 400 });
  }

  // Get existing groups for this tournament
  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .eq('tournament_id', tournament_id);

  if (!groups?.length) {
    return NextResponse.json({ error: 'No groups configured. Create groups first.' }, { status: 400 });
  }

  const groupMap = new Map(groups.map((g) => [g.name.toUpperCase(), g.id]));

  const golferInserts = [];
  const errors: string[] = [];

  for (const row of rows) {
    const groupName = (row.Group ?? '').trim().toUpperCase();
    const groupId = groupMap.get(groupName);

    if (!groupId) {
      errors.push(`Unknown group "${row.Group}" for golfer "${row.Name}"`);
      continue;
    }

    const name = (row.Name ?? '').trim();
    if (!name) continue;

    // Parse name into first/last
    const nameParts = name.split(' ');
    const firstName = row['First Name'] ?? nameParts[0] ?? '';
    const lastName = row['Last Name'] ?? nameParts.slice(1).join(' ') ?? '';

    golferInserts.push({
      tournament_id,
      group_id: groupId,
      name,
      first_name: firstName,
      last_name: lastName,
      world_ranking: row.Rank ? parseInt(row.Rank) || null : null,
      region: (['United States', 'Europe', 'International'].includes(row.Region?.trim())
        ? row.Region.trim()
        : null) as 'United States' | 'Europe' | 'International' | null,
      age_category: (['Under 30', 'Over 40'].includes(row['Age Range']?.trim())
        ? row['Age Range'].trim()
        : null) as 'Under 30' | 'Over 40' | null,
      is_rookie: ['true', 'yes', '1', 'x'].includes((row.Rookie ?? '').trim().toLowerCase()),
      is_amateur: ['true', 'yes', '1', 'x'].includes((row.Amateur ?? '').trim().toLowerCase()),
    });
  }

  if (!golferInserts.length) {
    return NextResponse.json({ error: 'No valid golfers to import', errors }, { status: 400 });
  }

  // Delete existing golfers for this tournament and re-insert
  await supabase.from('golfers').delete().eq('tournament_id', tournament_id);

  const { data, error } = await supabase.from('golfers').insert(golferInserts).select();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    imported: data?.length ?? 0,
    errors,
  });
}
