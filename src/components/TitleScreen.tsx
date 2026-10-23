'use client';

import { motion } from 'motion/react';
import { useGame } from './GameContext';
import { btn, HostLine } from './ui';
import { mainCast } from '@/lib/catalogue';

export default function TitleScreen() {
  const { state, dispatch } = useGame();
  const started = Object.keys(state.decisions).length > 0 || Object.keys(state.guesses).length > 0;

  return (
    <section className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-12 text-center">
      <div aria-hidden className="spotlight spotlight-left" />
      <div aria-hidden className="spotlight spotlight-right" />
      <div aria-hidden className="sparkle pointer-events-none absolute inset-0 opacity-60" />
      <div aria-hidden className="footlights pointer-events-none absolute inset-x-0 bottom-0 h-24" />

      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 font-display text-xs tracking-[0.18em] text-sky sm:tracking-[0.3em] sm:text-sm"
      >
        Live* from a spreadsheet near you
      </motion.p>

      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotate: -4 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 140, damping: 12, delay: 0.2 }}
        className="bulbs w-full max-w-3xl rounded-[2rem] bg-gradient-to-b from-red to-crimson px-5 py-8 shadow-[0_20px_60px_rgb(0_0_0/0.5)] sm:px-10 sm:py-12"
      >
        <h1 className="marquee-text">
          <span className="block text-xl sm:text-3xl">The Great</span>
          <span className="block text-[2.6rem] leading-[1] sm:text-7xl">January</span>
          <span className="block text-[2.6rem] leading-[1] sm:text-7xl">Getaway</span>
        </h1>
        <p className="mt-5 font-serif text-base italic text-cream sm:text-xl">
          Two travellers. Twenty holidays. One deeply overworked spreadsheet.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-10 max-w-xl space-y-4"
      >
        <HostLine>
          Good evening, bargain hunters. Tonight’s prizes include medieval old towns, suspiciously cheap flights and a very
          real possibility of January drizzle.
        </HostLine>
        <p className="text-sm leading-relaxed text-cream/80 sm:text-base">
          These are {mainCast.length} real, researched breaks for 17–22 January 2027 from Edinburgh or Glasgow, with
          indicative prices for two from October 2026.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="mt-8 w-full max-w-md space-y-5"
      >
        <fieldset className="rounded-2xl border border-cream/20 bg-black/20 p-4 text-left">
          <legend className="px-2 font-display text-xs tracking-widest text-gold">Tonight’s contestants</legend>
          <div className="grid grid-cols-2 gap-3">
            {state.contestants.map((name, i) => (
              <label key={i} className="text-xs text-cream/70">
                Player {i + 1}
                <input
                  value={name}
                  onChange={(e) => dispatch({ type: 'renameContestant', index: i as 0 | 1, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-cream/30 bg-navy px-3 py-2 text-base text-cream"
                  autoComplete="off"
                />
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col items-stretch gap-3">
          <button className={btn.primary + ' text-lg'} onClick={() => dispatch({ type: 'go', screen: 'conveyor' })}>
            {started ? 'Back to the prizes' : 'Let’s see the prizes'}
          </button>
          {started && (
            <button className={btn.gold} onClick={() => dispatch({ type: 'go', screen: 'final' })}>
              Straight to the Grand Final
            </button>
          )}
          <button
            className="min-h-11 text-sm text-cream/80 underline decoration-dotted underline-offset-4 hover:text-cream"
            onClick={() => dispatch({ type: 'go', screen: 'sensible' })}
          >
            I refuse to participate in this nonsense
          </button>
        </div>
      </motion.div>

      <p className="mt-10 max-w-md text-[11px] text-cream/50">
        *Not live. Prices are indicative and observed on 23 October 2026. No fares are booked or guaranteed.
      </p>
    </section>
  );
}
