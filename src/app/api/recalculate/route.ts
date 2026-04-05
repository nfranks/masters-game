import { NextResponse } from 'next/server';
import { recalculateAll } from '@/lib/scoring/calculator';

export async function POST(request: Request) {
  const body = await request.json();
  const { tournament_id } = body;

  if (!tournament_id) {
    return NextResponse.json({ error: 'tournament_id required' }, { status: 400 });
  }

  try {
    await recalculateAll(tournament_id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
