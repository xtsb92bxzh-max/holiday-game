'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { AlertTriangle, CalendarDays, Clock, Hotel, Plane, Plus, ThermometerSnowflake } from 'lucide-react';
import Photo from '@/components/Photo';
import { destinationById, evidenceLabel, routeLabel } from '@/lib/catalogue';
import { formatDate, formatDateRange } from '@/lib/dates';
import { formatGBP } from '@/lib/pricing';
import type { Itinerary } from '@/lib/types';
import { awkwardBits, profileFor, seatOf, selectedVariant, variantsFor } from '../lib/cast';
import { costBreakdown as costBreakdownSafe } from '../lib/cost';
import { identityPublic } from '../lib/state';
import { useShow } from './BlindFlightProvider';
import { Shell } from './Chrome';
import { Breakdown, PendingFacts } from './Price';
import { btn, Provenance, TripLinks } from './ui';

export function VariantPicker({ id, current }: { id: string; current: Itinerary }) {
  const { dispatch } = useShow();
  const variants = variantsFor(id);
  if (variants.length < 2) return null;
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-bold uppercase tracking-widest text-bf-custard">Pick your dates</legend>
      <p className="text-xs text-bf-cream/70">Changing dates updates the flights, room and price.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {variants.map((v) => {
          const c = costBreakdownSafe(v);
          const on = v.id === current.id;
          return (
            <label
              key={v.id}
              className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border-2 px-3 py-2 text-sm ${
                on ? 'border-bf-custard bg-bf-custard/10' : 'border-bf-cream/20 hover:border-bf-cream/40'
              }`}
            >
              <input
                type="radio"
                name={`variant-${id}`}
                checked={on}
                onChange={() => dispatch({ type: 'chooseItinerary', destinationId: id, itineraryId: v.id })}
                className="mt-1 size-4 accent-[#f3c95e]"
              />
              <span>
                <span className="block font-bold">
                  {v.nights} nights · {formatDateRange(v.departDate, v.returnDate)}
                </span>
                <span className="block text-xs text-bf-cream/80">
                  {v.departureAirport} → {v.arrivalAirport} · {c ? 'Priced' : evidenceLabel[v.fareEvidence]}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function TripFacts({ it }: { it: Itinerary }) {
  const t = it.flightTimes;
  return (
    <ul className="grid gap-2 text-sm sm:grid-cols-2">
      <li className="flex gap-2">
        <CalendarDays aria-hidden className="mt-0.5 size-4 shrink-0 text-bf-seafoam" />
        <span>
          <strong>{it.nights} nights</strong>: {formatDate(it.departDate)} to {formatDate(it.returnDate)} 2027
        </span>
      </li>
      <li className="flex gap-2">
        <Plane aria-hidden className="mt-0.5 size-4 shrink-0 text-bf-seafoam" />
        <span>
          <strong>
            {it.departureAirport} → {it.arrivalAirport}
          </strong>{' '}
          · {routeLabel[it.routeType]}
          <span className="block text-xs opacity-75">{it.routeEvidence}</span>
        </span>
      </li>
      {t && (
        <li className="flex gap-2">
          <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-bf-seafoam" />
          <span>
            Out {t.leaveUK}–{t.arriveThere}, back {t.leaveThere}–{t.arriveUK} (local times)
            {it.flightNumbers && <span className="block text-xs opacity-75">{it.flightNumbers}</span>}
          </span>
        </li>
      )}
      {it.hotelName && (
        <li className="flex gap-2">
          <Hotel aria-hidden className="mt-0.5 size-4 shrink-0 text-bf-seafoam" />
          <span>
            {it.hotelName}
            {it.hotelReviewOutOf10 != null && <span className="block text-xs opacity-75">Guest rating {it.hotelReviewOutOf10}/10 at time of quote</span>}
          </span>
        </li>
      )}
    </ul>
  );
}

export function AwkwardBit({ id, it, ink = false }: { id: string; it: Itinerary; ink?: boolean }) {
  const bits = awkwardBits(id, it);
  return (
    <div className={`rounded-2xl border-2 p-4 ${ink ? 'border-bf-red/40 bg-bf-red/5' : 'border-bf-tomato/60 bg-bf-tomato/10'}`}>
      <h3 className={`flex items-center gap-2 font-bold ${ink ? 'text-bf-red' : 'text-bf-custard'}`}>
        <AlertTriangle aria-hidden className="size-4" /> The awkward bit
      </h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {bits.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    </div>
  );
}

/** The brochure: reasons to go, dates, flights, hotel, weather and links. */
export function TripDetails({ id, it }: { id: string; it: Itinerary }) {
  const d = destinationById[id];
  const highlights = d.highlights.slice(0, 3);
  return (
    <div className="space-y-4">
      {highlights.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-bf-seafoam">Three reasons to go</h3>
          <ol className="mt-2 grid gap-2 sm:grid-cols-3">
            {highlights.map((h, i) => (
              <li key={h} className="flex gap-3 rounded-2xl bg-bf-cream/5 p-3 text-sm">
                <span className="bf-display text-2xl leading-none text-bf-custard">{i + 1}</span>
                {h}
              </li>
            ))}
          </ol>
        </div>
      )}
      <div className="space-y-4 rounded-2xl border border-bf-cream/15 p-4">
        <VariantPicker id={id} current={it} />
        <TripFacts it={it} />
        {d.winterTypical && (
          <p className="flex gap-2 text-sm">
            <ThermometerSnowflake aria-hidden className="mt-0.5 size-4 shrink-0 text-bf-seafoam" />
            <span>
              <strong>Typical January:</strong> {d.winterTypical} <span className="opacity-70">Not a forecast.</span>
            </span>
          </p>
        )}
        <TripLinks it={it} />
      </div>
    </div>
  );
}

function Revealed({ id, it }: { id: string; it: Itinerary }) {
  const { reduceMotion } = useShow();
  const d = destinationById[id];
  const profile = profileFor(id);
  return (
    <motion.section
      aria-labelledby="reveal-heading"
      initial={reduceMotion ? false : { clipPath: 'inset(0 50% 0 50%)' }}
      animate={{ clipPath: 'inset(0 0% 0 0%)' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-6"
    >
      <div className="overflow-hidden rounded-3xl border-4 border-bf-custard/70 shadow-2xl">
        <Photo src={d.imagePath} name={d.name} country={d.country} className="aspect-[4/3] w-full sm:aspect-[16/9]" sizes="(max-width: 1024px) 100vw, 1000px" priority showCredit />
      </div>
      <div>
        <h1 id="reveal-heading" className="bf-logo mt-1 text-5xl sm:text-6xl">
          {d.name}
        </h1>
        <p className="mt-1 text-lg text-bf-cream/85">{d.country}</p>
        <p className="mt-3 font-serif text-xl italic text-bf-custard">{profile.shortPitch}</p>
      </div>
      <AwkwardBit id={id} it={it} />
      <TripDetails id={id} it={it} />
    </motion.section>
  );
}

export default function ContestantScreen({ id }: { id: string }) {
  const { state, dispatch } = useShow();
  const d = destinationById[id];
  const inShow = state.destinationOrder.includes(id);
  const it = selectedVariant(id, state.preferredItineraryByDestination[id]);
  const seat = seatOf(id, state.destinationOrder, state.seed, state.balancedDeal);

  if (!d || !it) return null;

  if (inShow && !identityPublic(state, id)) {
    return (
      <Shell>
        <section className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="bf-logo text-4xl">No peeking</h1>
          <p className="mt-4 text-bf-cream/85">This contestant is still behind the screen. Their identity comes out in the reveal.</p>
          {seat && (
            <Link href={`/blind-flight/episode/${seat.episode.id}`} className={btn.primary + ' mt-8'}>
              Back to {seat.episode.title}
            </Link>
          )}
        </section>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:py-10">
        {inShow && seat ? (
          <Link href={`/blind-flight/episode/${seat.episode.id}`} className={btn.link}>
            ← {seat.episode.title}
          </Link>
        ) : (
          <Link href="/blind-flight/contenders" className={btn.link}>
            ← More eligible contenders
          </Link>
        )}
        <Revealed id={id} it={it} />
        <PendingOrBreakdown it={it} />
        {!inShow && (
          <div className="rounded-3xl border-2 border-dashed border-bf-cream/30 p-5">
            <p className="text-bf-cream/85">{d.name} is not on tonight’s show yet. Add them to a bonus episode to choose between them.</p>
            <button type="button" className={btn.sea + ' mt-3'} onClick={() => dispatch({ type: 'addContender', destinationId: id })}>
              <Plus aria-hidden className="size-4" /> Add {d.name} to the show
            </button>
          </div>
        )}
      </div>
    </Shell>
  );
}

function PendingOrBreakdown({ it }: { it: Itinerary }) {
  const c = costBreakdownSafe(it);
  return (
    <div className="bf-paper space-y-3 rounded-3xl p-5">
      <h2 className="bf-display text-2xl text-bf-red">The price</h2>
      {c ? (
        <>
          <p className="text-3xl font-bold">
            {formatGBP(c.headline)} <span className="text-base font-normal">for two · {formatGBP(c.perPerson, { pence: true })} each</span>
          </p>
          <Breakdown it={it} />
        </>
      ) : (
        <>
          <p className="text-xl font-bold">Price pending — flights not yet priced</p>
          <PendingFacts it={it} />
        </>
      )}
      <Provenance />
    </div>
  );
}
