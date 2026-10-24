'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EyeOff, Lock, Smartphone } from 'lucide-react';
import Photo from '@/components/Photo';
import { destinationById } from '@/lib/catalogue';
import { formatDateRange } from '@/lib/dates';
import { formatGBP } from '@/lib/pricing';
import { copy } from '../data/copy';
import { catchesFor, isFeatured, pitchFor, selectedVariant } from '../lib/cast';
import { costBreakdown } from '../lib/cost';
import { voteLabels, type Vote } from '../lib/matching';
import { ballotIds, ballotStep, currentVoter, nameOf, phaseHref, votedCount, type PlayerId } from '../lib/state';
import { ProgressControls, Shell } from './Chrome';
import { useShow, useVisit } from './ShowProvider';
import { btn, EvidenceStatus, HostLine, RoundHeading, SourceStatus, TripFacts, TripLinks, VariantPicker } from './ui';

const voteStyle: Record<Vote, string> = {
  yes: 'peer-checked:bg-gb-teal peer-checked:text-gb-paper peer-checked:border-gb-teal',
  maybe: 'peer-checked:bg-gb-gold peer-checked:text-gb-black peer-checked:border-gb-gold',
  no: 'peer-checked:bg-gb-tomato peer-checked:text-gb-paper peer-checked:border-gb-tomato',
};

function BallotCard({ id, voter }: { id: string; voter: PlayerId }) {
  const { state, dispatch, sfx } = useShow();
  const d = destinationById[id];
  const it = selectedVariant(id, state.preferredItineraryIds[id]);
  if (!d || !it) return null;
  const c = costBreakdown(it);
  const current = state.ballots[voter][id];
  const catches = catchesFor(id, it);
  return (
    <li className="gb-paper overflow-hidden rounded-2xl shadow-lg">
      <div className="grid grid-cols-[5.5rem_1fr] gap-3 p-3 sm:grid-cols-[8rem_1fr]">
        <Photo src={d.imagePath} name={d.name} country={d.country} className="aspect-square rounded-xl" sizes="128px" />
        <div className="min-w-0 space-y-1">
          <h2 className="gb-display text-2xl leading-none text-gb-navy">
            {d.name}
            {!isFeatured(id) && <span className="ml-2 align-middle text-xs font-sans font-bold normal-case tracking-normal text-gb-teal">Added</span>}
          </h2>
          <p className="text-xs opacity-75">{d.country}</p>
          <p className="text-sm font-semibold">
            {c ? `${formatGBP(c.totalForTwo, { pence: true })} for two · ${formatGBP(c.perPerson, { pence: true })} each` : 'Total unknown: flights unpriced'}
          </p>
          <p className="text-xs opacity-80">
            {formatDateRange(it.departDate, it.returnDate)} · {it.nights} nights · {it.departureAirport} → {it.arrivalAirport}
          </p>
          {catches[0] && <p className="text-xs text-gb-tomato">The catch: {catches[0]}</p>}
        </div>
      </div>
      <details className="border-t border-gb-black/10 px-3 text-sm">
        <summary className="flex min-h-11 cursor-pointer items-center font-semibold">Reasons, all the catches and links</summary>
        <div className="space-y-3 pb-3">
          <p className="font-serif italic">{pitchFor(id)}</p>
          {d.highlights.length > 0 && (
            <ul className="list-disc space-y-1 pl-5">
              {d.highlights.slice(0, 3).map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          )}
          <ul className="list-disc space-y-1 pl-5 text-gb-tomato">
            {catches.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <TripFacts it={it} />
          <EvidenceStatus it={it} />
          <VariantPicker id={id} />
          <TripLinks it={it} />
          <SourceStatus />
        </div>
      </details>
      <fieldset className="grid grid-cols-3 gap-2 border-t border-gb-black/10 p-3">
        <legend className="sr-only">Your vote on {d.name}</legend>
        {(['yes', 'maybe', 'no'] as const).map((v) => (
          <label key={v} className="relative">
            <input
              type="radio"
              name={`vote-${voter}-${id}`}
              value={v}
              checked={current === v}
              onChange={() => {
                dispatch({ type: 'vote', destinationId: id, vote: v });
                sfx(v === 'yes' ? 'keep' : v === 'maybe' ? 'maybe' : 'bin');
              }}
              className="peer sr-only"
            />
            <span
              className={`gb-display flex min-h-12 cursor-pointer items-center justify-center rounded-xl border-2 border-gb-black/25 text-xl transition peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gb-gold hover:border-gb-black ${voteStyle[v]}`}
            >
              {voteLabels[v]}
            </span>
          </label>
        ))}
      </fieldset>
    </li>
  );
}

function Voting({ voter }: { voter: PlayerId }) {
  const { state, dispatch } = useShow();
  const router = useRouter();
  const ids = ballotIds(state);
  const { voted, total } = votedCount(state, voter);
  const quick = state.mode === 'quick';
  const editing = state.editing === voter;
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), [voter]);

  const lock = () => {
    const missing = total - voted;
    if (missing > 0 && !window.confirm(`${missing} not voted yet. They will show as “Not voted”, never as No. Lock in anyway?`)) return;
    if (editing) dispatch({ type: 'finishEdit' });
    else dispatch({ type: 'lockBallot' });
    if (editing && state.resultsRevealed) router.push(phaseHref.results);
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      <div className="space-y-2">
        <h2 ref={heading} tabIndex={-1} className="gb-display text-3xl text-gb-gold outline-none">
          {quick ? 'Your shared ballot' : `${editing ? 'Private edit: ' : ''}${nameOf(state, voter)}’s ballot`}
        </h2>
        {!quick && (
          <p className="flex items-start gap-2 text-sm text-gb-paper/85">
            <EyeOff aria-hidden className="mt-0.5 size-4 shrink-0" />
            {voter === 'a'
              ? `${nameOf(state, 'b')}: look away. These votes stay hidden until you both reveal the results.`
              : `${nameOf(state, 'a')}’s votes are hidden and are not on this screen. Vote as you like.`}
          </p>
        )}
        <p className="text-sm text-gb-paper/80">{copy.ballot.intro}</p>
      </div>
      <ul className="grid gap-4 lg:grid-cols-2">
        {ids.map((id) => (
          <BallotCard key={id} id={id} voter={voter} />
        ))}
      </ul>
      <div className="gb-no-print sticky bottom-0 z-30 -mx-4 border-t border-gb-paper/15 bg-gb-black/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <p className="text-sm" aria-live="polite">
            <strong>{voted}</strong> of {total} voted
          </p>
          <button type="button" className={btn.primary} onClick={lock}>
            <Lock aria-hidden className="size-5" /> {editing ? 'Done editing' : 'Lock in my votes'}
          </button>
        </div>
      </div>
    </>
  );
}

