import { mainCast, mysteryCast } from './catalogue';
import { settleFinal, type FinalVerdict } from './finalVote';
import { isSeed, seededShuffle } from './shuffle';
import type { Decision, Destination } from './types';

export type Screen = 'title' | 'conveyor' | 'play' | 'mystery' | 'final' | 'sensible';

export type Pair<T> = [T, T];

export type GuessRecord = {
  itineraryId: string;
  /** One locked-in guess per contestant, in contestant order. null means no guess. */
  guesses: Pair<number | null>;
  revealed: boolean;
  points: Pair<number>;
};

export type GameState = {
  version: 1;
  screen: Screen;
  playIndex: number;
  mysteryIndex: number;
  /** Destination id → chosen itinerary id. */
  itineraryChoice: Record<string, string>;
  /** Destination id → guess state for the currently chosen itinerary. */
  guesses: Record<string, GuessRecord>;
  decisions: Record<string, Decision>;
  winner: string | null;
  /** Each contestant's secret pick in the final vote. A pick only counts while that prize is kept. */
  finalPicks: Pair<string | null>;
  contestants: [string, string];
  sound: boolean;
  reduceMotion: boolean | null; // null = follow the device setting
  /** Shuffles the running order. null keeps the workbook order (games saved before shuffling existed). */
  seed: number | null;
};

export const STORAGE_KEY = 'great-january-getaway:v1';

export const initialState: GameState = {
  version: 1,
  screen: 'title',
  playIndex: 0,
  mysteryIndex: 0,
  itineraryChoice: {},
  guesses: {},
  decisions: {},
  winner: null,
  finalPicks: [null, null],
  contestants: ['Contestant One', 'Contestant Two'],
  sound: false,
  reduceMotion: null,
  seed: null,
};

export type Action =
  | { type: 'hydrate'; state: GameState }
  | { type: 'go'; screen: Screen }
  | { type: 'setPlayIndex'; index: number }
  | { type: 'setMysteryIndex'; index: number }
  | { type: 'chooseItinerary'; destinationId: string; itineraryId: string }
  | { type: 'lockGuess'; destinationId: string; itineraryId: string; contestant: 0 | 1; guess: number }
  | { type: 'reveal'; destinationId: string; itineraryId: string; points: Pair<number> }
  | { type: 'decide'; destinationId: string; decision: Decision | null }
  | { type: 'setWinner'; destinationId: string | null }
  | { type: 'finalPick'; contestant: 0 | 1; destinationId: string }
  | { type: 'finalVoteAgain' }
  | { type: 'renameContestant'; index: 0 | 1; name: string }
  | { type: 'toggleSound' }
  | { type: 'setReduceMotion'; value: boolean | null }
  | { type: 'shuffle'; seed: number }
  | { type: 'reset' };

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'hydrate':
      return action.state;
    case 'go':
      return { ...state, screen: action.screen };
    case 'setPlayIndex':
      return { ...state, playIndex: action.index };
    case 'setMysteryIndex':
      return { ...state, mysteryIndex: action.index };
    case 'chooseItinerary': {
      // Changing dates invalidates the guess and the reveal for that destination.
      const guesses = { ...state.guesses };
      delete guesses[action.destinationId];
      return { ...state, itineraryChoice: { ...state.itineraryChoice, [action.destinationId]: action.itineraryId }, guesses };
    }
    case 'lockGuess': {
      const prev = currentGuess(state, action.destinationId, action.itineraryId);
      if (prev?.revealed || prev?.guesses[action.contestant] != null) return state;
      if (!Number.isFinite(action.guess) || action.guess <= 0) return state;
      const guesses: Pair<number | null> = [...(prev?.guesses ?? [null, null])];
      guesses[action.contestant] = Math.min(9999, Math.round(action.guess));
      return {
        ...state,
        guesses: {
          ...state.guesses,
          [action.destinationId]: { itineraryId: action.itineraryId, guesses, revealed: false, points: [0, 0] },
        },
      };
    }
    case 'reveal': {
      const prev = currentGuess(state, action.destinationId, action.itineraryId);
      if (prev?.revealed) return state;
      return {
        ...state,
        guesses: {
          ...state.guesses,
          [action.destinationId]: {
            itineraryId: action.itineraryId,
            guesses: prev?.guesses ?? [null, null],
            revealed: true,
            points: action.points,
          },
        },
      };
    }
    case 'decide': {
      const decisions = { ...state.decisions };
      if (action.decision) decisions[action.destinationId] = action.decision;
      else delete decisions[action.destinationId];
      const winner = state.winner === action.destinationId && action.decision !== 'keep' ? null : state.winner;
      return { ...state, decisions, winner };
    }
    case 'setWinner':
      return { ...state, winner: action.destinationId };
    case 'finalPick': {
      const picks = finalPicks(state);
      const who = action.contestant;
      // Contestant Two picks second, so Contestant One's pick is never on screen for them.
      if (state.decisions[action.destinationId] !== 'keep' || picks[who] || (who === 1 && !picks[0])) return state;
      const next: Pair<string | null> = [...picks];
      next[who] = action.destinationId;
      const settled = { ...state, finalPicks: next };
      const v = finalVerdict(settled);
      return v?.kind === 'agreed' ? { ...settled, winner: v.id } : settled;
    }
    case 'finalVoteAgain':
      return { ...state, finalPicks: [null, null] };
    case 'renameContestant': {
      const contestants: [string, string] = [...state.contestants];
      contestants[action.index] = action.name.slice(0, 24);
      return { ...state, contestants };
    }
    case 'toggleSound':
      return { ...state, sound: !state.sound };
    case 'setReduceMotion':
      return { ...state, reduceMotion: action.value };
    case 'shuffle':
      // A new game deals a fresh running order. Once anything is judged, the order stays put.
      if (hasProgress(state) || !isSeed(action.seed)) return state;
      return { ...state, seed: action.seed, playIndex: 0, mysteryIndex: 0 };
    case 'reset':
      return { ...initialState, sound: state.sound, reduceMotion: state.reduceMotion };
  }
}

