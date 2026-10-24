'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ChevronDown, ChevronRight, Heart, Lock, RotateCcw, Smartphone, Sparkles } from 'lucide-react';
import Confetti from '@/components/Confetti';
import Photo from '@/components/Photo';
import { destinationById } from '@/lib/catalogue';
import { formatGBP } from '@/lib/pricing';
import { hostQuestions, showCopy } from '../data/copy';
import { profileFor, selectedVariant, seatWords, type ShowEpisode } from '../lib/cast';
import { costBreakdown } from '../lib/cost';
import {
  choosers,
  cityPointsFor,
  displayName,
  duelResult,
  duelTarget,
  episodeProgress,
  episodeStage,
  episodeVerdict,
  guessOptions,
  isUnmasked,
  players,
  QUESTIONS,
  revealOrder,
  showEpisodes,
  validPicks,
  type PlayerId,
} from '../lib/state';
import { useShow } from './BlindFlightProvider';
import { Mark, Shell } from './Chrome';
import { AwkwardBit, TripDetails } from './ContestantScreen';
import { Breakdown, PendingFacts } from './Price';
import { btn, HostSays, LowerThird, PickChip, Scoreboard } from './ui';

const seatOfIn = (e: ShowEpisode, id: string) => seatWords[e.cast.indexOf(id)];
const hasClues = (e: ShowEpisode) => e.cast.every((id) => profileFor(id).hasClues);

/** Scrolls the newest item into view as the show moves on. */
function useFollow<T extends HTMLElement>(key: unknown) {
  const ref = useRef<T>(null);
  const { reduceMotion } = useShow();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    ref.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }, [key, reduceMotion]);
  return ref;
}

