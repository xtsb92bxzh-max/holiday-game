'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Heart, RotateCcw } from 'lucide-react';
import Confetti from '@/components/Confetti';
import Photo from '@/components/Photo';
import { destinationById, itineraryById } from '@/lib/catalogue';
import { formatGBP } from '@/lib/pricing';
import { copy } from '../data/copy';
import { selectedVariant } from '../lib/cast';
import { costBreakdown, guessVerdict } from '../lib/cost';
import { displayName, effectiveFinalists, groups, MAX_FINALISTS, players, resultsReady, type GameState, type PlayerId } from '../lib/state';
import { matchLabels } from '../lib/voteMatching';
import { useShow } from './BlindFlightProvider';
import { NotYet, Shell } from './Chrome';
import { btn, VoteChip } from './ui';

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

function Votes({ id }: { id: string }) {
  const { state } = useShow();
  if (state.mode === 'quick') return <VoteChip vote={state.players.traveller1.votes[id]} />;
  return (
    <span className="flex flex-wrap gap-1">
      {players.map((p) => (
        <VoteChip key={p} vote={state.players[p].votes[id]} who={displayName(state, p)} />
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
        <Votes id={id} />
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
          <Votes id={id} />
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

function GuessScores() {
  const { state } = useShow();
  const who: PlayerId[] = state.mode === 'quick' ? ['traveller1'] : players;
  const scores = who.map((p) => {
    let points = 0;
    let rounds = 0;
    const me = state.players[p];
    for (const [itId, g] of Object.entries(me.guessedPricesGBP)) {
      if (g == null || !me.priceRevealed[itId]) continue;
      const total = selectedVariantTotal(itId);
      if (total == null) continue;
      rounds++;
      points += guessVerdict(g, total).points;
    }
    return { p, points, rounds };
  });
  if (scores.every((s) => s.rounds === 0)) return null;
  return (
    <section className="rounded-3xl border border-bf-cream/15 p-4 text-sm">
      <h2 className="font-bold text-bf-custard">Price-guessing scoreboard</h2>
      <ul className="mt-2 flex flex-wrap gap-4">
        {scores.map((s) => (
          <li key={s.p}>
            {displayName(state, s.p)}: <strong>{s.points}</strong> points from {s.rounds} guess{s.rounds === 1 ? '' : 'es'}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-bf-cream/70">For entertainment only. Guessing well does not change any match.</p>
    </section>
  );
}

function selectedVariantTotal(itineraryId: string): number | null {
  const it = itineraryById[itineraryId];
  return it ? (costBreakdown(it)?.totalForTwo ?? null) : null;
}

export default function ResultsScreen() {
  const { state, dispatch, reduceMotion, sfx } = useShow();
  const router = useRouter();
  const ready = resultsReady(state);
  const [burst, setBurst] = useState(0);

  const g = ready ? groups(state) : null;
  const hasMatches = g ? (g.kind === 'two_person' ? g.match.length > 0 : g.keep.length > 0) : false;

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
        <NotYet title="The votes aren’t in yet">
          <p>
            {state.mode === 'quick'
              ? 'Lock in your shared ballot to see the shortlist.'
              : 'Both travellers need to lock in their ballots before anyone sees a match.'}
          </p>
        </NotYet>
      </Shell>
    );
  }

  const edit = (p: PlayerId) => {
    dispatch({ type: 'editBallot', player: p });
    router.push('/blind-flight/show');
  };

  return (
    <Shell>
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:py-12">
        <section className="bf-tv relative overflow-hidden rounded-[2rem] px-4 py-10 text-center sm:px-10">
          {burst > 0 && <Confetti burstKey={burst} />}
          {g.kind === 'two_person' ? (
            g.match.length > 0 ? (
              <>
                <Heart aria-hidden className="mx-auto size-12 fill-bf-tomato text-bf-tomato" />
                <h1 className="bf-logo mt-2 text-5xl sm:text-7xl">It’s a Match!</h1>
                <p className="mx-auto mt-4 max-w-xl font-serif text-lg italic text-bf-cream/90">{copy.match}</p>
              </>
            ) : (
              <>
                <h1 className="bf-logo text-4xl sm:text-6xl">{copy.noMatches}</h1>
                <p className="mx-auto mt-4 max-w-xl text-bf-cream/90">
                  Nobody got two hearts tonight.{' '}
                  {g.potential.length > 0
                    ? `There ${g.potential.length === 1 ? 'is' : 'are'} ${g.potential.length} potential match${g.potential.length === 1 ? '' : 'es'} to talk about, and anything can be reconsidered.`
                    : 'Look through the disagreements below and reconsider anything worth a second date.'}
                </p>
              </>
            )
          ) : (
            <>
              <h1 className="bf-logo text-4xl sm:text-6xl">Your shortlist</h1>
              <p className="mx-auto mt-4 max-w-xl text-bf-cream/90">One shared ballot, so these are your joint keeps and maybes. No matchmaking required.</p>
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
            <Group title={matchLabels.potential} ids={g.potential} line="A keep and a maybe, or two maybes. Promising." />
            <Group title={matchLabels.questions} ids={g.questions} line={copy.disagreement} open={g.match.length === 0} />
            <Group title={matchLabels.mutual_rejection} ids={g.mutual_rejection} line="Both of you passed. You can still reconsider." open={false} />
            <Group title={matchLabels.incomplete} ids={g.incomplete} line="At least one of you didn’t vote. These count neither way." open={false} />
          </>
        ) : (
          <>
            {g.keep.length > 0 && (
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {g.keep.map((id, i) => (
                  <MatchTile key={id} id={id} index={i} />
                ))}
              </ul>
            )}
            {g.keep.length === 0 && <p className="text-center text-bf-cream/85">Nothing kept yet. The maybes are below.</p>}
            <Group title="Maybe" ids={g.maybe} />
            <Group title="Passed" ids={g.pass} open={false} />
            <Group title="Not voted" ids={g.unvoted} open={false} />
          </>
        )}

        <GuessScores />

        <section className="flex flex-col items-center gap-4 text-center">
          <p className="font-serif text-xl italic text-bf-custard">{copy.comparison}</p>
          <Link href="/blind-flight/compare" className={btn.primary + ' text-xl'}>
            To the grand final
          </Link>
        </section>

        <section className="space-y-3 rounded-3xl border border-bf-cream/15 p-4 sm:p-5">
          <h2 className="font-bold">Change your minds</h2>
          <div className="flex flex-wrap gap-2">
            {state.mode === 'quick' ? (
              <button type="button" className={btn.ghost} onClick={() => edit('traveller1')}>
                Edit our votes
              </button>
            ) : (
              players.map((p) => (
                <button key={p} type="button" className={btn.ghost} onClick={() => edit(p)}>
                  Edit {displayName(state, p)}’s votes
                </button>
              ))
            )}
            <Link href="/blind-flight/contenders" className={btn.ghost}>
              Add more contenders
            </Link>
          </div>
          {state.mode === 'two_person' && (
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="size-5 accent-[#4acdc4]"
                checked={state.showOtherVotes}
                onChange={(e) => dispatch({ type: 'setShowOtherVotes', value: e.target.checked })}
              />
              Show the other traveller’s vote while editing
            </label>
          )}
        </section>
      </div>
    </Shell>
  );
}
