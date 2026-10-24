import { duelAnswer, duelItinerary, featuredIds, isFeatured, isShowable, ladderIds, variantsFor } from './cast';
import { groupQuick, groupTwoPerson, type Vote } from './matching';

export type { Vote };
export type PlayerId = 'a' | 'b';
export type Mode = 'two_person' | 'quick';
export type Phase = 'intro' | 'picture_reveal' | 'higher_lower' | 'wildcard_board' | 'ballots' | 'results' | 'grand_final';
export type Bookmark = 'possible' | 'not_for_me' | 'watching';
export type DuelGuess = 'higher' | 'lower' | 'skip';

export type DuelRecord = {
  index: number;
  leftItineraryId: string;
  rightItineraryId: string;
  guess: DuelGuess;
  /** null when the players skipped straight to both prices. */
  correct: boolean | null;
  /** The optional "guess it to the pound" entry. */
  poundGuess?: number;
};

export type GameState = {
  version: 3;
  mode: Mode;
  started: boolean;
  /** The last stage visited, for "Resume show". */
  phase: Phase;
  playerNames: Record<PlayerId, string>;

  // Round 1
  revealIndex: number;
  /** How many "show me a bit more" steps each picture has had (0–2). */
  revealSteps: Record<string, number>;
  identityRevealed: Record<string, true>;
  /** Studio points only. `atStep` is how much of the picture was showing. */
  pictureGuessResults: Record<string, { guessed: boolean; atStep: number }>;
  /** Informal bookmarks. They never fill in a ballot. */
  bookmarks: Record<string, Bookmark>;

  preferredItineraryIds: Record<string, string>;

  // Round 2
  duelIndex: number;
  priceDuelHistory: DuelRecord[];

  // Round 3
  unlockedDestinationIds: string[];
  /** Wildcards and extras the players chose to add to the ballot. */
  ballotExtraIds: string[];

  // Round 4
  ballots: Record<PlayerId, Record<string, Vote | undefined>>;
  ballotLocked: Record<PlayerId, boolean>;
  activeBallot: PlayerId;
  /** A private edit after locking in. Only that traveller's votes are on screen. */
  editing: PlayerId | null;
  resultsRevealed: boolean;

  // Grand final. Until the players change it, the finalists follow the votes.
  finalistsCustomised: boolean;
  finalistDestinationIds: string[];
  winnerDestinationId?: string;

  soundEnabled: boolean;
  /** null follows the device setting. */
  reduceMotion: boolean | null;
};

export const MAX_FINALISTS = 3;

export const initialState: GameState = {
  version: 3,
  mode: 'two_person',
  started: false,
  phase: 'intro',
  playerNames: { a: '', b: '' },
  revealIndex: 0,
  revealSteps: {},
  identityRevealed: {},
  pictureGuessResults: {},
  bookmarks: {},
  preferredItineraryIds: {},
  duelIndex: 0,
  priceDuelHistory: [],
  unlockedDestinationIds: [],
  ballotExtraIds: [],
  ballots: { a: {}, b: {} },
  ballotLocked: { a: false, b: false },
  activeBallot: 'a',
  editing: null,
  resultsRevealed: false,
  finalistsCustomised: false,
  finalistDestinationIds: [],
  soundEnabled: false,
  reduceMotion: null,
};

export type Action =
  | { type: 'hydrate'; state: GameState }
  | { type: 'setMode'; mode: Mode }
  | { type: 'setName'; player: PlayerId; name: string }
  | { type: 'start' }
  | { type: 'visit'; phase: Phase }
  | { type: 'goToReveal'; index: number }
  | { type: 'showMore'; destinationId: string }
  | { type: 'revealIdentity'; destinationId: string }
  | { type: 'recordGuess'; destinationId: string; guessed: boolean }
  | { type: 'bookmark'; destinationId: string; bookmark?: Bookmark }
  | { type: 'chooseItinerary'; destinationId: string; itineraryId: string }
  | { type: 'goToDuel'; index: number }
  | { type: 'answerDuel'; index: number; guess: DuelGuess; poundGuess?: number }
  | { type: 'unlock'; ids: string[] }
  | { type: 'addToBallot'; destinationId: string }
  | { type: 'removeFromBallot'; destinationId: string }
  | { type: 'vote'; destinationId: string; vote: Vote }
  | { type: 'lockBallot' }
  | { type: 'startBallotB' }
  | { type: 'editBallot'; player: PlayerId }
  | { type: 'finishEdit' }
  | { type: 'revealResults' }
  | { type: 'setFinalists'; ids: string[] }
  | { type: 'toggleFinalist'; destinationId: string }
  | { type: 'setWinner'; destinationId?: string }
  | { type: 'setSound'; on: boolean }
  | { type: 'setReduceMotion'; value: boolean | null }
  | { type: 'reset' };

