'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Heart, RotateCcw } from 'lucide-react';
import Confetti from '@/components/Confetti';
import Photo from '@/components/Photo';
import { destinationById } from '@/lib/catalogue';
import { formatGBP } from '@/lib/pricing';
import { copy } from '../data/copy';
import { selectedVariant } from '../lib/cast';
import { costBreakdown } from '../lib/cost';
import {
  choosers,
  displayName,
  effectiveFinalists,
  episodeProgress,
  groupLabels,
  groups,
  MAX_FINALISTS,
  resultsReady,
  showEpisodes,
  validPicks,
  type GameState,
} from '../lib/state';
import { useShow } from './BlindFlightProvider';
import { NotYet, Shell } from './Chrome';
import { btn, PickChip, Scoreboard } from './ui';

function priceLine(state: GameState, id: string): string {
  const it = selectedVariant(id, state.preferredItineraryByDestination[id]);
  const c = it && costBreakdown(it);
  return c ? `${formatGBP(c.headline)} for two` : 'Price pending';
}

function ReconsiderButton({ id }: { id: string }) {
  const { state, dispatch } = useShow();
  const finalists = effectiveFinalists(state);
  const on = finalists.includes(id);
  const full = !on && finalists.length >= MAX_FINALISTS;
  return (
    <button
      type="button"
      disabled={full}
      aria-pressed={on}
      title={full ? `The final holds up to ${MAX_FINALISTS}. Remove one first.` : undefined}
      onClick={() => {
        if (state.finalists.length === 0) dispatch({ type: 'setFinalists', ids: finalists });
        dispatch({ type: 'toggleFinalist', destinationId: id });
      }}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-current/40 px-3 py-1 text-sm font-semibold transition hover:border-current aria-pressed:border-bf-seafoam aria-pressed:bg-bf-seafoam aria-pressed:text-bf-ink disabled:opacity-40"
    >
      <RotateCcw aria-hidden className="size-3.5" /> {on ? 'In the final' : 'Reconsider'}
    </button>
  );
}

/** Who chose this contestant in their episode. */
function Pickers({ id }: { id: string }) {
  const { state } = useShow();
  const e = showEpisodes(state).find((ep) => ep.cast.includes(id));
  if (!e) return null;
  const picks = validPicks(episodeProgress(state, e.id), e);
  const who = choosers(state).filter((p) => picks[p] === id);
  if (who.length === 0) return <span className="text-xs opacity-75">Nobody chose them in {e.title}</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {who.map((p) => (
        <PickChip key={p} who={state.mode === 'quick' ? 'Your choice' : `${displayName(state, p)} chose`} />
      ))}
    </span>
  );
}

function MatchTile({ id, index }: { id: string; index: number }) {
  const { state, reduceMotion } = useShow();
  const d = destinationById[id];
  return (
    <motion.li
      initial={reduceMotion ? false : { opacity: 0, rotateY: 90 }}
      animate={{ opacity: 1, rotateY: 0 }}
      transition={{ delay: 0.3 + index * 0.25, duration: 0.5 }}
      className="bf-paper overflow-hidden rounded-3xl shadow-2xl"
    >
      <Photo src={d.imagePath} name={d.name} country={d.country} className="aspect-[16/10]" sizes="(max-width: 640px) 100vw, 400px" />
      <div className="space-y-2 p-4">
        <p className="bf-display text-2xl text-bf-red">{d.name}</p>
        <p className="text-sm">
          {d.country} · {priceLine(state, id)}
        </p>
        <Pickers id={id} />
        <div>
          <ReconsiderButton id={id} />
        </div>
      </div>
    </motion.li>
  );
}

function Row({ id }: { id: string }) {
  const { state } = useShow();
  const d = destinationById[id];
  return (
    <li className="flex flex-col gap-2 rounded-2xl bg-bf-cream/5 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <Link href={`/blind-flight/show/${id}`} className="font-bold underline-offset-4 hover:underline">
          {d.name}
        </Link>
        <span className="text-sm text-bf-cream/75"> · {priceLine(state, id)}</span>
        <div className="mt-1">
          <Pickers id={id} />
        </div>
      </div>
      <ReconsiderButton id={id} />
    </li>
  );
}