function Handover() {
  const { state, dispatch } = useShow();
  return (
    <section className="mx-auto max-w-xl space-y-6 py-8 text-center">
      <Smartphone aria-hidden className="mx-auto size-16 text-gb-gold" />
      <h2 className="gb-wordmark text-4xl">Pass the phone</h2>
      <HostLine>{copy.ballot.handover}</HostLine>
      <p className="text-gb-paper/85">
        {nameOf(state, 'a')}’s votes are locked and hidden. Nothing on the next screen shows them.
      </p>
      <div className="flex flex-col items-center gap-3">
        <button type="button" className={btn.primary} onClick={() => dispatch({ type: 'startBallotB' })}>
          I’m {nameOf(state, 'b')}. Start my ballot
        </button>
        <button type="button" className={btn.link} onClick={() => dispatch({ type: 'editBallot', player: 'a' })}>
          {nameOf(state, 'a')}: change my votes first
        </button>
      </div>
    </section>
  );
}

function ReadyToReveal() {
  const { state, dispatch, sfx } = useShow();
  const router = useRouter();
  const quick = state.mode === 'quick';
  return (
    <section className="mx-auto max-w-xl space-y-6 py-8 text-center">
      <h2 className="gb-wordmark text-4xl">{quick ? 'Ballot in' : 'Both ballots are in'}</h2>
      <HostLine>The envelopes have arrived from the disused office upstairs.</HostLine>
      <button
        type="button"
        className={btn.gold}
        onClick={() => {
          dispatch({ type: 'revealResults' });
          sfx('applause');
          router.push(phaseHref.results);
        }}
      >
        Reveal the results
      </button>
      <div className="flex flex-col items-center gap-1 text-sm">
        <p className="text-gb-paper/80">Second thoughts? Edit privately before the reveal.</p>
        <button type="button" className={btn.link} onClick={() => dispatch({ type: 'editBallot', player: 'a' })}>
          Edit {quick ? 'the ballot' : `${nameOf(state, 'a')}’s ballot`} privately
        </button>
        {!quick && (
          <button type="button" className={btn.link} onClick={() => dispatch({ type: 'editBallot', player: 'b' })}>
            Edit {nameOf(state, 'b')}’s ballot privately
          </button>
        )}
      </div>
    </section>
  );
}

export default function IndependentBallot() {
  const { state } = useShow();
  useVisit('ballots');
  const step = ballotStep(state);
  const voter = currentVoter(state);

  return (
    <Shell phase="ballots">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:py-10">
        <RoundHeading number={4} title={copy.ballot.title} />
        {step === 'voting' && voter && <Voting key={voter} voter={voter} />}
        {step === 'handover' && <Handover />}
        {step === 'ready_to_reveal' && <ReadyToReveal />}
        {step === 'revealed' && (
          <section className="mx-auto max-w-xl space-y-4 py-8 text-center">
            <h2 className="gb-wordmark text-4xl">The votes are counted</h2>
            <Link href={phaseHref.results} className={btn.gold}>
              See the results
            </Link>
          </section>
        )}
        <ProgressControls previous={phaseHref.wildcard_board} />
      </div>
    </Shell>
  );
}
