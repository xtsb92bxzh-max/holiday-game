'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Check, Plus, Target } from 'lucide-react';
import { destinationById } from '@/lib/catalogue';
import { boardSegments, type BoardSegmentId } from '../data/show';
import { copy } from '../data/copy';
import { benchIds, catchesFor, drawFromSegment, featuredIds, pitchFor, segmentsOf, selectedVariant } from '../lib/cast';
import { phaseHref } from '../lib/state';
import { ProgressControls, Shell } from './Chrome';
import { useShow, useVisit } from './ShowProvider';
import {
  btn,
  DestinationPhoto,
  EstimatedPrice,
  EvidenceStatus,
  HostLine,
  RoundHeading,
  SourceStatus,
  TripFacts,
  TripLinks,
  VariantPicker,
} from './ui';

const segmentColour = ['#196c73', '#f3c44e', '#c95140', '#196c73', '#f3c44e', '#c95140'];
const labelFor = (s: BoardSegmentId) => boardSegments.find((b) => b.id === s)?.label ?? s;

/** Six wedges. Decorative: the labelled buttons below are the controls. */
function Board({ active, angle, spinning }: { active?: number; angle?: number; spinning: boolean }) {
  const r = 100;
  const wedge = (i: number) => {
    const a0 = ((i * 60 - 90) * Math.PI) / 180;
    const a1 = (((i + 1) * 60 - 90) * Math.PI) / 180;
    return `M0 0 L${r * Math.cos(a0)} ${r * Math.sin(a0)} A${r} ${r} 0 0 1 ${r * Math.cos(a1)} ${r * Math.sin(a1)} Z`;
  };
  const mid = (i: number) => (((i + 0.5) * 60 - 90) * Math.PI) / 180;
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[19rem]" aria-hidden>
      <svg viewBox="-112 -112 224 224" className="size-full drop-shadow-[0_18px_30px_rgb(0_0_0/0.5)]">
        <circle r="110" fill="#141b29" />
        <circle r="106" fill="none" stroke="#f3c44e" strokeWidth="3" />
        {boardSegments.map((s, i) => (
          <path
            key={s.id}
            d={wedge(i)}
            fill={segmentColour[i]}
            stroke="#141b29"
            strokeWidth="2.5"
            opacity={active == null || active === i ? 1 : 0.45}
          />
        ))}
        {[72, 46].map((rr) => (
          <circle key={rr} r={rr} fill="none" stroke="#141b29" strokeWidth="2" opacity="0.6" />
        ))}
        {boardSegments.map((s, i) => (
          <text
            key={s.id}
            x={76 * Math.cos(mid(i))}
            y={76 * Math.sin(mid(i))}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="26"
            fontFamily="Anton, Impact, sans-serif"
            fill={i % 3 === 1 ? '#141b29' : '#fff7e6'}
          >
            {i + 1}
          </text>
        ))}
        <circle r="16" fill="#c95140" stroke="#141b29" strokeWidth="3" />
        <circle r="6" fill="#141b29" />
      </svg>
      {angle != null && (
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{ rotate: angle }}
          transition={{ duration: spinning ? 0.9 : 0.3, ease: 'easeOut' }}
        >
          <span className="absolute left-1/2 top-[14%] block h-[30%] w-1.5 -translate-x-1/2 rounded-full bg-gb-paper shadow-[0_0_0_2px_#141b29]">
            <span className="absolute -top-2 left-1/2 block size-3 -translate-x-1/2 rotate-45 bg-gb-paper" />
          </span>
        </motion.div>
      )}
    </div>
  );
}

