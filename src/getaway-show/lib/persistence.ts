import { isSeed } from '../../lib/shuffle';
import { featuredIds, isFeatured, isShowable, ladderIds, variantsFor } from './cast';
import {
  initialState,
  MAX_FINALISTS,
  TILES,
  type Bookmark,
  type Buzz,
  type DuelCall,
  type DuelRecord,
  type GameState,
  type Phase,
  type PlayerId,
  type Vote,
} from './state';

export const STORAGE_KEY = 'great-british-getaway-show:v3';

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem'>;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const votes = new Set<Vote>(['yes', 'maybe', 'no']);
const bookmarks = new Set<Bookmark>(['possible', 'not_for_me', 'watching']);
const phases = new Set<Phase>(['intro', 'picture_reveal', 'higher_lower', 'wildcard_board', 'ballots', 'results', 'grand_final']);
const isCount = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0;

function record<T>(v: unknown, keep: (key: string, value: unknown) => T | undefined): Record<string, T> {
  if (!isObj(v)) return {};
  const out: Record<string, T> = {};
  for (const [k, val] of Object.entries(v)) {
    const kept = keep(k, val);
    if (kept !== undefined) out[k] = kept;
  }
  return out;
}

const isCall = (v: unknown): v is DuelCall => v === 'higher' || v === 'lower';

/**
 * A duel record, in either shape. Before the secret calls, one shared guess
 * covered both travellers, so it is credited to each of them.
 */
function sanitiseDuel(h: unknown, travellers: PlayerId[]): DuelRecord | undefined {
  if (!isObj(h) || !isCount(h.index) || typeof h.leftItineraryId !== 'string' || typeof h.rightItineraryId !== 'string') return undefined;
  const base = {
    index: h.index,
    leftItineraryId: h.leftItineraryId,
    rightItineraryId: h.rightItineraryId,
    ...(typeof h.poundGuess === 'number' && Number.isFinite(h.poundGuess) ? { poundGuess: h.poundGuess } : {}),
  };
  if ('guess' in h) {
    if (h.guess === 'skip') return { ...base, calls: {}, skipped: true };
    const call = h.guess;
    return isCall(call) ? { ...base, calls: Object.fromEntries(travellers.map((p) => [p, call])), skipped: false } : undefined;
  }
  const calls = isObj(h.calls) ? h.calls : {};
  const kept: Partial<Record<PlayerId, DuelCall>> = {};
  for (const p of travellers) if (isCall(calls[p])) kept[p] = calls[p];
  // B only ever calls after A.
  if (!kept.a) delete kept.b;
  return { ...base, calls: kept, skipped: h.skipped === true };
}

const ids = (v: unknown, ok: (id: string) => boolean) =>
  Array.isArray(v) ? v.filter((id, i, a): id is string => typeof id === 'string' && ok(id) && a.indexOf(id) === i) : [];

/**
 * Reads saved progress. Anything unreadable, from another version, or
 * pointing at destinations that no longer exist is dropped rather than trusted.
 */
