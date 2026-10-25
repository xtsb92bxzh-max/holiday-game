'use client';

import { Crown, Lock, RotateCcw } from 'lucide-react';
import { destinationById } from '@/lib/catalogue';
import { finalPicks, finalVerdict, scoreFor } from '@/lib/gameState';
import { useGame } from './GameContext';
import { btn } from './ui';

/** Each contestant crowns a kept prize in secret. A split goes to whoever leads on points. */
export default function FinalVote({ keptIds }: { keptIds: string[] }) {
  const { state, dispatch, sfx } = useGame();
  const names = state.contestants;
  const picks = finalPicks(state);
  const v = finalVerdict(state);
  const next = picks[0] == null ? 0 : picks[1] == null ? 1 : null;
  const scores = scoreFor(state);

  return (
    <section aria-labelledby="final-vote" className="mx-auto mt-8 max-w-6xl px-4">
      <div className="space-y-4 rounded-2xl bg-royal p-4 text-cream shadow-[inset_0_0_0_3px_#f0b429] sm:p-6">
        <div>
          <h3 id="final-vote" className="font-display text-lg tracking-wide text-gold">
            The final vote
          </h3>
          <p className="text-sm text-cream/80">
            Each of you crowns one kept prize in secret. Agree and it wins. Split, and whoever leads on points has the casting vote.
          </p>
        </div>

        {next != null && (
          <div className="space-y-3">
            <ul className="flex flex-wrap gap-2 text-sm" aria-label="Who has voted">
              {names.map((name, i) => (
                <li key={i} className={`rounded-full px-3 py-1 ${picks[i] ? 'bg-gold font-semibold text-ink' : 'bg-cream/10'}`}>
                  {name}: {picks[i] ? 'voted' : 'thinking'}
                </li>
              ))}
            </ul>
            <p className="font-semibold">
              {next === 1 && `Pass the phone. `}
              {names[next]}, your winner. {names[next === 0 ? 1 : 0]}, look away.
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {keptIds.map((id) => (
                <button
                  key={`${next}-${id}`}
                  type="button"
                  className={btn.ghost}
                  onClick={() => {
                    dispatch({ type: 'finalPick', contestant: next, destinationId: id });
                    sfx(next === 0 ? 'tick' : 'fanfare');
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
            <p className="font-serif text-lg italic text-gold">A split decision. The studio holds its breath.</p>
            <ul className="space-y-1 text-sm">
              {names.map((name, i) => (
                <li key={i}>
                  {name} chose <strong>{destinationById[v.ids[i]].name}</strong> ({scores[i]} points)
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
                  <Crown aria-hidden className="size-5" /> {names[v.casting]} has the casting vote: {destinationById[v.ids[v.casting]].name}
                </button>
              ) : (
                <p className="text-sm text-cream/80">The scores are level, so nobody has the casting vote. Talk it over and crown one below.</p>
              )}
              <button type="button" className={btn.ghost} onClick={() => dispatch({ type: 'finalVoteAgain' })}>
                <RotateCcw aria-hidden className="size-4" /> Vote again
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
