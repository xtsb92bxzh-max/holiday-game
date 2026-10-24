'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bookmark as BookmarkIcon, Eye, EyeOff, Sparkles } from 'lucide-react';
import credits from '@/data/imageCredits.json';
import { destinationById } from '@/lib/catalogue';
import type { ImageCredit } from '@/lib/types';
import { contestants } from '../data/contestants';
import { copy } from '../data/copy';
import { groupOf, pitchFor, selectedVariant } from '../lib/cast';
import { costBreakdown } from '../lib/cost';
import { phaseHref, revealOrder, studioPoints, type Bookmark } from '../lib/state';
import { ProgressControls, Shell } from './Chrome';
import { useShow, useVisit } from './ShowProvider';
import { btn, Catches, EstimatedPrice, EvidenceStatus, HostLine, NoInfluence, RoundHeading, SourceStatus, TripFacts, VariantPicker } from './ui';

const TILES = 9;
const OPEN_PER_STEP = [0, 3, 6];

function hash(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h;
}

/** A fixed, per-destination order in which tiles flip away. */
function tileOrder(id: string): number[] {
  const order = Array.from({ length: TILES }, (_, i) => i);
  let h = hash(id);
  for (let i = order.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

function PictureBoard({ id, step, revealed }: { id: string; step: number; revealed: boolean }) {
  const d = destinationById[id];
  const open = new Set(tileOrder(id).slice(0, revealed ? TILES : OPEN_PER_STEP[step]));
  const [failed, setFailed] = useState(false);
  const credit = d.imagePath ? (credits as Record<string, ImageCredit>)[d.imagePath.split('/').pop()!.replace(/\.\w+$/, '')] : undefined;
  return (
    <div className="gb-print-plain relative aspect-[4/3] overflow-hidden rounded-2xl bg-gb-black shadow-[0_0_0_6px_#141b29,0_0_0_10px_#f3c44e,0_20px_50px_rgb(0_0_0/0.5)]">
      {d.imagePath && !failed ? (
        <Image
          src={d.imagePath}
          // Nothing readable names the city until the reveal.
          alt={revealed ? `${d.name}, ${d.country}` : ''}
          aria-hidden={revealed ? undefined : true}
          fill
          sizes="(max-width: 768px) 100vw, 640px"
          className="object-cover"
          onError={() => setFailed(true)}
          priority
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-gb-teal" aria-hidden={!revealed}>
          {revealed && <p className="gb-wordmark text-4xl">{d.name}</p>}
        </div>
      )}
      {revealed && credit && (
        <a
          href={credit.sourcePage}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-1 right-1 z-10 max-w-[80%] truncate rounded bg-black/60 px-1.5 py-0.5 text-[10px] leading-tight text-white/90"
        >
          Photo: {credit.author || 'Wikimedia Commons'} · {credit.license}
        </a>
      )}
      <div aria-hidden className="absolute inset-0 grid grid-cols-3 grid-rows-3">
        {Array.from({ length: TILES }, (_, i) => (
          <div
            key={i}
            className={`gb-tile grid place-items-center transition-[opacity,transform] duration-300 ease-out ${
              open.has(i) ? 'pointer-events-none scale-90 opacity-0 [transform:rotateY(90deg)]' : 'opacity-100'
            }`}
          >
            <span className="gb-display text-4xl text-gb-gold [text-shadow:2px_2px_0_#141b29] sm:text-5xl">{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const bookmarkOptions: { id: Bookmark; label: string }[] = [
  { id: 'possible', label: 'Add to my possibles' },
  { id: 'not_for_me', label: 'Not for me' },
  { id: 'watching', label: 'Keep watching' },
];

export default function DestinationReveal() {
  const { state, dispatch, sfx } = useShow();
  useVisit('picture_reveal');
  const order = revealOrder(state);
  const index = Math.min(state.revealIndex, order.length - 1);
  const id = order[index];
  const d = destinationById[id];
  const c = contestants[id];
  const group = groupOf(id);
  const step = state.revealSteps[id] ?? 0;
  const revealed = Boolean(state.identityRevealed[id]);
  const it = selectedVariant(id, state.preferredItineraryIds[id]);
  const guess = state.pictureGuessResults[id];
  const points = studioPoints(state);
  const last = index === order.length - 1;

  const cardHeading = useRef<HTMLHeadingElement>(null);
  const boardHeading = useRef<HTMLHeadingElement>(null);
  const prevRevealed = useRef(revealed);
  const prevId = useRef(id);
  useEffect(() => {
    if (revealed && !prevRevealed.current) cardHeading.current?.focus();
    else if (prevId.current !== id) boardHeading.current?.focus();
    prevRevealed.current = revealed;
    prevId.current = id;
  }, [revealed, id]);

  if (!d || !c || !it) return null;
  const go = (i: number) => dispatch({ type: 'goToReveal', index: i });
  const reveal = () => {
    dispatch({ type: 'revealIdentity', destinationId: id });
    sfx('fanfare');
  };

  return (
    <Shell phase="picture_reveal">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:py-10">
        <RoundHeading number={1} title={copy.round1.title}>
          <p className="max-w-2xl text-gb-paper/85">{copy.round1.intro}</p>
        </RoundHeading>

        <nav aria-label="Contestants" className="no-scrollbar -mx-4 overflow-x-auto px-4">
          <ol className="flex gap-1.5">
            {order.map((fid, i) => (
              <li key={fid}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-current={i === index ? 'step' : undefined}
                  aria-label={`Contestant ${i + 1}${state.identityRevealed[fid] ? `: ${destinationById[fid].name}` : ''}`}
                  className={`grid size-11 place-items-center rounded-lg gb-display text-lg transition ${
                    i === index
                      ? 'bg-gb-gold text-gb-black'
                      : state.identityRevealed[fid]
                        ? 'bg-gb-teal text-gb-paper'
                        : 'border-2 border-gb-paper/25 text-gb-paper/80 hover:border-gb-paper'
                  }`}
                >
                  {i + 1}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <section aria-labelledby="board-heading" className="space-y-4">
            <div>
              {group && <p className="text-xs font-bold uppercase tracking-[0.2em] text-gb-gold">{group.title}</p>}
              <h2 id="board-heading" ref={boardHeading} tabIndex={-1} className="gb-display text-2xl outline-none sm:text-3xl">
                Contestant {index + 1} of {order.length}
              </h2>
              <HostLine className="mt-1">{c.setup}</HostLine>
            </div>
            <PictureBoard id={id} step={step} revealed={revealed} />
          </section>

          <section aria-labelledby="clue-heading" className="space-y-4">
            {!revealed ? (
              <div className="gb-pinstripe space-y-4 rounded-3xl p-5">
                <h2 id="clue-heading" className="gb-display text-2xl text-gb-tomato">
                  The clues
                </h2>
                <ol className="space-y-2" aria-live="polite">
                  {c.clues.slice(0, step + 1).map((clue, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="gb-display grid size-8 shrink-0 place-items-center rounded-md bg-gb-teal text-gb-paper">{i + 1}</span>
                      <span className="pt-1">{clue}</span>
                    </li>
                  ))}
                </ol>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    className={btn.teal}
                    disabled={step >= 2}
                    onClick={() => {
                      dispatch({ type: 'showMore', destinationId: id });
                      sfx('tick');
                    }}
                  >
                    <Eye aria-hidden className="size-5" /> {copy.round1.more}
                  </button>
                  <button type="button" className={btn.primary} onClick={reveal}>
                    <Sparkles aria-hidden className="size-5" /> {copy.round1.reveal}
                  </button>
                </div>
                <p className="text-xs opacity-75">Guessing is entertainment, not a geography test. You can reveal at any time.</p>
              </div>
            ) : (
              <article className="gb-paper space-y-4 rounded-3xl p-5">
                <div>
                  <h2 id="clue-heading" ref={cardHeading} tabIndex={-1} className="gb-wordmark text-4xl outline-none [-webkit-text-stroke:0] [text-shadow:2px_2px_0_var(--color-gb-tomato)] !text-gb-navy">
                    {d.name}
                  </h2>
                  <p className="text-sm opacity-80">{d.country}</p>
                </div>
                <p className="font-serif text-lg italic">{pitchFor(id)}</p>
                {contestants[id]?.photoNote && <p className="text-xs opacity-80">{contestants[id].photoNote}</p>}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gb-teal">Three reasons to go</h3>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                    {d.highlights.slice(0, 3).map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </div>
                <Catches id={id} it={it} />
                <TripFacts it={it} />
                <EvidenceStatus it={it} />
                <VariantPicker id={id} />
                {costBreakdown(it) ? (
                  <p className="rounded-xl bg-gb-navy px-3 py-2 text-sm text-gb-paper">
                    The price is saved for Round 2. Or see it now in{' '}
                    <Link href="/getaway-show/holidays" className="underline">
                      the table
                    </Link>
                    .
                  </p>
                ) : (
                  <>
                    <EstimatedPrice it={it} />
                    <SourceStatus />
                  </>
                )}

                <div className="space-y-2 border-t border-gb-black/10 pt-3">
                  <p className="text-sm font-bold">Did you guess it?</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { v: true, label: 'We got it' },
                      { v: false, label: 'Not a clue' },
                    ].map((o) => (
                      <button
                        key={o.label}
                        type="button"
                        aria-pressed={guess?.guessed === o.v}
                        className={`${btn.ghostInk} aria-pressed:border-gb-teal aria-pressed:bg-gb-teal aria-pressed:text-gb-paper`}
                        onClick={() => dispatch({ type: 'recordGuess', destinationId: id, guessed: o.v })}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm">
                    Studio points so far: <strong>{points.picture}</strong> <NoInfluence className="ml-1 align-middle" />
                  </p>
                </div>

                <div className="space-y-2 border-t border-gb-black/10 pt-3">
                  <p className="flex items-center gap-1.5 text-sm font-bold">
                    <BookmarkIcon aria-hidden className="size-4" /> Quick bookmark
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {bookmarkOptions.map((b) => {
                      const on = state.bookmarks[id] === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          aria-pressed={on}
                          className={`${btn.ghostInk} aria-pressed:border-gb-tomato aria-pressed:bg-gb-tomato aria-pressed:text-gb-paper`}
                          onClick={() => dispatch({ type: 'bookmark', destinationId: id, bookmark: on ? undefined : b.id })}
                        >
                          {b.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs opacity-75">Informal and shared. Your private votes come in Round 4.</p>
                </div>
              </article>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" className={btn.ghost} disabled={index === 0} onClick={() => go(index - 1)}>
            ← Previous contestant
          </button>
          {last ? (
            <Link href={phaseHref.higher_lower} className={btn.gold}>
              On to Round 2
            </Link>
          ) : (
            <button type="button" className={btn.gold} onClick={() => go(index + 1)}>
              {revealed ? 'Next contestant' : 'Skip to next contestant'}
              {!revealed && <EyeOff aria-hidden className="size-5" />}
            </button>
          )}
        </div>

        <ProgressControls previous="/getaway-show" skip={phaseHref.higher_lower} />
      </div>
    </Shell>
  );
}
