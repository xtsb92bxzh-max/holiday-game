'use client';

import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { walk, type Walk } from '../lib/engine';
import { initialState, loadState, reducer, saveState, type Action, type State } from '../lib/state';

type Ctx = {
  state: State;
  dispatch: React.Dispatch<Action>;
  /** The story so far, replayed from the saved choices. */
  story: Walk;
  reduceMotion: boolean;
  /** True when a saved story was found on this device at load. */
  hadSave: boolean;
};

const EnvelopeContext = createContext<Ctx | null>(null);

export function useEnvelope(): Ctx {
  const ctx = useContext(EnvelopeContext);
  if (!ctx) throw new Error('useEnvelope must be used inside EnvelopeProvider');
  return ctx;
}

export default function EnvelopeProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);
  const [hadSave, setHadSave] = useState(false);
  const deviceReduced = useReducedMotion() ?? false;
  const reduceMotion = state.reduceMotion ?? deviceReduced;

  // localStorage is read only after mount, so the server and first client render match.
  useEffect(() => {
    const saved = loadState(window.localStorage);
    if (saved) {
      dispatch({ type: 'hydrate', state: saved });
      setHadSave(saved.history.length > 0);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(window.localStorage, state);
  }, [state, hydrated]);

  useEffect(() => {
    const root = document.documentElement;
    if (state.reduceMotion == null) delete root.dataset.motion;
    else root.dataset.motion = state.reduceMotion ? 'reduced' : 'full';
    return () => {
      delete root.dataset.motion;
    };
  }, [state.reduceMotion]);

  const story = useMemo(() => walk(state.history), [state.history]);
  const value = useMemo(() => ({ state, dispatch, story, reduceMotion, hadSave }), [state, story, reduceMotion, hadSave]);

  return (
    <EnvelopeContext.Provider value={value}>
      <div className="en-night min-h-dvh overflow-x-clip">
        {hydrated ? (
          children
        ) : (
          <div className="grid min-h-dvh place-items-center px-4">
            <p className="font-serif text-xl italic text-en-lamp">Unfolding the map…</p>
          </div>
        )}
      </div>
    </EnvelopeContext.Provider>
  );
}
