import { BestRecords } from '../types/game';

const RECORDS_KEY = 'skystack_car_records_v1';
const MUTE_KEY = 'skystack_car_muted_v1';

const DEFAULT_RECORDS: BestRecords = {
  bestScore: 0,
  bestFloor: 0,
  bestCombo: 0,
  totalGames: 0,
};

export function loadBestRecords(): BestRecords {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (!raw) return DEFAULT_RECORDS;
    const parsed = JSON.parse(raw) as Partial<BestRecords>;
    return {
      bestScore: typeof parsed.bestScore === 'number' ? parsed.bestScore : 0,
      bestFloor: typeof parsed.bestFloor === 'number' ? parsed.bestFloor : 0,
      bestCombo: typeof parsed.bestCombo === 'number' ? parsed.bestCombo : 0,
      totalGames: typeof parsed.totalGames === 'number' ? parsed.totalGames : 0,
    };
  } catch {
    return DEFAULT_RECORDS;
  }
}

export function saveRunToRecords(
  score: number,
  floor: number,
  maxCombo: number
): { records: BestRecords; isNewBestScore: boolean; isNewBestFloor: boolean } {
  const prev = loadBestRecords();
  const isNewBestScore = score > prev.bestScore;
  const isNewBestFloor = floor > prev.bestFloor;

  const updated: BestRecords = {
    bestScore: Math.max(prev.bestScore, score),
    bestFloor: Math.max(prev.bestFloor, floor),
    bestCombo: Math.max(prev.bestCombo, maxCombo),
    totalGames: prev.totalGames + 1,
  };

  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors gracefully
  }

  return { records: updated, isNewBestScore, isNewBestFloor };
}

export function loadMutedPreference(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveMutedPreference(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, String(muted));
  } catch {
    // Ignore storage errors
  }
}
