'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Minus, Plus, HelpCircle } from 'lucide-react';
import type { Itinerary } from '@/lib/types';
import { guessRange, hasPrice } from '@/lib/catalogue';
import { closenessPoints, formatGBP, roundForReveal } from '@/lib/pricing';
import { currentGuess } from '@/lib/gameState';
import { useGame } from './GameContext';
import RollingNumber from './RollingNumber';
import Confetti from './Confetti';
import { PriceBreakdown, ProvenanceLine } from './TripDetails';
import { btn } from './ui';

const range = guessRange();

function verdict(guess: number | null, actual: number): string {
  if (guess == null) return 'No guess at all? Admirably cautious.';
  const diff = guess - actual;
  if (Math.abs(diff) <= 20) return 'An almost suspiciously respectable estimate.';
  if (Math.abs(diff) <= 60) return diff > 0 ? 'Close. Slightly generous, but close.' : 'Close. A touch optimistic, but close.';
  return diff > 0
    ? 'You’ve just invented a very generous hotel minibar allowance.'
    : 'Somebody has been reading package-holiday brochures from 1994.';
}

export default function PriceGame({ destinationId, it }: { destinationId: string; it: Itinerary }) {
  const { state, dispatch, reduceMotion, sfx } = useGame();
  const record = currentGuess(state, destinationId, it.id);
  const revealed = record?.revealed ?? false;
  const guess = record?.guess ?? null;
  const [draft, setDraft] = useState(guess == null ? '' : String(guess));
  const [burst, setBurst] = useState(0);
  const priced = hasPrice(it);

  // Reset the text box whenever the itinerary (and therefore the stored guess) changes.
  useEffect(() => setDraft(guess == null ? '' : String(guess)), [it.id, guess]);

  const sliderValue = guess ?? Math.round((range.min + range.max) / 2 / 10) * 10;
  const setGuess = (v: number | null) => {
    const clamped = v == null || Number.isNaN(v) ? null : Math.max(0, Math.min(9999, Math.round(v)));
    dispatch({ type: 'setGuess', destinationId, itineraryId: it.id, guess: clamped });
  };

  const reveal = () => {
    if (!priced) {
      sfx('mystery');
      dispatch({ type: 'reveal', destinationId, itineraryId: it.id, points: 0 });
      return;
    }
    const pts = guess == null ? 0 : closenessPoints(guess, it.estimatedTotalForTwoGBP);
    dispatch({ type: 'reveal', destinationId, itineraryId: it.id, points: pts });
    sfx('fanfare');
    if (pts > 0) setTimeout(() => sfx('applause'), 900);
    if (!reduceMotion) setBurst((b) => b + 1);
  };

  const points = record?.points ?? 0;
  const message = useMemo(() => (priced && revealed ? verdict(guess, it.estimatedTotalForTwoGBP!) : ''), [priced, revealed, guess, it]);

  return (
    <div className="relative">
      {burst > 0 && <Confetti burstKey={burst} />}

      <div className="rounded-2xl bg-royal p-4 text-cream shadow-[inset_0_0_0_3px_#f0b429,0_10px_30px_#0006] sm:p-6">
        <p className="text-center font-display text-sm tracking-widest text-gold">Guess the holiday price!</p>
        <p className="mt-1 text-center text-xs text-cream/75">
          All-in estimate for two: flights, room, bags and transfers. {state.contestants[state.contestantTurn]} to guess.
        </p>

        <div className="my-4 flex min-h-[5.5rem] items-center justify-center rounded-xl bg-black/50 px-3 py-3 shadow-[inset_0_2px_10px_#000]">
          <AnimatePresence mode="wait">
            {!revealed ? (
              <motion.p key="q" exit={{ opacity: 0, scale: 0.8 }} className="scoreboard-digit text-5xl sm:text-6xl" aria-label="Price hidden">
                £???
              </motion.p>
            ) : priced ? (
              <motion.div key="r" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                <RollingNumber
                  value={roundForReveal(it.estimatedTotalForTwoGBP!)}
                  reduceMotion={reduceMotion}
                  className="scoreboard-digit text-5xl sm:text-6xl"
                />
                <p className="mt-1 text-xs text-cream/80">for two · indicative, not a live fare</p>
              </motion.div>
            ) : (
              <motion.div key="m" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <p className="font-display text-lg text-gold sm:text-xl">Flight price awaiting confirmation</p>
                <p className="mt-1 text-xs text-cream/80">No fare matched these dates, so there is no total to reveal.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!revealed && priced && (
          <div className="space-y-3">
            <label htmlFor={`guess-${destinationId}`} className="sr-only">
              Your guess in pounds for two people
            </label>
            <input
              type="range"
              min={range.min}
              max={range.max}
              step={5}
              value={sliderValue}
              onChange={(e) => setGuess(Number(e.target.value))}
              className="h-10 w-full accent-[#f0b429]"
              aria-label="Guess slider"
              aria-valuetext={guess == null ? 'No guess yet' : `£${guess}`}
            />
            <div className="flex items-center justify-center gap-2">
              <button className={btn.icon} onClick={() => setGuess((guess ?? sliderValue) - 10)} aria-label="Ten pounds less">
                <Minus className="size-5" />
              </button>
              <div className="flex items-center rounded-xl border-2 border-gold bg-navy px-3">
                <span className="font-display text-xl text-gold">£</span>
                <input
                  id={`guess-${destinationId}`}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={draft}
                  placeholder="Your guess"
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                    setDraft(v);
                    setGuess(v === '' ? null : Number(v));
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && reveal()}
                  className="h-12 w-32 bg-transparent px-2 font-display text-2xl text-cream placeholder:text-base placeholder:text-cream/40 focus:outline-none"
                />
              </div>
              <button className={btn.icon} onClick={() => setGuess((guess ?? sliderValue) + 10)} aria-label="Ten pounds more">
                <Plus className="size-5" />
              </button>
            </div>
            <p className="text-center text-xs text-cream/70">Higher? Lower? Has anyone checked the exchange rate?</p>
          </div>
        )}

        {!revealed && (
          <button className={`${btn.primary} mt-4 w-full text-lg`} onClick={reveal}>
            {priced ? 'Reveal the price' : (
              <>
                <HelpCircle aria-hidden className="size-5" /> Reveal the mystery
              </>
            )}
          </button>
        )}

        {revealed && priced && (
          <div className="mt-2 text-center" aria-live="polite">
            <p className="font-serif text-lg italic text-gold">{message}</p>
            <p className="mt-1 text-sm text-cream/80">
              {guess != null ? <>Your guess: {formatGBP(guess)}. </> : null}
              {record?.contestant && <>{record.contestant} scores </>}
              <span className="scoreboard-digit">+{points}</span> points
              <span className="text-cream/60"> (entertainment only)</span>
            </p>
          </div>
        )}
      </div>

      {revealed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : 0.8 }}
          className="mt-4 rounded-2xl bg-white p-4 text-ink shadow-md"
        >
          <p className="mb-2 font-display text-xs tracking-widest text-red">The small print</p>
          <PriceBreakdown it={it} />
          <ProvenanceLine it={it} />
        </motion.div>
      )}
    </div>
  );
}