const omit = <T,>(rec: Record<string, T>, key: string): Record<string, T> => {
  const copy = { ...rec };
  delete copy[key];
  return copy;
};

/** The two cards in a duel, using each destination's current dates. */
export function duelPair(state: GameState, index: number) {
  const leftId = ladderIds[index];
  const rightId = ladderIds[index + 1];
  if (!leftId || !rightId) return undefined;
  const left = duelItinerary(leftId, state.preferredItineraryIds[leftId]);
  const right = duelItinerary(rightId, state.preferredItineraryIds[rightId]);
  if (!left || !right) return undefined;
  return { leftId, rightId, left, right, answer: duelAnswer(left.estimatedTotalForTwoGBP, right.estimatedTotalForTwoGBP) };
}

/** A record only counts while it still matches the trips on stage. */
export function duelRecord(state: GameState, index: number): DuelRecord | undefined {
  const pair = duelPair(state, index);
  const rec = state.priceDuelHistory.find((h) => h.index === index);
  if (!pair || !rec) return undefined;
  return rec.leftItineraryId === pair.left.id && rec.rightItineraryId === pair.right.id ? rec : undefined;
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'hydrate':
      return action.state;

    case 'setMode':
      if (action.mode === state.mode) return state;
      // Switching edition empties the ballots rather than reinterpreting them.
      return {
        ...state,
        mode: action.mode,
        ballots: { a: {}, b: {} },
        ballotLocked: { a: false, b: false },
        activeBallot: 'a',
        editing: null,
        resultsRevealed: false,
        finalistsCustomised: false,
        finalistDestinationIds: [],
        winnerDestinationId: undefined,
      };

    case 'setName':
      return { ...state, playerNames: { ...state.playerNames, [action.player]: action.name.slice(0, 24) } };

    case 'start':
      return { ...state, started: true };

    case 'visit':
      return state.phase === action.phase ? state : { ...state, phase: action.phase, started: true };

    case 'goToReveal':
      return { ...state, revealIndex: Math.max(0, Math.min(featuredIds.length - 1, action.index)) };

    case 'showMore':
      return { ...state, revealSteps: { ...state.revealSteps, [action.destinationId]: Math.min(2, (state.revealSteps[action.destinationId] ?? 0) + 1) } };

    case 'revealIdentity':
      return { ...state, identityRevealed: { ...state.identityRevealed, [action.destinationId]: true } };

    case 'recordGuess':
      if (!state.identityRevealed[action.destinationId]) return state;
      return {
        ...state,
        pictureGuessResults: {
          ...state.pictureGuessResults,
          [action.destinationId]: { guessed: action.guessed, atStep: state.revealSteps[action.destinationId] ?? 0 },
        },
      };

    case 'bookmark':
      return {
        ...state,
        bookmarks: action.bookmark
          ? { ...state.bookmarks, [action.destinationId]: action.bookmark }
          : omit(state.bookmarks, action.destinationId),
      };

    case 'chooseItinerary': {
      if (!variantsFor(action.destinationId).some((v) => v.id === action.itineraryId)) return state;
      // New dates mean a new price round for any duel this destination is in. Votes stay.
      const next = { ...state, preferredItineraryIds: { ...state.preferredItineraryIds, [action.destinationId]: action.itineraryId } };
      return { ...next, priceDuelHistory: next.priceDuelHistory.filter((h) => duelRecord(next, h.index)) };
    }

    case 'goToDuel':
      return { ...state, duelIndex: Math.max(0, Math.min(Math.max(0, ladderIds.length - 2), action.index)) };

    case 'answerDuel': {
      const pair = duelPair(state, action.index);
      if (!pair || duelRecord(state, action.index)) return state;
      const correct = action.guess === 'skip' ? null : pair.answer === 'same' || pair.answer === action.guess;
      const rec: DuelRecord = {
        index: action.index,
        leftItineraryId: pair.left.id,
        rightItineraryId: pair.right.id,
        guess: action.guess,
        correct,
        ...(action.poundGuess != null && Number.isFinite(action.poundGuess) ? { poundGuess: Math.round(action.poundGuess) } : {}),
      };
      return { ...state, priceDuelHistory: [...state.priceDuelHistory.filter((h) => h.index !== action.index), rec] };
    }

    case 'unlock': {
      const add = action.ids.filter((id) => isShowable(id) && !isFeatured(id) && !state.unlockedDestinationIds.includes(id));
      return add.length ? { ...state, unlockedDestinationIds: [...state.unlockedDestinationIds, ...add] } : state;
    }

    case 'addToBallot':
      if (!isShowable(action.destinationId) || isFeatured(action.destinationId) || state.ballotExtraIds.includes(action.destinationId)) return state;
      return {
        ...state,
        ballotExtraIds: [...state.ballotExtraIds, action.destinationId],
        unlockedDestinationIds: state.unlockedDestinationIds.includes(action.destinationId)
          ? state.unlockedDestinationIds
          : [...state.unlockedDestinationIds, action.destinationId],
      };

    case 'removeFromBallot': {
      const id = action.destinationId;
      if (!state.ballotExtraIds.includes(id)) return state;
      return {
        ...state,
        ballotExtraIds: state.ballotExtraIds.filter((d) => d !== id),
        ballots: { a: omit(state.ballots.a, id), b: omit(state.ballots.b, id) },
        finalistDestinationIds: state.finalistDestinationIds.filter((d) => d !== id),
        winnerDestinationId: state.winnerDestinationId === id ? undefined : state.winnerDestinationId,
      };
    }

    case 'vote': {
      const who = currentVoter(state);
      if (!who || !ballotIds(state).includes(action.destinationId)) return state;
      return { ...state, ballots: { ...state.ballots, [who]: { ...state.ballots[who], [action.destinationId]: action.vote } } };
    }

    case 'lockBallot': {
      const who = currentVoter(state);
      if (!who) return state;
      return { ...state, ballotLocked: { ...state.ballotLocked, [who]: true }, editing: null };
    }

    case 'startBallotB':
      if (state.mode !== 'two_person' || !state.ballotLocked.a || state.ballotLocked.b) return state;
      return { ...state, activeBallot: 'b' };

    case 'editBallot':
      if (state.mode === 'quick' && action.player !== 'a') return state;
      if (!state.ballotLocked[action.player]) return state;
      return { ...state, editing: action.player, ballotLocked: { ...state.ballotLocked, [action.player]: false } };

    case 'finishEdit':
      if (!state.editing) return state;
      return { ...state, ballotLocked: { ...state.ballotLocked, [state.editing]: true }, editing: null };

    case 'revealResults':
      return ballotsComplete(state) ? { ...state, resultsRevealed: true } : state;

    case 'setFinalists':
      return { ...state, finalistsCustomised: true, finalistDestinationIds: unique(action.ids.filter(isShowable)).slice(0, MAX_FINALISTS) };

    case 'toggleFinalist': {
      const id = action.destinationId;
      if (!isShowable(id)) return state;
      const current = effectiveFinalists(state);
      if (current.includes(id)) {
        return {
          ...state,
          finalistsCustomised: true,
          finalistDestinationIds: current.filter((d) => d !== id),
          winnerDestinationId: state.winnerDestinationId === id ? undefined : state.winnerDestinationId,
        };
      }
      if (current.length >= MAX_FINALISTS) return state;
      return { ...state, finalistsCustomised: true, finalistDestinationIds: [...current, id] };
    }

    case 'setWinner':
      if (action.destinationId && !effectiveFinalists(state).includes(action.destinationId)) return state;
      return { ...state, winnerDestinationId: action.destinationId };

    case 'setSound':
      return { ...state, soundEnabled: action.on };

    case 'setReduceMotion':
      return { ...state, reduceMotion: action.value };

    case 'reset':
      return { ...initialState, soundEnabled: state.soundEnabled, reduceMotion: state.reduceMotion };
  }
}

