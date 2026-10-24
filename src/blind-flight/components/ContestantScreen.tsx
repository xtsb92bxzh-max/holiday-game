'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, Clock, Hotel, Plane, Plus, Sparkles, ThermometerSnowflake } from 'lucide-react';
import Photo from '@/components/Photo';
import { destinationById, evidenceLabel, routeLabel } from '@/lib/catalogue';
import { formatDate, formatDateRange } from '@/lib/dates';
import { formatGBP } from '@/lib/pricing';
import type { Itinerary } from '@/lib/types';
import { mysteryIntros, pick } from '../data/copy';
import { awkwardBits, ballotOrder, profileFor, seatOf, seatWords, selectedVariant, variantsFor } from '../lib/cast';
import { costBreakdown as costBreakdownSafe } from '../lib/cost';
import { phase } from '../lib/state';
import { useShow } from './BlindFlightProvider';
import { Shell } from './Chrome';
import PriceRound from './PriceRound';
import VotePanel from './VotePanel';
import { btn, LowerThird, TripLinks } from './ui';

function Strip({ id }: { id: string }) {
  const { state } = useShow();
  const seat = seatOf(id, state.destinationOrder);
  const order = ballotOrder(state.destinationOrder);
  const i = order.indexOf(id);
  const prev = order[i - 1];
  const next = order[i + 1];
  const me = state.players[state.activePlayer];
  if (!seat) return null;
  return (
    <nav aria-label="Contestants in this episode" className="flex items-center gap-2">
      {prev ? (
        <Link href={`/blind-flight/show/${prev}`} className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-bf-cream/30 hover:border-bf-cream" aria-label="Previous contestant">
          <ChevronLeft className="size-5" />
        </Link>
      ) : (
        <span className="size-11 shrink-0" />
      )}
      <ol className="grid flex-1 grid-cols-3 gap-2">
        {seat.episode.cast.map((cid, k) => {
          const active = cid === id;
          const d = destinationById[cid];
          return (
            <li key={cid}>
              <Link
                href={`/blind-flight/show/${cid}`}
                aria-current={active ? 'true' : undefined}
                className={`flex min-h-11 flex-col items-center justify-center rounded-xl border-2 px-1 py-1 text-center text-xs leading-tight transition ${
                  active ? 'border-bf-custard bg-bf-custard text-bf-ink' : 'border-bf-cream/20 text-bf-cream/85 hover:border-bf-cream/50'
                }`}
              >
                <span className="font-bold">No. {seatWords[k]}</span>
                <span className="w-full truncate">{me.identityRevealed[cid] ? d.name : '???'}</span>
              </Link>
            </li>
          );
        })}
      </ol>
      {next ? (
        <Link href={`/blind-flight/show/${next}`} className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-bf-cream/30 hover:border-bf-cream" aria-label="Next contestant">
          <ChevronRight className="size-5" />
        </Link>
      ) : (
        <span className="size-11 shrink-0" />
      )}
    </nav>
  );
}