function Group({ title, ids, line, open = true }: { title: string; ids: string[]; line?: string; open?: boolean }) {
  if (ids.length === 0) return null;
  return (
    <details open={open} className="rounded-3xl border border-bf-cream/15 bg-black/20 p-4 sm:p-5">
      <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2">
        <span className="bf-display text-2xl text-bf-custard">{title}</span>
        <span className="rounded-full bg-bf-cream/10 px-3 py-1 text-sm">{ids.length}</span>
      </summary>
      {line && <p className="mt-1 font-serif italic text-bf-cream/80">{line}</p>}
      <ul className="mt-3 space-y-2">
        {ids.map((id) => (
          <Row key={id} id={id} />
        ))}
      </ul>
    </details>
  );
}

export default function ResultsScreen() {
  const { state, reduceMotion, sfx } = useShow();
  const ready = resultsReady(state);
  const [burst, setBurst] = useState(0);

  const g = ready ? groups(state) : null;
  const hasMatches = g ? (g.kind === 'two_person' ? g.match.length > 0 : g.chosen.length > 0) : false;

  useEffect(() => {
    if (ready && hasMatches) {
      sfx('applause');
      if (!reduceMotion) setBurst((b) => b + 1);
    }
    // Once per visit.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready || !g) {
    return (
      <Shell>
        <NotYet title="The show isn’t over yet">
          <p>Every episode needs a decision before the results come in.</p>
        </NotYet>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:py-12">
        <section className="bf-tv relative overflow-hidden rounded-[2rem] px-4 py-10 text-center sm:px-10">
          {burst > 0 && <Confetti burstKey={burst} />}
          {g.kind === 'two_person' ? (
            g.match.length > 0 ? (
              <>
                <Heart aria-hidden className="mx-auto size-12 fill-bf-tomato text-bf-tomato" />
                <h1 className="bf-logo mt-2 text-5xl sm:text-7xl">
                  {g.match.length === 1 ? 'It’s a Match!' : `${g.match.length} Matches!`}
                </h1>
                <p className="mx-auto mt-4 max-w-xl font-serif text-lg italic text-bf-cream/90">{copy.match}</p>
              </>
            ) : (
              <>
                <h1 className="bf-logo text-4xl sm:text-6xl">{copy.noMatches}</h1>
                <p className="mx-auto mt-4 max-w-xl text-bf-cream/90">
                  You never chose the same contestant. Every split decision is below, and anything can be reconsidered.
                </p>
              </>
            )
          ) : (
            <>
              <h1 className="bf-logo text-4xl sm:text-6xl">Your shortlist</h1>
              <p className="mx-auto mt-4 max-w-xl text-bf-cream/90">One choice per episode, made together. No matchmaking required.</p>
            </>
          )}
        </section>

        {g.kind === 'two_person' ? (
          <>
            {g.match.length > 0 && (
              <section aria-labelledby="matches">
                <h2 id="matches" className="sr-only">
                  Matches
                </h2>
                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" style={{ perspective: 1000 }}>
                  {g.match.map((id, i) => (
                    <MatchTile key={id} id={id} index={i} />
                  ))}
                </ul>
              </section>
            )}
            <Group title={groupLabels.split} ids={g.split} line={copy.disagreement} />
            <Group title={groupLabels.unpicked} ids={g.unpicked} line="Nobody chose them. You can still reconsider." open={false} />
          </>
        ) : (
          <>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {g.chosen.map((id, i) => (
                <MatchTile key={id} id={id} index={i} />
              ))}
            </ul>
            <Group title={groupLabels.unpicked} ids={g.unpicked} open={false} />
          </>
        )}

        <section className="space-y-2 rounded-3xl border border-bf-cream/15 p-4 sm:p-5">
          <h2 className="font-bold">Final scores</h2>
          <Scoreboard detail />
          {state.mode === 'two_person' && <p className="text-xs text-bf-cream/70">Points never change a match. In a split grand final, the leader gets the casting vote.</p>}
        </section>

        <section className="flex flex-col items-center gap-4 text-center">
          <p className="font-serif text-xl italic text-bf-custard">The final: second chances, then one secret choice each.</p>
          <Link href="/blind-flight/final" className={btn.primary + ' text-xl'}>
            To the grand final
          </Link>
          <Link href="/blind-flight/compare" className={btn.link}>
            Or skip straight to the small print
          </Link>
        </section>

        <section className="space-y-3 rounded-3xl border border-bf-cream/15 p-4 sm:p-5">
          <h2 className="font-bold">Change your minds</h2>
          <p className="text-sm text-bf-cream/80">Open any episode and use Choose again, or bring in more contestants for a bonus round.</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/blind-flight/show" className={btn.ghost}>
              All episodes
            </Link>
            <Link href="/blind-flight/contenders" className={btn.ghost}>
              Add more contenders
            </Link>
          </div>
        </section>
      </div>
    </Shell>
  );
}
