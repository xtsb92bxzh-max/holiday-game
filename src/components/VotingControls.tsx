'use client';

import { Check, HelpCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Decision } from '@/lib/types';
import { useGame } from './GameContext';

const lines: Record<Decision, string> = {
  keep: 'Into the shortlist it goes.',
  maybe: 'The judges will deliberate.',
  bin: 'Not even for that price? Brutal.',
};

export default function VotingControls({ destinationId, compact = false }: { destinationId: string; compact?: boolean }) {
  const { state, dispatch, sfx } = useGame();
  const current = state.decisions[destinationId];
  const [said, setSaid] = useState<Decision | null>(null);

  const choose = (d: Decision) => {
    const next = current === d ? null : d;
    dispatch({ type: 'decide', destinationId, decision: next });
    if (next) sfx(next);
    setSaid(next);
  };

  const opts: { d: Decision; label: string; icon: React.ReactNode; on: string; off: string }[] = [
    { d: 'keep', label: 'Keep it', icon: <Check aria-hidden className="size-5" />, on: 'bg-sage text-white border-sage', off: 'bg-white border-sage/70 text-sage' },
    { d: 'maybe', label: 'Maybe', icon: <HelpCircle aria-hidden className="size-5" />, on: 'bg-mustard text-ink border-mustard', off: 'bg-white border-mustard/80 text-[#9a6b00]' },
    { d: 'bin', label: 'Bin it', icon: <Trash2 aria-hidden className="size-5" />, on: 'bg-red text-white border-red', off: 'bg-white border-red/70 text-red' },
  ];

  return (
    <div>
      <div className={`grid grid-cols-3 ${compact ? 'gap-1.5' : 'gap-2 sm:gap-3'}`} role="group" aria-label="Your decision">
        {opts.map((o) => (
          <button
            key={o.d}
            type="button"
            onClick={() => choose(o.d)}
            aria-pressed={current === o.d}
            className={`flex items-center justify-center gap-1.5 rounded-xl border-[3px] font-display tracking-wide transition active:scale-95 ${
              compact ? 'min-h-11 px-2 text-xs' : 'min-h-14 px-2 text-sm sm:text-base'
            } ${current === o.d ? o.on : o.off}`}
          >
            <span className={compact ? 'hidden' : 'hidden sm:inline'}>{o.icon}</span>
            {o.label}
          </button>
        ))}
      </div>
      {!compact && (
        <p className="mt-2 min-h-6 text-center font-serif text-sm italic text-ink/70" aria-live="polite">
          {said ? lines[said] : current ? 'Change your mind any time. The spreadsheet will not judge you.' : ''}
        </p>
      )}
    </div>
  );
}
