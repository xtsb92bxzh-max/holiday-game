import { featuredIds, isShowable, variantsFor } from './cast';
import { emptyProgress, initialState, MAX_FINALISTS, type GameState, type PlayerProgress, type Vote } from './state';

export const STORAGE_KEY = 'blind-flight:v2';

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem'>;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const votes = new Set<Vote>(['keep', 'maybe', 'pass']);

function record<T>(v: unknown, keep: (key: string, value: unknown) => T | undefined): Record<string, T> {
  if (!isObj(v)) return {};
  const out: Record<string, T> = {};
  for (const [k, val] of Object.entries(v)) {
    const kept = keep(k, val);
    if (kept !== undefined) out[k] = kept;
  }
  return out;
}

function sanitiseProgress(v: unknown, order: Set<string>): PlayerProgress {
  if (!isObj(v)) return emptyProgress();
  const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0;
  return {
    votes: record(v.votes, (k, val) => (order.has(k) && votes.has(val as Vote) ? (val as Vote) : undefined)),
    guessedPricesGBP: record(v.guessedPricesGBP, (_, val) => (isNum(val) ? val : undefined)),
    priceRevealed: record(v.priceRevealed, (_, val) => (val === true ? (true as const) : undefined)),
    identityRevealed: record(v.identityRevealed, (k, val) => (val === true && order.has(k) ? (true as const) : undefined)),
    cluesShown: record(v.cluesShown, (_, val) => (isNum(val) ? Math.min(3, Math.floor(val)) : undefined)),
    history: Array.isArray(v.history)
      ? v.history
          .filter(
            (h): h is { destinationId: string; previous?: Vote } =>
              isObj(h) && typeof h.destinationId === 'string' && order.has(h.destinationId) && (h.previous === undefined || votes.has(h.previous as Vote)),
          )
          .map((h) => ({ destinationId: h.destinationId, previous: h.previous }))
          .slice(-100)
      : [],
  };
}

/**
 * Reads saved progress. Anything unreadable, from another schema version,
 * or pointing at destinations that no longer exist is dropped rather than trusted.
 */
export function sanitise(raw: unknown): GameState | null {
  if (!isObj(raw) || raw.schemaVersion !== 2) return null;
  const savedOrder = Array.isArray(raw.destinationOrder) ? raw.destinationOrder.filter((id): id is string => typeof id === 'string') : [];
  // Featured contestants are always on the show; added contenders survive if still valid.
  const destinationOrder = [...featuredIds, ...savedOrder.filter((id) => isShowable(id) && !featuredIds.includes(id))].filter(
    (id, i, a) => a.indexOf(id) === i,
  );
  const order = new Set(destinationOrder);
  const mode = raw.mode === 'quick' ? 'quick' : 'two_person';
  const nick = isObj(raw.nicknames) ? raw.nicknames : {};
  const done = isObj(raw.ballotComplete) ? raw.ballotComplete : {};
  const finalists = Array.isArray(raw.finalists)
    ? raw.finalists.filter((id): id is string => typeof id === 'string' && isShowable(id)).slice(0, MAX_FINALISTS)
    : [];
  const winner = typeof raw.winnerDestinationId === 'string' && isShowable(raw.winnerDestinationId) ? raw.winnerDestinationId : undefined;
  const active = typeof raw.activeDestinationId === 'string' && order.has(raw.activeDestinationId) ? raw.activeDestinationId : undefined;

  const state: GameState = {
    ...initialState,
    mode,
    started: raw.started === true,
    activePlayer: mode === 'two_person' && raw.activePlayer === 'traveller2' ? 'traveller2' : 'traveller1',
    nicknames: {
      traveller1: typeof nick.traveller1 === 'string' ? nick.traveller1.slice(0, 24) : '',
      traveller2: typeof nick.traveller2 === 'string' ? nick.traveller2.slice(0, 24) : '',
    },
    activeDestinationId: active,
    destinationOrder,
    preferredItineraryByDestination: record(raw.preferredItineraryByDestination, (k, val) =>
      typeof val === 'string' && variantsFor(k).some((v) => v.id === val) ? val : undefined,
    ),
    players: {
      traveller1: sanitiseProgress(isObj(raw.players) ? raw.players.traveller1 : undefined, order),
      traveller2: sanitiseProgress(isObj(raw.players) ? raw.players.traveller2 : undefined, order),
    },
    ballotComplete: { traveller1: done.traveller1 === true, traveller2: mode === 'two_person' && done.traveller2 === true },
    showOtherVotes: raw.showOtherVotes === true,
    finalists,
    winnerDestinationId: winner,
    soundEnabled: raw.soundEnabled === true,
    reduceMotion: typeof raw.reduceMotion === 'boolean' ? raw.reduceMotion : null,
  };
  // Traveller 2 cannot be mid-ballot before Traveller 1 has finished.
  if (state.activePlayer === 'traveller2' && !state.ballotComplete.traveller1) state.activePlayer = 'traveller1';
  if (!state.ballotComplete.traveller1) state.ballotComplete.traveller2 = false;
  return state;
}

export function loadState(storage: Storage | undefined): GameState | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? sanitise(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveState(storage: Storage | undefined, state: GameState): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private browsing or full storage: the show goes on without saving.
  }
}
