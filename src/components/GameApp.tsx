'use client';

import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { MotionConfig, useReducedMotion } from 'motion/react';
import { initialState, loadState, reducer, saveState } from '@/lib/gameState';
import { play, type Sfx } from '@/lib/sound';
import { GameContext } from './GameContext';
import ShowHeader from './ShowHeader';
import TitleScreen from './TitleScreen';
import ConveyorScreen from './ConveyorScreen';
import PlayScreen from './PlayScreen';
import GrandFinal from './GrandFinal';
import SensibleMode from './SensibleMode';
import Footer from './Footer';

export default function GameApp() {
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

  // Each screen starts at the top.
  useEffect(() => {
    if (hydrated) window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [state.screen, hydrated]);

  const sfx = useCallback((s: Sfx) => state.sound && play(s), [state.sound]);
  const value = useMemo(() => ({ state, dispatch, reduceMotion, sfx }), [state, reduceMotion, sfx]);

  return (
    <GameContext.Provider value={value}>
      <MotionConfig reducedMotion={reduceMotion ? 'always' : 'never'}>
        <div className="stage-bg relative min-h-dvh overflow-x-clip">
          {!hydrated ? (
            <div className="grid min-h-dvh place-items-center">
              <p className="marquee-text text-2xl">Warming up the studio…</p>
            </div>
          ) : (
            <>
              {state.screen !== 'title' && <ShowHeader />}
              <main id="main">
                {state.screen === 'title' && <TitleScreen />}
                {state.screen === 'conveyor' && <ConveyorScreen />}
                {state.screen === 'play' && <PlayScreen mode="main" />}
                {state.screen === 'mystery' && <PlayScreen mode="mystery" />}
                {state.screen === 'final' && <GrandFinal />}
                {state.screen === 'sensible' && <SensibleMode />}
              </main>
              <Footer />
            </>
          )}
        </div>
      </MotionConfig>
    </GameContext.Provider>
  );
}