function PrizeCard({ id }: { id: string }) {
  const { state, dispatch } = useShow();
  const d = destinationById[id];
  const it = selectedVariant(id, state.preferredItineraryIds[id]);
  if (!d || !it) return null;
  const onBallot = state.ballotExtraIds.includes(id);
  return (
    <article aria-labelledby={`prize-${id}`} className="gb-paper flex flex-col overflow-hidden rounded-3xl shadow-xl">
      <DestinationPhoto id={id} className="aspect-[16/9]" sizes="(max-width: 640px) 100vw, 420px" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 id={`prize-${id}`} className="gb-display text-3xl text-gb-navy">
            {d.name}
          </h3>
          <p className="text-sm opacity-80">{d.country}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {segmentsOf(id).map((s) => (
              <span key={s} className="rounded-full bg-gb-black/10 px-2 py-0.5 text-xs font-semibold">
                {labelFor(s)}
              </span>
            ))}
          </div>
        </div>
        <p className="font-serif italic">{pitchFor(id)}</p>
        {d.highlights.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {d.highlights.slice(0, 3).map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        )}
        <EstimatedPrice it={it} />
        <SourceStatus />
        <details className="text-sm">
          <summary className="flex min-h-11 cursor-pointer items-center font-bold">Trip details, the catch and links</summary>
          <div className="space-y-3 pb-2">
            <TripFacts it={it} />
            <EvidenceStatus it={it} />
            <ul className="list-disc space-y-1 pl-5 text-gb-tomato">
              {catchesFor(id, it).map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <VariantPicker id={id} />
            <TripLinks it={it} />
          </div>
        </details>
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            aria-pressed={onBallot}
            className={onBallot ? btn.teal : btn.primary}
            onClick={() => dispatch({ type: onBallot ? 'removeFromBallot' : 'addToBallot', destinationId: id })}
          >
            {onBallot ? (
              <>
                <Check aria-hidden className="size-5" /> On the ballot
              </>
            ) : (
              <>
                <Plus aria-hidden className="size-5" /> Add to the ballot
              </>
            )}
          </button>
          <button
            type="button"
            aria-pressed={state.bookmarks[id] === 'possible'}
            className={`${btn.ghostInk} aria-pressed:border-gb-teal aria-pressed:bg-gb-teal aria-pressed:text-gb-paper`}
            onClick={() =>
              dispatch({ type: 'bookmark', destinationId: id, bookmark: state.bookmarks[id] === 'possible' ? undefined : 'possible' })
            }
          >
            Bookmark for fare research
          </button>
        </div>
      </div>
    </article>
  );
}

export default function CategoryTarget() {
  const { state, dispatch, reduceMotion, sfx } = useShow();
  useVisit('wildcard_board');
  const [pick, setPick] = useState<{ segment: number; ids: string[] } | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [dart, setDart] = useState<{ segment: number; turns: number } | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const choose = (segment: number) => {
    setDart((d) => ({ segment, turns: d?.turns ?? 0 }));
    const seg = boardSegments[segment];
    const ids = drawFromSegment(seg.id, [...featuredIds, ...state.unlockedDestinationIds], state.seed);
    if (ids.length) dispatch({ type: 'unlock', ids });
    setPick({ segment, ids });
    sfx(ids.length ? 'mystery' : 'bin');
    requestAnimationFrame(() => resultRef.current?.focus());
  };

  const throwDart = () => {
    const segment = Math.floor(Math.random() * boardSegments.length);
    if (reduceMotion) return choose(segment);
    setDart((d) => ({ segment, turns: (d?.turns ?? 0) + 3 }));
    setSpinning(true);
    timer.current = setTimeout(() => {
      setSpinning(false);
      choose(segment);
    }, 900);
  };

  const remaining = benchIds.filter((id) => !state.unlockedDestinationIds.includes(id));
  const unlockedNotJustIn = state.unlockedDestinationIds.filter((id) => !pick?.ids.includes(id));

  return (
    <Shell phase="wildcard_board">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:py-10">
        <RoundHeading number={3} title={copy.round3.title}>
          <p className="max-w-2xl text-gb-paper/85">{copy.round3.intro}</p>
          <HostLine>{copy.round3.prize}</HostLine>
        </RoundHeading>

        <section aria-labelledby="board" className="grid items-center gap-6 md:grid-cols-[19rem_1fr]">
          <h2 id="board" className="sr-only">
            The board
          </h2>
          <Board
            active={spinning ? undefined : pick?.segment}
            angle={dart ? dart.turns * 360 + (dart.segment + 0.5) * 60 : undefined}
            spinning={spinning}
          />
          <div className="space-y-3">
            <ul className="grid gap-2 sm:grid-cols-2">
              {boardSegments.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => choose(i)}
                    disabled={spinning}
                    aria-pressed={pick?.segment === i}
                    className="flex min-h-14 w-full items-start gap-3 rounded-xl border-2 border-gb-paper/20 bg-gb-black/30 p-3 text-left transition hover:border-gb-gold aria-pressed:border-gb-gold aria-pressed:bg-gb-gold/10 disabled:opacity-60"
                  >
                    <span
                      className="gb-display grid size-9 shrink-0 place-items-center rounded-md text-lg"
                      style={{ background: segmentColour[i], color: i % 3 === 1 ? '#141b29' : '#fff7e6' }}
                    >
                      {i + 1}
                    </span>
                    <span>
                      <span className="gb-display block text-lg leading-tight">{s.label}</span>
                      <span className="block text-xs text-gb-paper/80">{s.blurb}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className={btn.gold + ' w-full sm:w-auto'} onClick={throwDart} disabled={spinning}>
              <Target aria-hidden className="size-5" /> {spinning ? 'In flight…' : 'Throw the dart'}
            </button>
            <p className="text-xs text-gb-paper/75">The dart picks a category at random. It only brings destinations on; it never removes or decides one.</p>
          </div>
        </section>

        <div ref={resultRef} tabIndex={-1} aria-live="polite" className="space-y-4 outline-none">
          {pick && (
            <>
              <h2 className="gb-display text-2xl text-gb-gold">
                {boardSegments[pick.segment].label}
                {pick.ids.length === 0 ? `: ${copy.round3.claimed}` : `: ${pick.ids.length} new arrival${pick.ids.length > 1 ? 's' : ''}`}
              </h2>
              {pick.ids.length === 0 ? (
                <p className="text-gb-paper/85">{copy.round3.claimedLine}</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {pick.ids.map((id) => (
                    <PrizeCard key={id} id={id} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {unlockedNotJustIn.length > 0 && (
          <section aria-labelledby="claimed" className="space-y-4">
            <h2 id="claimed" className="gb-display text-2xl">
              Already on stage
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {unlockedNotJustIn.map((id) => (
                <PrizeCard key={id} id={id} />
              ))}
            </div>
          </section>
        )}

        {remaining.length > 0 && (
          <details className="rounded-3xl border border-gb-paper/15 p-4">
            <summary className="flex min-h-11 cursor-pointer items-center gap-2 gb-display text-xl">More destinations ({remaining.length})</summary>
            <p className="mt-2 text-sm text-gb-paper/80">Every other destination with an eligible trip. Priced first, cheapest first; then unpriced.</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {remaining.map((id) => {
                const it = selectedVariant(id, state.preferredItineraryIds[id]);
                const total = it?.estimatedTotalForTwoGBP;
                return (
                  <li key={id} className="flex items-center justify-between gap-2 rounded-xl bg-gb-black/30 px-3 py-2">
                    <span>
                      <span className="block font-semibold">{destinationById[id].name}</span>
                      <span className="block text-xs text-gb-paper/75">{total != null ? `£${Math.round(total)} for two` : 'Total unknown'}</span>
                    </span>
                    <button type="button" className={btn.ghost} onClick={() => dispatch({ type: 'unlock', ids: [id] })}>
                      Bring on
                    </button>
                  </li>
                );
              })}
            </ul>
          </details>
        )}

        <div className="flex justify-end">
          <Link href={phaseHref.ballots} className={btn.gold}>
            On to the vote
          </Link>
        </div>

        <ProgressControls previous={phaseHref.higher_lower} skip={phaseHref.ballots} />
      </div>
    </Shell>
  );
}
