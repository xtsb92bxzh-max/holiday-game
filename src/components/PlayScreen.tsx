'use client';

import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Snowflake, Sparkle, ThermometerSun, TriangleAlert } from 'lucide-react';
import { useGame } from './GameContext';
import { mainCast, mysteryCast, selectedItinerary, routeLabel } from '@/lib/catalogue';
import { formatDateRange } from '@/lib/dates';
import { currentGuess } from '@/lib/gameState';
import Photo from './Photo';
import PriceGame from './PriceGame';
import VotingControls from './VotingControls';
import ItineraryPicker from './ItineraryPicker';
import { BookingLinks, FlightFacts } from './TripDetails';
import { btn, HostLine } from './ui';

export default function PlayScreen({ mode }: { mode: 'main' | 'mystery' }) {
  const { state, dispatch, sfx } = useGame();
  const cast = mode === 'main' ? mainCast : mysteryCast;
  const index = Math.min(mode === 'main' ? state.playIndex : state.mysteryIndex, cast.length - 1);
  const dest = cast[index];
  const it = selectedItinerary(dest, state.itineraryChoice[dest.id]);
  const revealed = currentGuess(state, dest.id, it.id)?.revealed ?? false;
  const isLast = index === cast.length - 1;

  const go = (i: number) => {
    sfx('tick');
    dispatch({ type: mode === 'main' ? 'setPlayIndex' : 'setMysteryIndex', index: i });
    window.scrollTo({ top: 0 });
  };

  const prizeNo = String(index + 1).padStart(2, '0');

  return (
    <section className="mx-auto max-w-6xl px-4 pb-12 pt-5 sm:pt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="font-display text-xs tracking-[0.25em] text-sky">
            {mode === 'main' ? 'Rounds two and three' : 'Bonus round'}
          </p>
          <h2 className="marquee-text text-2xl sm:text-4xl">
            {mode === 'main' ? 'Guess the Holiday Price!' : 'The Mystery Contestants'}
          </h2>
        </div>
        <button className={btn.ghost} onClick={() => dispatch({ type: 'go', screen: 'conveyor' })}>
          Back to the belt
        </button>
      </div>
      {mode === 'mystery' && (
        <HostLine className="mb-4 max-w-3xl">
          These hopefuls have flights on the timetable and a hotel quote, but nobody has pinned down a fare. Judge them on
          charm alone.
        </HostLine>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={dest.id}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ type: 'spring', stiffness: 200, damping: 26 }}
          className="grid gap-5 lg:grid-cols-[1.15fr_1fr] lg:gap-8"
        >
          {/* Prize card */}
          <article className="overflow-hidden rounded-2xl bg-paper text-ink shadow-[0_14px_40px_#0008]" aria-labelledby={`title-${dest.id}`}>
            <div className="relative">
              <Photo
                src={dest.imagePath}
                name={dest.name}
                country={dest.country}
                className="aspect-video w-full"
                sizes="(max-width: 1024px) 100vw, 600px"
                priority
                showCredit
              />
              <div className="absolute left-3 top-3 rounded-lg bg-red px-3 py-1.5 font-display text-sm tracking-wider text-cream shadow-[0_3px_0_#7a1016] sm:text-base">
                {mode === 'main' ? 'PRIZE' : 'MYSTERY'} {prizeNo} · {dest.name.toUpperCase()}
              </div>
            </div>
            <div className="space-y-4 p-4 sm:p-6">
              <header>
                <h3 id={`title-${dest.id}`} className="font-serif text-3xl font-semibold leading-tight sm:text-4xl">
                  {dest.name}
                  <span className="ml-2 align-middle font-sans text-base font-normal text-ink/60">{dest.country}</span>
                </h3>
                <p className="mt-1 font-serif text-lg italic text-ink/80">{dest.prizeLine ?? dest.intro}</p>
              </header>

              <ul className="flex flex-wrap gap-2 text-sm" aria-label="Trip facts">
                <li className="rounded-full bg-cobalt px-3 py-1 font-semibold text-white">{it.nights} nights</li>
                <li className="rounded-full bg-ink/10 px-3 py-1">{formatDateRange(it.departDate, it.returnDate)} 2027</li>
                <li className="rounded-full bg-ink/10 px-3 py-1">From {it.departureAirport === 'EDI' ? 'Edinburgh' : 'Glasgow'}</li>
                <li className="rounded-full bg-ink/10 px-3 py-1">{routeLabel[it.routeType]}</li>
              </ul>

              <a
                href={`#price-${dest.id}`}
                className="inline-flex min-h-11 items-center rounded-full bg-red px-4 text-sm font-semibold text-cream lg:hidden"
              >
                Skip to the price guess ↓
              </a>

              <ItineraryPicker
                destination={dest}
                selected={it}
                tone="light"
                onChoose={(id) => dispatch({ type: 'chooseItinerary', destinationId: dest.id, itineraryId: id })}
              />

              {dest.highlights.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">Reasons to go</p>
                  <ul className="mt-1 space-y-1">
                    {dest.highlights.slice(0, 3).map((h) => (
                      <li key={h} className="flex gap-2">
                        <Sparkle aria-hidden className="mt-1 size-3.5 shrink-0 text-mustard" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="flex gap-2 rounded-lg bg-red/10 p-3 text-sm">
                <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-red" />
                <span>
                  <strong>Honest caution: </strong>
                  {dest.caution}
                </span>
              </p>

              {dest.winterTypical && (
                <p className="flex gap-2 text-sm text-ink/80">
                  {/warm|sun|1[5-9]|2\d/.test(dest.winterTypical) ? (
                    <ThermometerSun aria-hidden className="mt-0.5 size-4 shrink-0" />
                  ) : (
                    <Snowflake aria-hidden className="mt-0.5 size-4 shrink-0" />
                  )}
                  <span>
                    {dest.winterTypical} <span className="text-ink/55">Typical January, not a forecast.</span>
                  </span>
                </p>
              )}

              <details className="group rounded-lg border border-ink/15 p-3">
                <summary className="cursor-pointer list-none font-semibold marker:hidden">
                  Flights, room and links <span className="text-ink/50 group-open:hidden">(show)</span>
                </summary>
                <div className="mt-3 space-y-4">
                  <FlightFacts it={it} />
                  <BookingLinks it={it} className="text-cobalt" />
                </div>
              </details>
            </div>
          </article>

          {/* Game panel */}
          <div id={`price-${dest.id}`} className="scroll-mt-28 space-y-4">
            <PriceGame destinationId={dest.id} it={it} />

            <div className={`rounded-2xl bg-paper p-4 text-ink transition sm:p-5 ${revealed ? 'ring-4 ring-gold' : ''}`}>
              <p className="mb-3 text-center font-display text-sm tracking-widest text-red">
                {revealed ? 'Keep it, maybe, or bin it?' : 'Or decide without peeking'}
              </p>
              <VotingControls destinationId={dest.id} />
            </div>

            <nav className="flex items-center justify-between gap-3" aria-label="Prize navigation">
              <button className={btn.ghost} onClick={() => go(index - 1)} disabled={index === 0}>
                <ArrowLeft aria-hidden className="size-4" /> Previous
              </button>
              <span className="text-sm text-cream/70">
                {index + 1} / {cast.length}
              </span>
              {!isLast ? (
                <button className={btn.gold} onClick={() => go(index + 1)}>
                  Next prize <ArrowRight aria-hidden className="size-4" />
                </button>
              ) : mode === 'main' && mysteryCast.length > 0 ? (
                <button className={btn.gold} onClick={() => dispatch({ type: 'go', screen: 'mystery' })}>
                  Mystery round <ArrowRight aria-hidden className="size-4" />
                </button>
              ) : (
                <button className={btn.gold} onClick={() => dispatch({ type: 'go', screen: 'final' })}>
                  Grand Final <ArrowRight aria-hidden className="size-4" />
                </button>
              )}
            </nav>
            {mode === 'main' && isLast && (
              <button className={`${btn.ghost} w-full`} onClick={() => dispatch({ type: 'go', screen: 'final' })}>
                Skip the mystery round and go to the Grand Final
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
