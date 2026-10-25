import { isSeed, seededShuffle } from '../../lib/shuffle';
import { duelAnswer, duelItinerary, featuredIds, isFeatured, isShowable, ladderIds, regionOf, showDestinationIds, variantsFor, type DuelAnswer } from './cast';
import { groupQuick, groupTwoPerson, type Vote } from './matching';

export type { Vote };
export type PlayerId = 'a' | 'b';
export type Mode = 'two_person' | 'quick';
export type Phase = 'intro' | 'picture_reveal' | 'higher_lower' | 'wildcard_board' | 'ballots' | 'results' | 'grand_final';
export type Bookmark = 'possible' | 'not_for_me' | 'watching';
export type DuelCall = 'higher' | 'lower';

export type DuelRecord = {
  index: number;
  leftItineraryId: string;
  rightItineraryId: string;
  /** Each traveller's secret call. The quick edition has one shared call, under 'a'. */
  calls: Partial<Record<PlayerId, DuelCall>>;
  /** Both prices shown without waiting for the calls. Scores nothing. */
  skipped: boolean;
  /** The optional "guess it to the pound" entry. */
  poundGuess?: number;
};

/** A traveller's one guess at a Round 1 picture, and how many tiles were open at the time. */
export type Buzz = { guessId: string; tilesOpen: number };

/** Round 1 pictures hide under nine tiles. At least one stays down until the reveal. */
export const TILES = 9;
/** A right answer scores one point per tile still covered. */
export const picturePoints = (tilesOpen: number) => TILES - tilesOpen;
/** A right price call. */
export const DUEL_POINTS = 3;
/** A new clue arrives with every third tile. */
export const cluesShown = (tilesOpen: number) => Math.min(3, 1 + Math.floor(tilesOpen / 3));

export type GameState = {
  version: 3;
  mode: Mode;
  started: boolean;
  /** The last stage visited, for "Resume show". */
  phase: Phase;
  playerNames: Record<PlayerId, string>;

  // Round 1
  revealIndex: number;
  /** How many tiles each picture has had flipped (0 to TILES − 1). */
  tilesOpen: Record<string, number>;
  identityRevealed: Record<string, true>;
  /** Studio points only. One buzz per traveller per picture. */
  buzzes: Record<string, Partial<Record<PlayerId, Buzz>>>;
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
  /** Shuffles the running order, the price pairings and the board draws. null keeps the written order. */
  seed: number | null;
};

export const MAX_FINALISTS = 3;

export const initialState: GameState = {
  version: 3,
  mode: 'two_person',
  started: false,
  phase: 'intro',
  playerNames: { a: '', b: '' },
  revealIndex: 0,
  tilesOpen: {},
  identityRevealed: {},
  buzzes: {},
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
  seed: null,
};

