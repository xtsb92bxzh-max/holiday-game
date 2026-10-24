import { episodesFor, featuredIds, isFeatured, isShowable, profileFor, variantsFor, type ShowEpisode } from './cast';

export type PlayerId = 'traveller1' | 'traveller2';
export type PlayMode = 'two_person' | 'quick';

export const players: PlayerId[] = ['traveller1', 'traveller2'];

/** The host asks three questions. Clue n is contestant's answer to question n. */
export const QUESTIONS = 3;

export type EpisodeProgress = {
  /** 0 is the opening one-liners; 1 to 3 are the host's questions. */
  questionsShown: number;
  /** Set once the host calls time and the choosing starts. */
  choosing: boolean;
  /** Each traveller's secret choice: a destination id in this episode's cast. */
  picks: Partial<Record<PlayerId, string>>;
  /** Contestants unmasked so far in the reveal, in reveal order. */
  unmasked: string[];
};

export type GameState = {
  schemaVersion: 3;
  mode: PlayMode;
  started: boolean;
  /** Who is choosing right now. */
  activePlayer: PlayerId;
  nicknames: Record<PlayerId, string>;
  /** Featured contestants plus any added contenders. */
  destinationOrder: string[];
  preferredItineraryByDestination: Record<string, string>;
  /** Keyed by episode id. */
  episodes: Record<string, EpisodeProgress>;
  /** Empty means "use the default finalists". */
  finalists: string[];
  winnerDestinationId?: string;
  soundEnabled: boolean;
  /** null follows the device setting. */
  reduceMotion: boolean | null;
};

export const emptyEpisode = (): EpisodeProgress => ({ questionsShown: 0, choosing: false, picks: {}, unmasked: [] });

