'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ClipboardCopy, Crown, Printer, Share2, X } from 'lucide-react';
import Confetti from '@/components/Confetti';
import { destinationById, routeLabel } from '@/lib/catalogue';
import { formatDateRange } from '@/lib/dates';
import { formatGBP } from '@/lib/pricing';
import type { Itinerary } from '@/lib/types';
import { copy } from '../data/copy';
import { benchIds, catchesFor, featuredIds, pitchFor, segmentsOf, selectedVariant, showDestinationIds } from '../lib/cast';
import { costBreakdown } from '../lib/cost';
import { effectiveFinalists, MAX_FINALISTS, phaseHref, rankedShortlist, resultsVisible } from '../lib/state';
import { comparisonText, shortlistText, verdictFor } from '../lib/summary';
import { ProgressControls, Shell } from './Chrome';
import { useShow, useVisit } from './ShowProvider';
import { btn, DestinationPhoto, EvidenceStatus, HostLine, PriceBreakdown, RoundHeading, SourceStatus, TripFacts, TripLinks, VariantPicker } from './ui';

type SortKey = 'chosen' | 'cheapest' | 'simplest' | 'time' | 'sun' | 'culture';

const sorts: { id: SortKey; label: string }[] = [
  { id: 'chosen', label: 'In the order you chose' },
  { id: 'cheapest', label: 'Cheapest estimated starter trip' },
  { id: 'simplest', label: 'Simplest journey' },
  { id: 'time', label: 'Most time there' },
  { id: 'sun', label: 'Winter escape' },
  { id: 'culture', label: 'Cafés & culture' },
];

const routeRank: Record<Itinerary['routeType'], number> = { direct: 0, direct_plus_ground: 1, connecting: 2, unknown: 3 };

/** A sort score, or a reason the trip cannot be compared on that measure. */
function score(key: SortKey, id: string, it: Itinerary): { value: number } | { notComparable: string } {
  switch (key) {
    case 'cheapest': {
      const c = costBreakdown(it);
      return c ? { value: c.totalForTwo } : { notComparable: 'Not comparable: total unknown' };
    }
    case 'simplest':
      return it.routeType === 'unknown' ? { notComparable: 'Not comparable: route unknown' } : { value: routeRank[it.routeType] };
    case 'time':
      return it.hoursInDestination != null && it.timesConfirmed
        ? { value: -it.hoursInDestination }
        : { notComparable: 'Not comparable: flight timings not known' };
    case 'sun':
      return segmentsOf(id).includes('sun') ? { value: 0 } : { notComparable: 'Not a winter-sun option' };
    case 'culture': {
      const n = segmentsOf(id).filter((s) => s === 'food' || s === 'old').length;
      return n ? { value: -n } : { notComparable: 'Not tagged for cafés or culture' };
    }
    default:
      return { value: 0 };
  }
}

