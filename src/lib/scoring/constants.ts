// Daily points (per round per golfer)
export const POINTS = {
  BEST_ROUND_OF_DAY: 5,
  HOLE_IN_ONE: 5,
  DOUBLE_EAGLE: 3,
  EAGLE: 1,

  // Tournament points (per golfer)
  WINNER: 40,
  RUNNER_UP: 35,
  THIRD: 30,
  FOURTH: 25,
  FIFTH: 20,
  SIXTH_TO_TENTH: 15,
  ELEVENTH_TO_TWENTY_FIFTH: 10,
  BEST_ROUND_OF_TOURNAMENT: 5,
  MADE_CUT: 10,
} as const;

export function getPositionPoints(position: number | null): number {
  if (position === null) return 0;
  if (position === 1) return POINTS.WINNER;
  if (position === 2) return POINTS.RUNNER_UP;
  if (position === 3) return POINTS.THIRD;
  if (position === 4) return POINTS.FOURTH;
  if (position === 5) return POINTS.FIFTH;
  if (position >= 6 && position <= 10) return POINTS.SIXTH_TO_TENTH;
  if (position >= 11 && position <= 25) return POINTS.ELEVENTH_TO_TWENTY_FIFTH;
  return 0;
}