function Podiums({ e }: { e: ShowEpisode }) {
  const { state } = useShow();
  return (
    <div className="relative rounded-3xl border border-bf-cream/10 bg-black/20 px-3 pb-4 pt-5 sm:px-8">
      <div aria-hidden className="bf-floor pointer-events-none absolute inset-x-0 bottom-0 h-1/3 rounded-b-3xl" />
      <ol className="relative mx-auto grid max-w-2xl grid-cols-3 gap-3 sm:gap-8">
        {e.cast.map((id, i) => {
          const d = destinationById[id];
          const shown = isUnmasked(state, e.id, id);
          return (
            <li key={id} className="flex min-w-0 flex-col items-center text-center">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-[2rem] rounded-b-lg border-2 border-bf-custard/60 shadow-xl">
                {shown ? (
                  <Photo src={d.imagePath} name={d.name} country={d.country} className="size-full" sizes="(max-width: 640px) 33vw, 220px" />
                ) : (
                  <div className="bf-silhouette absolute inset-0 grid place-items-center">
                    <span aria-hidden className="bf-display text-5xl text-bf-custard/90 sm:text-7xl">
                      ?
                    </span>
                  </div>
                )}
              </div>
              <div className="bf-podium -mt-1 w-[112%] px-1 pb-1.5 pt-1.5">
                <p className="bf-display text-lg leading-none text-bf-custard sm:text-2xl">No. {seatWords[i]}</p>
              </div>
              <p className="mt-1.5 min-h-5 w-full truncate text-sm font-semibold">{shown ? d.name : 'Identity hidden'}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Answers({ e, line }: { e: ShowEpisode; line: (id: string) => string }) {
  const { state } = useShow();
  return (
    <ol className="grid gap-2 sm:grid-cols-3">
      {e.cast.map((id, i) => (
        <motion.li
          key={id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.15 }}
          className="rounded-2xl bg-bf-cream p-4 text-bf-ink shadow-lg"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-bf-red">
            {isUnmasked(state, e.id, id) ? destinationById[id].name : `No. ${seatWords[i]}`}
          </p>
          <p className="mt-1 font-serif italic leading-snug">“{line(id)}”</p>
        </motion.li>
      ))}
    </ol>
  );
}

function Watching({ e }: { e: ShowEpisode }) {
  const { state, dispatch, sfx } = useShow();
  const shown = episodeProgress(state, e.id).questionsShown;
  const clues = hasClues(e);
  const more = clues && shown < QUESTIONS;
  const follow = useFollow<HTMLDivElement>(shown);

  return (
    <section aria-label="The questions" className="space-y-6">
      <div className="space-y-3">
        <LowerThird label="Host">{showCopy.intros}</LowerThird>
        <Answers e={e} line={(id) => profileFor(id).stageIntro} />
      </div>

      {clues &&
        hostQuestions.slice(0, shown).map((q, n) => (
          <div key={q} ref={n === shown - 1 ? follow : undefined} className="scroll-mt-20 space-y-3">
            <LowerThird label={`Question ${n + 1}`}>{q}</LowerThird>
            <Answers e={e} line={(id) => profileFor(id).clues[n]} />
          </div>
        ))}

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        {more ? (
          <>
            <button
              type="button"
              className={btn.primary}
              onClick={() => {
                dispatch({ type: 'nextQuestion', episodeId: e.id });
                sfx('tick');
              }}
            >
              {shown === 0 ? 'Ask the first question' : `Ask question ${shown + 1}`} <ChevronDown aria-hidden className="size-5" />
            </button>
            {shown > 0 && (
              <button type="button" className={btn.ghost} onClick={() => dispatch({ type: 'startChoosing', episodeId: e.id })}>
                I’ve heard enough. Let’s choose
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            className={btn.gold + ' text-xl'}
            onClick={() => {
              dispatch({ type: 'startChoosing', episodeId: e.id });
              sfx('mystery');
            }}
          >
            Time to choose
          </button>
        )}
      </div>
    </section>
  );
}

function Choosing({ e }: { e: ShowEpisode }) {
  const { state, dispatch, sfx } = useShow();
  const [selected, setSelected] = useState<string>();
  const [guess, setGuess] = useState<string | null>();
  const shown = episodeProgress(state, e.id).questionsShown;
  const canGuess = selected != null && !isUnmasked(state, e.id, selected);
  const who = displayName(state, state.activePlayer);
  const quick = state.mode === 'quick';

  return (
    <section aria-labelledby="choose-heading" className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-bf-seafoam">{quick ? 'Choosing together' : `Choosing: ${who}`}</p>
        <h2 id="choose-heading" className="bf-logo text-4xl">
          {quick ? 'Who gets the date?' : `${who}, who gets the date?`}
        </h2>
        <HostSays>{quick ? showCopy.quickChoose : showCopy.choose}</HostSays>
      </div>

      <div role="radiogroup" aria-labelledby="choose-heading" className="grid gap-3 sm:grid-cols-3">
        {e.cast.map((id, i) => {
          const on = selected === id;
          const p = profileFor(id);
          const unmasked = isUnmasked(state, e.id, id);
          const d = destinationById[id];
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                if (id !== selected) setGuess(undefined);
                setSelected(id);
                sfx('tick');
              }}
              className={`flex flex-col gap-2 rounded-3xl border-4 p-4 text-left transition ${
                on ? 'border-bf-custard bg-bf-custard/15' : 'border-bf-cream/20 bg-black/20 hover:border-bf-cream/50'
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="bf-display text-2xl text-bf-custard">{unmasked ? d.name : `Number ${seatWords[i]}`}</span>
                {on && <Heart aria-hidden className="size-6 shrink-0 fill-bf-tomato text-bf-tomato" />}
              </span>
              <span className="font-serif text-sm italic text-bf-cream/90">“{p.stageIntro}”</span>
              {p.hasClues && shown > 0 && (
                <ul className="list-disc space-y-1 pl-4 text-xs text-bf-cream/75">
                  {p.clues.slice(0, shown).map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              )}
            </button>
          );
        })}
      </div>

      {canGuess && (
        <fieldset className="space-y-3 rounded-3xl border-2 border-dashed border-bf-seafoam/50 p-4">
          <legend className="px-2 text-xs font-bold uppercase tracking-widest text-bf-seafoam">Bonus round</legend>
          <p className="font-bold">Who do you think Number {seatOfIn(e, selected)} really is?</p>
          <p className="text-sm text-bf-cream/75">
            Right first time scores {cityPointsFor(shown)} point{cityPointsFor(shown) === 1 ? '' : 's'}. Fewer questions, more points.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {guessOptions(e, selected).map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={guess === id}
                onClick={() => setGuess(id)}
                className="min-h-11 rounded-xl border-2 border-bf-cream/25 px-3 py-2 text-left text-sm font-semibold transition hover:border-bf-cream/60 aria-pressed:border-bf-seafoam aria-pressed:bg-bf-seafoam aria-pressed:text-bf-ink"
              >
                {destinationById[id].name}
              </button>
            ))}
          </div>
          <button type="button" aria-pressed={guess === null} onClick={() => setGuess(null)} className={btn.link + ' aria-pressed:text-bf-seafoam'}>
            No idea. Surprise me
          </button>
        </fieldset>
      )}

      <button
        type="button"
        className={btn.primary + ' w-full text-xl sm:w-auto'}
        disabled={!selected || (canGuess && guess === undefined)}
        onClick={() => {
          if (!selected) return;
          dispatch({ type: 'pick', episodeId: e.id, destinationId: selected, guessId: guess ?? undefined });
          sfx('keep');
        }}
      >
        <Lock aria-hidden className="size-5" />
        {!selected ? 'Choose a contestant' : canGuess && guess === undefined ? 'Make a guess first' : `Lock in Number ${seatOfIn(e, selected)}`}
      </button>
    </section>
  );
}

/** A full-screen cover with nothing about the first choice on it. */
export function HandoverCover({ onPass, onUndo, what }: { onPass: () => void; onUndo: () => void; what: string }) {
  const { state, sfx } = useShow();
  const t1 = displayName(state, 'traveller1');
  const t2 = displayName(state, 'traveller2');
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="handover-heading" className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-bf-deep px-4 py-12">
      <div aria-hidden className="bf-curtain pointer-events-none absolute inset-y-0 left-0 w-1/2 opacity-90" />
      <div aria-hidden className="bf-curtain pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-90" />
      <div aria-hidden className="bf-valance pointer-events-none absolute inset-x-0 top-0 h-10" />
      <div className="relative w-full max-w-md space-y-6 rounded-[2rem] border-4 border-bf-custard bg-bf-deep/95 p-6 text-center shadow-2xl sm:p-8">
        <Mark className="mx-auto size-14" />
        <h2 id="handover-heading" className="bf-logo text-4xl sm:text-5xl">
          Pass the phone.
          <span className="mt-2 block text-3xl text-bf-seafoam [text-shadow:2px_2px_0_var(--color-bf-deep)] sm:text-4xl">No peeking.</span>
        </h2>
        <Smartphone aria-hidden className="mx-auto size-10 text-bf-cream/70" />
        <HostSays>{showCopy.handover}</HostSays>
        <p className="text-bf-cream/85">
          {t1}’s choice is sealed. {t2} now chooses from {what}.
        </p>
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            className={btn.primary + ' text-xl'}
            onClick={() => {
              onPass();
              sfx('fanfare');
            }}
          >
            I’m {t2}. Show me
          </button>
          <button type="button" className={btn.link} onClick={onUndo}>
            Wait, {t1} wants to change their mind
          </button>
        </div>
      </div>
    </div>
  );
}

function Handover({ e }: { e: ShowEpisode }) {
  const { dispatch } = useShow();
  return (
    <HandoverCover
      what="the same three"
      onPass={() => dispatch({ type: 'passPhone', episodeId: e.id })}
      onUndo={() => dispatch({ type: 'unpick', episodeId: e.id })}
    />
  );
}

function pickersOf(state: ReturnType<typeof useShow>['state'], e: ShowEpisode, id: string): PlayerId[] {
  const picks = validPicks(episodeProgress(state, e.id), e);
  return choosers(state).filter((p) => picks[p] === id);
}

function RevealCard({ e, id }: { e: ShowEpisode; id: string }) {
  const { state, reduceMotion } = useShow();
  const d = destinationById[id];
  const it = selectedVariant(id, state.preferredItineraryByDestination[id]);
  const c = it && costBreakdown(it);
  const who = pickersOf(state, e, id);
  const p = episodeProgress(state, e.id);
  // Your date's price stays behind the curtain until the duel is settled.
  const priceHidden = episodeStage(state, e.id) === 'duel' && duelTarget(state, e) === id;
  return (
    <motion.article
      initial={reduceMotion ? false : { clipPath: 'inset(0 50% 0 50%)' }}
      animate={{ clipPath: 'inset(0 0% 0 0%)' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="overflow-hidden rounded-3xl border-4 border-bf-custard/60 bg-black/25 shadow-2xl"
    >
      <Photo src={d.imagePath} name={d.name} country={d.country} className="aspect-[16/9] w-full" sizes="(max-width: 1024px) 100vw, 1000px" showCredit />
      <div className="space-y-4 p-4 sm:p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-bf-seafoam">Contestant number {seatOfIn(e, id).toLowerCase()} was…</p>
          <h3 className="bf-logo mt-1 text-4xl sm:text-5xl">{d.name}</h3>
          <p className="text-bf-cream/85">{d.country}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {who.length === 0 ? (
            <span className="rounded-full border border-bf-cream/40 px-2.5 py-0.5 text-xs font-semibold text-bf-cream/80">Turned down</span>
          ) : (
            who.map((p) => <PickChip key={p} who={state.mode === 'quick' ? 'Your choice' : `${displayName(state, p)} chose`} />)
          )}
        </div>
        {who.map((pl) => {
          const g = p.cityGuesses[pl];
          if (!g) return null;
          const right = g === id;
          return (
            <p key={pl} className={`text-sm font-semibold ${right ? 'text-bf-seafoam' : 'text-bf-cream/75'}`}>
              {state.mode === 'quick' ? 'You' : displayName(state, pl)} guessed {destinationById[g].name}.{' '}
              {right ? `Correct: +${p.cityPoints[pl] ?? 0}` : 'Not even close.'}
            </p>
          );
        })}
        <p className="font-serif text-lg italic text-bf-custard">{profileFor(id).shortPitch}</p>
        <p className="text-xl font-bold">
          {priceHidden ? (
            <>
              £??? <span className="text-base font-normal text-bf-cream/80">for two · price duel below</span>
            </>
          ) : c ? (
            <>
              {formatGBP(c.headline)} <span className="text-base font-normal text-bf-cream/80">for two · {formatGBP(c.perPerson, { pence: true })} each</span>
            </>
          ) : (
            'Price pending — flights not yet priced'
          )}
        </p>
        {it && <AwkwardBit id={id} it={it} />}
        {it && (
          <details className="rounded-2xl border border-bf-cream/15 px-4 py-2">
            <summary className="flex min-h-11 cursor-pointer items-center font-bold">Full details: dates, flights, hotel and links</summary>
            <div className="space-y-4 pb-3 pt-2">
              <TripDetails id={id} it={it} />
              {!priceHidden && <div className="bf-paper rounded-2xl p-4">{c ? <Breakdown it={it} /> : <PendingFacts it={it} />}</div>}
            </div>
          </details>
        )}
      </div>
    </motion.article>
  );
}

function PriceInput({ label, onLock }: { label: string; onLock: (n: number) => void }) {
  const [text, setText] = useState('');
  const n = Number(text.replace(/[£,\s]/g, ''));
  const ok = text.trim() !== '' && Number.isFinite(n) && n > 0;
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
      onSubmit={(ev) => {
        ev.preventDefault();
        if (ok) onLock(Math.round(n));
      }}
    >
      <label className="flex-1 text-sm font-bold">
        {label}
        {/* Masked so the other traveller can't read it over your shoulder. */}
        <input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          placeholder="£ for two"
          value={text}
          onChange={(ev) => setText(ev.target.value)}
          className="mt-1 block w-full rounded-xl border-2 border-bf-ink/20 bg-white px-4 py-3 text-2xl font-bold tabular-nums text-bf-ink placeholder:text-base placeholder:font-normal"
        />
      </label>
      <button type="submit" className={btn.primary} disabled={!ok}>
        <Lock aria-hidden className="size-5" /> Lock it in
      </button>
    </form>
  );
}

function Duel({ e }: { e: ShowEpisode }) {
  const { state, dispatch, sfx } = useShow();
  const p = episodeProgress(state, e.id);
  const target = duelTarget(state, e)!;
  const d = destinationById[target];
  const next = choosers(state).find((pl) => p.priceGuesses[pl] == null);
  const quick = state.mode === 'quick';
  return (
    <section aria-labelledby="duel-heading" className="bf-paper space-y-4 rounded-3xl p-5 sm:p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-bf-red">Price duel</p>
        <h2 id="duel-heading" className="bf-display text-3xl text-bf-red">
          What does {d.name} cost?
        </h2>
        <p className="mt-1 text-sm">
          The estimated total for both of you: return flights, the room, and an allowance for bags and transfers.{' '}
          {quick ? 'Close guesses earn points.' : 'Closest without going over scores 2, with a bonus point within 5%. Go over and you score nothing.'}
        </p>
      </div>
      {!quick && (
        <ul className="flex flex-wrap gap-2 text-sm">
          {choosers(state).map((pl) => (
            <li key={pl} className="rounded-full bg-bf-ink/10 px-3 py-1 font-semibold">
              {displayName(state, pl)}: {p.priceGuesses[pl] != null ? 'locked in' : 'thinking'}
            </li>
          ))}
        </ul>
      )}
      {next && (
        <PriceInput
          key={next}
          label={quick ? 'Your guess' : `${displayName(state, next)}, your guess`}
          onLock={(value) => {
            dispatch({ type: 'priceGuess', episodeId: e.id, player: next, value });
            sfx(next === choosers(state).at(-1) ? 'fanfare' : 'tick');
          }}
        />
      )}
      <button type="button" className="min-h-11 text-sm underline decoration-dotted underline-offset-4" onClick={() => dispatch({ type: 'skipDuel', episodeId: e.id })}>
        Skip the duel
      </button>
    </section>
  );
}

function DuelOutcome({ e }: { e: ShowEpisode }) {
  const { state } = useShow();
  const r = duelResult(state, e);
  if (!r) return null;
  const d = destinationById[r.target];
  const winners = choosers(state).filter((pl) => (r.points[pl] ?? 0) > 0);
  return (
    <section className="rounded-3xl border-2 border-bf-custard/60 bg-black/25 p-5 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-bf-seafoam">Price duel</p>
      <p className="mt-1 text-lg">
        {d.name} costs <strong className="text-bf-custard">{formatGBP(r.actual, { pence: true })}</strong> for two.
      </p>
      <ul className="mt-2 space-y-1 text-sm">
        {choosers(state).map((pl) => (
          <li key={pl}>
            {state.mode === 'quick' ? 'You' : displayName(state, pl)} guessed {formatGBP(r.guesses[pl]!)}
            {r.guesses[pl]! > r.actual ? ' (over)' : ''}: +{r.points[pl] ?? 0}
          </li>
        ))}
      </ul>
      {state.mode === 'two_person' && (
        <p className="mt-2 font-serif italic text-bf-custard">
          {winners.length === 0
            ? 'You both went over. The finance department is appalled.'
            : winners.length === 2
              ? 'A dead heat. Suspicious.'
              : `${displayName(state, winners[0])} takes the duel.`}
        </p>
      )}
    </section>
  );
}

function Verdict({ e }: { e: ShowEpisode }) {
  const { state, sfx, reduceMotion } = useShow();
  const v = episodeVerdict(state, e);
  const [burst, setBurst] = useState(0);
  const follow = useFollow<HTMLElement>(v?.kind);

  useEffect(() => {
    if (v?.kind === 'match' || v?.kind === 'chosen') {
      sfx('applause');
      if (!reduceMotion) setBurst((b) => b + 1);
    }
    // Once, when the verdict first appears.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!v) return null;
  return (
    <section ref={follow} aria-live="polite" className="bf-tv relative scroll-mt-20 overflow-hidden rounded-[2rem] px-4 py-8 text-center sm:px-10">
      {burst > 0 && <Confetti burstKey={burst} />}
      {v.kind === 'match' && (
        <>
          <Heart aria-hidden className="mx-auto size-12 fill-bf-tomato text-bf-tomato" />
          <h2 className="bf-logo mt-2 text-5xl sm:text-6xl">It’s a Match!</h2>
          <p className="mt-3 text-xl">
            You both chose <strong>{destinationById[v.id].name}</strong>.
          </p>
          <p className="mx-auto mt-2 max-w-xl font-serif italic text-bf-cream/90">{showCopy.match}</p>
        </>
      )}
      {v.kind === 'split' && (
        <>
          <h2 className="bf-logo text-4xl sm:text-5xl">Split decision</h2>
          <ul className="mt-3 space-y-1 text-lg">
            {players.map((p) => (
              <li key={p}>
                {displayName(state, p)} chose <strong>{destinationById[v.ids[p]].name}</strong>
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-2 max-w-xl font-serif italic text-bf-cream/90">{showCopy.split}</p>
        </>
      )}
      {v.kind === 'chosen' && (
        <>
          <Heart aria-hidden className="mx-auto size-12 fill-bf-tomato text-bf-tomato" />
          <h2 className="bf-logo mt-2 text-4xl sm:text-5xl">{destinationById[v.id].name}</h2>
          <p className="mx-auto mt-2 max-w-xl font-serif italic text-bf-cream/90">{showCopy.chosen}</p>
        </>
      )}
    </section>
  );
}

function Reveal({ e }: { e: ShowEpisode }) {
  const { state, dispatch, sfx } = useShow();
  const stage = episodeStage(state, e.id);
  const order = revealOrder(state, e);
  const out = order.filter((id) => isUnmasked(state, e.id, id));
  const next = order.find((id) => !isUnmasked(state, e.id, id));
  const eps = showEpisodes(state);
  const after = eps[eps.findIndex((x) => x.id === e.id) + 1];
  const follow = useFollow<HTMLDivElement>(out.length);
  const lastOne = next && order.indexOf(next) === order.length - 1;

  return (
    <section aria-label="The reveal" className="space-y-6">
      {hasClues(e) && <HostSays>{showCopy.revealIntro}</HostSays>}
      <Podiums e={e} />

      <div className="space-y-6">
        {out.map((id, i) => (
          <div key={id} ref={i === out.length - 1 ? follow : undefined} className="scroll-mt-20">
            <RevealCard e={e} id={id} />
          </div>
        ))}
      </div>

      {stage === 'reveal' && next && (
        <button
          type="button"
          className={btn.gold + ' w-full text-xl sm:w-auto'}
          onClick={() => {
            dispatch({ type: 'unmask', episodeId: e.id });
            sfx('mystery');
          }}
        >
          <Sparkles aria-hidden className="size-5" />
          {lastOne ? 'And finally… meet your date' : `Reveal number ${seatOfIn(e, next).toLowerCase()}`}
        </button>
      )}

      {stage === 'duel' && <Duel e={e} />}

      {stage === 'done' && (
        <>
          <DuelOutcome e={e} />
          <Verdict e={e} />
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            {after ? (
              <Link href={`/blind-flight/episode/${after.id}`} className={btn.primary + ' text-xl'}>
                Next: {after.title} <ChevronRight aria-hidden className="size-5" />
              </Link>
            ) : (
              <Link href="/blind-flight/results" className={btn.primary + ' text-xl'}>
                See the results <ChevronRight aria-hidden className="size-5" />
              </Link>
            )}
            <button
              type="button"
              className={btn.ghost}
              onClick={() => {
                if (window.confirm('Clear the choices for this episode and choose again? The contestants stay revealed and your points are kept.'))
                  dispatch({ type: 'pickAgain', episodeId: e.id });
              }}
            >
              <RotateCcw aria-hidden className="size-4" /> Choose again
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default function EpisodeScreen({ id }: { id: string }) {
  const { state } = useShow();
  const eps = showEpisodes(state);
  const e = eps.find((x) => x.id === id);

  if (!e) {
    return (
      <Shell>
        <section className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="bf-logo text-4xl">Not on tonight</h1>
          <p className="mt-4 text-bf-cream/85">This episode isn’t part of the current show.</p>
          <Link href="/blind-flight/show" className={btn.primary + ' mt-8'}>
            Back to the show
          </Link>
        </section>
      </Shell>
    );
  }

  const stage = episodeStage(state, e.id);

  return (
    <Shell>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:py-10">
        <div className="space-y-2">
          <Link href="/blind-flight/show" className={btn.link}>
            ← All episodes
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-bf-seafoam">
            {e.bonus ? 'Bonus round' : 'Episode'} {e.number} of {eps.length}
          </p>
          <h1 className="bf-display text-4xl text-bf-custard sm:text-5xl">{e.title}</h1>
          <LowerThird label="Host">{e.presenterLine}</LowerThird>
          <Scoreboard />
        </div>

        {(stage === 'watching' || stage === 'choosing') && <Podiums e={e} />}
        {stage === 'watching' && <Watching e={e} />}
        {/* Keyed by chooser so the second traveller never inherits the first one's selection. */}
        {stage === 'choosing' && <Choosing key={state.activePlayer} e={e} />}
        {stage === 'handover' && <Handover e={e} />}
        {(stage === 'reveal' || stage === 'duel' || stage === 'done') && <Reveal e={e} />}
      </div>
    </Shell>
  );
}
