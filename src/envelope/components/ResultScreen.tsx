'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleCheck, CircleHelp } from 'lucide-react';
import Photo from '@/components/Photo';
import assumptions from '@/data/assumptions.json';
import { destinationById } from '@/lib/catalogue';
import { formatDate, formatDateRange } from '@/lib/dates';
import { decisionsTaken } from '../lib/engine';
import { devViewEnabled } from '../lib/dev';
import { practicalLines, practicalNotes, segmentDates } from '../lib/practical';
import { resultCopy, type MatchCopy } from '../lib/summary';
import type { ShortlistOption } from '../lib/types';
import { btn, COMPARE_ALL_HREF } from './Chrome';
import { useEnvelope } from './EnvelopeProvider';

/** The segment with the most nights that has a photo in the shared data. */
function photoFor(o: ShortlistOption) {
  const seg = [...o.segments].filter((s) => s.destinationId && destinationById[s.destinationId]).sort((a, b) => b.nights - a.nights)[0];
  const d = seg?.destinationId ? destinationById[seg.destinationId] : undefined;
  return { src: d?.imagePath, name: seg?.name ?? o.name, country: d?.country };
}

function TripPhoto({ o, className = '' }: { o: ShortlistOption; className?: string }) {
  const p = photoFor(o);
  return <Photo src={p.src} name={p.name} country={p.country} className={className} sizes="(min-width: 768px) 720px, 100vw" showCredit />;
}

