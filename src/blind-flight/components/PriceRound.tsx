'use client';

import { useId, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { BadgeHelp, Hotel, Plane } from 'lucide-react';
import RollingNumber from '@/components/RollingNumber';
import { itineraries } from '@/lib/catalogue';
import { formatGBP } from '@/lib/pricing';
import type { Itinerary } from '@/lib/types';
import { copy } from '../data/copy';
import { isShowItinerary } from '../lib/cast';
import { costBreakdown, guessBounds, guessVerdict } from '../lib/cost';
import { useShow } from './BlindFlightProvider';
import { btn, Provenance } from './ui';

export function Breakdown({ it, ink = true }: { it: Itinerary; ink?: boolean }) {
  const c = costBreakdown(it);
  if (!c) return null;
  const rows: [string, string, string?][] = [
    ['Estimated total for two', formatGBP(c.totalForTwo, { pence: true })],
    ['Per person', formatGBP(c.perPerson, { pence: true })],
    ['Return flights for two', formatGBP(c.flightsForTwo, { pence: true }), `${formatGBP(c.flightsPerPerson, { pence: true })} each`],
    ['Room for two', formatGBP(c.roomForTwo, { pence: true }), `${it.nights} nights${it.hotelName ? `, ${it.hotelName}` : ''}`],
    [
      'Bags and transfers',
      formatGBP(c.extrasForTwo, { pence: true }),
      `Illustrative: £${c.baggageForTwo / 2} bag each + £${c.transfersForTwo} transfers`,
    ],
  ];
  return (
    <dl className={`divide-y text-sm ${ink ? 'divide-bf-ink/10' : 'divide-bf-cream/10'}`}>
      {rows.map(([k, v, note], i) => (
        <div key={k} className={`flex items-baseline justify-between gap-3 py-2 ${i === 0 ? 'font-bold' : ''}`}>
          <dt>
            {k}
            {note && <span className="block text-xs font-normal opacity-70">{note}</span>}
          </dt>
          <dd className="shrink-0 tabular-nums">{v}</dd>
        </div>
      ))}
      <div className="py-2 text-xs opacity-75">Not included: food, sightseeing, local spending and getting to the UK airport.</div>
    </dl>
  );
}

/** Known facts for a trip with no matched fare. Kept as separate fields; never summed into a package. */
export function PendingFacts({ it }: { it: Itinerary }) {
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <div className="rounded-xl bg-bf-ink/5 p-3">
        <dt className="flex items-center gap-1.5 font-bold">
          <Hotel aria-hidden className="size-4" /> Room quote for two
        </dt>
        <dd className="mt-1">
          {it.roomForTwoGBP != null ? formatGBP(it.roomForTwoGBP, { pence: true }) : 'No room quote recorded'}
          {it.hotelName && <span className="block text-xs opacity-75">{it.hotelName}, {it.nights} nights</span>}
        </dd>
      </div>
      <div className="rounded-xl bg-bf-ink/5 p-3">
        <dt className="flex items-center gap-1.5 font-bold">
          <Plane aria-hidden className="size-4" /> Flights
        </dt>
        <dd className="mt-1">
          <span className="inline-block rounded-full bg-bf-custard px-2 py-0.5 text-xs font-bold text-bf-ink">Fare still needed</span>
          <span className="mt-1 block text-xs opacity-80">
            {it.flightNumbers ? `Timetable found: ${it.flightNumbers}.` : 'No flight schedule established.'} No return fare has been matched to
            these dates.
          </span>
        </dd>
      </div>
    </dl>
  );
}

