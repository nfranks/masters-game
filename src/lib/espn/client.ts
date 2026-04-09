import type { ESPNResponse, ESPNCompetitor } from './types';

const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/golf/pga';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 3000, 8000]; // exponential-ish backoff
const FETCH_TIMEOUT = 15000; // 15 second timeout

async function fetchWithRetry(url: string): Promise<ESPNResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const res = await fetch(url, {
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`ESPN API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      // Sanity check: ESPN sometimes returns empty/malformed responses
      if (!data || typeof data !== 'object') {
        throw new Error('ESPN returned empty or malformed response');
      }

      return data;
    } catch (err: any) {
      lastError = err;
      const isTimeout = err.name === 'AbortError';
      const retryable = isTimeout || err.message?.includes('ESPN API error: 5');

      if (attempt < MAX_RETRIES && retryable) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
        continue;
      }

      // Non-retryable error or exhausted retries
      break;
    }
  }

  throw lastError ?? new Error('ESPN fetch failed after retries');
}

export async function fetchScoreboard(): Promise<ESPNResponse> {
  return fetchWithRetry(`${BASE_URL}/scoreboard`);
}

export async function fetchEventScoreboard(eventId: string): Promise<ESPNResponse> {
  return fetchWithRetry(`${BASE_URL}/scoreboard?event=${eventId}`);
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
