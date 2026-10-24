'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ClipboardCopy, Crown, Download, Share2 } from 'lucide-react';
import Photo from '@/components/Photo';
import { destinationById, evidenceLabel } from '@/lib/catalogue';
import { formatGBP } from '@/lib/pricing';
import { copy } from '../data/copy';
import { selectedVariant, variantsFor } from '../lib/cast';
import { costBreakdown } from '../lib/cost';
import { ballot, effectiveFinalists, MAX_FINALISTS, resultsReady } from '../lib/state';
import { finalistRows, summaryCsv, summaryText, verdictFor } from '../lib/summary';
import { useShow } from './BlindFlightProvider';
import { Shell } from './Chrome';
import { AwkwardBit, TripFacts } from './ContestantScreen';
import { Breakdown, PendingFacts } from './Price';
import { btn, Provenance, TripLinks } from './ui';
import { formatDateRange } from '@/lib/dates';

function FinalistCard({ id }: { id: string }) {
  const { state, dispatch } = useShow();
  const d = destinationById[id];
  const it = selectedVariant(id, state.preferredItineraryByDestination[id]);
  if (!d || !it) return null;
  const c = costBreakdown(it);
  const winner = state.winnerDestinationId === id;
  const verdict = verdictFor(state, id);
  const variants = variantsFor(id);
  return (
    <article
      aria-labelledby={`final-${id}`}
      className={`bf-paper flex w-[86vw] max-w-sm shrink-0 snap-center flex-col overflow-hidden rounded-3xl shadow-2xl sm:w-auto sm:max-w-none ${
        winner ? 'ring-4 ring-bf-custard' : ''
      }`}
    >
      <div className="relative">
        <Photo src={d.imagePath} name={d.name} country={d.country} className="aspect-[16/10]" sizes="(max-width: 640px) 86vw, 400px" showCredit />
        {winner && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-bf-custard px-3 py-1 text-sm font-bold text-bf-ink">
            <Crown aria-hidden className="size-4" /> Our winner
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <h2 id={`final-${id}`} className="bf-display text-3xl text-bf-red">
            {d.name}
          </h2>
          <p className="text-sm opacity-80">
            {d.country}
            {verdict && ` · ${verdict}`}
          </p>
        </div>

        <div className="rounded-2xl bg-bf-navy p-4 text-bf-cream">
          {c ? (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-bf-seafoam">Estimated total for two</p>
              <p className="font-bf-display text-4xl text-bf-custard">{formatGBP(c.headline)}</p>
              <p className="text-sm">{formatGBP(c.perPerson, { pence: true })} per person</p>
            </>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-bf-seafoam">{evidenceLabel[it.fareEvidence]}</p>
              <p className="text-xl font-bold">Price pending — flights not yet priced</p>
            </>
          )}
          <p className="mt-1 text-xs text-bf-cream/75">Indicative quote dated 23 Oct 2026</p>
        </div>

        {variants.length > 1 && (
          <label className="text-sm font-bold">
            Preferred dates
            <select
              value={it.id}
              onChange={(e) => dispatch({ type: 'chooseItinerary', destinationId: id, itineraryId: e.target.value })}
              className="mt-1 block min-h-11 w-full rounded-xl border-2 border-bf-ink/20 bg-white px-3 font-normal"
            >
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nights} nights · {formatDateRange(v.departDate, v.returnDate)} · {v.departureAirport}
                  {costBreakdown(v) ? '' : ' · price pending'}
                </option>
              ))}
            </select>
          </label>
        )}

        <TripFacts it={it} />
        {c ? (
          <details>
            <summary className="flex min-h-11 cursor-pointer items-center font-bold">Price breakdown</summary>
            <Breakdown it={it} />
          </details>
        ) : (
          <PendingFacts it={it} />
        )}

        {d.winterTypical && (
          <p className="text-sm">
            <strong>Typical January:</strong> {d.winterTypical} <span className="opacity-70">Not a forecast.</span>
          </p>
        )}
        {d.highlights.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {d.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        )}
        <AwkwardBit id={id} it={it} ink />
        <TripLinks it={it} ink />

        <div className="mt-auto flex flex-wrap gap-2 pt-2">
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
              'Select our winner'
            )}
          </button>
          <button type="button" className={btn.ghostInk} onClick={() => dispatch({ type: 'toggleFinalist', destinationId: id })}>
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}

