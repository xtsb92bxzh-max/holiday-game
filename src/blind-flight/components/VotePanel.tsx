'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useTransform, type PanInfo } from 'motion/react';
import { ChevronRight, Undo2 } from 'lucide-react';
import type { Sfx } from '@/lib/sound';
import { pick, voteReactions } from '../data/copy';
import { canSeeOtherVotes, displayName, nextUnvoted, phase, type PlayerId, type Vote } from '../lib/state';
import { voteLabels } from '../lib/voteMatching';
import { useShow } from './BlindFlightProvider';
import { btn, VoteChip, voteIcon } from './ui';

const options: { vote: Vote; cls: string; sfx: Sfx }[] = [
  { vote: 'keep', cls: 'bg-bf-red text-bf-cream shadow-[0_5px_0_#6e1c22] aria-pressed:ring-4 aria-pressed:ring-bf-custard', sfx: 'keep' },
  { vote: 'maybe', cls: 'bg-bf-custard text-bf-ink shadow-[0_5px_0_#a5801f] aria-pressed:ring-4 aria-pressed:ring-bf-cream', sfx: 'maybe' },
  { vote: 'pass', cls: 'bg-bf-cream text-bf-ink shadow-[0_5px_0_#9c9283] aria-pressed:ring-4 aria-pressed:ring-bf-seafoam', sfx: 'bin' },
];

const SWIPE = 110;

export default function VotePanel({ destinationId, name, ready }: { destinationId: string; name: string; ready: boolean }) {
  const { state, dispatch, sfx, reduceMotion } = useShow();
  const router = useRouter();
  const me = state.players[state.activePlayer];
  const current = me.votes[destinationId];
  const other: PlayerId = state.activePlayer === 'traveller1' ? 'traveller2' : 'traveller1';
  const showOther = canSeeOtherVotes(state);
  const next = nextUnvoted(state, state.activePlayer, destinationId);
  const ph = phase(state);
  const canUndo = me.history.length > 0;

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-6, 6]);
  const keepHint = useTransform(x, [0, SWIPE], [0, 1]);
  const passHint = useTransform(x, [-SWIPE, 0], [1, 0]);

  const cast = (vote: Vote) => {
    dispatch({ type: 'vote', destinationId, vote });
    sfx(options.find((o) => o.vote === vote)!.sfx);
  };
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE) cast('keep');
    else if (info.offset.x < -SWIPE) cast('pass');
  };

  return (
    <section aria-labelledby="vote-heading" className="rounded-3xl border-2 border-bf-custard/50 bg-black/25 p-5 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-bf-seafoam">Voting as {displayName(state, state.activePlayer)}</p>
      <h2 id="vote-heading" className="bf-display mt-1 text-3xl text-bf-custard">
        Would you take me away?
      </h2>

      {!ready ? (
        <p className="mt-3 text-bf-cream/85">Reveal the price above first (or tap “Just show me”). Decisions come after the small print.</p>
      ) : (
        <>
          <motion.div
            drag={reduceMotion ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            dragDirectionLock
            onDragEnd={onDragEnd}
            style={{ x, rotate }}
            className="relative mt-4 select-none rounded-2xl border border-bf-cream/15 bg-bf-navy p-4 text-center touch-pan-y"
          >
            <motion.span aria-hidden style={{ opacity: keepHint }} className="pointer-events-none absolute left-3 top-3 rounded-full bg-bf-red px-3 py-1 text-xs font-bold">
              Keep
            </motion.span>
            <motion.span aria-hidden style={{ opacity: passHint }} className="pointer-events-none absolute right-3 top-3 rounded-full bg-bf-cream px-3 py-1 text-xs font-bold text-bf-ink">
              Pass
            </motion.span>
            <p className="bf-display text-2xl">{name}</p>
            <p className="mt-1 text-sm text-bf-cream/75">
              {current ? (
                <>
                  Your vote: <VoteChip vote={current} />
                </>
              ) : reduceMotion ? (
                'Choose below.'
              ) : (
                'Swipe right to keep, left to pass, or use the buttons.'
              )}
            </p>
          </motion.div>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3" role="group" aria-label={`Your vote on ${name}`}>
            {options.map(({ vote, cls }) => {
              const Icon = voteIcon[vote];
              return (
                <button
                  key={vote}
                  type="button"
                  aria-pressed={current === vote}
                  onClick={() => cast(vote)}
                  className={`flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-3 transition active:translate-y-1 active:shadow-none ${cls}`}
                >
                  <Icon aria-hidden className="size-7" strokeWidth={2.5} />
                  <span className="text-base font-extrabold uppercase tracking-wide">{voteLabels[vote].short}</span>
                  <span className="text-[11px] leading-tight opacity-85 sm:text-xs">{voteLabels[vote].long}</span>
                </button>
              );
            })}
          </div>

          <div aria-live="polite" className="mt-4 min-h-6">
            {current && <p className="font-serif italic text-bf-custard">{pick(voteReactions[current], destinationId + current)}</p>}
          </div>

          {showOther && (
            <p className="mt-2 text-sm">
              <VoteChip vote={state.players[other].votes[destinationId]} who={displayName(state, other)} className="text-bf-cream" />
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {current && next && (
              <button type="button" className={btn.primary} onClick={() => router.push(`/blind-flight/show/${next}`)}>
                Next contestant <ChevronRight aria-hidden className="size-5" />
              </button>
            )}
            {current && !next && ph !== 'results' && (
              <Link href="/blind-flight/show" className={btn.gold}>
                That’s everyone. Lock in your ballot
              </Link>
            )}
            {current && !next && ph === 'results' && (
              <Link href="/blind-flight/results" className={btn.gold}>
                Back to the results
              </Link>
            )}
            <button type="button" className={btn.ghost} disabled={!canUndo} onClick={() => dispatch({ type: 'undo' })}>
              <Undo2 aria-hidden className="size-4" /> Undo last vote
            </button>
          </div>
        </>
      )}
    </section>
  );
}
