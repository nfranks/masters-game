import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Vercel Cron calls this endpoint on schedule
// During active play (8am-7pm ET, Thu-Sun): every 5 minutes
// Off-hours: every hour
export async function GET(request: Request) {
  // Verify this is a legitimate cron call (Vercel sets this header)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Get latest tournament
  const { data: tournament } = await supabase
    .from('tournament_config')
    .select('*')
    .order('year', { ascending: false })
    .limit(1)
    .single();

  if (!tournament) {
    return NextResponse.json({ error: 'No tournament found' }, { status: 404 });
  }

  // Only fetch if tournament is in active or closed status (not 'draft' or 'open' pre-tournament)
  if (tournament.status === 'draft') {
    return NextResponse.json({ skipped: true, reason: 'Tournament is in draft status' });
  }

  // Check if auto-fetch is paused
  const { data: pauseSetting } = await supabase
    .from('tournament_config')
    .select('auto_fetch_paused')
    .eq('id', tournament.id)
    .single();

  if (pauseSetting?.auto_fetch_paused) {
    return NextResponse.json({ skipped: true, reason: 'Auto-fetch is paused' });
  }

  // Call the existing fetch endpoint internally
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://masters-game.vercel.app';

  try {
    const res = await fetch(`${baseUrl}/api/scores/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournament_id: tournament.id, source: 'cron' }),
    });

    const result = await res.json();

    return NextResponse.json({
      success: res.ok,
      ...result,
      triggered_by: 'cron',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({
      error: err.message,
      triggered_by: 'cron',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