function FinalistCard({ id, note }: { id: string; note?: string }) {
  const { state, dispatch } = useShow();
  const d = destinationById[id];
  const it = selectedVariant(id, state.preferredItineraryIds[id]);
  if (!d || !it) return null;
  const c = costBreakdown(it);
  const winner = state.winnerDestinationId === id;
  const verdict = verdictFor(state, id);
  return (
    <article
      aria-labelledby={`final-${id}`}
      className={`gb-paper gb-print-plain flex flex-col overflow-hidden rounded-3xl shadow-2xl ${winner ? 'ring-4 ring-gb-gold' : ''}`}
    >
      <div className="relative">
        <DestinationPhoto id={id} className="aspect-[16/10]" sizes="(max-width: 768px) 100vw, 400px" />
        {winner && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gb-gold px-3 py-1 text-sm font-bold text-gb-black">
            <Crown aria-hidden className="size-4" /> Your winner
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <h2 id={`final-${id}`} className="gb-display text-3xl text-gb-navy">
            {d.name}
          </h2>
          <p className="text-sm opacity-80">
            {d.country}
            {verdict && ` · ${verdict}`}
          </p>
          {note && <p className="mt-1 inline-block rounded bg-gb-black/10 px-2 py-0.5 text-xs font-semibold">{note}</p>}
        </div>
        <p className="font-serif italic">{pitchFor(id)}</p>

        <div className="rounded-2xl bg-gb-navy p-4 text-gb-paper">
          {c ? (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-gb-gold">Estimated total for two</p>
              <p className="gb-display text-4xl tabular-nums">{formatGBP(c.totalForTwo, { pence: true })}</p>
              <p className="text-sm">
                {formatGBP(c.perPerson, { pence: true })} per person · return flight {formatGBP(c.flightsPerPerson, { pence: true })} per adult
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-gb-gold">Flights unpriced</p>
              <p className="gb-display text-4xl">Total unknown</p>
              <p className="text-sm">
                Hotel only: {it.roomForTwoGBP != null ? `${formatGBP(it.roomForTwoGBP, { pence: true })} for two, whole stay` : 'no quote recorded'}
              </p>
            </>
          )}
          <SourceStatus className="mt-2 text-gb-paper/85" />
        </div>

        <VariantPicker id={id} />
        <TripFacts it={it} />
        <EvidenceStatus it={it} />
        {c && (
          <details className="text-sm">
            <summary className="flex min-h-11 cursor-pointer items-center font-bold">Price breakdown and what is left out</summary>
            <PriceBreakdown it={it} />
          </details>
        )}

        <div className="text-sm">
          <h3 className="font-bold text-gb-teal">Why this could win</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {d.highlights.slice(0, 3).map((h) => (
              <li key={h}>{h}</li>
            ))}
            {d.winterTypical && <li>Typical January: {d.winterTypical} Not a forecast.</li>}
          </ul>
        </div>
        <div className="text-sm">
          <h3 className="font-bold text-gb-tomato">What’s the catch</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {catchesFor(id, it).map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-bold">Recheck price and timings before booking</h3>
          <TripLinks it={it} />
        </div>

        <div className="gb-no-print mt-auto flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            className={winner ? btn.gold : btn.primary}
            aria-pressed={winner}
            onClick={() => dispatch({ type: 'setWinner', destinationId: winner ? undefined : id })}
          >
            {winner ? (
              <>
                <Check aria-hidden className="size-5" /> Our winner
              </>
            ) : (
              'Choose as our winner'
            )}
          </button>
          <button type="button" className={btn.ghostInk} onClick={() => dispatch({ type: 'toggleFinalist', destinationId: id })}>
            <X aria-hidden className="size-4" /> Remove
          </button>
        </div>
      </div>
    </article>
  );
}

function Certificate({ id }: { id: string }) {
  const { state, reduceMotion } = useShow();
  const d = destinationById[id];
  const it = selectedVariant(id, state.preferredItineraryIds[id]);
  const [burst, setBurst] = useState(0);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    setBurst((b) => b + 1);
    ref.current?.focus();
  }, [id]);
  if (!d || !it) return null;
  const c = costBreakdown(it);
  return (
    <section ref={ref} tabIndex={-1} aria-labelledby="certificate" className="gb-certificate gb-print-plain relative overflow-hidden rounded-3xl p-6 text-center outline-none sm:p-10">
      {!reduceMotion && <Confetti burstKey={burst} />}
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-gb-teal">{copy.channel}</p>
      <h2 id="certificate" className="gb-display mt-3 text-3xl leading-tight text-gb-navy sm:text-5xl">
        {copy.final.certificate}
      </h2>
      <p className="mt-6 text-sm font-bold uppercase tracking-widest">Winner</p>
      <p className="gb-display mt-1 text-5xl text-gb-tomato [text-shadow:3px_3px_0_var(--color-gb-gold)] sm:text-7xl">{d.name}</p>
      <p className="mt-4 text-lg">
        {formatDateRange(it.departDate, it.returnDate)} 2027 · {it.nights} nights · {it.departureAirport} → {it.arrivalAirport} ({routeLabel[it.routeType]})
      </p>
      <p className="mt-1 text-lg font-bold">
        {c ? `${formatGBP(c.totalForTwo, { pence: true })} for two, indicative` : 'Total unknown: flights still to be priced'}
      </p>
      <p className="mx-auto mt-4 max-w-lg text-xs">
        Indicative estimate as researched 23 October 2026. Not a booking, a held fare or a live price. Recheck everything before you pay.
      </p>
      <p className="gb-display mt-4 text-sm tracking-widest text-gb-tomato">{copy.series}</p>
    </section>
  );
}

