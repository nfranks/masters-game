import type { ESPNResponse, ESPNCompetitor } from './types';

const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/golf/pga';

export async function fetchScoreboard(): Promise<ESPNResponse> {
  const res = await fetch(`${BASE_URL}/scoreboard`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`ESPN API error: ${res.status}`);
  return res.json();
}

export async function fetchEventScoreboard(eventId: string): Promise<ESPNResponse> {
  const res = await fetch(`${BASE_URL}/scoreboard?event=${eventId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`ESPN API error: ${res.status}`);
  return res.json();
}

// Augusta National par values (standard)
export const AUGUSTA_PARS = [4, 5, 4, 3, 4, 3, 4, 5, 4, 4, 4, 3, 5, 4, 5, 3, 4, 4];

export function parseCompetitorRound(
  competitor: ESPNCompetitor,
  roundNumber: number
): {
  totalStrokes: number | null;
  scoreToPar: number | null;
  holeScores: number[];
  eagles: number;
  doubleEagles: number;
  holesInOne: number;
} | null {
  const roundData = competitor.linescores?.find((ls) => ls.period === roundNumber);
  if (!roundData || !roundData.value) return null;

  const totalStrokes = roundData.value;
  const scoreToPar = totalStrokes - 72; // Augusta is par 72

  let eagles = 0;
  let doubleEagles = 0;
  let holesInOne = 0;
  const holeScores: number[] = [];

  if (roundData.linescores) {
    for (const hole of roundData.linescores) {
      const strokes = hole.value;
      holeScores.push(strokes);
      const par = AUGUSTA_PARS[hole.period - 1] ?? 4;
      const diff = strokes - par;

      if (strokes === 1) holesInOne++;
      if (diff <= -3) doubleEagles++;
      else if (diff === -2) eagles++;
    }
  }

  return { totalStrokes, scoreToPar, holeScores, eagles, doubleEagles, holesInOne };
}
