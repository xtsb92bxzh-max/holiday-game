'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { HelpCircle, Lock } from 'lucide-react';
import type { Itinerary } from '@/lib/types';
import { hasPrice } from '@/lib/catalogue';
import { duelPoints, formatGBP, roundForReveal, UNDER_BONUS } from '@/lib/pricing';
import { currentGuess, type Pair } from '@/lib/gameState';
import { useGame } from './GameContext';
import RollingNumber from './RollingNumber';
import Confetti from './Confetti';
import { PriceBreakdown, ProvenanceLine } from './TripDetails';
import { btn } from './ui';

function verdict(guess: number, actual: number): string {
  const diff = guess - actual;
  const ratio = Math.abs(diff) / actual;
  if (ratio <= 0.05) return 'An almost suspiciously respectable estimate.';
  if (ratio <= 0.2) return diff > 0 ? 'Close. Slightly generous, but close.' : 'Close. A touch optimistic, but close.';
  return diff > 0
    ? 'Has invented a very generous hotel minibar allowance.'
    : 'Has been reading package-holiday brochures from 1994.';
}

function GuessInput({ label, onLock }: { label: string; onLock: (n: number) => void }) {
  const [text, setText] = useState('');
  const n = Number(text.replace(/[£,\s]/g, ''));
  const ok = text.trim() !== '' && Number.isFinite(n) && n > 0;
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (ok) onLock(n);
      }}
    >
      <label className="block text-sm font-semibold">
        {label}
        <span className="mt-1 flex items-center rounded-xl border-2 border-gold bg-navy px-3">
          <span aria-hidden className="font-display text-xl text-gold">
            £
          </span>
          {/* Masked so the other contestant can't read it over your shoulder. */}
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={5}
            value={text}
            placeholder="for two"
            onChange={(e) => setText(e.target.value.replace(/[^0-9]/g, ''))}
            className="h-12 w-full bg-transparent px-2 font-display text-2xl text-cream placeholder:font-sans placeholder:text-base placeholder:text-cream/40 focus:outline-none"
          />
        </span>
      </label>
      <button type="submit" className={`${btn.gold} w-full`} disabled={!ok}>
        <Lock aria-hidden className="size-5" /> Lock it in
      </button>
    </form>
  );
}

export default function PriceGame({ destinationId, it }: { destinationId: string; it: Itinerary }) {
  const { state, dispatch, reduceMotion, sfx } = useGame();
  const record = currentGuess(state, destinationId, it.id);
  const revealed = record?.revealed ?? false;
  const guesses: Pair<number | null> = record?.guesses ?? [null, null];
  const points: Pair<number> = record?.points ?? [0, 0];
  const [burst, setBurst] = useState(0);
  const priced = hasPrice(it);
  const names = state.contestants;
  const next = guesses.findIndex((g) => g == null) as -1 | 0 | 1;
  const locked = guesses.filter((g) => g != null).length;

  const reveal = () => {
    if (!priced) {
      sfx('mystery');
      dispatch({ type: 'reveal', destinationId, itineraryId: it.id, points: [0, 0] });
      return;
    }
    const pts = duelPoints(guesses, it.estimatedTotalForTwoGBP) as Pair<number>;
    dispatch({ type: 'reveal', destinationId, itineraryId: it.id, points: pts });
    sfx('fanfare');
    if (pts[0] + pts[1] > 0) setTimeout(() => sfx('applause'), 900);
    if (!reduceMotion) setBurst((b) => b + 1);
  };

  const headline = (() => {
    if (!priced || !revealed || locked === 0) return '';
    if (locked === 1) return `${names[guesses[0] != null ? 0 : 1]} played alone and scores ${points[guesses[0] != null ? 0 : 1]}.`;
    if (points[0] === points[1]) return points[0] === 0 ? 'Nobody scores. The spreadsheet wins this one.' : 'A dead heat. Suspicious.';
    return `${names[points[0] > points[1] ? 0 : 1]} takes this prize.`;
  })();

  return (
    <div className="relative">
      {burst > 0 && <Confetti burstKey={burst} />}

      <div className="rounded-2xl bg-royal p-4 text-cream shadow-[inset_0_0_0_3px_#f0b429,0_10px_30px_#0006] sm:p-6">
        <p className="text-center font-display text-sm tracking-widest text-gold">Guess the holiday price!</p>
        <p className="mt-1 text-center text-xs text-cream/75">
          All-in estimate for two: flights, room, bags and transfers.
          {priced && ' Both guess in secret. Within 5% scores 10, within 10% scores 6, within 20% scores 3.'}
          {priced && ` The closest guess that doesn’t go over gets ${UNDER_BONUS} more.`}
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
            <ul className="flex flex-wrap justify-center gap-2 text-sm" aria-label="Who has guessed">
              {names.map((name, i) => (
                <li
                  key={i}
                  className={`rounded-full px-3 py-1 ${guesses[i] != null ? 'bg-gold font-semibold text-ink' : 'bg-cream/10 text-cream/80'}`}
                >
                  {name}: {guesses[i] != null ? 'locked in' : 'thinking'}
                </li>
              ))}
            </ul>
            {next !== -1 && (
              <>
                <GuessInput
                  key={`${it.id}-${next}`}
                  label={`${names[next]}, your guess`}
                  onLock={(n) => {
                    dispatch({ type: 'lockGuess', destinationId, itineraryId: it.id, contestant: next, guess: n });
                    sfx('tick');
                  }}
                />
                <p className="text-center text-xs text-cream/70">
                  {names[next === 0 ? 1 : 0]}, look away. Has anyone checked the exchange rate?
                </p>
              </>
            )}
          </div>
        )}

        {!revealed && (
          <button
            className={`${next === -1 || !priced ? btn.primary : btn.ghost} mt-4 w-full ${next === -1 || !priced ? 'text-lg' : ''}`}
            onClick={reveal}
          >
            {!priced ? (
              <>
                <HelpCircle aria-hidden className="size-5" /> Reveal the mystery
              </>
            ) : next === -1 ? (
              'Reveal the price'
            ) : locked === 0 ? (
              'Skip the guessing and reveal'
            ) : (
              `Reveal without ${names[next]}’s guess`
            )}
          </button>
        )}

        {revealed && priced && (
          <div className="mt-2 space-y-2 text-center" aria-live="polite">
            {headline && <p className="font-display text-lg tracking-wide text-gold">{headline}</p>}
            {locked > 0 ? (
              <ul className="space-y-1.5 text-sm">
                {names.map((name, i) =>
                  guesses[i] == null ? null : (
                    <li key={i}>
                      <span className="font-semibold">{name}</span> guessed {formatGBP(guesses[i])}
                      {guesses[i]! > it.estimatedTotalForTwoGBP! ? ' (over)' : ''}:{' '}
                      <span className="scoreboard-digit">+{points[i]}</span>
                      <span className="block font-serif italic text-cream/80">{verdict(guesses[i]!, it.estimatedTotalForTwoGBP!)}</span>
                    </li>
                  ),
                )}
              </ul>
            ) : (
              <p className="font-serif text-lg italic text-gold">No guesses at all? Admirably cautious.</p>
            )}
            <p className="text-xs text-cream/60">Points are entertainment only.</p>
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
