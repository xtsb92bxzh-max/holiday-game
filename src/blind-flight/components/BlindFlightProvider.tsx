'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { MotionConfig, useReducedMotion } from 'motion/react';
import { play, type Sfx } from '@/lib/sound';
import { loadState, saveState } from '../lib/persistence';
import { initialState, reducer, type Action, type GameState } from '../lib/state';

type Ctx = {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  reduceMotion: boolean;
  sfx: (s: Sfx) => void;
};

const BlindFlightContext = createContext<Ctx | null>(null);

export function useShow(): Ctx {
  const ctx = useContext(BlindFlightContext);
  if (!ctx) throw new Error('useShow must be used inside BlindFlightProvider');
  return ctx;
}

export default function BlindFlightProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);
  const deviceReduced = useReducedMotion() ?? false;
  const reduceMotion = state.reduceMotion ?? deviceReduced;

  useEffect(() => {
    const saved = loadState(typeof window !== 'undefined' ? window.localStorage : undefined);
    if (saved) dispatch({ type: 'hydrate', state: saved });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(window.localStorage, state);
  }, [state, hydrated]);

  useEffect(() => {
    const root = document.documentElement;
    if (state.reduceMotion == null) delete root.dataset.motion;
    else root.dataset.motion = state.reduceMotion ? 'reduced' : 'full';
  }, [state.reduceMotion]);

  const sfx = useCallback((s: Sfx) => state.soundEnabled && play(s), [state.soundEnabled]);
  const value = useMemo(() => ({ state, dispatch, reduceMotion, sfx }), [state, reduceMotion, sfx]);

  return (
    <BlindFlightContext.Provider value={value}>
      <MotionConfig reducedMotion={reduceMotion ? 'always' : 'never'}>
        <div className="bf-stage relative min-h-dvh overflow-x-clip">
          {hydrated ? (
            children
          ) : (
            <div className="grid min-h-dvh place-items-center px-4">
              <p className="bf-logo text-3xl">Warming up the studio lights…</p>
            </div>
          )}
        </div>
      </MotionConfig>
    </BlindFlightContext.Provider>
  );
}
