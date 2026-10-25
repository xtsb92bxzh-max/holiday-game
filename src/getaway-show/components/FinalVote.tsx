'use client';

import { Crown, Lock, RotateCcw } from 'lucide-react';
import { destinationById } from '@/lib/catalogue';
import { finalPicks, finalVerdict, nameOf, studioPoints, type PlayerId } from '../lib/state';
import { useShow } from './ShowProvider';
import { btn } from './ui';

const both: PlayerId[] = ['a', 'b'];

/** Each traveller picks a winner in secret. A split goes to whoever leads on studio points. */
export default function FinalVote({ finalists }: { finalists: string[] }) {
  const { state, dispatch, sfx } = useShow();
  const picks = finalPicks(state);
  const v = finalVerdict(state);
  const next = both.find((p) => !picks[p]);
  const points = studioPoints(state);

  return (
    <section aria-labelledby="final-vote" className="gb-no-print space-y-4 rounded-3xl border-2 border-gb-gold/60 bg-gb-navy p-5">
      <div>
        <h2 id="final-vote" className="gb-display text-2xl text-gb-gold">
          The final vote
        </h2>
        <p className="text-sm text-gb-paper/85">
          Each of you picks a winner in secret. Agree and it wins. Split, and whoever leads on studio points has the casting vote.
        </p>
      </div>

      {next && (
        <div className="space-y-3">
          <ul className="flex flex-wrap gap-2 text-sm" aria-label="Who has voted">
            {both.map((p) => (
              <li key={p} className={`rounded-full px-3 py-1 ${picks[p] ? 'bg-gb-gold font-bold text-gb-black' : 'bg-gb-paper/10'}`}>
                {nameOf(state, p)}: {picks[p] ? 'voted' : 'thinking'}
              </li>
            ))}
          </ul>
          <p className="font-bold">
            {next === 'b' && 'Pass the phone. '}
            {nameOf(state, next)}, your winner. {nameOf(state, next === 'a' ? 'b' : 'a')}, look away.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {finalists.map((id) => (
              <button
                key={`${next}-${id}`}
                type="button"
                className={btn.ghost}
                onClick={() => {
                  dispatch({ type: 'finalPick', player: next, destinationId: id });
                  sfx(next === 'a' ? 'tick' : 'fanfare');
                }}
              >
                <Lock aria-hidden className="size-4" /> {destinationById[id].name}
              </button>
            ))}
          </div>
        </div>
      )}

      {v?.kind === 'split' && (
        <div className="space-y-3" aria-live="polite">
          <p className="font-serif text-lg italic text-gb-gold">Controversy in the studio. The nation is divided.</p>
          <ul className="space-y-1 text-sm">
            {both.map((p, i) => (
              <li key={p}>
                {nameOf(state, p)} chose <strong>{destinationById[v.ids[i]].name}</strong> ({points[p].total} studio points)
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {v.casting != null ? (
              <button
                type="button"
                className={btn.gold}
                onClick={() => {
                  dispatch({ type: 'setWinner', destinationId: v.ids[v.casting!] });
                  sfx('applause');
                }}
              >
                <Crown aria-hidden className="size-5" /> {nameOf(state, both[v.casting])} has the casting vote: {destinationById[v.ids[v.casting]].name}
              </button>
            ) : (
              <p className="text-sm text-gb-paper/85">The studio points are level, so nobody has the casting vote. Talk it over and choose below.</p>
            )}
            <button type="button" className={btn.ghost} onClick={() => dispatch({ type: 'finalVoteAgain' })}>
              <RotateCcw aria-hidden className="size-4" /> Vote again
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