function Practical({ o }: { o: ShortlistOption }) {
  const lines = practicalLines(o);
  const dates = segmentDates(o);
  return (
    <div className="space-y-3">
      <p className="text-sm">
        Suggested dates: {o.segments.map((s, i) => `${s.name} ${formatDateRange(dates[i].start, dates[i].end)}`).join(', then ')} 2027.
      </p>
      <ul className="space-y-2 text-sm">
        {lines.map((l, i) => (
          <li key={i} className="flex gap-2">
            {l.status === 'researched' ? (
              <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-[#2f6f4f]" />
            ) : (
              <CircleHelp aria-hidden className="mt-0.5 size-4 shrink-0 text-en-rust" />
            )}
            <span>
              <span className="font-semibold">{l.label}</span>{' '}
              <span className="rounded bg-en-fold px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                {l.status === 'researched' ? 'Researched' : 'Unconfirmed'}
              </span>
              <span className="block">{l.text}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-en-ink/80">
        Researched on {formatDate(assumptions.pricesObservedOn)} 2026 for {assumptions.sourceWorkbook}. Prices and timetables change. Nothing is reserved;
        recheck everything before booking.
      </p>
    </div>
  );
}

function MatchCard({ m, label }: { m: MatchCopy; label: string }) {
  const o = m.option;
  return (
    <article className="en-paper overflow-hidden rounded-sm" aria-labelledby={`match-${o.id}`}>
      <TripPhoto o={o} className="aspect-[16/9] w-full" />
      <div className="space-y-5 px-5 py-6 sm:px-8 sm:py-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-en-rust">{label}</p>
          <h2 id={`match-${o.id}`} className="mt-1 font-serif text-3xl italic leading-tight sm:text-4xl">
            {o.name}
          </h2>
          <p className="mt-1 font-semibold">{o.split}</p>
        </header>
        <div className="space-y-2">
          <p className="font-serif text-lg leading-snug">{m.suggests}</p>
          {m.chooseIf && <p className="font-semibold">{m.chooseIf}</p>}
          {m.reasons.length > 0 && (
            <>
              <p className="text-sm font-semibold">From the story:</p>
              <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
                {m.reasons.map((r) => (
                  <li key={`${r.scene.id}.${r.choice.id}`}>{r.choice.recap}</li>
                ))}
              </ul>
            </>
          )}
        </div>
        <section>
          <h3 className="font-serif text-xl italic">How it could feel</h3>
          <p className="mt-1 leading-relaxed">{o.feel}</p>
        </section>
        <section>
          <h3 className="font-serif text-xl italic">In January</h3>
          <p className="mt-1 leading-relaxed">{o.january} This describes a typical January, not a forecast.</p>
        </section>
        <section>
          <h3 className="font-serif text-xl italic">The main compromise</h3>
          <p className="mt-1 leading-relaxed">{o.compromise}</p>
        </section>
        <details className="rounded-xl border-2 border-en-ink/15 px-4">
          <summary className="min-h-11 cursor-pointer py-3 font-semibold">Practical details</summary>
          <div className="pb-4">
            <Practical o={o} />
          </div>
        </details>
      </div>
    </article>
  );
}

function Compare({ a, b }: { a: ShortlistOption; b: ShortlistOption }) {
  const rows: [string, (o: ShortlistOption) => React.ReactNode][] = [
    ['Nights', (o) => o.split],
    ['How it could feel', (o) => o.feel],
    ['In January', (o) => o.january],
    ['The main compromise', (o) => o.compromise],
    [
      'Practical',
      (o) => {
        const l = practicalLines(o);
        const known = l.filter((x) => x.status === 'researched').length;
        return `${known} researched detail${known === 1 ? '' : 's'}, ${l.length - known} unconfirmed.`;
      },
    ],
  ];
  return (
    <section className="en-paper rounded-sm px-5 py-6 sm:px-8" aria-labelledby="compare-heading">
      <h2 id="compare-heading" className="font-serif text-2xl italic">
        Side by side
      </h2>
      <div className="mt-4 hidden sm:block">
        <table className="w-full table-fixed text-left text-sm">
          <caption className="sr-only">
            {a.name} compared with {b.name}
          </caption>
          <thead>
            <tr className="border-b-2 border-en-ink/20">
              <th scope="col" className="w-32 py-2 pr-3" />
              {[a, b].map((o) => (
                <th key={o.id} scope="col" className="py-2 pr-3 font-serif text-lg italic">
                  {o.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, f]) => (
              <tr key={label} className="border-b border-en-ink/10 align-top">
                <th scope="row" className="py-3 pr-3 font-semibold">
                  {label}
                </th>
                <td className="py-3 pr-3 leading-relaxed">{f(a)}</td>
                <td className="py-3 pr-3 leading-relaxed">{f(b)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* On a phone, one row at a time with both trips under it. */}
      <dl className="mt-4 space-y-4 sm:hidden">
        {rows.map(([label, f]) => (
          <div key={label} className="border-b border-en-ink/10 pb-3">
            <dt className="font-semibold">{label}</dt>
            {[a, b].map((o) => (
              <dd key={o.id} className="mt-1 text-sm leading-relaxed">
                <span className="font-serif italic">{o.name}:</span> {f(o)}
              </dd>
            ))}
          </div>
        ))}
      </dl>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {[a, b].map((o) => (
          <details key={o.id} className="rounded-xl border-2 border-en-ink/15 px-4">
            <summary className="min-h-11 cursor-pointer py-3 font-semibold">Practical details: {o.name}</summary>
            <div className="pb-4">
              <Practical o={o} />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

export default function ResultScreen() {
  const { state, dispatch, story } = useEnvelope();
  const copy = useMemo(() => resultCopy(story.trail), [story.trail]);
  const [comparing, setComparing] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const compareRef = useRef<HTMLDivElement>(null);
  const { rec } = copy;
  const shown = copy.matches.map((m) => m.option);
  const other = copy.runnerUp?.option ?? copy.matches[1]?.option;
  const notes = practicalNotes(state.practical, rec.ranked, copy.runnerUp ? [rec.top, rec.runnerUp] : shown);
  const decisions = decisionsTaken(story);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    heading.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (comparing) compareRef.current?.scrollIntoView({ block: 'start' });
  }, [comparing]);

  return (
    <div className="en-fade space-y-8">
      <header className="space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-en-lamp">Your map, read back to you</p>
        <h1 ref={heading} tabIndex={-1} className="font-serif text-4xl italic leading-tight outline-none sm:text-5xl">
          Where your map points
        </h1>
        <p className="mx-auto max-w-lg text-en-mist">This is a suggestion drawn from the choices you made in the story. You know things about yourself that it does not.</p>
      </header>

      {copy.closeNote && (
        <p className="rounded-2xl border border-en-lamp/50 bg-en-lamp/10 px-4 py-3 leading-relaxed" role="note">
          {copy.closeNote}
        </p>
      )}

      {copy.matches.map((m, i) => (
        <MatchCard key={m.option.id} m={m} label={copy.matches.length > 1 ? `Credible match ${i + 1} of 2` : 'Best match'} />
      ))}

      {copy.runnerUp && (
        <section className="rounded-2xl border-2 border-en-paper/20 px-5 py-6 sm:px-8" aria-labelledby="runner-up">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-en-lamp">Runner-up</p>
          <h2 id="runner-up" className="mt-1 font-serif text-2xl italic sm:text-3xl">
            {copy.runnerUp.option.name}
          </h2>
          <p className="font-semibold text-en-mist">{copy.runnerUp.option.split}</p>
          <p className="mt-3 leading-relaxed">{copy.runnerUp.sentence}</p>
          {copy.runnerUp.evidence && <p className="mt-2 text-sm leading-relaxed text-en-mist">One of your choices already leaned that way. {copy.runnerUp.evidence.choice.recap}</p>}
        </section>
      )}

      {notes.length > 0 && (
        <section className="rounded-2xl border-2 border-en-sea/40 px-5 py-5 sm:px-8" aria-labelledby="practical-notes">
          <h2 id="practical-notes" className="font-serif text-xl italic">
            From your practical check
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-en-mist">These notes do not change the story’s suggestion.</p>
        </section>
      )}

      <div className="en-no-print flex flex-wrap gap-3">
        {other && (
          <button type="button" className={btn.primary} aria-expanded={comparing} aria-controls="compare" onClick={() => setComparing((c) => !c)}>
            {comparing ? 'Hide the comparison' : 'Compare the top two'}
          </button>
        )}
        <button type="button" className={btn.ghost} onClick={() => dispatch({ type: 'practical' })}>
          {Object.keys(state.practical).length ? 'Change practical answers' : 'Answer the practical check'}
        </button>
      </div>

      <div id="compare" ref={compareRef} className="scroll-mt-20">
        {comparing && other && <Compare a={copy.matches[0].option} b={other} />}
      </div>

      <section className="rounded-2xl border border-en-paper/15 px-5 py-5 sm:px-8" aria-labelledby="revisit">
        <details>
          <summary className="min-h-11 cursor-pointer py-2">
            <h2 id="revisit" className="inline font-serif text-xl italic">
              Revisit a choice
            </h2>
          </summary>
          <p className="mt-1 text-sm text-en-mist">Going back to a decision clears everything after it. The story continues from there.</p>
          <ol className="mt-3 space-y-2">
            {decisions.map(({ index, entry }) => (
              <li key={index} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-en-paper/10 pb-2 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block text-xs uppercase tracking-wider text-en-lamp">
                    {entry.scene.when} · {entry.scene.place}
                  </span>
                  {entry.choice.recap}
                </span>
                <button type="button" className={btn.link} onClick={() => dispatch({ type: 'revisit', index })}>
                  Change this
                </button>
              </li>
            ))}
          </ol>
        </details>
      </section>

      <div className="en-no-print flex flex-wrap items-center gap-x-6 gap-y-2">
        <button
          type="button"
          className={btn.ghost}
          onClick={() => {
            if (window.confirm('Play the story again from the first night? Your choices will be cleared.')) dispatch({ type: 'restart' });
          }}
        >
          Replay the story
        </button>
        <Link href={COMPARE_ALL_HREF} className={btn.link}>
          Compare every holiday
        </Link>
        <Link href="/" className={btn.link}>
          Back to all games
        </Link>
        {devViewEnabled && (
          <Link href="/the-envelope/dev" className={`${btn.link} text-en-sea`}>
            How each decision counted (development view)
          </Link>
        )}
      </div>
    </div>
  );
}