function Mystery({ id, seatWord }: { id: string; seatWord: string }) {
  const { state, dispatch, sfx } = useShow();
  const profile = profileFor(id);
  const shown = state.players[state.activePlayer].cluesShown[id] ?? 0;
  return (
    <section aria-labelledby="mystery-heading" className="grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="relative mx-auto w-full max-w-xs md:max-w-none">
        <div className="bf-silhouette relative grid aspect-[4/5] place-items-center overflow-hidden rounded-t-[3rem] rounded-b-2xl border-4 border-bf-custard/70 shadow-2xl">
          <svg viewBox="0 0 200 200" aria-hidden className="w-2/3 opacity-80">
            <circle cx="100" cy="72" r="38" fill="#0d1529" />
            <path d="M30 190 C30 130 60 112 100 112 C140 112 170 130 170 190Z" fill="#0d1529" />
            <text x="100" y="88" textAnchor="middle" fontSize="54" fill="#f3c95e" fontFamily="Georgia, serif">
              ?
            </text>
          </svg>
          <span className="absolute right-3 top-3 rotate-6 rounded border-2 border-dashed border-bf-cream/60 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-bf-cream/80">
            Par avion
          </span>
        </div>
        <div className="bf-podium mx-auto -mt-1 w-[106%] -translate-x-[3%] py-2 text-center">
          <p className="text-xs font-bold uppercase tracking-widest">Contestant number</p>
          <p className="bf-display text-3xl leading-none text-bf-custard">{seatWord}</p>
        </div>
      </div>

      <div className="space-y-5">
        <LowerThird label="Host">{pick(mysteryIntros, id)}</LowerThird>
        <div className="relative rounded-3xl bg-bf-cream p-5 text-bf-ink shadow-xl">
          <span aria-hidden className="absolute -left-2 top-8 size-5 rotate-45 bg-bf-cream" />
          <h1 id="mystery-heading" className="sr-only">
            Mystery contestant number {seatWord.toLowerCase()}
          </h1>
          <p className="font-serif text-xl italic leading-snug sm:text-2xl">“{profile.stageIntro}”</p>
        </div>

        <ol className="space-y-2" aria-label="Clues">
          {profile.clues.map((clue, i) => (
            <li key={i}>
              <AnimatePresence mode="wait" initial={false}>
                {i < shown ? (
                  <motion.p
                    key="shown"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-bf-seafoam/40 bg-bf-seafoam/10 px-4 py-3"
                  >
                    <span className="mr-2 text-xs font-bold uppercase tracking-widest text-bf-seafoam">Clue {i + 1}</span>
                    {clue}
                  </motion.p>
                ) : (
                  <motion.button
                    key="hidden"
                    type="button"
                    disabled={i !== shown}
                    onClick={() => {
                      dispatch({ type: 'revealClue', destinationId: id });
                      sfx('tick');
                    }}
                    className="flex min-h-12 w-full items-center justify-between rounded-2xl border-2 border-dashed border-bf-cream/30 px-4 py-3 text-left text-bf-cream/85 enabled:hover:border-bf-seafoam disabled:opacity-40"
                  >
                    <span>
                      <span className="mr-2 text-xs font-bold uppercase tracking-widest">Clue {i + 1}</span>
                      {i === 0 ? 'Broad hint' : i === 1 ? 'More useful' : 'Fairly obvious'}
                    </span>
                    <span className="text-sm font-semibold">{i === shown ? 'Tap to uncover' : 'Locked'}</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </li>
          ))}
        </ol>

        <button
          type="button"
          className={btn.primary + ' w-full sm:w-auto'}
          onClick={() => {
            dispatch({ type: 'revealIdentity', destinationId: id });
            sfx('mystery');
          }}
        >
          <Sparkles aria-hidden className="size-5" /> Reveal my identity
        </button>
      </div>
    </section>
  );
}

function VariantPicker({ id, current }: { id: string; current: Itinerary }) {
  const { dispatch } = useShow();
  const variants = variantsFor(id);
  if (variants.length < 2) return null;
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-bold uppercase tracking-widest text-bf-custard">Pick your dates</legend>
      <p className="text-xs text-bf-cream/70">Changing dates updates the flights, room and price, and starts a fresh price round.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {variants.map((v) => {
          const c = costBreakdownSafe(v);
          const on = v.id === current.id;
          return (
            <label
              key={v.id}
              className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border-2 px-3 py-2 text-sm ${
                on ? 'border-bf-custard bg-bf-custard/10' : 'border-bf-cream/20 hover:border-bf-cream/40'
              }`}
            >
              <input
                type="radio"
                name={`variant-${id}`}
                checked={on}
                onChange={() => dispatch({ type: 'chooseItinerary', destinationId: id, itineraryId: v.id })}
                className="mt-1 size-4 accent-[#f3c95e]"
              />
              <span>
                <span className="block font-bold">
                  {v.nights} nights · {formatDateRange(v.departDate, v.returnDate)}
                </span>
                <span className="block text-xs text-bf-cream/80">
                  {v.departureAirport} → {v.arrivalAirport} · {c ? 'Priced' : evidenceLabel[v.fareEvidence]}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function TripFacts({ it }: { it: Itinerary }) {
  const t = it.flightTimes;
  return (
    <ul className="grid gap-2 text-sm sm:grid-cols-2">
      <li className="flex gap-2">
        <CalendarDays aria-hidden className="mt-0.5 size-4 shrink-0 text-bf-seafoam" />
        <span>
          <strong>{it.nights} nights</strong>: {formatDate(it.departDate)} to {formatDate(it.returnDate)} 2027
        </span>
      </li>
      <li className="flex gap-2">
        <Plane aria-hidden className="mt-0.5 size-4 shrink-0 text-bf-seafoam" />
        <span>
          <strong>
            {it.departureAirport} → {it.arrivalAirport}
          </strong>{' '}
          · {routeLabel[it.routeType]}
          <span className="block text-xs opacity-75">{it.routeEvidence}</span>
        </span>
      </li>
      {t && (
        <li className="flex gap-2">
          <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-bf-seafoam" />
          <span>
            Out {t.leaveUK}–{t.arriveThere}, back {t.leaveThere}–{t.arriveUK} (local times)
            {it.flightNumbers && <span className="block text-xs opacity-75">{it.flightNumbers}</span>}
          </span>
        </li>
      )}
      {it.hotelName && (
        <li className="flex gap-2">
          <Hotel aria-hidden className="mt-0.5 size-4 shrink-0 text-bf-seafoam" />
          <span>
            {it.hotelName}
            {it.hotelReviewOutOf10 != null && <span className="block text-xs opacity-75">Guest rating {it.hotelReviewOutOf10}/10 at time of quote</span>}
          </span>
        </li>
      )}
    </ul>
  );
}

export function AwkwardBit({ id, it, ink = false }: { id: string; it: Itinerary; ink?: boolean }) {
  const bits = awkwardBits(id, it);
  return (
    <div className={`rounded-2xl border-2 p-4 ${ink ? 'border-bf-red/40 bg-bf-red/5' : 'border-bf-tomato/60 bg-bf-tomato/10'}`}>
      <h3 className={`flex items-center gap-2 font-bold ${ink ? 'text-bf-red' : 'text-bf-custard'}`}>
        <AlertTriangle aria-hidden className="size-4" /> The awkward bit
      </h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {bits.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    </div>
  );
}

function Revealed({ id, it, seatWord }: { id: string; it: Itinerary; seatWord?: string }) {
  const { reduceMotion } = useShow();
  const d = destinationById[id];
  const profile = profileFor(id);
  const highlights = d.highlights.slice(0, 3);
  return (
    <motion.section
      aria-labelledby="reveal-heading"
      initial={reduceMotion ? false : { clipPath: 'inset(0 50% 0 50%)' }}
      animate={{ clipPath: 'inset(0 0% 0 0%)' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-6"
    >
      <div className="overflow-hidden rounded-3xl border-4 border-bf-custard/70 shadow-2xl">
        <Photo src={d.imagePath} name={d.name} country={d.country} className="aspect-[4/3] w-full sm:aspect-[16/9]" sizes="(max-width: 1024px) 100vw, 1000px" priority showCredit />
      </div>
      <div>
        {seatWord && <p className="text-xs font-bold uppercase tracking-[0.25em] text-bf-seafoam">Contestant number {seatWord.toLowerCase()} is…</p>}
        <h1 id="reveal-heading" className="bf-logo mt-1 text-5xl sm:text-6xl">
          {d.name}
        </h1>
        <p className="mt-1 text-lg text-bf-cream/85">{d.country}</p>
        <p className="mt-3 font-serif text-xl italic text-bf-custard">{profile.shortPitch}</p>
      </div>

      {highlights.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-bf-seafoam">Three reasons to go</h2>
          <ol className="mt-2 grid gap-2 sm:grid-cols-3">
            {highlights.map((h, i) => (
              <li key={h} className="flex gap-3 rounded-2xl bg-bf-cream/5 p-3 text-sm">
                <span className="bf-display text-2xl leading-none text-bf-custard">{i + 1}</span>
                {h}
              </li>
            ))}
          </ol>
        </div>
      )}

      <AwkwardBit id={id} it={it} />

      <div className="space-y-4 rounded-2xl border border-bf-cream/15 p-4">
        <VariantPicker id={id} current={it} />
        <TripFacts it={it} />
        {d.winterTypical && (
          <p className="flex gap-2 text-sm">
            <ThermometerSnowflake aria-hidden className="mt-0.5 size-4 shrink-0 text-bf-seafoam" />
            <span>
              <strong>Typical January:</strong> {d.winterTypical} <span className="opacity-70">Not a forecast.</span>
            </span>
          </p>
        )}
        <TripLinks it={it} />
      </div>
    </motion.section>
  );
}

export default function ContestantScreen({ id }: { id: string }) {
  const { state, dispatch } = useShow();
  const d = destinationById[id];
  const inShow = state.destinationOrder.includes(id);
  const it = selectedVariant(id, state.preferredItineraryByDestination[id]);
  const me = state.players[state.activePlayer];
  const profile = profileFor(id);
  const seat = seatOf(id, state.destinationOrder);
  const seatWord = seat ? seatWords[seat.seat - 1] : undefined;
  const revealed = !profile.hasClues || Boolean(me.identityRevealed[id]) || !inShow;
  const handover = phase(state) === 'handover';

  useEffect(() => {
    if (inShow && !handover) dispatch({ type: 'setActive', destinationId: id });
  }, [id, inShow, handover, dispatch]);

  if (!d || !it) return null;

  if (handover) {
    return (
      <Shell>
        <section className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="bf-logo text-4xl">No peeking</h1>
          <p className="mt-4 text-bf-cream/85">Traveller 1 has locked in their ballot. Traveller 2 starts from the handover screen.</p>
          <Link href="/blind-flight/handover" className={btn.primary + ' mt-8'}>
            Go to the handover
          </Link>
        </section>
      </Shell>
    );
  }

  const priceDone = !costBreakdownSafe(it) || Boolean(me.priceRevealed[it.id]);

  return (
    <Shell>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:py-10">
        {inShow ? (
          <>
            <div className="space-y-2">
              <Link href="/blind-flight/show" className={btn.link}>
                ← All episodes
              </Link>
              {seat && (
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-bf-seafoam">
                  {seat.episode.bonus ? 'Bonus round' : `Episode ${seat.episode.number}`}: {seat.episode.title}
                </p>
              )}
              <Strip id={id} />
            </div>
            {revealed ? <Revealed id={id} it={it} seatWord={seatWord} /> : <Mystery id={id} seatWord={seatWord ?? 'One'} />}
            {revealed && (
              <>
                <PriceRound key={it.id} it={it} destinationName={d.name} />
                <VotePanel destinationId={id} name={d.name} ready={priceDone} />
              </>
            )}
          </>
        ) : (
          <>
            <Link href="/blind-flight/contenders" className={btn.link}>
              ← More eligible contenders
            </Link>
            <Revealed id={id} it={it} />
            <PendingOrBreakdown it={it} />
            <div className="rounded-3xl border-2 border-dashed border-bf-cream/30 p-5">
              <p className="text-bf-cream/85">{d.name} is not on tonight’s show yet. Add them as a bonus contestant to vote on them.</p>
              <button type="button" className={btn.sea + ' mt-3'} onClick={() => dispatch({ type: 'addContender', destinationId: id })}>
                <Plus aria-hidden className="size-4" /> Add {d.name} to the show
              </button>
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}

function PendingOrBreakdown({ it }: { it: Itinerary }) {
  const c = costBreakdownSafe(it);
  return (
    <div className="bf-paper rounded-3xl p-5">
      <h2 className="bf-display text-2xl text-bf-red">The price</h2>
      {c ? (
        <p className="mt-2 text-3xl font-bold">
          {formatGBP(c.headline)} <span className="text-base font-normal">for two · {formatGBP(c.perPerson, { pence: true })} each</span>
        </p>
      ) : (
        <p className="mt-2 text-xl font-bold">Price pending — flights not yet priced</p>
      )}
    </div>
  );
}