export default function FinalComparison() {
  const { state, dispatch } = useShow();
  useVisit('grand_final');
  const finalists = effectiveFinalists(state);
  const [sort, setSort] = useState<SortKey>('chosen');
  const [copied, setCopied] = useState('');
  const visible = resultsVisible(state);
  const ranked = rankedShortlist(state);
  const pool = (visible ? [...ranked, ...featuredIds, ...state.ballotExtraIds] : [...featuredIds, ...state.unlockedDestinationIds]).filter(
    (id, i, a) => a.indexOf(id) === i,
  );
  const others = showDestinationIds.filter((id) => !pool.includes(id)).sort((a, b) => benchIds.indexOf(a) - benchIds.indexOf(b));

  const scored = finalists.map((id, i) => {
    const it = selectedVariant(id, state.preferredItineraryIds[id])!;
    return { id, i, s: score(sort, id, it) };
  });
  const ordered =
    sort === 'chosen'
      ? scored
      : [...scored].sort((a, b) => {
          const av = 'value' in a.s ? a.s.value : Infinity;
          const bv = 'value' in b.s ? b.s.value : Infinity;
          return av - bv || a.i - b.i;
        });

  const priced = finalists
    .map((id) => ({ id, c: costBreakdown(selectedVariant(id, state.preferredItineraryIds[id])) }))
    .filter((x) => x.c)
    .sort((a, b) => a.c!.totalForTwo - b.c!.totalForTwo);
  const max = Math.max(1, ...priced.map((p) => p.c!.totalForTwo));

  const toClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(`${label} copied to the clipboard.`);
    } catch {
      setCopied('Could not copy on this browser.');
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title: 'The Great British Getaway Show: our shortlist', text: visible ? shortlistText(state) : comparisonText(state, finalists) });
    } catch {
      // Cancelled or unsupported. Copy is still there.
    }
  };

  return (
    <Shell phase="grand_final">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:py-10">
        <RoundHeading title={copy.final.title}>
          <HostLine>{copy.final.intro}</HostLine>
        </RoundHeading>

        {state.winnerDestinationId && finalists.includes(state.winnerDestinationId) && <Certificate id={state.winnerDestinationId} />}

        <section aria-labelledby="pick" className="gb-no-print space-y-3">
          <h2 id="pick" className="font-bold">
            Finalists ({finalists.length} of up to {MAX_FINALISTS})
          </h2>
          {!visible && (
            <p className="text-sm text-gb-paper/80">No results have been revealed, so nothing is pre-selected and no votes are shown. Pick any destinations.</p>
          )}
          <div className="flex flex-wrap gap-2">
            {pool.map((id) => {
              const on = finalists.includes(id);
              const v = verdictFor(state, id);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  disabled={!on && finalists.length >= MAX_FINALISTS}
                  onClick={() => dispatch({ type: 'toggleFinalist', destinationId: id })}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-gb-paper/30 px-3 py-1 text-sm transition hover:border-gb-paper aria-pressed:border-gb-gold aria-pressed:bg-gb-gold aria-pressed:text-gb-black disabled:opacity-40"
                >
                  {on && <Check aria-hidden className="size-4" />}
                  {destinationById[id].name}
                  {v && <span className="text-xs opacity-80">· {v}</span>}
                </button>
              );
            })}
          </div>
          {others.length > 0 && finalists.length < MAX_FINALISTS && (
            <label className="block max-w-sm text-sm">
              Add another destination
              <select
                value=""
                onChange={(e) => e.target.value && dispatch({ type: 'toggleFinalist', destinationId: e.target.value })}
                className="mt-1 block min-h-11 w-full rounded-xl border border-gb-paper/30 bg-gb-black px-3 text-base text-gb-paper"
              >
                <option value="">Choose…</option>
                {others.map((id) => (
                  <option key={id} value={id}>
                    {destinationById[id].name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </section>

        {finalists.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-gb-paper/30 p-6 text-center text-gb-paper/85">
            No finalists yet. Choose up to three destinations above to compare them side by side.
          </p>
        ) : (
          <>
            <div className="gb-no-print flex flex-wrap items-end gap-4">
              <label className="text-sm">
                Rank the finalists by
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="mt-1 block min-h-11 rounded-xl border border-gb-paper/30 bg-gb-black px-3 text-base text-gb-paper"
                >
                  {sorts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="pb-3 text-xs text-gb-paper/75">This only reorders the cards. You still choose the winner.</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {ordered.map(({ id, s }) => (
                <FinalistCard key={id} id={id} note={'notComparable' in s ? s.notComparable : undefined} />
              ))}
            </div>

            {priced.length > 0 && (
              <section aria-labelledby="cheap-dear" className="gb-pinstripe gb-print-plain space-y-2 rounded-3xl p-5">
                <h2 id="cheap-dear" className="gb-display text-xl text-gb-tomato">
                  Cheap to dear
                </h2>
                <ol className="space-y-1.5">
                  {priced.map((p) => (
                    <li key={p.id} className="grid grid-cols-[6.5rem_1fr_5rem] items-center gap-2 text-sm">
                      <span className="truncate font-semibold">{destinationById[p.id].name}</span>
                      <span className="h-4 rounded bg-gb-black/10">
                        <span className="block h-4 rounded bg-gb-teal" style={{ width: `${(p.c!.totalForTwo / max) * 100}%` }} />
                      </span>
                      <span className="text-right tabular-nums">{formatGBP(p.c!.totalForTwo, { pence: true })}</span>
                    </li>
                  ))}
                </ol>
                {priced.length < finalists.length && <p className="text-xs">Finalists with an unknown total are left off this chart.</p>}
              </section>
            )}
          </>
        )}

        <section className="gb-no-print space-y-3 rounded-3xl border border-gb-paper/15 p-4 sm:p-5">
          <h2 className="font-bold">Take it with you</h2>
          <p className="text-sm text-gb-paper/80">
            Summaries list destinations, dates, prices, links and cautions. They leave out nicknames and who voted what. Nothing syncs between devices.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn.teal} onClick={() => window.print()}>
              <Printer aria-hidden className="size-5" /> Print / save as PDF
            </button>
            <button type="button" className={btn.ghost} disabled={finalists.length === 0} onClick={() => toClipboard(comparisonText(state, finalists), 'Comparison')}>
              <ClipboardCopy aria-hidden className="size-4" /> Copy comparison
            </button>
            <button type="button" className={btn.ghost} disabled={!visible} onClick={() => toClipboard(shortlistText(state), 'Shortlist')}>
              <ClipboardCopy aria-hidden className="size-4" /> Copy the shortlist
            </button>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button type="button" className={btn.ghost} onClick={share}>
                <Share2 aria-hidden className="size-4" /> Share as text
              </button>
            )}
          </div>
          <p aria-live="polite" className="text-sm text-gb-gold">
            {copied}
          </p>
        </section>

        <div className="gb-no-print flex flex-wrap items-center gap-4">
          <Link href="/getaway-show/holidays" className={btn.gold}>
            {copy.table}
          </Link>
          {visible && (
            <Link href={phaseHref.results} className={btn.link}>
              Back to the results
            </Link>
          )}
        </div>

        <ProgressControls previous={phaseHref.results} />
      </div>
    </Shell>
  );
}
