'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ClipboardCopy, Plus } from 'lucide-react';
import { destinationById } from '@/lib/catalogue';
import { formatGBP } from '@/lib/pricing';
import { copy } from '../data/copy';
import { selectedVariant } from '../lib/cast';
import { costBreakdown } from '../lib/cost';
import { outcomeLabels, voteLabels, type Outcome, type Vote } from '../lib/matching';
import {
  ballotsComplete,
  effectiveFinalists,
  groups,
  MAX_FINALISTS,
  nameOf,
  phaseHref,
  rankedShortlist,
  resultsVisible,
  studioPoints,
} from '../lib/state';
import { shortlistText } from '../lib/summary';
import { ProgressControls, Shell } from './Chrome';
import { useShow, useVisit } from './ShowProvider';
import { btn, HostLine, NoInfluence, RoundHeading, SourceStatus } from './ui';

const chip: Record<Vote, string> = {
  yes: 'bg-gb-teal text-gb-paper',
  maybe: 'bg-gb-gold text-gb-black',
  no: 'bg-gb-tomato text-gb-paper',
};

function VoteChip({ who, vote }: { who: string; vote?: Vote }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${vote ? chip[vote] : 'border border-current/40 opacity-80'}`}>
      {who}: {vote ? voteLabels[vote] : 'Not voted'}
    </span>
  );
}

function Row({ id }: { id: string }) {
  const { state, dispatch } = useShow();
  const d = destinationById[id];
  const it = selectedVariant(id, state.preferredItineraryIds[id]);
  const c = costBreakdown(it);
  const finalists = effectiveFinalists(state);
  const on = finalists.includes(id);
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gb-paper px-4 py-3 text-gb-black">
      <div className="min-w-0">
        <p className="text-lg font-bold">{d.name}</p>
        <p className="text-sm opacity-80">
          {c ? `${formatGBP(c.totalForTwo, { pence: true })} for two · ${formatGBP(c.perPerson, { pence: true })} each` : 'Total unknown'}
        </p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {state.mode === 'two_person' ? (
            <>
              <VoteChip who={nameOf(state, 'a')} vote={state.ballots.a[id]} />
              <VoteChip who={nameOf(state, 'b')} vote={state.ballots.b[id]} />
            </>
          ) : (
            <VoteChip who="Your vote" vote={state.ballots.a[id]} />
          )}
        </div>
      </div>
      <button
        type="button"
        aria-pressed={on}
        disabled={!on && finalists.length >= MAX_FINALISTS}
        onClick={() => dispatch({ type: 'toggleFinalist', destinationId: id })}
        className={`${btn.ghostInk} aria-pressed:border-gb-teal aria-pressed:bg-gb-teal aria-pressed:text-gb-paper`}
      >
        {on ? <Check aria-hidden className="size-4" /> : <Plus aria-hidden className="size-4" />}
        {on ? 'In the final' : 'Add to final'}
      </button>
    </li>
  );
}

function Section({ title, plain, ids, empty }: { title: string; plain: string; ids: string[]; empty?: string }) {
  if (ids.length === 0 && !empty) return null;
  return (
    <section className="space-y-3">
      <h2 className="gb-display text-2xl text-gb-gold sm:text-3xl">
        {title} <span className="text-base text-gb-paper/80">· {plain}</span>
      </h2>
      {ids.length ? (
        <ul className="grid gap-2 md:grid-cols-2">
          {ids.map((id) => (
            <Row key={id} id={id} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gb-paper/80">{empty}</p>
      )}
    </section>
  );
}

function Gate() {
  const { state, dispatch } = useShow();
  const complete = ballotsComplete(state);
  return (
    <section className="mx-auto max-w-xl space-y-4 py-10 text-center">
      <h2 className="gb-wordmark text-4xl">Results sealed</h2>
      <p className="text-gb-paper/85">
        {complete
          ? 'The ballots are in. Reveal them together when you are both looking.'
          : 'The ballots are not finished yet, so nothing is shown here.'}
      </p>
      {complete ? (
        <button type="button" className={btn.gold} onClick={() => dispatch({ type: 'revealResults' })}>
          Reveal the results
        </button>
      ) : (
        <Link href={phaseHref.ballots} className={btn.gold}>
          Go to the vote
        </Link>
      )}
      <p>
        <Link href={phaseHref.grand_final} className={btn.link}>
          Compare destinations without voting
        </Link>
      </p>
    </section>
  );
}

export default function ResultsStudio() {
  const { state, dispatch } = useShow();
  useVisit('results');
  const [copied, setCopied] = useState<'idle' | 'copied' | 'failed'>('idle');
  if (!resultsVisible(state)) {
    return (
      <Shell phase="results">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
          <RoundHeading title="The results" />
          <Gate />
          <ProgressControls previous={phaseHref.ballots} />
        </div>
      </Shell>
    );
  }

  const g = groups(state);
  const shortlist = rankedShortlist(state);
  const points = studioPoints(state);
  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortlistText(state));
      setCopied('copied');
    } catch {
      setCopied('failed');
    }
  };

  const sections: { key: Outcome | 'favourites' | 'maybes' | 'passes' | 'unvoted'; title: string; plain: string; ids: string[]; empty?: string }[] =
    g.kind === 'two_person'
      ? [
          { key: 'mutual', title: copy.results.mutual, plain: outcomeLabels.mutual, ids: g.mutual, empty: 'No mutual favourites tonight.' },
          { key: 'discuss', title: copy.results.discuss, plain: outcomeLabels.discuss, ids: g.discuss },
          { key: 'disagree', title: copy.results.disagree, plain: outcomeLabels.disagree, ids: g.disagree },
          { key: 'rejected', title: copy.results.rejected, plain: outcomeLabels.rejected, ids: g.rejected },
          { key: 'incomplete', title: copy.results.incomplete, plain: 'Missing a vote, not counted as No', ids: g.incomplete },
        ]
      : [
          { key: 'favourites', title: 'Favourites', plain: 'Your shared Yes', ids: g.favourites, empty: 'No favourites yet.' },
          { key: 'maybes', title: 'Maybes', plain: 'Worth another look', ids: g.maybes },
          { key: 'passes', title: 'Passes', plain: 'Not this time', ids: g.passes },
          { key: 'unvoted', title: 'Not voted', plain: 'Not counted as a pass', ids: g.unvoted },
        ];

  return (
    <Shell phase="results">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:py-10">
        <RoundHeading title={g.kind === 'two_person' ? 'The nation has voted' : 'Your shortlist'}>
          <HostLine>
            {shortlist.length === 0
              ? 'A historic night: nobody wants to go anywhere. The studio is considering a staycation special.'
              : g.kind === 'two_person' && g.mutual.length > 0
                ? `${g.mutual.length} mutual favourite${g.mutual.length > 1 ? 's' : ''}. The studio lights have been dimmed accordingly.`
                : 'No outright winner. Some strong maybes, and a little light controversy.'}
          </HostLine>
          <p className="text-sm text-gb-paper/80">
            Ranked by your votes alone: mutual Yes first, then the strongest maybes, featured before added wildcards. Studio points ({points.total}){' '}
            <NoInfluence className="align-middle" />
          </p>
        </RoundHeading>

        {shortlist.length > MAX_FINALISTS && (
          <p className="rounded-2xl border border-gb-gold/50 bg-gb-gold/10 p-4 text-sm">
            {shortlist.length} contenders for {MAX_FINALISTS} places in the final. The first three by vote strength are pencilled in. Swap any of them
            with Add to final, or settle it head to head in the comparison.
          </p>
        )}

        {sections.map((s) => (
          <Section key={s.key} title={s.title} plain={s.plain} ids={s.ids} empty={s.empty} />
        ))}

        {shortlist.length === 0 && (
          <section className="gb-pinstripe space-y-3 rounded-3xl p-5">
            <h2 className="gb-display text-2xl text-gb-tomato">Nothing made the final</h2>
            <p>That is a legitimate result. You can revisit the rejects, bring on more destinations, or pick finalists by hand.</p>
            <div className="flex flex-wrap gap-2">
              <Link href={phaseHref.ballots} className={btn.ghostInk} onClick={() => dispatch({ type: 'editBallot', player: 'a' })}>
                Revisit rejects
              </Link>
              <Link href={phaseHref.wildcard_board} className={btn.ghostInk}>
                Show more destinations
              </Link>
            </div>
          </section>
        )}

        <SourceStatus />

        <div className="flex flex-wrap items-center gap-3">
          <Link href={phaseHref.grand_final} className={btn.gold}>
            To the grand final
          </Link>
          <button type="button" className={btn.ghost} onClick={doCopy}>
            <ClipboardCopy aria-hidden className="size-4" /> Copy the shortlist
          </button>
          <span aria-live="polite" className="text-sm text-gb-gold">
            {copied === 'copied' ? 'Copied.' : copied === 'failed' ? 'Could not copy on this browser.' : ''}
          </span>
        </div>

        <div className="space-y-1 text-sm">
          <p className="text-gb-paper/80">Change your mind? Edit a ballot. Only that traveller’s votes are on screen while editing.</p>
          <div className="flex flex-wrap gap-x-6">
            <Link href={phaseHref.ballots} className={btn.link} onClick={() => dispatch({ type: 'editBallot', player: 'a' })}>
              Edit {state.mode === 'quick' ? 'the ballot' : `${nameOf(state, 'a')}’s ballot`}
            </Link>
            {state.mode === 'two_person' && (
              <Link href={phaseHref.ballots} className={btn.link} onClick={() => dispatch({ type: 'editBallot', player: 'b' })}>
                Edit {nameOf(state, 'b')}’s ballot
              </Link>
            )}
          </div>
        </div>

        <ProgressControls previous={phaseHref.ballots} skip={phaseHref.grand_final} skipLabel="Grand final" />
      </div>
    </Shell>
  );
}