export function sanitise(raw: unknown): GameState | null {
  if (!isObj(raw) || raw.version !== 3) return null;
  const mode = raw.mode === 'quick' ? 'quick' : 'two_person';
  const names = isObj(raw.playerNames) ? raw.playerNames : {};
  const extras = ids(raw.ballotExtraIds, (id) => isShowable(id) && !isFeatured(id));
  const pool = new Set([...featuredIds, ...extras]);
  const ballot = (v: unknown) => record(v, (k, val) => (pool.has(k) && votes.has(val as Vote) ? (val as Vote) : undefined));
  const ballots = isObj(raw.ballots) ? raw.ballots : {};
  const locked = isObj(raw.ballotLocked) ? raw.ballotLocked : {};
  const travellers: PlayerId[] = mode === 'quick' ? ['a'] : ['a', 'b'];
  const editing: PlayerId | null = raw.editing === 'a' || (raw.editing === 'b' && mode === 'two_person') ? raw.editing : null;

  const state: GameState = {
    ...initialState,
    mode,
    started: raw.started === true,
    phase: phases.has(raw.phase as Phase) ? (raw.phase as Phase) : 'intro',
    playerNames: {
      a: typeof names.a === 'string' ? names.a.slice(0, 24) : '',
      b: typeof names.b === 'string' ? names.b.slice(0, 24) : '',
    },
    revealIndex: isCount(raw.revealIndex) ? Math.min(raw.revealIndex, Math.max(0, featuredIds.length - 1)) : 0,
    // Saves from before single-tile flips counted steps of three tiles.
    tilesOpen: isObj(raw.tilesOpen)
      ? record(raw.tilesOpen, (k, val) => (isShowable(k) && isCount(val) ? Math.min(TILES - 1, val) : undefined))
      : record(raw.revealSteps, (k, val) => (isShowable(k) && isCount(val) ? Math.min(2, val) * 3 : undefined)),
    identityRevealed: record(raw.identityRevealed, (k, val) => (isShowable(k) && val === true ? (true as const) : undefined)),
    // The old "we got it" honour system named nobody, so its points are not carried over.
    buzzes: record(raw.buzzes, (k, val) => {
      if (!isShowable(k) || !isObj(val)) return undefined;
      const kept: Partial<Record<PlayerId, Buzz>> = {};
      for (const p of travellers) {
        const b = val[p];
        if (isObj(b) && typeof b.guessId === 'string' && isShowable(b.guessId) && isCount(b.tilesOpen)) {
          kept[p] = { guessId: b.guessId, tilesOpen: Math.min(TILES - 1, b.tilesOpen) };
        }
      }
      return Object.keys(kept).length > 0 ? kept : undefined;
    }),
    bookmarks: record(raw.bookmarks, (k, val) => (isShowable(k) && bookmarks.has(val as Bookmark) ? (val as Bookmark) : undefined)),
    seed: isSeed(raw.seed) ? raw.seed : null,
    preferredItineraryIds: record(raw.preferredItineraryIds, (k, val) =>
      typeof val === 'string' && variantsFor(k).some((v) => v.id === val) ? val : undefined,
    ),
    duelIndex: isCount(raw.duelIndex) ? Math.min(raw.duelIndex, Math.max(0, ladderIds.length - 2)) : 0,
    priceDuelHistory: Array.isArray(raw.priceDuelHistory)
      ? raw.priceDuelHistory.flatMap((h) => sanitiseDuel(h, travellers) ?? [])
      : [],
    unlockedDestinationIds: ids(raw.unlockedDestinationIds, (id) => isShowable(id) && !isFeatured(id)),
    ballotExtraIds: extras,
    ballots: { a: ballot(ballots.a), b: mode === 'two_person' ? ballot(ballots.b) : {} },
    ballotLocked: { a: locked.a === true, b: mode === 'two_person' && locked.b === true },
    activeBallot: mode === 'two_person' && raw.activeBallot === 'b' ? 'b' : 'a',
    editing,
    resultsRevealed: raw.resultsRevealed === true,
    finalistsCustomised: raw.finalistsCustomised === true,
    finalistDestinationIds: ids(raw.finalistDestinationIds, isShowable).slice(0, MAX_FINALISTS),
    ...(typeof raw.winnerDestinationId === 'string' && isShowable(raw.winnerDestinationId) ? { winnerDestinationId: raw.winnerDestinationId } : {}),
    soundEnabled: raw.soundEnabled === true,
    reduceMotion: typeof raw.reduceMotion === 'boolean' ? raw.reduceMotion : null,
  };
  // Traveller B cannot be mid-ballot before Traveller A has locked in.
  if (!state.ballotLocked.a && !state.editing) {
    state.activeBallot = 'a';
    state.ballotLocked.b = false;
  }
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

export function clearState(storage: Storage | undefined): void {
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}
