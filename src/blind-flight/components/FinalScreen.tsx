'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Crown, Heart, Lock, RotateCcw } from 'lucide-react';
import Confetti from '@/components/Confetti';
import Photo from '@/components/Photo';
import { destinationById } from '@/lib/catalogue';
import { formatGBP } from '@/lib/pricing';
import { copy, finalCopy } from '../data/copy';
import {
  chosenIds,
  choosers,
  displayName,
  finalPool,
  finalStage,
  finalVerdict,
  leader,
  players,
  priceOf,
  secondChanceOptions,
} from '../lib/state';
import { useShow } from './BlindFlightProvider';
import { NotYet, Shell } from './Chrome';
import { HandoverCover } from './EpisodeScreen';
import { btn, HostSays, Scoreboard } from './ui';

function priceText(n: number | null) {
  return n != null ? `${formatGBP(n)} for two` : 'Price pending';
}

function SecondChance() {
  const { state, dispatch, sfx } = useShow();
  const options = secondChanceOptions(state);
  const through = chosenIds(state);
  const ready = choosers(state).every((pl) => state.final.secondChance[pl] !== undefined);
  return (
    <section aria-labelledby="second-heading" className="space-y-6">
      <div className="space-y-2">
        <h2 id="second-heading" className="bf-display text-3xl text-bf-custard">
          Second chances
        </h2>
        <HostSays>{finalCopy.secondChance}</HostSays>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-bf-seafoam">Already through</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {through.map((id) => (
            <li key={id} className="rounded-full bg-bf-custard px-3 py-1 text-sm font-bold text-bf-ink">
              {destinationById[id].name}
            </li>
          ))}
        </ul>
      </div>

      {choosers(state).map((pl) => {
        const current = state.final.secondChance[pl];
        return (
          <fieldset key={pl} className="space-y-3 rounded-3xl border border-bf-cream/15 bg-black/20 p-4">
            <legend className="px-2 font-bold">{state.mode === 'quick' ? 'Your second chance' : `${displayName(state, pl)}’s second chance`}</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {options.map((id) => {
                const d = destinationById[id];
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={current === id}
                    onClick={() => {
                      dispatch({ type: 'secondChance', player: pl, destinationId: id });
                      sfx('tick');
                    }}
                    className="overflow-hidden rounded-2xl border-2 border-bf-cream/20 text-left transition hover:border-bf-cream/60 aria-pressed:border-bf-custard aria-pressed:bg-bf-custard/15"
                  >
                    <Photo src={d.imagePath} name={d.name} country={d.country} className="aspect-[16/10] w-full" sizes="(max-width: 640px) 50vw, 240px" />
                    <span className="block px-2 py-1.5 text-sm">
                      <span className="block font-bold">{d.name}</span>
                      <span className="text-xs text-bf-cream/75">{priceText(priceOf(state, id))}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              aria-pressed={current === null}
              onClick={() => dispatch({ type: 'secondChance', player: pl, destinationId: null })}
              className={btn.ghost + ' aria-pressed:border-bf-seafoam aria-pressed:bg-bf-seafoam aria-pressed:text-bf-ink'}
            >
              No thanks
            </button>
          </fieldset>
        );
      })}

      <button
        type="button"
        className={btn.gold + ' w-full text-xl sm:w-auto'}
        disabled={!ready}
        onClick={() => {
          dispatch({ type: 'startFinal' });
          sfx('mystery');
        }}
      >
        {ready ? 'On to the final' : 'Everyone decides first'}
      </button>
    </section>
  );
}

function FinalChoosing() {
  const { state, dispatch, sfx } = useShow();
  const [selected, setSelected] = useState<string>();
  const pool = finalPool(state);
  const quick = state.mode === 'quick';
  const who = displayName(state, state.activePlayer);
  return (
    <section aria-labelledby="final-choose" className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-bf-seafoam">{quick ? 'Choosing together' : `Choosing: ${who}`}</p>
        <h2 id="final-choose" className="bf-logo text-4xl">
          {quick ? 'Which one is the holiday?' : `${who}, which one is the holiday?`}
        </h2>
        <HostSays>{finalCopy.choose}</HostSays>
      </div>
      <div role="radiogroup" aria-labelledby="final-choose" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pool.map((id) => {
          const d = destinationById[id];
          const on = selected === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                setSelected(id);
                sfx('tick');
              }}
              className={`overflow-hidden rounded-3xl border-4 text-left transition ${on ? 'border-bf-custard bg-bf-custard/15' : 'border-bf-cream/20 bg-black/20 hover:border-bf-cream/50'}`}
            >
              <Photo src={d.imagePath} name={d.name} country={d.country} className="aspect-[16/9] w-full" sizes="(max-width: 640px) 100vw, 360px" />
              <span className="flex items-center justify-between gap-2 p-3">
                <span>
                  <span className="bf-display block text-2xl text-bf-custard">{d.name}</span>
                  <span className="text-sm text-bf-cream/80">{priceText(priceOf(state, id))}</span>
                </span>
                {on && <Heart aria-hidden className="size-6 shrink-0 fill-bf-tomato text-bf-tomato" />}
              </span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className={btn.primary + ' w-full text-xl sm:w-auto'}
        disabled={!selected}
        onClick={() => {
          if (!selected) return;
          dispatch({ type: 'finalPick', destinationId: selected });
          sfx('keep');
        }}
      >
        <Lock aria-hidden className="size-5" /> {selected ? `Lock in ${destinationById[selected].name}` : 'Choose your holiday'}
      </button>
    </section>
  );
}

function Winner({ id }: { id: string }) {
  const { state, reduceMotion, sfx } = useShow();
  const [burst, setBurst] = useState(0);
  const d = destinationById[id];
  useEffect(() => {
    sfx('applause');
    if (!reduceMotion) setBurst((b) => b + 1);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <section className="bf-tv relative overflow-hidden rounded-[2rem] text-center">
      {burst > 0 && <Confetti burstKey={burst} />}
      <Photo src={d.imagePath} name={d.name} country={d.country} className="aspect-[16/9] w-full" sizes="(max-width: 1024px) 100vw, 1000px" priority showCredit />
      <div className="px-4 py-8">
        <Crown aria-hidden className="mx-auto size-12 text-bf-custard" />
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.25em] text-bf-seafoam">And the winner is…</p>
        <h2 className="bf-logo mt-1 text-5xl sm:text-7xl">{d.name}</h2>
        <p className="mt-2 text-lg">
          {d.country} · {priceText(priceOf(state, id))}
        </p>
        <p className="mx-auto mt-3 max-w-xl font-serif italic text-bf-cream/90">{copy.grandFinal}</p>
      </div>
    </section>
  );
}

function Decided() {
  const { state, dispatch } = useShow();
  const router = useRouter();
  const v = finalVerdict(state);
  const top = leader(state);
  if (!v) return null;
  const winner = state.winnerDestinationId;

  const talk = (ids: string[]) => {
    dispatch({ type: 'setFinalists', ids });
    router.push('/blind-flight/compare');
  };

  return (
    <section className="space-y-6">
      {v.kind === 'split' && !winner && (
        <div className="bf-tv space-y-4 rounded-[2rem] px-4 py-8 text-center sm:px-10">
          <h2 className="bf-logo text-4xl sm:text-5xl">Split decision</h2>
          <ul className="space-y-1 text-lg">
            {players.map((pl) => (
              <li key={pl}>
                {displayName(state, pl)} chose <strong>{destinationById[v.ids[pl]].name}</strong>
              </li>
            ))}
          </ul>
          <p className="mx-auto max-w-xl font-serif italic text-bf-cream/90">{finalCopy.split}</p>
          <Scoreboard detail className="justify-center" />
          <div className="flex flex-col items-center gap-3">
            {top ? (
              <button type="button" className={btn.gold + ' text-xl'} onClick={() => dispatch({ type: 'setWinner', destinationId: v.ids[top] })}>
                <Crown aria-hidden className="size-5" /> {displayName(state, top)} has the casting vote: {destinationById[v.ids[top]].name}
              </button>
            ) : (
              <p className="text-sm text-bf-cream/80">The scores are level, so nobody has the casting vote.</p>
            )}
            <button type="button" className={btn.ghost} onClick={() => talk([v.ids.traveller1, v.ids.traveller2])}>
              Talk it over in the comparison
            </button>
          </div>
        </div>
      )}

      {winner && <Winner id={winner} />}

      {winner && (
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <button type="button" className={btn.primary + ' text-xl'} onClick={() => talk([winner, ...finalPool(state).filter((id) => id !== winner)])}>
            Check the small print
          </button>
        </div>
      )}

      <button
        type="button"
        className={btn.ghost}
        onClick={() => {
          if (window.confirm('Run the grand final again, second chances and all?')) dispatch({ type: 'finalAgain' });
        }}
      >
        <RotateCcw aria-hidden className="size-4" /> Replay the final
      </button>
    </section>
  );
}

export default function FinalScreen() {
  const { state, dispatch } = useShow();
  const stage = finalStage(state);

  if (stage === 'locked') {
    return (
      <Shell>
        <NotYet title="The final isn’t ready yet">
          <p>Every episode needs a decision before the grand final.</p>
        </NotYet>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:py-12">
        <div className="space-y-3">
          <Link href="/blind-flight/results" className={btn.link}>
            ← Results
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-bf-seafoam">The grand final</p>
          <h1 className="bf-logo text-4xl sm:text-5xl">One holiday to rule them all</h1>
          <Scoreboard />
        </div>
        {stage === 'secondChance' && <SecondChance />}
        {stage === 'choosing' && <FinalChoosing key={state.activePlayer} />}
        {stage === 'handover' && (
          <HandoverCover what="the same finalists" onPass={() => dispatch({ type: 'finalPassPhone' })} onUndo={() => dispatch({ type: 'finalUnpick' })} />
        )}
        {stage === 'decided' && <Decided />}
      </div>
    </Shell>
  );
}