export function hasProgress(state: GameState): boolean {
  return Object.keys(state.decisions).length > 0 || Object.keys(state.guesses).length > 0;
}

/** The prizes in tonight's running order. */
export function mainLineup(state: GameState): Destination[] {
  return state.seed == null ? mainCast : seededShuffle(mainCast, state.seed);
}

export function mysteryLineup(state: GameState): Destination[] {
  return state.seed == null ? mysteryCast : seededShuffle(mysteryCast, state.seed + 1);
}

/** The guess record only counts if it was made for the itinerary now selected. */
export function currentGuess(state: GameState, destinationId: string, itineraryId: string): GuessRecord | undefined {
  const g = state.guesses[destinationId];
  return g && g.itineraryId === itineraryId ? g : undefined;
}

/** The final-vote picks that still count: a pick for a prize no longer kept drops out. */
export function finalPicks(state: GameState): Pair<string | null> {
  return state.finalPicks.map((id) => (id && state.decisions[id] === 'keep' ? id : null)) as Pair<string | null>;
}

export function finalVerdict(state: GameState): FinalVerdict | undefined {
  const [a, b] = finalPicks(state);
  return settleFinal([a ?? undefined, b ?? undefined], scoreFor(state));
}

/** Points so far, in contestant order. */
export function scoreFor(state: GameState): Pair<number> {
  const totals: Pair<number> = [0, 0];
  for (const g of Object.values(state.guesses)) {
    if (!g.revealed) continue;
    totals[0] += g.points[0];
    totals[1] += g.points[1];
  }
  return totals;
}

/**
 * Saves from before both contestants guessed held one guess, credited to a contestant by name.
 * Revealed ones keep their guess and points; an unrevealed draft was never locked in, so it goes.
 */
function migrateGuesses(raw: unknown, contestants: [string, string]): Record<string, GuessRecord> {
  const out: Record<string, GuessRecord> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, g] of Object.entries(raw as Record<string, any>)) {
    if (!g || typeof g.itineraryId !== 'string') continue;
    if (Array.isArray(g.guesses) && Array.isArray(g.points)) {
      out[id] = g as GuessRecord;
      continue;
    }
    if (!g.revealed) continue;
    const who = contestants.indexOf(g.contestant);
    const guesses: Pair<number | null> = [null, null];
    const points: Pair<number> = [0, 0];
    if (who === 0 || who === 1) {
      guesses[who] = typeof g.guess === 'number' ? g.guess : null;
      points[who] = typeof g.points === 'number' ? g.points : 0;
    }
    out[id] = { itineraryId: g.itineraryId, guesses, revealed: true, points };
  }
  return out;
}

export function loadState(storage: Pick<Storage, 'getItem'> | undefined): GameState | null {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1) return null;
    const { contestantTurn: _turn, ...rest } = parsed;
    const contestants = Array.isArray(parsed.contestants) && parsed.contestants.length === 2 ? parsed.contestants : initialState.contestants;
    return {
      ...initialState,
      ...rest,
      contestants,
      guesses: migrateGuesses(parsed.guesses, contestants),
      finalPicks:
        Array.isArray(parsed.finalPicks) && parsed.finalPicks.length === 2
          ? (parsed.finalPicks.map((id: unknown) => (typeof id === 'string' ? id : null)) as Pair<string | null>)
          : [null, null],
      seed: isSeed(parsed.seed) ? parsed.seed : null,
    };
  } catch {
    return null;
  }
}

export function saveState(storage: Pick<Storage, 'setItem'> | undefined, state: GameState) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or storage full: the game still works for this visit.
  }
}
