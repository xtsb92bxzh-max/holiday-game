'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { destinationById, evidenceLabel, itineraries, routeLabel } from '@/lib/catalogue';
import { formatDateRange, isEligibleTrip } from '@/lib/dates';
import { formatGBP } from '@/lib/pricing';
import type { Itinerary } from '@/lib/types';
import { boardSegments, type BoardSegmentId } from '../data/show';
import { catchesFor, isFeatured, isShowable, segmentsOf } from '../lib/cast';
import { costBreakdown } from '../lib/cost';
import { Shell } from './Chrome';
import { useShow } from './ShowProvider';
import { btn, EvidenceStatus, PriceBreakdown, SourceStatus, TripLinks } from './ui';

type Sort = 'price' | 'name' | 'nights' | 'rating';
type Status = 'viable' | 'priced_indicative' | 'scheduled_unpriced' | 'needs_manual_review' | 'all';

const field = 'mt-1 block min-h-11 w-full rounded-xl border border-gb-paper/30 bg-gb-black px-3 text-base text-gb-paper';

/** Every itinerary in the research that fits the travel window. No game required. */
export default function HolidaysTable() {
  const { state, dispatch } = useShow();
  const [maxBudget, setMaxBudget] = useState<number | ''>('');
  const [nights, setNights] = useState<'any' | '4' | '5'>('any');
  const [airport, setAirport] = useState<'any' | 'GLA' | 'EDI'>('any');
  const [segment, setSegment] = useState<'any' | BoardSegmentId>('any');
  const [status, setStatus] = useState<Status>('viable');
  const [route, setRoute] = useState<'any' | Itinerary['routeType']>('any');
  const [sort, setSort] = useState<Sort>('price');
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const list = itineraries.filter((it) => {
      const d = destinationById[it.destinationId];
      if (!d || !isEligibleTrip(it.departDate, it.returnDate)) return false;
      if (status === 'viable' && it.sourceSheet !== 'Viable itineraries') return false;
      if (status !== 'viable' && status !== 'all' && it.fareEvidence !== status) return false;
      const total = costBreakdown(it)?.totalForTwo ?? null;
      if (maxBudget !== '' && (total == null || total > maxBudget)) return false;
      if (nights !== 'any' && String(it.nights) !== nights) return false;
      if (airport !== 'any' && it.departureAirport !== airport) return false;
      if (segment !== 'any' && !segmentsOf(d.id).includes(segment)) return false;
      if (route !== 'any' && it.routeType !== route) return false;
      if (q.trim() && !`${d.name} ${d.country}`.toLowerCase().includes(q.trim().toLowerCase())) return false;
      return true;
    });
    const price = (it: Itinerary) => costBreakdown(it)?.totalForTwo ?? Infinity;
    return list.sort((a, b) => {
      if (sort === 'name') return destinationById[a.destinationId].name.localeCompare(destinationById[b.destinationId].name) || price(a) - price(b);
      if (sort === 'nights') return a.nights - b.nights || price(a) - price(b);
      if (sort === 'rating') return (b.hotelReviewOutOf10 ?? -1) - (a.hotelReviewOutOf10 ?? -1) || price(a) - price(b);
      return price(a) - price(b) || (a.roomForTwoGBP ?? Infinity) - (b.roomForTwoGBP ?? Infinity);
    });
  }, [maxBudget, nights, airport, segment, status, route, sort, q]);

  const reset = () => {
    setMaxBudget('');
    setNights('any');
    setAirport('any');
    setSegment('any');
    setStatus('viable');
    setRoute('any');
    setQ('');
  };

  return (
    <Shell>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:py-12">
        <section className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gb-gold">Enough nonsense</p>
          <h1 className="text-3xl font-bold sm:text-4xl">All eligible holidays</h1>
          <p className="max-w-2xl text-gb-paper/85">
            Every trip from the research that fits Sunday 17 or Monday 18 January out and Thursday 21 or Friday 22 January back, from Glasgow or
            Edinburgh. Totals are for two people sharing one room.
          </p>
          <Link href="/getaway-show" className={btn.link}>
            ← Back to the show
          </Link>
        </section>

        <form className="grid gap-3 rounded-3xl border border-gb-paper/15 bg-gb-black/30 p-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(e) => e.preventDefault()}>
          <label className="text-sm">
            Search
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="City or country" className={field + ' placeholder:text-gb-paper/45'} />
          </label>
          <label className="text-sm">
            Which rows
            <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className={field}>
              <option value="viable">Viable itineraries (45)</option>
              <option value="priced_indicative">{evidenceLabel.priced_indicative} only</option>
              <option value="scheduled_unpriced">{evidenceLabel.scheduled_unpriced} only</option>
              <option value="needs_manual_review">Connections still to verify</option>
              <option value="all">Everything</option>
            </select>
          </label>
          <label className="text-sm">
            Budget for two (up to)
            <select value={maxBudget} onChange={(e) => setMaxBudget(e.target.value ? Number(e.target.value) : '')} className={field}>
              <option value="">Any (includes unknown totals)</option>
              {[350, 400, 450, 500, 550, 600, 700].map((n) => (
                <option key={n} value={n}>
                  {formatGBP(n)} (priced only)
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Nights
            <select value={nights} onChange={(e) => setNights(e.target.value as typeof nights)} className={field}>
              <option value="any">4 or 5</option>
              <option value="4">4 nights</option>
              <option value="5">5 nights</option>
            </select>
          </label>
          <label className="text-sm">
            Departing from
            <select value={airport} onChange={(e) => setAirport(e.target.value as typeof airport)} className={field}>
              <option value="any">Glasgow or Edinburgh</option>
              <option value="GLA">Glasgow (GLA)</option>
              <option value="EDI">Edinburgh (EDI)</option>
            </select>
          </label>
          <label className="text-sm">
            Type of trip
            <select value={segment} onChange={(e) => setSegment(e.target.value as typeof segment)} className={field}>
              <option value="any">Any</option>
              {boardSegments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Route
            <select value={route} onChange={(e) => setRoute(e.target.value as typeof route)} className={field}>
              <option value="any">Any</option>
              {(['direct', 'direct_plus_ground', 'connecting', 'unknown'] as const).map((r) => (
                <option key={r} value={r}>
                  {routeLabel[r]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={field}>
              <option value="price">Total for two, cheapest first</option>
              <option value="name">Destination A–Z</option>
              <option value="nights">Nights</option>
              <option value="rating">Hotel rating</option>
            </select>
          </label>
          <div className="flex items-center justify-between gap-3 sm:col-span-2 lg:col-span-4">
            <p aria-live="polite" className="text-sm text-gb-paper/85">
              {rows.length} trip{rows.length === 1 ? '' : 's'}
            </p>
            <button type="button" onClick={reset} className={btn.ghost}>
              Clear filters
            </button>
          </div>
        </form>

        <SourceStatus />

        <ul className="grid gap-4 lg:grid-cols-2">
          {rows.map((it) => {
            const d = destinationById[it.destinationId];
            const c = costBreakdown(it);
            const onBallot = isFeatured(d.id) || state.ballotExtraIds.includes(d.id);
            return (
              <li key={it.id} className="gb-paper flex flex-col gap-3 rounded-2xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-bold">{d.name}</h2>
                    <p className="text-sm opacity-75">
                      {d.country} · <span className="font-mono text-xs">{it.id}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    {c ? (
                      <>
                        <p className="text-2xl font-bold tabular-nums">{formatGBP(c.totalForTwo, { pence: true })}</p>
                        <p className="text-xs opacity-80">for two · {formatGBP(c.perPerson, { pence: true })} each</p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold">{it.fareEvidence === 'needs_manual_review' ? 'Flights not established' : 'Flights unpriced — total unknown'}</p>
                        <p className="text-xs opacity-80">
                          Room only: {it.roomForTwoGBP != null ? formatGBP(it.roomForTwoGBP, { pence: true }) : 'none recorded'}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-sm">
                  <strong>
                    {it.nights} nights · {formatDateRange(it.departDate, it.returnDate)} 2027
                  </strong>{' '}
                  · {it.departureAirport} → {it.arrivalAirport}
                </p>
                <EvidenceStatus it={it} />
                {it.hotelName && (
                  <p className="text-sm">
                    Stay: {it.hotelName}
                    {it.hotelReviewOutOf10 != null && ` (${it.hotelReviewOutOf10}/10)`}
                  </p>
                )}
                <p className="text-sm text-gb-tomato">
                  <strong>Watch out:</strong> {catchesFor(d.id, it).join(' ')}
                </p>
                {it.workbookNote && <p className="text-xs opacity-80">Research note: {it.workbookNote}</p>}
                {c && (
                  <details className="text-sm">
                    <summary className="flex min-h-11 cursor-pointer items-center font-semibold">Price breakdown</summary>
                    <PriceBreakdown it={it} />
                  </details>
                )}
                <TripLinks it={it} />
                {isShowable(d.id) && it.sourceSheet === 'Viable itineraries' && (
                  <div className="border-t border-gb-black/10 pt-3">
                    {onBallot ? (
                      <p className="text-sm font-semibold">{d.name} is on the ballot.</p>
                    ) : (
                      <button type="button" className={btn.ghostInk} onClick={() => dispatch({ type: 'addToBallot', destinationId: d.id })}>
                        Add {d.name} to the ballot
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {rows.length === 0 && <p className="text-center text-gb-paper/85">Nothing matches those filters. Try clearing one.</p>}
      </div>
    </Shell>
  );
}