export default function CompareScreen() {
  const { state, dispatch } = useShow();
  const finalists = effectiveFinalists(state);
  const ready = resultsReady(state);
  const [copied, setCopied] = useState<'idle' | 'copied' | 'failed'>('idle');
  const rows = finalistRows(state, finalists);
  const pool = ballot(state);
  const winner = state.winnerDestinationId ? destinationById[state.winnerDestinationId] : undefined;

  const toggle = (id: string) => {
    if (state.finalists.length === 0 && finalists.length > 0) dispatch({ type: 'setFinalists', ids: finalists });
    dispatch({ type: 'toggleFinalist', destinationId: id });
  };

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText(rows));
      setCopied('copied');
    } catch {
      setCopied('failed');
    }
  };
  const doShare = async () => {
    try {
      await navigator.share({ title: 'Blind Flight: our finalists', text: summaryText(rows) });
    } catch {
      // Cancelled or unsupported. Copy is still there.
    }
  };
  const download = () => {
    const blob = new Blob([summaryCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blind-flight-finalists.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Shell>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:py-12">
        <section className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-bf-seafoam">The grand final</p>
          <h1 className="bf-logo text-4xl sm:text-5xl">{copy.comparison}</h1>
          <p className="max-w-2xl font-serif text-lg italic text-bf-custard">{copy.grandFinal}</p>
          {winner && (
            <p className="inline-flex items-center gap-2 rounded-full bg-bf-custard px-4 py-2 font-bold text-bf-ink">
              <Crown aria-hidden className="size-5" /> Winner: {winner.name}
            </p>
          )}
        </section>

        <section aria-labelledby="pick" className="space-y-3">
          <h2 id="pick" className="font-bold">
            Finalists ({finalists.length} of up to {MAX_FINALISTS})
          </h2>
          {!ready && (
            <p className="text-sm text-bf-cream/80">
              The show isn’t finished, so nothing is pre-selected and no choices are shown here. Pick any contestants to compare.
            </p>
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
                  onClick={() => toggle(id)}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-bf-cream/30 px-3 py-1 text-sm transition hover:border-bf-cream aria-pressed:border-bf-custard aria-pressed:bg-bf-custard aria-pressed:text-bf-ink disabled:opacity-40"
                >
                  {on && <Check aria-hidden className="size-4" />}
                  {destinationById[id].name}
                  {v && <span className="text-xs opacity-75">· {v}</span>}
                </button>
              );
            })}
          </div>
        </section>

        {finalists.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-bf-cream/30 p-6 text-center text-bf-cream/85">
            No finalists yet. Choose two to four contestants above to compare them side by side.
          </p>
        ) : (
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
            {finalists.map((id) => (
              <FinalistCard key={id} id={id} />
            ))}
          </div>
        )}

        <Provenance />

        <section className="space-y-3 rounded-3xl border border-bf-cream/15 p-4 sm:p-5">
          <h2 className="font-bold">Take it with you</h2>
          <p className="text-sm text-bf-cream/75">The summary lists destinations, dates, prices, links and cautions. It leaves out your nicknames.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn.sea} onClick={doCopy} disabled={rows.length === 0}>
              <ClipboardCopy aria-hidden className="size-4" /> Copy summary
            </button>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button type="button" className={btn.ghost} onClick={doShare} disabled={rows.length === 0}>
                <Share2 aria-hidden className="size-4" /> Share
              </button>
            )}
            <button type="button" className={btn.ghost} onClick={download} disabled={rows.length === 0}>
              <Download aria-hidden className="size-4" /> Download CSV
            </button>
          </div>
          <p aria-live="polite" className="text-sm text-bf-seafoam">
            {copied === 'copied' ? 'Copied to the clipboard.' : copied === 'failed' ? 'Could not copy. Try the CSV instead.' : ''}
          </p>
        </section>

        <div className="flex flex-wrap gap-x-6">
          <Link href="/blind-flight/holidays" className={btn.link}>
            View all holidays
          </Link>
          <Link href={ready ? '/blind-flight/results' : '/blind-flight/show'} className={btn.link}>
            Edit preferences
          </Link>
          <button
            type="button"
            className={btn.link}
            onClick={() => {
              if (window.confirm('Clear every choice and finalist and start the show again?')) dispatch({ type: 'reset' });
            }}
          >
            Restart
          </button>
        </div>
      </div>
    </Shell>
  );
}
