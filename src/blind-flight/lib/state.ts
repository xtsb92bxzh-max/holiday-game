import { ballotOrder, featuredIds, isFeatured, isShowable, variantsFor } from './cast';
import { groupQuick, groupTwoPerson, type Vote } from './voteMatching';

export type { Vote };
export type PlayerId = 'traveller1' | 'traveller2';
export type PlayMode = 'two_person' | 'quick';

export const players: PlayerId[] = ['traveller1', 'traveller2'];

export type PlayerProgress = {
  votes: Record<string, Vote | undefined>; // destination id
  guessedPricesGBP: Record<string, number | undefined>; // itinerary id
  priceRevealed: Record<string, true | undefined>; // itinerary id
  identityRevealed: Record<string, true | undefined>; // destination id
  cluesShown: Record<string, number | undefined>; // destination id
  /** Most recent last. Used for undo. */
  history: { destinationId: string; previous?: Vote }[];
};

export type GameState = {
  schemaVersion: 2;
  mode: PlayMode;
  started: boolean;
  activePlayer: PlayerId;
  nicknames: Record<PlayerId, string>;
  activeDestinationId?: string;
  /** Featured contestants plus any added contenders. */
  destinationOrder: string[];
  preferredItineraryByDestination: Record<string, string>;
  players: Record<PlayerId, PlayerProgress>;
  ballotComplete: Record<PlayerId, boolean>;
  /** Only honoured once both ballots are in. */
  showOtherVotes: boolean;
  /** Empty means "use the default finalists". */
  finalists: string[];
  winnerDestinationId?: string;
  soundEnabled: boolean;
  /** null follows the device setting. */
  reduceMotion: boolean | null;
};

export const emptyProgress = (): PlayerProgress => ({
  votes: {},
  guessedPricesGBP: {},
  priceRevealed: {},
  identityRevealed: {},
  cluesShown: {},
  history: [],
});

export const initialState: GameState = {
  schemaVersion: 2,
  mode: 'two_person',
  started: false,
  activePlayer: 'traveller1',
  nicknames: { traveller1: '', traveller2: '' },
  destinationOrder: featuredIds,
  preferredItineraryByDestination: {},
  players: { traveller1: emptyProgress(), traveller2: emptyProgress() },
  ballotComplete: { traveller1: false, traveller2: false },
  showOtherVotes: false,
  finalists: [],
  soundEnabled: false,
  reduceMotion: null,
};

export const MAX_FINALISTS = 4;

export type Action =
  | { type: 'hydrate'; state: GameState }
  | { type: 'setMode'; mode: PlayMode }
  | { type: 'setNickname'; player: PlayerId; name: string }
  | { type: 'start' }
  | { type: 'setActive'; destinationId: string }
  | { type: 'revealClue'; destinationId: string }
  | { type: 'revealIdentity'; destinationId: string }
  | { type: 'chooseItinerary'; destinationId: string; itineraryId: string }
  | { type: 'guess'; itineraryId: string; value: number | undefined }
  | { type: 'revealPrice'; itineraryId: string }
  | { type: 'vote'; destinationId: string; vote: Vote }
  | { type: 'undo' }
  | { type: 'completeBallot' }
  | { type: 'startSecondBallot' }
  | { type: 'editBallot'; player: PlayerId }
  | { type: 'setShowOtherVotes'; value: boolean }
  | { type: 'addContender'; destinationId: string }
  | { type: 'removeContender'; destinationId: string }
  | { type: 'setFinalists'; ids: string[] }
  | { type: 'toggleFinalist'; destinationId: string }
  | { type: 'setWinner'; destinationId?: string }
  | { type: 'setSound'; on: boolean }
  | { type: 'setReduceMotion'; value: boolean | null }
  | { type: 'reset' };

function withPlayer(state: GameState, player: PlayerId, fn: (p: PlayerProgress) => PlayerProgress): GameState {
  return { ...state, players: { ...state.players, [player]: fn(state.players[player]) } };
}

function freshBallots(state: GameState): GameState {
  return {
    ...state,
    activePlayer: 'traveller1',
    activeDestinationId: undefined,
    players: { traveller1: emptyProgress(), traveller2: emptyProgress() },
    ballotComplete: { traveller1: false, traveller2: false },
    showOtherVotes: false,
    finalists: [],
    winnerDestinationId: undefined,
  };
}

