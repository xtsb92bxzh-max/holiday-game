import { featuredIds, isShowable, variantsFor } from './cast';
import { emptyEpisode, emptyFinal, initialState, MAX_FINALISTS, players, QUESTIONS, type EpisodeProgress, type FinalProgress, type GameState, type PlayerId } from './state';

export const STORAGE_KEY = 'blind-flight:v3';

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem'>;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function record<T>(v: unknown, keep: (key: string, value: unknown) => T | undefined): Record<string, T> {
  if (!isObj(v)) return {};
  const out: Record<string, T> = {};
  for (const [k, val] of Object.entries(v)) {
    const kept = keep(k, val);
    if (kept !== undefined) out[k] = kept;
  }
  return out;
}

function sanitiseEpisode(v: unknown, order: Set<string>): EpisodeProgress | undefined {
  if (!isObj(v)) return undefined;
  const shown = typeof v.questionsShown === 'number' && Number.isFinite(v.questionsShown) ? Math.floor(v.questionsShown) : 0;
  const picks = isObj(v.picks) ? v.picks : {};
  const pickOf = (x: unknown) => (typeof x === 'string' && order.has(x) ? x : undefined);
  const p: EpisodeProgress = {
    ...emptyEpisode(),
    questionsShown: Math.max(0, Math.min(QUESTIONS, shown)),
    choosing: v.choosing === true,
    unmasked: Array.isArray(v.unmasked) ? v.unmasked.filter((id): id is string => typeof id === 'string' && order.has(id)) : [],
  };
  const t1 = pickOf(picks.traveller1);
  const t2 = pickOf(picks.traveller2);
  if (t1) p.picks.traveller1 = t1;
  if (t2) p.picks.traveller2 = t2;
  p.cityGuesses = perPlayer(v.cityGuesses, (x) => (typeof x === 'string' && isShowable(x) ? x : undefined));
  p.cityPoints = perPlayer(v.cityPoints, (x) => (isCount(x) ? Math.min(4, Math.floor(x)) : undefined));
  p.priceGuesses = perPlayer(v.priceGuesses, (x) => (isCount(x) && x > 0 ? Math.round(x) : undefined));
  p.duelSkipped = v.duelSkipped === true;
  if (typeof v.duelTarget === 'string' && order.has(v.duelTarget)) p.duelTarget = v.duelTarget;
  return p;
}

const isCount = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x >= 0;

function perPlayer<T>(v: unknown, keep: (x: unknown) => T | undefined): Partial<Record<PlayerId, T>> {
  const out: Partial<Record<PlayerId, T>> = {};
  if (!isObj(v)) return out;
  for (const pl of players) {
    const kept = keep(v[pl]);
    if (kept !== undefined) out[pl] = kept;
  }
  return out;
}

function sanitiseFinal(v: unknown): FinalProgress {
  if (!isObj(v)) return emptyFinal();
  return {
    secondChance: perPlayer(v.secondChance, (x) => (x === null ? null : typeof x === 'string' && isShowable(x) ? x : undefined)),
    choosing: v.choosing === true,
    picks: perPlayer(v.picks, (x) => (typeof x === 'string' && isShowable(x) ? x : undefined)),
  };
}

/**
 * Reads saved progress. Anything unreadable, from another schema version,
 * or pointing at destinations that no longer exist is dropped rather than trusted.
 */
export function sanitise(raw: unknown): GameState | null {
  if (!isObj(raw) || raw.schemaVersion !== 3) return null;
  const savedOrder = Array.isArray(raw.destinationOrder) ? raw.destinationOrder.filter((id): id is string => typeof id === 'string') : [];
  // Featured contestants are always on the show; added contenders survive if still valid.
  const destinationOrder = [...featuredIds, ...savedOrder.filter((id) => isShowable(id) && !featuredIds.includes(id))].filter(
    (id, i, a) => a.indexOf(id) === i,
  );
  const order = new Set(destinationOrder);
  const mode = raw.mode === 'quick' ? 'quick' : 'two_person';
  const nick = isObj(raw.nicknames) ? raw.nicknames : {};
  const finalists = Array.isArray(raw.finalists)
    ? raw.finalists.filter((id): id is string => typeof id === 'string' && isShowable(id)).slice(0, MAX_FINALISTS)
    : [];
  const winner = typeof raw.winnerDestinationId === 'string' && isShowable(raw.winnerDestinationId) ? raw.winnerDestinationId : undefined;

  const state: GameState = {
    ...initialState,
    mode,
    started: raw.started === true,
    activePlayer: mode === 'two_person' && raw.activePlayer === 'traveller2' ? 'traveller2' : 'traveller1',
    nicknames: {
      traveller1: typeof nick.traveller1 === 'string' ? nick.traveller1.slice(0, 24) : '',
      traveller2: typeof nick.traveller2 === 'string' ? nick.traveller2.slice(0, 24) : '',
    },
    destinationOrder,
    seed: typeof raw.seed === 'number' && Number.isInteger(raw.seed) && raw.seed >= 0 ? raw.seed : null,
    balancedDeal: raw.balancedDeal === true,
    preferredItineraryByDestination: record(raw.preferredItineraryByDestination, (k, val) =>
      typeof val === 'string' && variantsFor(k).some((v) => v.id === val) ? val : undefined,
    ),
    episodes: record(raw.episodes, (_, val) => sanitiseEpisode(val, order)),
    final: sanitiseFinal(raw.final),
    finalists,
    winnerDestinationId: winner,
    soundEnabled: raw.soundEnabled === true,
    reduceMotion: typeof raw.reduceMotion === 'boolean' ? raw.reduceMotion : null,
  };
  // Quick play has one shared choice, so there is never a second traveller's pick.
  if (mode === 'quick') {
    for (const p of [...Object.values(state.episodes), state.final]) delete p.picks.traveller2;
  }
  // Traveller 2 only ever holds the phone after Traveller 1 has chosen.
  const t2Turn = [...Object.values(state.episodes), state.final].some((p) => p.choosing && p.picks.traveller1 && !p.picks.traveller2);
  if (!t2Turn) state.activePlayer = 'traveller1';
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