export type Action =
  | { type: 'hydrate'; state: GameState }
  | { type: 'setMode'; mode: Mode }
  | { type: 'setName'; player: PlayerId; name: string }
  | { type: 'start'; seed?: number }
  | { type: 'visit'; phase: Phase }
  | { type: 'goToReveal'; index: number }
  | { type: 'showMore'; destinationId: string }
  | { type: 'revealIdentity'; destinationId: string }
  | { type: 'buzz'; destinationId: string; player: PlayerId; guessId: string }
  | { type: 'bookmark'; destinationId: string; bookmark?: Bookmark }
  | { type: 'chooseItinerary'; destinationId: string; itineraryId: string }
  | { type: 'goToDuel'; index: number }
  | { type: 'callDuel'; index: number; player: PlayerId; call: DuelCall; poundGuess?: number }
  | { type: 'skipDuel'; index: number; poundGuess?: number }
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
  const ladder = ladderOrder(state);
  const leftId = ladder[index];
  const rightId = ladder[index + 1];
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
      // A new show deals a fresh order once. A show already under way keeps its own.
      return { ...state, started: true, seed: state.seed ?? (hasProgress(state) || !isSeed(action.seed) ? null : action.seed) };

    case 'visit':
      return state.phase === action.phase ? state : { ...state, phase: action.phase, started: true };

    case 'goToReveal':
      return { ...state, revealIndex: Math.max(0, Math.min(featuredIds.length - 1, action.index)) };

    case 'showMore':
      if (state.identityRevealed[action.destinationId]) return state;
      return {
        ...state,
        tilesOpen: { ...state.tilesOpen, [action.destinationId]: Math.min(TILES - 1, (state.tilesOpen[action.destinationId] ?? 0) + 1) },
      };

    case 'revealIdentity':
      return { ...state, identityRevealed: { ...state.identityRevealed, [action.destinationId]: true } };

    case 'buzz': {
      const id = action.destinationId;
      const mine = state.buzzes[id] ?? {};
      if (state.identityRevealed[id] || !players(state).includes(action.player) || mine[action.player]) return state;
      if (!pictureOptions(state, id).includes(action.guessId)) return state;
      const buzzes = { ...mine, [action.player]: { guessId: action.guessId, tilesOpen: state.tilesOpen[id] ?? 0 } };
      // A right answer, or nobody left to try, ends the picture.
      const over = action.guessId === id || players(state).every((p) => buzzes[p]);
      return {
        ...state,
        buzzes: { ...state.buzzes, [id]: buzzes },
        identityRevealed: over ? { ...state.identityRevealed, [id]: true } : state.identityRevealed,
      };
    }

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

    case 'callDuel':
    case 'skipDuel': {
      const pair = duelPair(state, action.index);
      if (!pair) return state;
      const prev = duelRecord(state, action.index);
      if (prev && duelDone(state, prev)) return state;
      const rec: DuelRecord = prev ?? { index: action.index, leftItineraryId: pair.left.id, rightItineraryId: pair.right.id, calls: {}, skipped: false };
      let next: DuelRecord;
      if (action.type === 'skipDuel') next = { ...rec, skipped: true };
      else {
        // Traveller B calls second, so A's call is never on screen for B to copy.
        const p = action.player;
        if (!players(state).includes(p) || rec.calls[p] || (p === 'b' && !rec.calls.a)) return state;
        next = { ...rec, calls: { ...rec.calls, [p]: action.call } };
      }
      if (next.poundGuess == null && action.poundGuess != null && Number.isFinite(action.poundGuess) && action.poundGuess > 0) {
        next = { ...next, poundGuess: Math.round(action.poundGuess) };
      }
      return { ...state, priceDuelHistory: [...state.priceDuelHistory.filter((h) => h.index !== action.index), next] };
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

/** Who plays the guessing rounds: both travellers, or one shared player in the quick edition. */
export function players(state: GameState): PlayerId[] {
  return state.mode === 'quick' ? ['a'] : ['a', 'b'];
}

function hash(s: string): number {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h;
}

/**
 * The four answers offered for a Round 1 picture: the real city and three
 * wrong ones from the same part of Europe, topped up from the rest of the
 * show if a region runs short. Fixed for a given show, so a reload offers the same four.
 */
export function pictureOptions(state: GameState, id: string): string[] {
  const rank = (x: string) => hash(`${state.seed ?? 0}:${id}:${x}`);
  const others = showDestinationIds.filter((x) => x !== id).sort((a, b) => rank(a) - rank(b));
  const region = regionOf(id);
  const near = others.filter((x) => region != null && regionOf(x) === region);
  const decoys = [...near, ...others.filter((x) => !near.includes(x))].slice(0, 3);
  return [id, ...decoys].sort((a, b) => rank(a) - rank(b));
}

/** Whether a duel has been settled: skipped, or everyone has called. */
export function duelDone(state: GameState, rec: DuelRecord): boolean {
  return rec.skipped || players(state).every((p) => rec.calls[p]);
}

export const callRight = (answer: DuelAnswer, call: DuelCall | undefined) => call != null && (answer === 'same' || answer === call);

export function nameOf(state: GameState, player: PlayerId): string {
  if (state.mode === 'quick') return 'Both of you';
  return state.playerNames[player].trim() || (player === 'a' ? 'Traveller A' : 'Traveller B');
}

/** Round 1's running order. */
export function revealOrder(state: GameState): string[] {
  return state.seed == null ? featuredIds : seededShuffle(featuredIds, state.seed);
}

/** Round 2's ladder. Shuffling it changes which destinations meet in each duel. */
export function ladderOrder(state: GameState): string[] {
  return state.seed == null ? ladderIds : seededShuffle(ladderIds, state.seed + 1);
}

export function hasProgress(state: GameState): boolean {
  return (
    state.revealIndex > 0 ||
    Object.keys(state.identityRevealed).length > 0 ||
    state.priceDuelHistory.length > 0 ||
    state.unlockedDestinationIds.length > 0 ||
    Object.keys(state.ballots.a).length > 0 ||
    Object.keys(state.ballots.b).length > 0
  );
}

/** Featured contestants in tonight's order, then anything the players added. One entry per destination. */
export function ballotIds(state: GameState): string[] {
  return unique([...revealOrder(state), ...state.ballotExtraIds.filter(isShowable)]);
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

export type StudioPoints = { picture: number; price: number; total: number };

/** Entertainment only: never used to rank a holiday. */
export function studioPoints(state: GameState): Record<PlayerId, StudioPoints> {
  const tally = (p: PlayerId): StudioPoints => {
    let picture = 0;
    for (const [id, buzzes] of Object.entries(state.buzzes)) {
      const b = buzzes[p];
      if (b && b.guessId === id) picture += picturePoints(b.tilesOpen);
    }
    let price = 0;
    for (let i = 0; i < Math.max(0, ladderIds.length - 1); i++) {
      const rec = duelRecord(state, i);
      const pair = duelPair(state, i);
      if (rec && pair && !rec.skipped && duelDone(state, rec) && callRight(pair.answer, rec.calls[p])) price += DUEL_POINTS;
    }
    return { picture, price, total: picture + price };
  };
  return { a: tally('a'), b: state.mode === 'quick' ? { picture: 0, price: 0, total: 0 } : tally('b') };
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