const unique = (ids: string[]) => ids.filter((id, i) => ids.indexOf(id) === i);

// ───────────── Selectors ─────────────

export function nameOf(state: GameState, player: PlayerId): string {
  if (state.mode === 'quick') return 'Both of you';
  return state.playerNames[player].trim() || (player === 'a' ? 'Traveller A' : 'Traveller B');
}

/** Featured contestants, then anything the players added. One entry per destination. */
export function ballotIds(state: GameState): string[] {
  return unique([...featuredIds, ...state.ballotExtraIds.filter(isShowable)]);
}

/** Whose ballot is on screen, or null when nobody should be voting. */
export function currentVoter(state: GameState): PlayerId | null {
  if (state.editing) return state.editing;
  if (state.mode === 'quick') return state.ballotLocked.a ? null : 'a';
  if (!state.ballotLocked.a) return 'a';
  if (!state.ballotLocked.b && state.activeBallot === 'b') return 'b';
  return null;
}

export function ballotsComplete(state: GameState): boolean {
  if (state.editing) return false;
  return state.mode === 'quick' ? state.ballotLocked.a : state.ballotLocked.a && state.ballotLocked.b;
}

export function resultsVisible(state: GameState): boolean {
  return ballotsComplete(state) && state.resultsRevealed;
}

