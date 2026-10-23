'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useGame } from './GameContext';
import { allCategories, destinations, evidenceLabel, hasPrice, itinerariesFor, routeLabel, selectedItinerary } from '@/lib/catalogue';
import { formatDateRange } from '@/lib/dates';
import { formatGBP, perPerson } from '@/lib/pricing';
import type { EvidenceStatus, Itinerary } from '@/lib/types';
import VotingControls from './VotingControls';
import Photo from './Photo';
import { ExternalLink, Provenance, btn } from './ui';

type Confidence = 'all' | EvidenceStatus;
type Sort = 'price' | 'name';

const confidenceOptions: { value: Confidence; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'priced_indicative', label: 'Indicative price' },
  { value: 'scheduled_unpriced', label: 'Fare not verified' },
  { value: 'needs_manual_review', label: 'Needs review' },
];

const badge: Record<EvidenceStatus, string> = {
  priced_indicative: 'bg-sage/15 text-sage',
  scheduled_unpriced: 'bg-mustard/25 text-[#7a5200]',
  needs_manual_review: 'bg-red/10 text-red',
};

/** Best evidence level a destination has across its itineraries. */
function bestEvidence(list: Itinerary[]): EvidenceStatus {
  if (list.some(hasPrice)) return 'priced_indicative';
  if (list.some((i) => i.fareEvidence === 'scheduled_unpriced')) return 'scheduled_unpriced';
  return 'needs_manual_review';
}

