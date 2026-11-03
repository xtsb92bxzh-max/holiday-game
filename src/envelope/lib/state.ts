import { PRACTICAL_QUESTIONS, type PracticalAnswers } from '../data/practical';
import { isFinished, walk } from './engine';
import type { Step } from './types';

export type Phase = 'title' | 'story' | 'practical' | 'result';

export type State = {
  version: 1;
  phase: Phase;
  /** Every choice taken, in order. Scores and flags are rebuilt from this. */
  history: Step[];
  practical: PracticalAnswers;
  /** null follows the device setting. */
  reduceMotion: boolean | null;
};

export const initialState: State = { version: 1, phase: 'title', history: [], practical: {}, reduceMotion: null };

export type Action =
  | { type: 'hydrate'; state: State }
  | { type: 'start' }
  | { type: 'resume' }
  | { type: 'choose'; sceneId: string; choiceId: string }
  | { type: 'back' }
  | { type: 'revisit'; index: number }
  | { type: 'answer'; question: keyof PracticalAnswers; value: string | undefined }
  | { type: 'showResult' }
  | { type: 'practical' }
  | { type: 'restart' }
  | { type: 'title' }
  | { type: 'setReduceMotion'; value: boolean | null };

/** Where a saved history should open: the story, or the practical check once it is finished. */
function phaseFor(history: Step[], wanted: Phase): Phase {
  const done = isFinished(walk(history));
  if (!done) return 'story';
  return wanted === 'result' ? 'result' : 'practical';
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return action.state;
    case 'start':
      return { ...state, phase: 'story', history: [], practical: {} };
    case 'resume':
      return { ...state, phase: phaseFor(state.history, state.phase === 'title' ? 'result' : state.phase) };
    case 'choose': {
      const next = [...state.history, { sceneId: action.sceneId, choiceId: action.choiceId }];
      const w = walk(next);
      // Ignore a choice that does not fit the current scene, such as a double tap.
      if (w.steps.length !== next.length) return state;
      return { ...state, history: next, phase: isFinished(w) ? 'practical' : 'story' };
    }
    case 'back':
      if (state.history.length === 0) return { ...state, phase: 'title' };
      return { ...state, history: state.history.slice(0, -1), phase: 'story' };
    case 'revisit':
      if (action.index < 0 || action.index >= state.history.length) return state;
      return { ...state, history: state.history.slice(0, action.index), phase: 'story' };
    case 'answer': {
      const practical = { ...state.practical };
      if (action.value === undefined) delete practical[action.question];
      else practical[action.question] = action.value;
      return { ...state, practical };
    }
    case 'practical':
      return isFinished(walk(state.history)) ? { ...state, phase: 'practical' } : state;
    case 'showResult':
      return isFinished(walk(state.history)) ? { ...state, phase: 'result' } : state;
    case 'restart':
      return { ...initialState, reduceMotion: state.reduceMotion, phase: 'story' };
    case 'title':
      return { ...state, phase: 'title' };
    case 'setReduceMotion':
      return { ...state, reduceMotion: action.value };
  }
}

export const STORAGE_KEY = 'the-envelope:v1';

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem'>;
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const phases = new Set<Phase>(['title', 'story', 'practical', 'result']);

/**
 * Reads saved progress. The history is replayed against the current story,
 * so a save from an older version of the story keeps only the steps that
 * still make sense.
 */
export function sanitise(raw: unknown): State | null {
  if (!isObj(raw) || raw.version !== 1) return null;
  const history: Step[] = Array.isArray(raw.history)
    ? raw.history.flatMap((s) => (isObj(s) && typeof s.sceneId === 'string' && typeof s.choiceId === 'string' ? [{ sceneId: s.sceneId, choiceId: s.choiceId }] : []))
    : [];
  const valid = walk(history).steps;
  const practical: PracticalAnswers = {};
  const answers = isObj(raw.practical) ? raw.practical : {};
  for (const q of PRACTICAL_QUESTIONS) {
    const v = answers[q.id];
    if (typeof v === 'string' && q.options.some((o) => o.id === v)) practical[q.id] = v;
  }
  const wanted = phases.has(raw.phase as Phase) ? (raw.phase as Phase) : 'title';
  return {
    version: 1,
    phase: wanted === 'title' ? 'title' : phaseFor(valid, wanted),
    history: valid,
    practical,
    reduceMotion: typeof raw.reduceMotion === 'boolean' ? raw.reduceMotion : null,
  };
}

export function loadState(storage: Storage | undefined): State | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? sanitise(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveState(storage: Storage | undefined, state: State): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private browsing or full storage: the story carries on without saving.
  }
}