export type BallotStep = 'voting' | 'handover' | 'ready_to_reveal' | 'revealed';

export function ballotStep(state: GameState): BallotStep {
  if (currentVoter(state)) return 'voting';
  if (resultsVisible(state)) return 'revealed';
  if (ballotsComplete(state)) return 'ready_to_reveal';
  return 'handover';
}

export function votedCount(state: GameState, player: PlayerId) {
  const ids = ballotIds(state);
  return { voted: ids.filter((id) => state.ballots[player][id]).length, total: ids.length };
}

export function groups(state: GameState) {
  const order = ballotIds(state);
  return state.mode === 'quick'
    ? ({ kind: 'quick', ...groupQuick(order, state.ballots.a) } as const)
    : ({ kind: 'two_person', ...groupTwoPerson(order, state.ballots.a, state.ballots.b) } as const);
}

/**
 * Mutual favourites first, then the strongest maybes, featured before added
 * wildcards. Votes alone decide; nothing is chosen at random.
 */
export function rankedShortlist(state: GameState): string[] {
  if (!resultsVisible(state)) return [];
  const g = groups(state);
  const list = g.kind === 'quick' ? [...g.favourites, ...g.maybes] : [...g.mutual, ...g.discuss];
  const extra = new Set(state.ballotExtraIds);
  const tier = (id: string) => (g.kind === 'quick' ? (g.favourites.includes(id) ? 0 : 1) : g.mutual.includes(id) ? 0 : 1);
  return list
    .map((id, i) => ({ id, i }))
    .sort((x, y) => tier(x.id) - tier(y.id) || Number(extra.has(x.id)) - Number(extra.has(y.id)) || x.i - y.i)
    .map((x) => x.id);
}

export function defaultFinalists(state: GameState): string[] {
  return rankedShortlist(state).slice(0, MAX_FINALISTS);
}

export function effectiveFinalists(state: GameState): string[] {
  return state.finalistsCustomised ? state.finalistDestinationIds : defaultFinalists(state);
}

export function studioPoints(state: GameState) {
  const picture = Object.values(state.pictureGuessResults).reduce((sum, r) => sum + (r.guessed ? 3 - r.atStep : 0), 0);
  const price = ladderIds.slice(0, -1).reduce((sum, _, i) => sum + (duelRecord(state, i)?.correct ? 1 : 0), 0);
  return { picture, price, total: picture + price };
}

export const phaseHref: Record<Phase, string> = {
  intro: '/getaway-show',
  picture_reveal: '/getaway-show/catch-a-flight',
  higher_lower: '/getaway-show/higher-or-lower',
  wildcard_board: '/getaway-show/bullseye',
  ballots: '/getaway-show/vote',
  results: '/getaway-show/results',
  grand_final: '/getaway-show/final',
};

export function resumeHref(state: GameState): string {
  return phaseHref[state.phase === 'intro' ? 'picture_reveal' : state.phase];
}
