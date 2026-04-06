import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();
  const body = await request.json();

  const updates: Record<string, any> = {};
  if ('group_id' in body) updates.group_id = body.group_id;
  if ('name' in body) updates.name = body.name;
  if ('world_ranking' in body) updates.world_ranking = body.world_ranking;
  if ('region' in body) updates.region = body.region;
  if ('age_category' in body) updates.age_category = body.age_category;
  if ('is_rookie' in body) updates.is_rookie = body.is_rookie;
  if ('is_amateur' in body) updates.is_amateur = body.is_amateur;

  const { data, error } = await supabase
    .from('golfers')
    .update(updates)
    .eq('id', id)
    .select('*, group:groups(name)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
