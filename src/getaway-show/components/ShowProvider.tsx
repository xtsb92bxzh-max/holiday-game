'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { MotionConfig, useReducedMotion } from 'motion/react';
import { play, type Sfx } from '@/lib/sound';
import { loadState, saveState } from '../lib/persistence';
import { initialState, reducer, type Action, type GameState, type Phase } from '../lib/state';

type Ctx = {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  reduceMotion: boolean;
  sfx: (s: Sfx) => void;
  /** True when a saved show was found on this device at load. */
  hadSavedShow: boolean;
};

const ShowContext = createContext<Ctx | null>(null);

export function useShow(): Ctx {
  const ctx = useContext(ShowContext);
  if (!ctx) throw new Error('useShow must be used inside ShowProvider');
  return ctx;
}

/** Records the stage for "Resume show". */
export function useVisit(phase: Phase) {
  const { dispatch } = useShow();
  useEffect(() => {
    dispatch({ type: 'visit', phase });
  }, [dispatch, phase]);
}

export default function ShowProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);
  const [hadSavedShow, setHadSavedShow] = useState(false);
  const deviceReduced = useReducedMotion() ?? false;
  const reduceMotion = state.reduceMotion ?? deviceReduced;

  // localStorage is read only after mount, so the server and first client render match.
  useEffect(() => {
    const saved = loadState(window.localStorage);
    if (saved) {
      dispatch({ type: 'hydrate', state: saved });
      setHadSavedShow(saved.started);
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

  const sfx = useCallback((s: Sfx) => state.soundEnabled && play(s), [state.soundEnabled]);
  const value = useMemo(() => ({ state, dispatch, reduceMotion, sfx, hadSavedShow }), [state, reduceMotion, sfx, hadSavedShow]);

  return (
    <ShowContext.Provider value={value}>
      <MotionConfig reducedMotion={reduceMotion ? 'always' : 'never'}>
        <div className="gb-studio relative min-h-dvh overflow-x-clip">
          {hydrated ? (
            children
          ) : (
            <div className="grid min-h-dvh place-items-center px-4">
              <p className="gb-display text-2xl text-gb-gold">Warming up the studio lights…</p>
            </div>
          )}
        </div>
      </MotionConfig>
    </ShowContext.Provider>
  );
}
