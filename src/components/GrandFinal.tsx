'use client';

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ClipboardCopy, Crown, Download, RotateCcw, Share2, Snowflake, Sparkle, TriangleAlert, Columns3 } from 'lucide-react';
import { useGame } from './GameContext';
import { destinations, destinationById, hasPrice, selectedItinerary, routeLabel, evidenceLabel } from '@/lib/catalogue';
import { formatDateRange } from '@/lib/dates';
import { formatGBP, perPerson } from '@/lib/pricing';
import { shortlistCsv, shortlistRows, shortlistText } from '@/lib/exportShortlist';
import type { Destination, Itinerary } from '@/lib/types';
import Photo from './Photo';
import VotingControls from './VotingControls';
import ItineraryPicker from './ItineraryPicker';
import { BookingLinks, FlightFacts, PriceBreakdown, ProvenanceLine } from './TripDetails';
import { btn, HostLine, Provenance } from './ui';

type Sort = 'cost' | 'show' | 'hotel';

export default function GrandFinal() {
  const { state, dispatch } = useGame();
  const [sort, setSort] = useState<Sort>('cost');
  const [compare, setCompare] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [toast, setToast] = useState('');

  const withIt = (d: Destination) => ({ d, it: selectedItinerary(d, state.itineraryChoice[d.id]) });
  const byDecision = (k: string) => destinations.filter((d) => state.decisions[d.id] === k).map(withIt);

  const kept = useMemo(() => {
    const list = byDecision('keep');
    const order = destinations.map((d) => d.id);
    return list.sort((a, b) => {
      if (sort === 'cost') return (a.it.estimatedTotalForTwoGBP ?? Infinity) - (b.it.estimatedTotalForTwoGBP ?? Infinity);
      if (sort === 'hotel') return (b.it.hotelReviewOutOf10 ?? 0) - (a.it.hotelReviewOutOf10 ?? 0);
      return order.indexOf(a.d.id) - order.indexOf(b.d.id);
    });
  }, [state.decisions, state.itineraryChoice, sort]);
  const maybes = byDecision('maybe');
  const binned = byDecision('bin');

  const rows = shortlistRows(state);
  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 2500);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shortlistText(rows));
      flash('Shortlist copied to the clipboard.');
    } catch {
      flash('Copy failed. Try Download CSV instead.');
    }
  };
  const download = () => {
    const blob = new Blob([shortlistCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'great-january-getaway-shortlist.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  const share = async () => {
    try {
      await navigator.share({ title: 'The Great January Getaway: our shortlist', text: shortlistText(rows) });
    } catch {
      /* cancelled */
    }
  };
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const toggleCompare = (id: string) =>
    setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 4 ? c : [...c, id]));
  const compared = compare.filter((id) => state.decisions[id] === 'keep').map((id) => withIt(destinationById[id]));
  const winner = state.winner ? destinationById[state.winner] : null;

  return (
    <section className="pb-12">
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:pt-10">
        <p className="font-display text-xs tracking-[0.25em] text-sky">Round four</p>
        <h2 className="marquee-text text-3xl sm:text-5xl">The Grand Final</h2>
        <HostLine className="mt-3 max-w-2xl">
          One getaway will leave with our hearts. All others will remain in the spreadsheet.
        </HostLine>
        <Provenance className="mt-3 text-cream" />

        {winner && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bulbs mt-8 rounded-2xl bg-gradient-to-r from-red to-crimson p-5 text-center"
          >
            <p className="font-display text-xs tracking-widest text-gold">Tonight’s winner</p>
            <p className="marquee-text text-3xl sm:text-4xl">{winner.name}</p>
            <p className="mt-1 text-sm text-cream/90">Now go and check the real fares before anyone changes their mind.</p>
          </motion.div>
        )}
      </div>

      {/* Toolbar */}
      <div className="mx-auto mt-8 max-w-6xl px-4">
        <div className="flex flex-col gap-3 rounded-2xl bg-black/30 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-cream/80" htmlFor="final-sort">
              Sort
            </label>
            <select
              id="final-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="min-h-11 rounded-lg border border-cream/30 bg-navy px-3 text-sm"
            >
              <option value="cost">Cheapest first</option>
              <option value="hotel">Best-rated room</option>
              <option value="show">Show order</option>
            </select>
            <button
              className={btn.ghost}
              onClick={() => setShowCompare((s) => !s)}
              disabled={compared.length < 2}
              aria-pressed={showCompare}
              title={compared.length < 2 ? 'Tick at least two kept holidays to compare' : undefined}
            >
              <Columns3 aria-hidden className="size-4" /> Compare selected ({compared.length})
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className={btn.ghost} onClick={copy} disabled={rows.length === 0}>
              <ClipboardCopy aria-hidden className="size-4" /> Copy
            </button>
            <button className={btn.ghost} onClick={download} disabled={rows.length === 0}>
              <Download aria-hidden className="size-4" /> CSV
            </button>
            {canShare && (
              <button className={btn.ghost} onClick={share} disabled={rows.length === 0}>
                <Share2 aria-hidden className="size-4" /> Share
              </button>
            )}
          </div>
        </div>
        <p className="mt-2 min-h-5 text-sm text-gold" aria-live="polite">
          {toast}
        </p>
      </div>

      {/* Comparison */}
      {showCompare && compared.length >= 2 && (
        <div className="mx-auto mt-4 max-w-6xl px-4">
          <div className="overflow-x-auto rounded-2xl bg-paper text-ink">
            <table className="w-full min-w-[560px] text-left text-sm">
              <caption className="sr-only">Side-by-side comparison</caption>
              <thead>
                <tr className="border-b border-ink/15">
                  <th className="p-3" scope="col">
                    <span className="sr-only">Detail</span>
                  </th>
                  {compared.map(({ d }) => (
                    <th key={d.id} scope="col" className="p-3 font-serif text-lg">
                      {d.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="[&_th]:p-3 [&_th]:align-top [&_th]:font-semibold [&_th]:text-ink/70 [&_td]:p-3 [&_td]:align-top [&_tr]:border-b [&_tr]:border-ink/10">
                <tr>
                  <th scope="row">Total for two</th>
                  {compared.map(({ d, it }) => (
                    <td key={d.id} className="font-bold">
                      {hasPrice(it) ? formatGBP(it.estimatedTotalForTwoGBP, { pence: true }) : evidenceLabel[it.fareEvidence]}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Per person</th>
                  {compared.map(({ d, it }) => (
                    <td key={d.id}>{hasPrice(it) ? formatGBP(perPerson(it.estimatedTotalForTwoGBP), { pence: true }) : '—'}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Dates</th>
                  {compared.map(({ d, it }) => (
                    <td key={d.id}>
                      {formatDateRange(it.departDate, it.returnDate)} · {it.nights} nights
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Flights</th>
                  {compared.map(({ d, it }) => (
                    <td key={d.id}>
                      {it.departureAirport} → {it.arrivalAirport}, {routeLabel[it.routeType].toLowerCase()}
                      {it.timesConfirmed ? ', timetable times' : ', times not confirmed'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Room</th>
                  {compared.map(({ d, it }) => (
                    <td key={d.id}>
                      {it.hotelName ?? '—'}
                      {it.hotelReviewOutOf10 != null && ` (${it.hotelReviewOutOf10}/10)`}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Typical January</th>
                  {compared.map(({ d }) => (
                    <td key={d.id}>{d.winterTypical ?? 'Not summarised'}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Why go</th>
                  {compared.map(({ d }) => (
                    <td key={d.id}>{d.highlights.join('; ') || d.intro}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Why not</th>
                  {compared.map(({ d }) => (
                    <td key={d.id}>{d.caution}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kept */}
      <div className="mx-auto mt-6 max-w-6xl px-4">
        <h3 className="font-display text-lg tracking-wide text-gold">Kept ({kept.length})</h3>
        {kept.length === 0 ? (
          <div className="mt-3 rounded-2xl border-2 border-dashed border-cream/30 p-6 text-center">
            <p className="font-serif text-xl italic">The trophy cabinet is currently empty.</p>
            <p className="mt-2 text-sm text-cream/75">
              Keep at least one prize to see it here. You can promote a maybe below, or go back to the belt.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button className={btn.gold} onClick={() => dispatch({ type: 'go', screen: 'conveyor' })}>
                Back to the belt
              </button>
              <button className={btn.ghost} onClick={() => dispatch({ type: 'go', screen: 'sensible' })}>
                Browse the sensible list
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {kept.map(({ d, it }) => (
              <FinalCard
                key={d.id}
                d={d}
                it={it}
                isWinner={state.winner === d.id}
                comparing={compare.includes(d.id)}
                onCompare={() => toggleCompare(d.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Maybe */}
      {maybes.length > 0 && (
        <div className="mx-auto mt-10 max-w-6xl px-4">
          <h3 className="font-display text-lg tracking-wide text-gold">Still deliberating ({maybes.length})</h3>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {maybes.map(({ d, it }) => (
              <CompactRow key={d.id} d={d} it={it} />
            ))}
          </ul>
        </div>
      )}

      {/* Binned */}
      <div className="mx-auto mt-10 max-w-6xl px-4">
        <details className="rounded-2xl bg-black/25 p-4">
          <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-display text-lg tracking-wide text-cream/85">
            <RotateCcw aria-hidden className="size-4" /> Reconsider the rejected ({binned.length})
          </summary>
          {binned.length === 0 ? (
            <p className="mt-2 text-sm text-cream/70">Nothing binned yet. Remarkably generous of you.</p>
          ) : (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {binned.map(({ d, it }) => (
                <CompactRow key={d.id} d={d} it={it} />
              ))}
            </ul>
          )}
        </details>
      </div>
    </section>
  );
}

function CompactRow({ d, it }: { d: Destination; it: Itinerary }) {
  return (
    <li className="rounded-xl bg-paper p-3 text-ink">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="font-serif text-lg font-semibold">{d.name}</span>
        <span className="text-sm font-semibold">
          {hasPrice(it) ? formatGBP(it.estimatedTotalForTwoGBP) : <span className="text-ink/60">{evidenceLabel[it.fareEvidence]}</span>}
        </span>
      </div>
      <p className="mb-2 text-xs text-ink/70">
        {formatDateRange(it.departDate, it.returnDate)} · {it.nights} nights · {it.departureAirport}
      </p>
      <VotingControls destinationId={d.id} compact />
    </li>
  );
}

function FinalCard({
  d,
  it,
  isWinner,
  comparing,
  onCompare,
}: {
  d: Destination;
  it: Itinerary;
  isWinner: boolean;
  comparing: boolean;
  onCompare: () => void;
}) {
  const { dispatch, sfx } = useGame();
  return (
    <article className={`flex flex-col overflow-hidden rounded-2xl bg-paper text-ink shadow-lg ${isWinner ? 'ring-4 ring-gold' : ''}`}>
      <div className="relative">
        <Photo src={d.imagePath} name={d.name} country={d.country} className="aspect-video w-full" sizes="(max-width: 768px) 100vw, 400px" showCredit />
        {isWinner && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gold px-3 py-1 font-display text-xs text-ink">
            <Crown aria-hidden className="size-4" /> Winner
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <header className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-serif text-2xl font-semibold leading-tight">{d.name}</h4>
            <p className="text-sm text-ink/65">
              {d.country} · {d.regionOrCategory}
            </p>
          </div>
          <div className="text-right">
            {hasPrice(it) ? (
              <>
                <p className="font-display text-2xl leading-none">{formatGBP(it.estimatedTotalForTwoGBP)}</p>
                <p className="text-xs text-ink/65">for two · {formatGBP(perPerson(it.estimatedTotalForTwoGBP))} each</p>
              </>
            ) : (
              <p className="max-w-[8rem] text-sm font-semibold text-red">{evidenceLabel[it.fareEvidence]}</p>
            )}
          </div>
        </header>

        <p className="text-sm font-semibold">
          {formatDateRange(it.departDate, it.returnDate)} 2027 · {it.nights} nights
        </p>
        <ItineraryPicker
          destination={d}
          selected={it}
          tone="light"
          showPrices
          onChoose={(id) => dispatch({ type: 'chooseItinerary', destinationId: d.id, itineraryId: id })}
        />

        <FlightFacts it={it} />

        {d.winterTypical && (
          <p className="flex gap-2 text-sm">
            <Snowflake aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>
              {d.winterTypical} <span className="text-ink/55">Typical, not a forecast.</span>
            </span>
          </p>
        )}
        {d.highlights.length > 0 && (
          <ul className="space-y-1 text-sm">
            {d.highlights.map((h) => (
              <li key={h} className="flex gap-2">
                <Sparkle aria-hidden className="mt-0.5 size-3.5 shrink-0 text-mustard" />
                {h}
              </li>
            ))}
          </ul>
        )}
        <p className="flex gap-2 rounded-lg bg-red/10 p-2.5 text-sm">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-red" />
          <span>
            <strong>Reason not to: </strong>
            {d.caution}
          </span>
        </p>
        {d.repeatVisitNote && <p className="text-sm text-ink/70">Repeat trip: {d.repeatVisitNote}</p>}

        <details className="rounded-lg border border-ink/15 p-3 text-sm">
          <summary className="cursor-pointer font-semibold">Price breakdown</summary>
          <div className="mt-2 space-y-2">
            <PriceBreakdown it={it} />
            <ProvenanceLine it={it} />
          </div>
        </details>

        <BookingLinks it={it} className="text-cobalt" />

        <div className="mt-auto space-y-2 border-t border-ink/10 pt-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                dispatch({ type: 'setWinner', destinationId: isWinner ? null : d.id });
                if (!isWinner) sfx('applause');
              }}
              aria-pressed={isWinner}
              className={`inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border-2 px-3 text-sm font-semibold ${
                isWinner ? 'border-gold bg-gold text-ink' : 'border-ink/25'
              }`}
            >
              <Crown aria-hidden className="size-4" /> {isWinner ? 'Our winner' : 'Crown the winner'}
            </button>
            <label className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-ink/25 px-3 text-sm font-semibold">
              <input type="checkbox" checked={comparing} onChange={onCompare} className="size-4 accent-[#1d3fc4]" />
              Compare
            </label>
          </div>
          <VotingControls destinationId={d.id} compact />
        </div>
      </div>
    </article>
  );
}
