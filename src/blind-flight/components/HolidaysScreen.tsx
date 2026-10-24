'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { allCategories, destinationById, evidenceLabel, itineraries, routeLabel } from '@/lib/catalogue';
import { formatDateRange, isEligibleTrip } from '@/lib/dates';
import { formatGBP } from '@/lib/pricing';
import type { Itinerary } from '@/lib/types';
import { isShowable } from '../lib/cast';
import { costBreakdown } from '../lib/cost';
import { useShow } from './BlindFlightProvider';
import { Shell } from './Chrome';
import { btn, Provenance, TripLinks } from './ui';

type Sort = 'price' | 'name' | 'nights';
type Status = 'all' | Itinerary['fareEvidence'];

const routeQualities: Itinerary['routeType'][] = ['direct', 'direct_plus_ground', 'connecting', 'unknown'];

const select =
  'mt-1 block min-h-11 w-full rounded-xl border border-bf-cream/30 bg-bf-deep px-3 text-base text-bf-cream';

/** Every itinerary in the workbook's travel window, with no game state in sight. */
export default function HolidaysScreen() {
  const { dispatch, state } = useShow();
  const [maxBudget, setMaxBudget] = useState<number | ''>('');
  const [nights, setNights] = useState<'any' | '4' | '5'>('any');
  const [airport, setAirport] = useState<'any' | 'GLA' | 'EDI'>('any');
  const [category, setCategory] = useState('any');
  const [status, setStatus] = useState<Status>('all');
  const [route, setRoute] = useState<'any' | Itinerary['routeType']>('any');
  const [sort, setSort] = useState<Sort>('price');
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const list = itineraries.filter((it) => {
      const d = destinationById[it.destinationId];
      if (!d || !isEligibleTrip(it.departDate, it.returnDate)) return false;
      const total = costBreakdown(it)?.totalForTwo ?? null;
      if (maxBudget !== '' && (total == null || total > maxBudget)) return false;
      if (nights !== 'any' && String(it.nights) !== nights) return false;
      if (airport !== 'any' && it.departureAirport !== airport) return false;
      if (category !== 'any' && !d.categories.includes(category)) return false;
      if (status !== 'all' && it.fareEvidence !== status) return false;
      if (route !== 'any' && it.routeType !== route) return false;
      if (q.trim() && !`${d.name} ${d.country}`.toLowerCase().includes(q.trim().toLowerCase())) return false;
      return true;
    });
    const price = (it: Itinerary) => costBreakdown(it)?.totalForTwo ?? Infinity;
    return list.sort((a, b) => {
      if (sort === 'name') return destinationById[a.destinationId].name.localeCompare(destinationById[b.destinationId].name) || price(a) - price(b);
      if (sort === 'nights') return a.nights - b.nights || price(a) - price(b);
      return price(a) - price(b) || (a.roomForTwoGBP ?? Infinity) - (b.roomForTwoGBP ?? Infinity);
    });
  }, [maxBudget, nights, airport, category, status, route, sort, q]);

  const reset = () => {
    setMaxBudget('');
    setNights('any');
    setAirport('any');
    setCategory('any');
    setStatus('all');
    setRoute('any');
    setQ('');
  };

  return (
    <Shell>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:py-12">
        <section className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-bf-seafoam">Sensible mode</p>
          <h1 className="text-3xl font-bold sm:text-4xl">All the holidays</h1>
          <p className="max-w-2xl text-bf-cream/85">
            Every trip from the research that fits 17/18 to 21/22 January 2027, from Glasgow or Edinburgh. Totals are for two people sharing a room.
          </p>
          <Link href="/blind-flight" className={btn.link}>
            ← Back to the game
          </Link>
        </section>

        <form className="grid gap-3 rounded-3xl border border-bf-cream/15 bg-black/20 p-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(e) => e.preventDefault()}>
          <label className="text-sm">
            Search
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="City or country" className={select + ' placeholder:text-bf-cream/40'} />
          </label>
          <label className="text-sm">
            Budget for two (up to)
            <select value={maxBudget} onChange={(e) => setMaxBudget(e.target.value ? Number(e.target.value) : '')} className={select}>
              <option value="">Any (includes unpriced)</option>
              {[400, 450, 500, 550, 600, 700].map((n) => (
                <option key={n} value={n}>
                  {formatGBP(n)} (priced only)
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Nights
            <select value={nights} onChange={(e) => setNights(e.target.value as typeof nights)} className={select}>
              <option value="any">4 or 5</option>
              <option value="4">4 nights</option>
              <option value="5">5 nights</option>
            </select>
          </label>
          <label className="text-sm">
            Departing from
            <select value={airport} onChange={(e) => setAirport(e.target.value as typeof airport)} className={select}>
              <option value="any">Glasgow or Edinburgh</option>
              <option value="GLA">Glasgow (GLA)</option>
              <option value="EDI">Edinburgh (EDI)</option>
            </select>
          </label>
          <label className="text-sm">
            Type of trip
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={select}>
              <option value="any">Any</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Price status
            <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className={select}>
              <option value="all">All</option>
              <option value="priced_indicative">{evidenceLabel.priced_indicative}</option>
              <option value="scheduled_unpriced">{evidenceLabel.scheduled_unpriced}</option>
              <option value="needs_manual_review">{evidenceLabel.needs_manual_review}</option>
            </select>
          </label>
          <label className="text-sm">
            Route
            <select value={route} onChange={(e) => setRoute(e.target.value as typeof route)} className={select}>
              <option value="any">Any</option>
              {routeQualities.map((r) => (
                <option key={r} value={r}>
                  {routeLabel[r]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={select}>
              <option value="price">Price for two</option>
              <option value="name">Destination</option>
              <option value="nights">Nights</option>
            </select>
          </label>
          <div className="flex items-center justify-between gap-3 sm:col-span-2 lg:col-span-4">
            <p aria-live="polite" className="text-sm text-bf-cream/80">
              {rows.length} trip{rows.length === 1 ? '' : 's'}
            </p>
            <button type="button" onClick={reset} className={btn.ghost}>
              Clear filters
            </button>
          </div>
        </form>

        <Provenance />

        <ul className="grid gap-4 lg:grid-cols-2">
          {rows.map((it) => {
            const d = destinationById[it.destinationId];
            const c = costBreakdown(it);
            const inShow = state.destinationOrder.includes(d.id);
            return (
              <li key={it.id} className="bf-paper flex flex-col gap-3 rounded-2xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-bold">{d.name}</h2>
                    <p className="text-sm opacity-75">{d.country}</p>
                  </div>
                  <div className="text-right">
                    {c ? (
                      <>
                        <p className="text-2xl font-bold tabular-nums">{formatGBP(c.totalForTwo, { pence: true })}</p>
                        <p className="text-xs opacity-75">for two · {formatGBP(c.perPerson, { pence: true })} each</p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold">{it.fareEvidence === 'needs_manual_review' ? 'Flights not established' : 'Price pending'}</p>
                        <p className="text-xs opacity-75">
                          Room only: {it.roomForTwoGBP != null ? formatGBP(it.roomForTwoGBP, { pence: true }) : 'none recorded'}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-sm">
                  <strong>
                    {it.nights} nights · {formatDateRange(it.departDate, it.returnDate)}
                  </strong>{' '}
                  · {it.departureAirport} → {it.arrivalAirport} · {routeLabel[it.routeType]}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-bf-navy px-2.5 py-1 font-semibold text-bf-cream">{evidenceLabel[it.fareEvidence]}</span>
                  {d.categories.map((cat) => (
                    <span key={cat} className="rounded-full bg-bf-ink/10 px-2.5 py-1">
                      {cat}
                    </span>
                  ))}
                </div>
                {c && (
                  <p className="text-xs opacity-80">
                    Flights {formatGBP(c.flightsForTwo, { pence: true })} · room {formatGBP(c.roomForTwo, { pence: true })} · bags and transfers{' '}
                    {formatGBP(c.extrasForTwo, { pence: true })}
                  </p>
                )}
                {it.hotelName && (
                  <p className="text-sm">
                    Stay: {it.hotelName}
                    {it.hotelReviewOutOf10 != null && ` (${it.hotelReviewOutOf10}/10)`}
                  </p>
                )}
                {[it.routeCaution, d.caution].filter(Boolean).length > 0 && (
                  <p className="text-sm text-bf-red">
                    <strong>Watch out:</strong> {[it.routeCaution, d.caution].filter(Boolean).join(' ')}
                  </p>
                )}
                <TripLinks it={it} ink />
                {isShowable(d.id) && (
                  <div className="border-t border-bf-ink/10 pt-3">
                    {inShow ? (
                      <Link href={`/blind-flight/show/${d.id}`} className="text-sm font-semibold underline underline-offset-4">
                        On the show: see {d.name}’s profile
                      </Link>
                    ) : (
                      <button type="button" className={btn.ghostInk} onClick={() => dispatch({ type: 'addContender', destinationId: d.id })}>
                        Add {d.name} to the show
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {rows.length === 0 && <p className="text-center text-bf-cream/85">Nothing matches those filters. Try clearing one.</p>}
      </div>
    </Shell>
  );
}
