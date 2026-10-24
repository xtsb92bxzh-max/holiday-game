'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowDown, ArrowUp, Check, Equal, X } from 'lucide-react';
import Photo from '@/components/Photo';
import { destinationById } from '@/lib/catalogue';
import { formatDateRange } from '@/lib/dates';
import { formatGBP } from '@/lib/pricing';
import type { Itinerary } from '@/lib/types';
import { copy } from '../data/copy';
import { duelCount, duelItinerary, featuredIds, ladderIds } from '../lib/cast';
import { costBreakdown } from '../lib/cost';
import { duelPair, duelRecord, phaseHref, studioPoints, type DuelGuess } from '../lib/state';
import { ProgressControls, Shell } from './Chrome';
import { useShow, useVisit } from './ShowProvider';
import { btn, EvidenceStatus, HostLine, NoInfluence, PriceBreakdown, RoundHeading, SourceStatus, VariantPicker } from './ui';

function Placard({ id, it, shown, reduceMotion }: { id: string; it: Itinerary; shown: boolean; reduceMotion: boolean }) {
  const d = destinationById[id];
  const c = costBreakdown(it)!;
  return (
    <div className="gb-placard flex flex-col overflow-hidden rounded-2xl text-gb-paper">
      <Photo src={d.imagePath} name={d.name} country={d.country} className="aspect-[16/9]" sizes="(max-width: 640px) 50vw, 360px" />
      <div className="flex flex-1 flex-col items-center gap-1 px-2 py-3 text-center sm:px-4">
        <p className="gb-display text-xl leading-none sm:text-3xl">{d.name}</p>
        <p className="text-[11px] leading-tight opacity-85 sm:text-xs">
          {formatDateRange(it.departDate, it.returnDate)} · {it.nights}n · {it.departureAirport}
        </p>
        <div className="mt-1 grid min-h-[3.5rem] place-items-center [perspective:600px] sm:min-h-[4.5rem]">
          {shown ? (
            <motion.p
              key="price"
              initial={reduceMotion ? false : { rotateX: -90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="gb-display text-4xl tabular-nums text-gb-gold [text-shadow:2px_2px_0_#141b29] sm:text-6xl"
            >
              {formatGBP(c.placard)}
            </motion.p>
          ) : (
            <p className="gb-display text-4xl text-gb-paper/70 sm:text-6xl" aria-label="Price hidden">
              £???
            </p>
          )}
        </div>
        <p className="text-[11px] opacity-80 sm:text-xs">{shown ? `${formatGBP(c.perPerson, { pence: true })} each` : 'for two'}</p>
      </div>
    </div>
  );
}

function ResultLine({ answer, correct, guess }: { answer: 'higher' | 'lower' | 'same'; correct: boolean | null; guess: DuelGuess }) {
  const reaction = answer === 'same' ? copy.round2.same : answer === 'higher' ? copy.round2.higher : copy.round2.lower;
  const Icon = correct == null ? Equal : correct ? Check : X;
  return (
    <div className="space-y-1 text-center">
      <p className={`gb-display inline-flex items-center gap-2 text-2xl ${correct ? 'text-gb-gold' : correct === false ? 'text-gb-tomato' : 'text-gb-paper'}`}>
        <Icon aria-hidden className="size-6" />
        {guess === 'skip' ? 'Both prices shown' : correct ? 'Correct!' : 'Not this time'}
        {guess !== 'skip' && <span className="text-base text-gb-paper/80">· it was {answer === 'same' ? 'the same' : answer}</span>}
      </p>
      <HostLine>{guess === 'skip' ? copy.round2.skipped : correct ? copy.round2.right : copy.round2.wrong}</HostLine>
      <p className="font-serif text-sm italic text-gb-paper/80">{reaction}</p>
    </div>
  );
}

function PriceLadder() {
  const { state } = useShow();
  const rows = featuredIds
    .flatMap((id) => {
      const it = duelItinerary(id, state.preferredItineraryIds[id]);
      return it ? [{ id, total: it.estimatedTotalForTwoGBP }] : [];
    })
    .sort((a, b) => a.total - b.total);
  const max = Math.max(...rows.map((r) => r.total));
  return (
    <section aria-labelledby="ladder" className="gb-pinstripe space-y-3 rounded-3xl p-5">
      <h2 id="ladder" className="gb-display text-2xl text-gb-tomato">
        Tonight’s price ladder
      </h2>
      <p className="text-sm">Estimated total for two for each featured destination, on its current dates. Cheapest first.</p>
      <ol className="space-y-1.5">
        {rows.map((r) => (
          <li key={r.id} className="grid grid-cols-[6.5rem_1fr_4.5rem] items-center gap-2 text-sm">
            <span className="truncate font-semibold">{destinationById[r.id].name}</span>
            <span className="h-4 rounded bg-gb-black/10">
              <span className="block h-4 rounded bg-gb-teal" style={{ width: `${(r.total / max) * 100}%` }} />
            </span>
            <span className="text-right tabular-nums">{formatGBP(r.total, { pence: true })}</span>
          </li>
        ))}
      </ol>
      <SourceStatus />
    </section>
  );
}

export default function HigherLowerGame() {
  const { state, dispatch, reduceMotion, sfx } = useShow();
  useVisit('higher_lower');
  const index = Math.min(state.duelIndex, Math.max(0, duelCount - 1));
  const pair = duelPair(state, index);
  const rec = duelRecord(state, index);
  const [pound, setPound] = useState('');
  const poundId = useId();
  const resultRef = useRef<HTMLDivElement>(null);
  const points = studioPoints(state);
  const answered = Array.from({ length: duelCount }, (_, i) => duelRecord(state, i));
  const allDone = answered.every(Boolean);

  useEffect(() => setPound(''), [index]);
  const wasAnswered = useRef(Boolean(rec));
  useEffect(() => {
    if (rec && !wasAnswered.current) resultRef.current?.focus();
    wasAnswered.current = Boolean(rec);
  }, [rec]);

  if (duelCount === 0 || !pair) {
    return (
      <Shell phase="higher_lower">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
          <RoundHeading number={2} title={copy.round2.title} />
          <p>There are not enough priced destinations for a price round. On to the board.</p>
          <Link href={phaseHref.wildcard_board} className={btn.gold}>
            On to Round 3
          </Link>
        </div>
      </Shell>
    );
  }

  const answer = (guess: DuelGuess) => {
    const n = Number(pound.replace(/[£,\s]/g, ''));
    dispatch({ type: 'answerDuel', index, guess, poundGuess: pound.trim() && Number.isFinite(n) && n > 0 ? n : undefined });
    sfx(guess === 'skip' ? 'tick' : guess === pair.answer || pair.answer === 'same' ? 'fanfare' : 'bin');
  };
  const right = costBreakdown(pair.right)!;

  return (
    <Shell phase="higher_lower">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:py-10">
        <RoundHeading number={2} title={copy.round2.title}>
          <p className="max-w-2xl text-gb-paper/85">{copy.round2.intro}</p>
        </RoundHeading>

        <nav aria-label="Price duels">
          <ol className="flex flex-wrap gap-1.5">
            {answered.map((r, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'goToDuel', index: i })}
                  aria-current={i === index ? 'step' : undefined}
                  aria-label={`Duel ${i + 1}${r ? (r.correct ? ', correct' : r.correct === false ? ', wrong' : ', skipped') : ''}`}
                  className={`grid size-11 place-items-center rounded-lg gb-display text-lg ${
                    i === index ? 'bg-gb-gold text-gb-black' : r ? 'bg-gb-teal text-gb-paper' : 'border-2 border-gb-paper/25 text-gb-paper/80'
                  }`}
                >
                  {i + 1}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <section aria-labelledby="duel-heading" className="space-y-4">
          <h2 id="duel-heading" className="gb-display text-2xl">
            Duel {index + 1} of {duelCount}: is {destinationById[pair.rightId].name} higher or lower than {destinationById[pair.leftId].name}?
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            <Placard id={pair.leftId} it={pair.left} shown reduceMotion={reduceMotion} />
            <Placard id={pair.rightId} it={pair.right} shown={Boolean(rec)} reduceMotion={reduceMotion} />
          </div>

          {!rec ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button type="button" className={btn.gold + ' !text-2xl'} onClick={() => answer('higher')}>
                  <ArrowUp aria-hidden className="size-6" /> Higher
                </button>
                <button type="button" className={btn.primary + ' !text-2xl'} onClick={() => answer('lower')}>
                  <ArrowDown aria-hidden className="size-6" /> Lower
                </button>
              </div>
              <div className="flex flex-col items-center gap-2">
                <button type="button" className={btn.ghost} onClick={() => answer('skip')}>
                  Show both prices
                </button>
                <details className="w-full max-w-sm text-sm">
                  <summary className="flex min-h-11 cursor-pointer items-center justify-center text-gb-paper/85 underline decoration-dotted underline-offset-4">
                    Bonus: guess it to the pound (optional)
                  </summary>
                  <label htmlFor={poundId} className="mt-2 block text-center">
                    Your guess for {destinationById[pair.rightId].name}, total for two (£)
                  </label>
                  <input
                    id={poundId}
                    inputMode="numeric"
                    autoComplete="off"
                    value={pound}
                    onChange={(e) => setPound(e.target.value)}
                    placeholder="e.g. 450"
                    className="mt-1 block min-h-11 w-full rounded-xl border-2 border-gb-paper/30 bg-gb-black px-3 text-center text-lg text-gb-paper"
                  />
                </details>
              </div>
            </div>
          ) : (
            <div ref={resultRef} tabIndex={-1} className="space-y-4 outline-none" aria-live="polite">
              <ResultLine answer={pair.answer} correct={rec.correct} guess={rec.guess} />
              {rec.poundGuess != null && (
                <p className="text-center text-sm">
                  You guessed {formatGBP(rec.poundGuess)}. That is {formatGBP(Math.abs(rec.poundGuess - right.totalForTwo), { pence: true })}{' '}
                  {rec.poundGuess > right.totalForTwo ? 'over' : 'under'}. <NoInfluence className="align-middle" />
                </p>
              )}
              <p className="text-center text-sm text-gb-paper/85">
                Exact estimates: {destinationById[pair.leftId].name} {formatGBP(pair.left.estimatedTotalForTwoGBP, { pence: true })} ·{' '}
                {destinationById[pair.rightId].name} {formatGBP(pair.right.estimatedTotalForTwoGBP, { pence: true })}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { id: pair.leftId, it: pair.left },
                  { id: pair.rightId, it: pair.right },
                ].map(({ id, it }) => (
                  <details key={id} className="gb-paper rounded-2xl px-4 py-2">
                    <summary className="flex min-h-11 cursor-pointer items-center font-bold">What’s in {destinationById[id].name}’s number?</summary>
                    <div className="space-y-3 pb-3">
                      <PriceBreakdown it={it} />
                      <EvidenceStatus it={it} />
                      {it.routeCaution && <p className="text-sm text-gb-tomato">{it.routeCaution}</p>}
                      <VariantPicker id={id} />
                    </div>
                  </details>
                ))}
              </div>
              <div className="flex justify-center">
                {index < duelCount - 1 ? (
                  <button type="button" className={btn.gold} onClick={() => dispatch({ type: 'goToDuel', index: index + 1 })}>
                    Next duel
                  </button>
                ) : (
                  <Link href={phaseHref.wildcard_board} className={btn.gold}>
                    On to Round 3
                  </Link>
                )}
              </div>
            </div>
          )}
          <SourceStatus className="justify-center text-gb-paper/85" />
          <p className="text-center text-xs text-gb-paper/75">
            Estimated package comparison for 2 • research dated 23 Oct 2026. A wrong guess eliminates nobody.
          </p>
        </section>

        <p className="text-center text-sm">
          Price points: <strong>{points.price}</strong> of {duelCount} <NoInfluence className="ml-1 align-middle" />
        </p>

        {allDone && (
          <>
            <HostLine className="text-center">{copy.round2.done}</HostLine>
            <PriceLadder />
          </>
        )}
        {!allDone && ladderIds.length > 0 && (
          <details className="text-sm">
            <summary className="flex min-h-11 cursor-pointer items-center text-gb-paper/85 underline decoration-dotted underline-offset-4">
              Spoil it: show the whole price ladder
            </summary>
            <div className="mt-2">
              <PriceLadder />
            </div>
          </details>
        )}

        <ProgressControls previous={phaseHref.picture_reveal} skip={phaseHref.wildcard_board} />
      </div>
    </Shell>
  );
}
