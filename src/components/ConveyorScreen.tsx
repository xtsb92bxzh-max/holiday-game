'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Pause, Play, Sparkles } from 'lucide-react';
import ConveyorBelt, { type ConveyorHandle } from './ConveyorBelt';
import { useGame } from './GameContext';
import { btn, HostLine } from './ui';
import { mainCast, mysteryCast, selectedItinerary, hasPrice } from '@/lib/catalogue';
import { formatDateRange } from '@/lib/dates';

export default function ConveyorScreen() {
  const { state, dispatch, reduceMotion, sfx } = useGame();
  const [running, setRunning] = useState(!reduceMotion);
  const [active, setActive] = useState(Math.min(state.playIndex, mainCast.length - 1));
  const handle = useRef<ConveyorHandle | null>(null);
  const dest = mainCast[active];
  const it = selectedItinerary(dest, state.itineraryChoice[dest.id]);
  const decided = mainCast.filter((d) => state.decisions[d.id]).length;

  const open = (i: number) => {
    sfx('fanfare');
    dispatch({ type: 'setPlayIndex', index: i });
    dispatch({ type: 'go', screen: 'play' });
  };

  return (
    <section className="relative pb-10">
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:pt-10">
        <p className="font-display text-xs tracking-[0.25em] text-sky">Round one</p>
        <h2 className="marquee-text mt-1 text-3xl sm:text-5xl">The Holiday Conveyor Belt</h2>
        <HostLine className="mt-3 max-w-2xl">Behold the conveyor belt of aggressively researched European opportunities.</HostLine>
      </div>

      <div className="relative mt-6 sm:mt-10">
        <ConveyorBelt
          items={mainCast}
          running={running}
          onRunningChange={setRunning}
          activeIndex={active}
          onActiveChange={(i) => {
            setActive(i);
            if (!running) sfx('tick');
          }}
          onOpen={open}
          reduceMotion={reduceMotion}
          handleRef={handle}
          decisionFor={(id) => state.decisions[id]}
        />
      </div>

      <div className="mx-auto mt-4 flex max-w-6xl flex-col items-center gap-5 px-4">
        <div className="flex items-center gap-3" role="toolbar" aria-label="Belt controls">
          <button className={btn.icon} onClick={() => handle.current?.prev()} aria-label="Previous prize">
            <ChevronLeft className="size-6" />
          </button>
          {!reduceMotion && (
            <button
              className={`${btn.gold} min-w-36`}
              onClick={() => setRunning((r) => !r)}
              aria-pressed={running}
            >
              {running ? <Pause aria-hidden className="size-5" /> : <Play aria-hidden className="size-5" />}
              {running ? 'Stop belt' : 'Start belt'}
            </button>
          )}
          <button className={btn.icon} onClick={() => handle.current?.next()} aria-label="Next prize">
            <ChevronRight className="size-6" />
          </button>
        </div>

        <p className="text-sm text-cream/70">
          Prize <span className="scoreboard-digit">{active + 1}</span> of {mainCast.length} ·{' '}
          <span className="scoreboard-digit">{mainCast.length - decided}</span> still to judge
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={dest.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="ticket w-full max-w-lg rounded-2xl px-6 py-5 text-center text-ink shadow-[0_10px_30px_#0008]"
            aria-live="polite"
          >
            <p className="font-display text-xs tracking-widest text-red">Prize {String(active + 1).padStart(2, '0')} · in the spotlight</p>
            <p className="mt-1 font-display text-2xl sm:text-3xl">{dest.name}</p>
            <p className="font-serif italic text-ink/75">{dest.prizeLine ?? dest.intro}</p>
            <p className="mt-2 text-sm text-ink/70">
              {it.nights} nights · {formatDateRange(it.departDate, it.returnDate)} · from {it.departureAirport}
              {dest.itineraryIds.length > 1 && ' · other dates available'}
            </p>
            <button className={`${btn.primary} mt-4 w-full`} onClick={() => open(active)}>
              <Sparkles aria-hidden className="size-5" />
              {state.guesses[dest.id]?.revealed && hasPrice(it) ? 'Revisit this prize' : 'Play this prize'}
            </button>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-wrap justify-center gap-3">
          <button className={btn.ghost} onClick={() => open(0)}>
            Start from prize one
          </button>
          {mysteryCast.length > 0 && (
            <button className={btn.ghost} onClick={() => dispatch({ type: 'go', screen: 'mystery' })}>
              Mystery contestants ({mysteryCast.length})
            </button>
          )}
          <button className={btn.ghost} onClick={() => dispatch({ type: 'go', screen: 'final' })}>
            Skip to the Grand Final
          </button>
        </div>
      </div>
    </section>
  );
}