export default function PriceRound({ it, destinationName }: { it: Itinerary; destinationName: string }) {
  const { state, dispatch, reduceMotion, sfx } = useShow();
  const me = state.players[state.activePlayer];
  const cost = costBreakdown(it);
  const revealed = Boolean(me.priceRevealed[it.id]);
  const guess = me.guessedPricesGBP[it.id];
  const [text, setText] = useState(guess != null ? String(guess) : '');
  const inputId = useId();
  const sliderId = useId();
  const bounds = useMemo(
    () => guessBounds(itineraries.filter((i) => isShowItinerary(i)).flatMap((i) => (costBreakdown(i) ? [costBreakdown(i)!.totalForTwo] : []))),
    [],
  );

  if (!cost) {
    return (
      <section aria-labelledby="price-heading" className="bf-paper rounded-3xl p-5 sm:p-6">
        <h2 id="price-heading" className="bf-display text-2xl text-bf-red">
          What’s your price, darling?
        </h2>
        <p className="mt-3 text-2xl font-bold">Price pending — flights not yet priced</p>
        <p className="mt-1 font-serif italic">{copy.pricePending}</p>
        <p className="mt-2 text-sm opacity-80">There is no price round for {destinationName} on these dates, because there is no real total to guess.</p>
        <div className="mt-4">
          <PendingFacts it={it} />
        </div>
      </section>
    );
  }

  const setGuess = (raw: string) => {
    setText(raw);
    const n = Number(raw.replace(/[£,\s]/g, ''));
    dispatch({ type: 'guess', itineraryId: it.id, value: raw.trim() && Number.isFinite(n) && n > 0 ? Math.round(n) : undefined });
  };
  const reveal = () => {
    dispatch({ type: 'revealPrice', itineraryId: it.id });
    sfx('fanfare');
  };
  const verdict = guess != null ? guessVerdict(guess, cost.totalForTwo) : null;

  return (
    <section aria-labelledby="price-heading" className="bf-paper overflow-hidden rounded-3xl">
      <div className="p-5 sm:p-6">
        <h2 id="price-heading" className="bf-display text-2xl text-bf-red">
          What’s your price, darling?
        </h2>
        <p className="mt-1 font-serif italic">{copy.price}</p>
        <p className="mt-2 text-sm">
          Guess the <strong>estimated total for both of you</strong>: return flights, the room, and an illustrative allowance for bags and
          transfers. Optional, and purely for fun.
        </p>
      </div>

      <div className="bf-tv mx-4 mb-5 rounded-2xl px-4 py-6 text-center text-bf-cream sm:mx-6">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-bf-seafoam">Estimated total for two</p>
        <div className="mt-2 font-bf-display text-6xl text-bf-custard sm:text-7xl" aria-live="polite">
          {revealed ? <RollingNumber value={cost.headline} reduceMotion={reduceMotion} /> : <span aria-label="Hidden price">£???</span>}
        </div>
        {revealed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduceMotion ? 0 : 0.6 }}>
            <p className="mt-2 text-sm text-bf-cream/85">
              {formatGBP(cost.perPerson, { pence: true })} per person · exact estimate {formatGBP(cost.totalForTwo, { pence: true })}
            </p>
            {verdict && (
              <div className="mt-4 inline-block rounded-xl border-2 border-bf-custard px-4 py-2">
                <p className="text-xs text-bf-cream/75">You guessed {formatGBP(guess!)}</p>
                <p className="bf-display text-xl text-bf-custard">{verdict.badge}</p>
                <p className="font-serif text-sm italic">{verdict.line}</p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      <div className="space-y-4 px-5 pb-6 sm:px-6">
        {!revealed ? (
          <>
            <div className="grid gap-3">
              <label htmlFor={inputId} className="text-sm font-bold">
                Your guess for two (£)
              </label>
              <input
                id={inputId}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                placeholder="Type a total"
                value={text}
                onChange={(e) => setGuess(e.target.value)}
                className="w-full rounded-xl border-2 border-bf-ink/20 bg-white px-4 py-3 text-2xl font-bold tabular-nums text-bf-ink placeholder:text-base placeholder:font-normal"
              />
              <label htmlFor={sliderId} className="sr-only">
                Or drag to guess
              </label>
              <input
                id={sliderId}
                type="range"
                min={bounds.min}
                max={bounds.max}
                step={bounds.step}
                value={guess ?? Math.round((bounds.min + bounds.max) / 2 / 50) * 50}
                onChange={(e) => setGuess(e.target.value)}
                className={`h-11 w-full accent-[#b8353a] ${guess == null ? 'opacity-60' : ''}`}
                aria-valuetext={guess != null ? formatGBP(guess) : 'No guess yet'}
              />
              <div className="flex justify-between text-xs opacity-70">
                <span>{formatGBP(bounds.min)}</span>
                <span>Drag or type</span>
                <span>{formatGBP(bounds.max)}</span>
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <button type="button" className={btn.primary} disabled={guess == null} onClick={reveal}>
                Reveal the price!
              </button>
              <button type="button" className="min-h-11 px-3 text-sm underline decoration-dotted underline-offset-4" onClick={reveal}>
                Just show me
              </button>
            </div>
          </>
        ) : (
          <details className="rounded-xl bg-bf-ink/5 px-4 py-2" open>
            <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-bold">
              <BadgeHelp aria-hidden className="size-4" /> What’s in that number?
            </summary>
            <Breakdown it={it} />
          </details>
        )}
        <Provenance />
      </div>
    </section>
  );
}