export default function SensibleMode() {
  const { state, dispatch } = useGame();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [confidence, setConfidence] = useState<Confidence>('all');
  const [sort, setSort] = useState<Sort>('price');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return destinations
      .map((d) => ({ d, its: itinerariesFor(d), chosen: selectedItinerary(d, state.itineraryChoice[d.id]) }))
      .filter(({ d, its }) => {
        if (q && !`${d.name} ${d.country} ${d.regionOrCategory} ${d.intro}`.toLowerCase().includes(q)) return false;
        if (category !== 'all' && !d.categories.includes(category)) return false;
        if (confidence !== 'all' && !its.some((i) => i.fareEvidence === confidence)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sort === 'name') return a.d.name.localeCompare(b.d.name);
        const pa = Math.min(...a.its.filter(hasPrice).map((i) => i.estimatedTotalForTwoGBP), Infinity);
        const pb = Math.min(...b.its.filter(hasPrice).map((i) => i.estimatedTotalForTwoGBP), Infinity);
        return pa - pb || a.d.name.localeCompare(b.d.name);
      });
  }, [query, category, confidence, sort, state.itineraryChoice]);

  return (
    <section className="paper min-h-dvh pb-16">
      <div className="mx-auto max-w-5xl px-4 pt-6 sm:pt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-cobalt">Sensible mode</p>
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl">Every option, plainly</h2>
          </div>
          <button
            className="min-h-11 rounded-xl border-2 border-cobalt px-4 text-sm font-semibold text-cobalt hover:bg-cobalt hover:text-white"
            onClick={() => dispatch({ type: 'go', screen: 'title' })}
          >
            Fine, back to the show
          </button>
        </div>
        <p className="mt-3 max-w-3xl text-ink/80">
          {destinations.length} destinations from the workbook. Totals are for two people and include return flights, one
          shared room, an allowance for bags and transfers. A total only appears where a fare was matched to the exact
          dates. Your Keep, Maybe and Bin choices here are shared with the show.
        </p>
        <Provenance className="mt-2 text-ink" />

        <div className="sticky top-[60px] z-30 -mx-4 mt-5 space-y-3 border-b border-ink/10 bg-paper/95 px-4 py-3 backdrop-blur sm:top-[64px]">
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Search destinations</span>
              <Search aria-hidden className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/50" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search city, country or style"
                className="min-h-11 w-full rounded-xl border border-ink/20 bg-white pl-9 pr-3 text-base"
              />
            </label>
            <div className="flex gap-2">
              <label className="sr-only" htmlFor="sens-conf">
                Price confidence
              </label>
              <select
                id="sens-conf"
                value={confidence}
                onChange={(e) => setConfidence(e.target.value as Confidence)}
                className="min-h-11 flex-1 rounded-xl border border-ink/20 bg-white px-3 text-sm"
              >
                {confidenceOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor="sens-sort">
                Sort
              </label>
              <select
                id="sens-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="min-h-11 flex-1 rounded-xl border border-ink/20 bg-white px-3 text-sm"
              >
                <option value="price">Cheapest first</option>
                <option value="name">A–Z</option>
              </select>
            </div>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label="Category">
            {['all', ...allCategories].map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={`min-h-9 shrink-0 rounded-full border px-3 text-sm ${
                  category === c ? 'border-cobalt bg-cobalt text-white' : 'border-ink/20 bg-white'
                }`}
              >
                {c === 'all' ? 'All styles' : c}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-4 text-sm text-ink/60" aria-live="polite">
          Showing {list.length} of {destinations.length}
        </p>

        <ul className="mt-3 space-y-4">
          {list.map(({ d, its, chosen }) => {
            const ev = bestEvidence(its);
            const decision = state.decisions[d.id];
            return (
              <li key={d.id} className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
                <div className="flex gap-3 p-3 sm:gap-4 sm:p-4">
                  <Photo src={d.imagePath} name={d.name} className="hidden aspect-[4/3] w-32 shrink-0 rounded-lg sm:block" sizes="128px" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <h3 className="font-serif text-xl font-semibold">
                        {d.name} <span className="font-sans text-sm font-normal text-ink/60">{d.country}</span>
                      </h3>
                      <span className="text-right">
                        {hasPrice(chosen) ? (
                          <>
                            <span className="text-lg font-bold">{formatGBP(chosen.estimatedTotalForTwoGBP, { pence: true })}</span>
                            <span className="ml-1 text-xs text-ink/60">for two</span>
                          </>
                        ) : (
                          <span className="text-sm font-semibold text-ink/60">No total</span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${badge[ev]}`}>{evidenceLabel[ev]}</span>
                      <span className="rounded-full bg-ink/5 px-2 py-0.5">{d.regionOrCategory}</span>
                      {d.role === 'main' && <span className="rounded-full bg-red/10 px-2 py-0.5 text-red">In the show</span>}
                      {d.role === 'mystery' && <span className="rounded-full bg-cobalt/10 px-2 py-0.5 text-cobalt">Mystery contestant</span>}
                      {decision && (
                        <span className="rounded-full bg-ink px-2 py-0.5 font-semibold uppercase text-white">{decision}</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-ink/80">{d.intro}</p>
                    <p className="mt-1 text-sm text-red/90">{d.caution}</p>
                  </div>
                </div>

                <details className="border-t border-ink/10">
                  <summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm font-semibold text-cobalt">
                    {its.length} itinerar{its.length === 1 ? 'y' : 'ies'}, links and decision
                  </summary>
                  <div className="space-y-4 px-4 pb-4">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-left text-sm">
                        <thead className="text-xs uppercase tracking-wider text-ink/55">
                          <tr>
                            <th className="py-2 pr-3">Use</th>
                            <th className="py-2 pr-3">Dates</th>
                            <th className="py-2 pr-3">Route</th>
                            <th className="py-2 pr-3">Total / two</th>
                            <th className="py-2 pr-3">Per person</th>
                            <th className="py-2 pr-3">Room</th>
                            <th className="py-2">Links</th>
                          </tr>
                        </thead>
                        <tbody>
                          {its.map((it) => (
                            <tr key={it.id} className="border-t border-ink/10 align-top">
                              <td className="py-2 pr-3">
                                <input
                                  type="radio"
                                  name={`use-${d.id}`}
                                  checked={chosen.id === it.id}
                                  onChange={() => dispatch({ type: 'chooseItinerary', destinationId: d.id, itineraryId: it.id })}
                                  className="size-5 accent-[#1d3fc4]"
                                  aria-label={`Use ${formatDateRange(it.departDate, it.returnDate)} for the shortlist`}
                                />
                              </td>
                              <td className="py-2 pr-3">
                                {formatDateRange(it.departDate, it.returnDate)}
                                <span className="block text-xs text-ink/60">{it.nights} nights</span>
                              </td>
                              <td className="py-2 pr-3">
                                {it.departureAirport} → {it.arrivalAirport}
                                <span className="block text-xs text-ink/60">{routeLabel[it.routeType]}</span>
                                {it.flightTimes && (
                                  <span className="block text-xs text-ink/60">
                                    {it.flightTimes.leaveUK}–{it.flightTimes.arriveThere} / {it.flightTimes.leaveThere}–{it.flightTimes.arriveUK}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 pr-3 font-semibold">
                                {hasPrice(it) ? formatGBP(it.estimatedTotalForTwoGBP, { pence: true }) : <span className={`rounded px-1.5 py-0.5 text-xs ${badge[it.fareEvidence]}`}>{evidenceLabel[it.fareEvidence]}</span>}
                              </td>
                              <td className="py-2 pr-3">{hasPrice(it) ? formatGBP(perPerson(it.estimatedTotalForTwoGBP), { pence: true }) : '—'}</td>
                              <td className="py-2 pr-3">
                                {it.hotelName ?? '—'}
                                {it.hotelReviewOutOf10 != null && <span className="text-ink/60"> · {it.hotelReviewOutOf10}/10</span>}
                                {it.roomForTwoGBP != null && (
                                  <span className="block text-xs text-ink/60">Room {formatGBP(it.roomForTwoGBP, { pence: true })}</span>
                                )}
                              </td>
                              <td className="space-y-1 py-2">
                                <ExternalLink href={it.flightSourceUrl} className="!min-h-9 !px-3 !py-1 text-cobalt">
                                  Flights
                                </ExternalLink>
                                <ExternalLink href={it.roomSourceUrl} className="!min-h-9 !px-3 !py-1 text-cobalt">
                                  Room
                                </ExternalLink>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {its.some((i) => i.routeCaution) && (
                      <ul className="list-disc space-y-1 pl-5 text-sm text-ink/80">
                        {its
                          .filter((i) => i.routeCaution)
                          .map((i) => (
                            <li key={i.id}>
                              <strong>{formatDateRange(i.departDate, i.returnDate)}:</strong> {i.routeCaution}
                            </li>
                          ))}
                      </ul>
                    )}
                    {d.winterTypical && <p className="text-sm text-ink/80">{d.winterTypical} Typical January, not a forecast.</p>}
                    <p className="text-xs text-ink/60">
                      Flight links are general search or timetable pages, not dated deep links. Enter the dates yourself and
                      recheck every price.
                    </p>
                    <div className="max-w-md">
                      <VotingControls destinationId={d.id} compact />
                    </div>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>

        {list.length === 0 && (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-ink/20 p-6 text-center">
            <p>Nothing matches those filters.</p>
            <button
              className={`${btn.ghost} mt-3 !border-ink/30 !text-ink`}
              onClick={() => {
                setQuery('');
                setCategory('all');
                setConfidence('all');
              }}
            >
              Clear filters
            </button>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            className="min-h-11 rounded-xl bg-cobalt px-5 font-semibold text-white"
            onClick={() => dispatch({ type: 'go', screen: 'final' })}
          >
            See the shortlist and export it
          </button>
        </div>
      </div>
    </section>
  );
}
