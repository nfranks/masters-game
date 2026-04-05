import { createServiceClient } from '@/lib/supabase/server';
import { POINTS, getPositionPoints } from './constants';
import type { GolferScore, GolferResult } from '@/lib/types';

export function calculateRoundPoints(score: GolferScore, isBestRoundOfDay: boolean): number {
  let points = 0;
  points += (score.eagles ?? 0) * POINTS.EAGLE;
  points += (score.double_eagles ?? 0) * POINTS.DOUBLE_EAGLE;
  points += (score.holes_in_one ?? 0) * POINTS.HOLE_IN_ONE;
  if (isBestRoundOfDay) points += POINTS.BEST_ROUND_OF_DAY;
  return points;
}

export function detectScoringEvents(
  holeScores: number[],
  holePars: number[]
): { eagles: number; double_eagles: number; holes_in_one: number } {
  let eagles = 0;
  let double_eagles = 0;
  let holes_in_one = 0;

  for (let i = 0; i < holeScores.length; i++) {
    if (!holeScores[i] || !holePars[i]) continue;
    const diff = holeScores[i] - holePars[i];
    if (holeScores[i] === 1) holes_in_one++;
    if (diff <= -3) double_eagles++;
    else if (diff === -2) eagles++;
  }

  return { eagles, double_eagles, holes_in_one };
}

export async function recalculateAll(tournamentId: string) {
  const supabase = createServiceClient();

  // 1. Get all scores for this tournament
  const { data: scores } = await supabase
    .from('golfer_scores')
    .select('*')
    .eq('tournament_id', tournamentId);

  if (!scores?.length) return;

  // 2. Find best round of each day
  for (let round = 1; round <= 4; round++) {
    const roundScores = scores.filter(
      (s) => s.round_number === round && s.total_strokes != null
    );
    if (!roundScores.length) continue;

    const bestStrokes = Math.min(...roundScores.map((s) => s.total_strokes!));

    // Reset all, then set best
    await supabase
      .from('golfer_scores')
      .update({ is_best_round_of_day: false })
      .eq('tournament_id', tournamentId)
      .eq('round_number', round);

    await supabase
      .from('golfer_scores')
      .update({ is_best_round_of_day: true })
      .eq('tournament_id', tournamentId)
      .eq('round_number', round)
      .eq('total_strokes', bestStrokes);
  }

  // 3. Find best round of tournament
  const allPlayedScores = scores.filter((s) => s.total_strokes != null);
  let bestTournamentStrokes = Infinity;
  if (allPlayedScores.length) {
    bestTournamentStrokes = Math.min(...allPlayedScores.map((s) => s.total_strokes!));
  }

  // 4. Get fresh scores with updated best-round flags
  const { data: freshScores } = await supabase
    .from('golfer_scores')
    .select('*')
    .eq('tournament_id', tournamentId);

  // 5. Calculate per-golfer results
  const golferIds = [...new Set(freshScores?.map((s) => s.golfer_id) ?? [])];

  for (const golferId of golferIds) {
    const golferScores = freshScores!.filter((s) => s.golfer_id === golferId);
    const playedRounds = golferScores.filter((s) => s.total_strokes != null);

    // Daily points = sum of round points
    let dailyPoints = 0;
    for (const score of golferScores) {
      dailyPoints += calculateRoundPoints(score as GolferScore, score.is_best_round_of_day);
    }

    // Check if made cut (has rounds 3 or 4)
    const madeCut = golferScores.some(
      (s) => (s.round_number === 3 || s.round_number === 4) && s.total_strokes != null
    );

    // Best round of tournament
    const isBestOfTournament =
      playedRounds.length > 0 &&
      playedRounds.some((s) => s.total_strokes === bestTournamentStrokes);

    // Get position from the latest round score that has one
    const latestWithPosition = golferScores
      .sort((a, b) => b.round_number - a.round_number)
      .find(() => true); // just get latest

    // We need position from golfer_results or from the score data
    const { data: existingResult } = await supabase
      .from('golfer_results')
      .select('final_position')
      .eq('golfer_id', golferId)
      .eq('tournament_id', tournamentId)
      .single();

    const position = existingResult?.final_position ?? null;
    const tournamentPoints =
      getPositionPoints(position) +
      (madeCut ? POINTS.MADE_CUT : 0) +
      (isBestOfTournament ? POINTS.BEST_ROUND_OF_TOURNAMENT : 0);

    const totalStrokes = playedRounds.reduce((sum, s) => sum + (s.total_strokes ?? 0), 0);
    const totalScoreToPar = playedRounds.reduce((sum, s) => sum + (s.score_to_par ?? 0), 0);

    await supabase.from('golfer_results').upsert(
      {
        golfer_id: golferId,
        tournament_id: tournamentId,
        final_position: position,
        total_strokes: totalStrokes || null,
        total_score_to_par: totalScoreToPar,
        made_cut: madeCut,
        is_best_round_of_tournament: isBestOfTournament,
        tournament_points: tournamentPoints,
        daily_points: dailyPoints,
        total_points: tournamentPoints + dailyPoints,
      },
      { onConflict: 'golfer_id,tournament_id' }
    );
  }

  // 6. Update entry totals
  const { data: entries } = await supabase
    .from('entries')
    .select('id')
    .eq('tournament_id', tournamentId);

  for (const entry of entries ?? []) {
    const { data: entryGolfers } = await supabase
      .from('entry_golfers')
      .select('golfer_id')
      .eq('entry_id', entry.id);

    const golferIdsForEntry = entryGolfers?.map((eg) => eg.golfer_id) ?? [];

    const { data: results } = await supabase
      .from('golfer_results')
      .select('total_points')
      .eq('tournament_id', tournamentId)
      .in('golfer_id', golferIdsForEntry);

    const totalPoints = results?.reduce((sum, r) => sum + (r.total_points ?? 0), 0) ?? 0;

    await supabase.from('entries').update({ total_points: totalPoints }).eq('id', entry.id);
  }
}