export const initialState: GameState = {
  schemaVersion: 3,
  mode: 'two_person',
  started: false,
  activePlayer: 'traveller1',
  nicknames: { traveller1: '', traveller2: '' },
  destinationOrder: featuredIds,
  preferredItineraryByDestination: {},
  episodes: {},
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
  | { type: 'nextQuestion'; episodeId: string }
  | { type: 'startChoosing'; episodeId: string }
  | { type: 'pick'; episodeId: string; destinationId: string }
  | { type: 'unpick'; episodeId: string }
  | { type: 'passPhone'; episodeId: string }
  | { type: 'unmask'; episodeId: string }
  | { type: 'pickAgain'; episodeId: string }
  | { type: 'chooseItinerary'; destinationId: string; itineraryId: string }
  | { type: 'addContender'; destinationId: string }
  | { type: 'removeContender'; destinationId: string }
  | { type: 'setFinalists'; ids: string[] }
  | { type: 'toggleFinalist'; destinationId: string }
  | { type: 'setWinner'; destinationId?: string }
  | { type: 'setSound'; on: boolean }
  | { type: 'setReduceMotion'; value: boolean | null }
  | { type: 'reset' };

function findEpisode(state: GameState, episodeId: string): ShowEpisode | undefined {
  return episodesFor(state.destinationOrder).find((e) => e.id === episodeId);
}

function withEpisode(state: GameState, episodeId: string, fn: (p: EpisodeProgress, e: ShowEpisode) => EpisodeProgress | null): GameState {
  const e = findEpisode(state, episodeId);
  if (!e) return state;
  const next = fn(episodeProgress(state, episodeId), e);
  return next ? { ...state, episodes: { ...state.episodes, [episodeId]: next } } : state;
}

/** Bonus contestants have no clues, so they are on view from the start. */
export function isUnmasked(state: GameState, episodeId: string, destinationId: string): boolean {
  return !profileFor(destinationId).hasClues || episodeProgress(state, episodeId).unmasked.includes(destinationId);
}

export function choosers(state: GameState): PlayerId[] {
  return state.mode === 'quick' ? ['traveller1'] : players;
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'hydrate':
      return action.state;

    case 'setMode':
      if (action.mode === state.mode) return state;
      return { ...state, mode: action.mode, activePlayer: 'traveller1', episodes: {}, finalists: [], winnerDestinationId: undefined };

    case 'setNickname':
      return { ...state, nicknames: { ...state.nicknames, [action.player]: action.name.slice(0, 24) } };

    case 'start':
      return { ...state, started: true };

    case 'nextQuestion':
      return withEpisode(state, action.episodeId, (p) =>
        p.choosing || p.questionsShown >= QUESTIONS ? null : { ...p, questionsShown: p.questionsShown + 1 },
      );

    case 'startChoosing': {
      const next = withEpisode(state, action.episodeId, (p) => (p.choosing ? null : { ...p, choosing: true }));
      return next === state ? state : { ...next, activePlayer: 'traveller1', started: true };
    }

    case 'pick': {
      const me = state.activePlayer;
      const next = withEpisode(state, action.episodeId, (p, e) => {
        const picks = validPicks(p, e);
        if (!p.choosing || !e.cast.includes(action.destinationId) || picks[me]) return null;
        if (me === 'traveller2' && !picks.traveller1) return null;
        return { ...p, picks: { ...p.picks, [me]: action.destinationId } };
      });
      if (next === state) return state;
      // Once everyone has chosen, the next episode starts with Traveller 1 again.
      const e = findEpisode(next, action.episodeId)!;
      const done = choosers(next).every((pl) => validPicks(episodeProgress(next, e.id), e)[pl]);
      return done ? { ...next, activePlayer: 'traveller1' } : next;
    }

    case 'unpick': {
      // Only the traveller who has just chosen, before the phone is passed.
      if (episodeStage(state, action.episodeId) !== 'handover') return state;
      return withEpisode(state, action.episodeId, (p) => {
        const picks = { ...p.picks };
        delete picks.traveller1;
        return { ...p, picks };
      });
    }

    case 'passPhone':
      if (episodeStage(state, action.episodeId) !== 'handover') return state;
      return { ...state, activePlayer: 'traveller2' };

    case 'unmask':
      return withEpisode(state, action.episodeId, (p, e) => {
        if (episodeStage(state, e.id) !== 'reveal') return null;
        const id = revealOrder(state, e).find((d) => !isUnmasked(state, e.id, d));
        return id ? { ...p, unmasked: [...p.unmasked, id] } : null;
      });

    case 'pickAgain':
      return {
        ...withEpisode(state, action.episodeId, (p) => ({ ...p, picks: {}, choosing: true })),
        activePlayer: 'traveller1',
      };

    case 'chooseItinerary': {
      const variants = variantsFor(action.destinationId);
      if (!variants.some((v) => v.id === action.itineraryId)) return state;
      return {
        ...state,
        preferredItineraryByDestination: { ...state.preferredItineraryByDestination, [action.destinationId]: action.itineraryId },
      };
    }

    case 'addContender':
      if (!isShowable(action.destinationId) || state.destinationOrder.includes(action.destinationId)) return state;
      return { ...state, destinationOrder: [...state.destinationOrder, action.destinationId] };

    case 'removeContender': {
      const id = action.destinationId;
      if (isFeatured(id) || !state.destinationOrder.includes(id)) return state;
      // Bonus episodes regroup when someone leaves, so their progress starts afresh.
      const episodes = Object.fromEntries(Object.entries(state.episodes).filter(([eid]) => !eid.startsWith('bonus-')));
      return {
        ...state,
        destinationOrder: state.destinationOrder.filter((d) => d !== id),
        episodes,
        finalists: state.finalists.filter((d) => d !== id),
        winnerDestinationId: state.winnerDestinationId === id ? undefined : state.winnerDestinationId,
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

export function showEpisodes(state: GameState): ShowEpisode[] {
  return episodesFor(state.destinationOrder);
}

/** Contestants in the order the show presents them. */
export function ballot(state: GameState): string[] {
  return showEpisodes(state).flatMap((e) => e.cast);
}

export function episodeProgress(state: GameState, episodeId: string): EpisodeProgress {
  return state.episodes[episodeId] ?? emptyEpisode();
}

/** Picks that still point at someone in the cast. */
export function validPicks(p: EpisodeProgress, e: ShowEpisode): Partial<Record<PlayerId, string>> {
  const out: Partial<Record<PlayerId, string>> = {};
  for (const pl of players) {
    const id = p.picks[pl];
    if (id && e.cast.includes(id)) out[pl] = id;
  }
  return out;
}

export type EpisodeStage = 'watching' | 'choosing' | 'handover' | 'reveal' | 'done';

export function episodeStage(state: GameState, episodeId: string): EpisodeStage {
  const e = findEpisode(state, episodeId);
  if (!e) return 'watching';
  const p = episodeProgress(state, episodeId);
  const picks = validPicks(p, e);
  if (choosers(state).every((pl) => picks[pl])) {
    return e.cast.every((d) => isUnmasked(state, e.id, d)) ? 'done' : 'reveal';
  }
  if (!p.choosing) return 'watching';
  if (state.mode === 'two_person' && picks.traveller1 && state.activePlayer === 'traveller1') return 'handover';
  return 'choosing';
}

/** Turned-down contestants first, then anyone chosen by one of you, then a mutual choice. */
export function revealOrder(state: GameState, e: ShowEpisode): string[] {
  const picks = Object.values(validPicks(episodeProgress(state, e.id), e));
  const votes = (id: string) => picks.filter((p) => p === id).length;
  return [...e.cast].sort((a, b) => votes(a) - votes(b));
}

export type EpisodeVerdict =
  | { kind: 'match'; id: string }
  | { kind: 'split'; ids: Record<PlayerId, string> }
  | { kind: 'chosen'; id: string };

/** Only once every chooser has picked. */
export function episodeVerdict(state: GameState, e: ShowEpisode): EpisodeVerdict | undefined {
  const picks = validPicks(episodeProgress(state, e.id), e);
  if (state.mode === 'quick') return picks.traveller1 ? { kind: 'chosen', id: picks.traveller1 } : undefined;
  const a = picks.traveller1;
  const b = picks.traveller2;
  if (!a || !b) return undefined;
  return a === b ? { kind: 'match', id: a } : { kind: 'split', ids: { traveller1: a, traveller2: b } };
}

export function currentEpisode(state: GameState): ShowEpisode | undefined {
  return showEpisodes(state).find((e) => episodeStage(state, e.id) !== 'done');
}

export function progress(state: GameState) {
  const eps = showEpisodes(state);
  const done = eps.filter((e) => episodeStage(state, e.id) === 'done').length;
  return { done, total: eps.length };
}

export function resultsReady(state: GameState): boolean {
  const eps = showEpisodes(state);
  return eps.length > 0 && eps.every((e) => episodeStage(state, e.id) === 'done');
}

export function anyProgress(state: GameState): boolean {
  return Object.values(state.episodes).some((p) => p.questionsShown > 0 || p.choosing);
}

/** Where "Continue the show" should take you. */
export function resumeHref(state: GameState): string {
  const e = currentEpisode(state);
  return e ? `/blind-flight/episode/${e.id}` : '/blind-flight/results';
}

export type Groups =
  | { kind: 'two_person'; match: string[]; split: string[]; unpicked: string[] }
  | { kind: 'quick'; chosen: string[]; unpicked: string[] };

export function groups(state: GameState): Groups {
  const chosen: string[] = [];
  const match: string[] = [];
  const split: string[] = [];
  for (const e of showEpisodes(state)) {
    const v = episodeVerdict(state, e);
    if (v?.kind === 'match') match.push(v.id);
    if (v?.kind === 'split') split.push(...new Set(Object.values(v.ids)));
    if (v?.kind === 'chosen') chosen.push(v.id);
  }
  const picked = new Set([...chosen, ...match, ...split]);
  const unpicked = ballot(state).filter((id) => !picked.has(id));
  return state.mode === 'quick' ? { kind: 'quick', chosen, unpicked } : { kind: 'two_person', match, split, unpicked };
}

/** Mutual choices first, then the split decisions; in quick play, your choices. Up to four. */
export function defaultFinalists(state: GameState): string[] {
  if (!resultsReady(state)) return [];
  const g = groups(state);
  const list = g.kind === 'quick' ? g.chosen : [...g.match, ...g.split];
  return list.slice(0, MAX_FINALISTS);
}

export function effectiveFinalists(state: GameState): string[] {
  return state.finalists.length > 0 ? state.finalists : defaultFinalists(state);
}

/** A contestant's identity is public once their episode reaches the reveal, or if they never had clues. */
export function identityPublic(state: GameState, destinationId: string): boolean {
  const e = showEpisodes(state).find((ep) => ep.cast.includes(destinationId));
  return !e || isUnmasked(state, e.id, destinationId);
}

export const groupLabels = {
  match: 'It’s a Match!',
  split: 'Split decision',
  chosen: 'Chosen',
  unpicked: 'Left on the podium',
};