export function reducer(state: GameState, action: Action): GameState {
  const me = state.activePlayer;
  switch (action.type) {
    case 'hydrate':
      return action.state;

    case 'setMode':
      if (action.mode === state.mode) return state;
      return { ...freshBallots(state), mode: action.mode };

    case 'setNickname':
      return { ...state, nicknames: { ...state.nicknames, [action.player]: action.name.slice(0, 24) } };

    case 'start':
      return { ...state, started: true };

    case 'setActive':
      return state.destinationOrder.includes(action.destinationId)
        ? { ...state, activeDestinationId: action.destinationId }
        : state;

    case 'revealClue':
      return withPlayer(state, me, (p) => ({
        ...p,
        cluesShown: { ...p.cluesShown, [action.destinationId]: Math.min(3, (p.cluesShown[action.destinationId] ?? 0) + 1) },
      }));

    case 'revealIdentity':
      return withPlayer(state, me, (p) => ({
        ...p,
        identityRevealed: { ...p.identityRevealed, [action.destinationId]: true },
      }));

    case 'chooseItinerary': {
      const variants = variantsFor(action.destinationId);
      if (!variants.some((v) => v.id === action.itineraryId)) return state;
      // A new date choice means a new price round for everyone.
      const ids = variants.map((v) => v.id);
      const clear = (p: PlayerProgress): PlayerProgress => {
        const guessedPricesGBP = { ...p.guessedPricesGBP };
        const priceRevealed = { ...p.priceRevealed };
        for (const id of ids) {
          delete guessedPricesGBP[id];
          delete priceRevealed[id];
        }
        return { ...p, guessedPricesGBP, priceRevealed };
      };
      return {
        ...state,
        preferredItineraryByDestination: { ...state.preferredItineraryByDestination, [action.destinationId]: action.itineraryId },
        players: { traveller1: clear(state.players.traveller1), traveller2: clear(state.players.traveller2) },
      };
    }

    case 'guess':
      if (state.players[me].priceRevealed[action.itineraryId]) return state;
      return withPlayer(state, me, (p) => ({
        ...p,
        guessedPricesGBP: { ...p.guessedPricesGBP, [action.itineraryId]: action.value },
      }));

    case 'revealPrice':
      return withPlayer(state, me, (p) => ({ ...p, priceRevealed: { ...p.priceRevealed, [action.itineraryId]: true } }));

    case 'vote': {
      if (!state.destinationOrder.includes(action.destinationId)) return state;
      const previous = state.players[me].votes[action.destinationId];
      if (previous === action.vote) return state;
      return {
        ...withPlayer(state, me, (p) => ({
          ...p,
          votes: { ...p.votes, [action.destinationId]: action.vote },
          history: [...p.history, { destinationId: action.destinationId, previous }].slice(-100),
        })),
        activeDestinationId: action.destinationId,
      };
    }

    case 'undo': {
      const last = state.players[me].history.at(-1);
      if (!last) return state;
      return withPlayer(state, me, (p) => {
        const votes = { ...p.votes };
        if (last.previous) votes[last.destinationId] = last.previous;
        else delete votes[last.destinationId];
        return { ...p, votes, history: p.history.slice(0, -1) };
      });
    }

    case 'completeBallot':
      return { ...state, started: true, ballotComplete: { ...state.ballotComplete, [me]: true } };

    case 'startSecondBallot':
      if (state.mode !== 'two_person' || !state.ballotComplete.traveller1) return state;
      return { ...state, activePlayer: 'traveller2', activeDestinationId: undefined };

    case 'editBallot':
      if (!resultsReady(state)) return state;
      if (state.mode === 'quick' && action.player !== 'traveller1') return state;
      return { ...state, activePlayer: action.player };

    case 'setShowOtherVotes':
      return { ...state, showOtherVotes: action.value };

    case 'addContender':
      if (!isShowable(action.destinationId) || state.destinationOrder.includes(action.destinationId)) return state;
      return { ...state, destinationOrder: [...state.destinationOrder, action.destinationId] };

    case 'removeContender': {
      const id = action.destinationId;
      if (isFeatured(id) || !state.destinationOrder.includes(id)) return state;
      const drop = (p: PlayerProgress): PlayerProgress => {
        const votes = { ...p.votes };
        delete votes[id];
        return { ...p, votes, history: p.history.filter((h) => h.destinationId !== id) };
      };
      return {
        ...state,
        destinationOrder: state.destinationOrder.filter((d) => d !== id),
        players: { traveller1: drop(state.players.traveller1), traveller2: drop(state.players.traveller2) },
        finalists: state.finalists.filter((d) => d !== id),
        winnerDestinationId: state.winnerDestinationId === id ? undefined : state.winnerDestinationId,
        activeDestinationId: state.activeDestinationId === id ? undefined : state.activeDestinationId,
      };
    }

    case 'setFinalists':
      return { ...state, finalists: action.ids.filter(isShowable).slice(0, MAX_FINALISTS) };

    case 'toggleFinalist': {
      const id = action.destinationId;
      if (!isShowable(id)) return state;
      if (state.finalists.includes(id)) {
        return {
          ...state,
          finalists: state.finalists.filter((d) => d !== id),
          winnerDestinationId: state.winnerDestinationId === id ? undefined : state.winnerDestinationId,
        };
      }
      if (state.finalists.length >= MAX_FINALISTS) return state;
      return { ...state, finalists: [...state.finalists, id] };
    }

    case 'setWinner':
      if (action.destinationId && !isShowable(action.destinationId)) return state;
      return { ...state, winnerDestinationId: action.destinationId };

    case 'setSound':
      return { ...state, soundEnabled: action.on };

    case 'setReduceMotion':
      return { ...state, reduceMotion: action.value };

    case 'reset':
      return { ...initialState, soundEnabled: state.soundEnabled, reduceMotion: state.reduceMotion };
  }
}

