import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Vercel Cron hits this every 5 minutes.
// We decide server-side whether to actually fetch based on time of day.
// During active play (8am-7pm ET, Thu-Sun): fetch every hit (every 5 min)
// Off-hours: fetch only on the hour (every 60 min)
export async function GET(request: Request) {
  // Verify cron secret if configured
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check time in ET to decide frequency
  const now = new Date();
  const etTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const hour = etTime.getHours();
  const minute = etTime.getMinutes();
  const day = etTime.getDay(); // 0=Sun, 4=Thu, 5=Fri, 6=Sat

  const isTournamentDay = day >= 4 || day === 0; // Thu-Sun
  const isDuringPlay = hour >= 8 && hour < 19; // 8am-7pm ET
  const isActiveWindow = isTournamentDay && isDuringPlay;

  // Off-hours: only fetch on the hour (minute 0-4 since cron is every 5 min)
  if (!isActiveWindow && minute >= 5) {
    return NextResponse.json({ skipped: true, reason: 'Off-hours, waiting for top of hour' });
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

  if (tournament.status === 'draft') {
    return NextResponse.json({ skipped: true, reason: 'Tournament is in draft status' });
  }

  if (tournament.auto_fetch_paused) {
    return NextResponse.json({ skipped: true, reason: 'Auto-fetch is paused' });
  }

  // Call the fetch endpoint
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
      active_window: isActiveWindow,
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
