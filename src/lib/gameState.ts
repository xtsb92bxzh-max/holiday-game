import type { Decision } from './types';

export type Screen = 'title' | 'conveyor' | 'play' | 'mystery' | 'final' | 'sensible';

export type GuessRecord = {
  itineraryId: string;
  guess: number | null;
  revealed: boolean;
  points: number;
  contestant?: string;
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
  contestants: [string, string];
  contestantTurn: 0 | 1;
  sound: boolean;
  reduceMotion: boolean | null; // null = follow the device setting
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
  contestants: ['Contestant One', 'Contestant Two'],
  contestantTurn: 0,
  sound: false,
  reduceMotion: null,
};

export type Action =
  | { type: 'hydrate'; state: GameState }
  | { type: 'go'; screen: Screen }
  | { type: 'setPlayIndex'; index: number }
  | { type: 'setMysteryIndex'; index: number }
  | { type: 'chooseItinerary'; destinationId: string; itineraryId: string }
  | { type: 'setGuess'; destinationId: string; itineraryId: string; guess: number | null }
  | { type: 'reveal'; destinationId: string; itineraryId: string; points: number }
  | { type: 'decide'; destinationId: string; decision: Decision | null }
  | { type: 'setWinner'; destinationId: string | null }
  | { type: 'renameContestant'; index: 0 | 1; name: string }
  | { type: 'toggleSound' }
  | { type: 'setReduceMotion'; value: boolean | null }
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
    case 'setGuess': {
      const prev = currentGuess(state, action.destinationId, action.itineraryId);
      if (prev?.revealed) return state;
      return {
        ...state,
        guesses: {
          ...state.guesses,
          [action.destinationId]: { itineraryId: action.itineraryId, guess: action.guess, revealed: false, points: 0 },
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
            guess: prev?.guess ?? null,
            revealed: true,
            points: action.points,
            contestant: state.contestants[state.contestantTurn],
          },
        },
        contestantTurn: state.contestantTurn === 0 ? 1 : 0,
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
    case 'renameContestant': {
      const contestants: [string, string] = [...state.contestants];
      contestants[action.index] = action.name.slice(0, 24);
      return { ...state, contestants };
    }
    case 'toggleSound':
      return { ...state, sound: !state.sound };
    case 'setReduceMotion':
      return { ...state, reduceMotion: action.value };
    case 'reset':
      return { ...initialState, sound: state.sound, reduceMotion: state.reduceMotion };
  }
}

/** The guess record only counts if it was made for the itinerary now selected. */
export function currentGuess(state: GameState, destinationId: string, itineraryId: string): GuessRecord | undefined {
  const g = state.guesses[destinationId];
  return g && g.itineraryId === itineraryId ? g : undefined;
}

export function scoreFor(state: GameState): Record<string, number> {
  const totals: Record<string, number> = { [state.contestants[0]]: 0, [state.contestants[1]]: 0 };
  for (const g of Object.values(state.guesses)) {
    if (g.revealed && g.contestant != null && g.contestant in totals) totals[g.contestant] += g.points;
  }
  return totals;
}

export function loadState(storage: Pick<Storage, 'getItem'> | undefined): GameState | null {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1) return null;
    return { ...initialState, ...parsed };
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