// ───────────── Selectors ─────────────

export function displayName(state: GameState, player: PlayerId): string {
  if (state.mode === 'quick') return 'Both of you';
  return state.nicknames[player].trim() || (player === 'traveller1' ? 'Traveller 1' : 'Traveller 2');
}

export function ballot(state: GameState): string[] {
  return ballotOrder(state.destinationOrder);
}

export function progress(state: GameState, player: PlayerId = state.activePlayer) {
  const order = ballot(state);
  const voted = order.filter((id) => state.players[player].votes[id]).length;
  return { voted, total: order.length };
}

export function nextUnvoted(state: GameState, player: PlayerId = state.activePlayer, after?: string): string | undefined {
  const order = ballot(state);
  const votes = state.players[player].votes;
  const start = after ? order.indexOf(after) + 1 : 0;
  return [...order.slice(start), ...order.slice(0, start)].find((id) => !votes[id]);
}

export function resultsReady(state: GameState): boolean {
  return state.mode === 'quick'
    ? state.ballotComplete.traveller1
    : state.ballotComplete.traveller1 && state.ballotComplete.traveller2;
}

/**
 * Whether the active player may see the other traveller's votes.
 * Before both ballots are in, never.
 */
export function canSeeOtherVotes(state: GameState): boolean {
  return state.mode === 'two_person' && resultsReady(state) && state.showOtherVotes;
}

export type Phase = 'ballot1' | 'handover' | 'ballot2' | 'results';

export function phase(state: GameState): Phase {
  if (resultsReady(state)) return 'results';
  if (state.mode === 'quick') return 'ballot1';
  if (!state.ballotComplete.traveller1) return 'ballot1';
  return state.activePlayer === 'traveller2' ? 'ballot2' : 'handover';
}

/** Where "Continue the show" should take you. */
export function resumeHref(state: GameState): string {
  switch (phase(state)) {
    case 'handover':
      return '/blind-flight/handover';
    case 'results':
      return '/blind-flight/results';
    default: {
      const next =
        state.activeDestinationId && !state.players[state.activePlayer].votes[state.activeDestinationId]
          ? state.activeDestinationId
          : nextUnvoted(state, state.activePlayer, state.activeDestinationId);
      return next ? `/blind-flight/show/${next}` : '/blind-flight/show';
    }
  }
}

export function groups(state: GameState) {
  const order = ballot(state);
  return state.mode === 'quick'
    ? ({ kind: 'quick', ...groupQuick(order, state.players.traveller1.votes) } as const)
    : ({ kind: 'two_person', ...groupTwoPerson(order, state.players.traveller1.votes, state.players.traveller2.votes) } as const);
}

/** Matches first, then potential matches; in quick play, keeps then maybes. Up to four. */
export function defaultFinalists(state: GameState): string[] {
  if (!resultsReady(state)) return [];
  const g = groups(state);
  const list = g.kind === 'quick' ? [...g.keep, ...g.maybe] : [...g.match, ...g.potential];
  return list.slice(0, MAX_FINALISTS);
}

export function effectiveFinalists(state: GameState): string[] {
  return state.finalists.length > 0 ? state.finalists : defaultFinalists(state);
}
