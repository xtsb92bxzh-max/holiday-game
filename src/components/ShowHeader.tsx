'use client';

import { Volume2, VolumeX, Sparkles, Pause, ClipboardList, Trophy, Clapperboard } from 'lucide-react';
import { useGame } from './GameContext';
import { scoreFor, type Screen } from '@/lib/gameState';
import { mainCast } from '@/lib/catalogue';

const nav: { screen: Screen; label: string; icon: React.ReactNode }[] = [
  { screen: 'conveyor', label: 'The show', icon: <Clapperboard aria-hidden className="size-4" /> },
  { screen: 'final', label: 'Grand final', icon: <Trophy aria-hidden className="size-4" /> },
  { screen: 'sensible', label: 'Sensible mode', icon: <ClipboardList aria-hidden className="size-4" /> },
];

export default function ShowHeader() {
  const { state, dispatch, reduceMotion } = useGame();
  const scores = scoreFor(state);
  const decided = mainCast.filter((d) => state.decisions[d.id]).length;
  const inShow = ['conveyor', 'play', 'mystery'].includes(state.screen);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-mustard/60 bg-navy/90 backdrop-blur supports-[backdrop-filter]:bg-navy/75">
      <div className="mx-auto flex max-w-6xl items-center gap-1 px-2 py-2 sm:gap-4 sm:px-4">
        <button
          onClick={() => dispatch({ type: 'go', screen: 'title' })}
          className="marquee-text shrink-0 text-left text-[11px] leading-[1.05] min-[380px]:text-[13px] sm:text-base"
          aria-label="Back to the opening titles"
        >
          The Great
          <br />
          January Getaway
        </button>

        <nav aria-label="Sections" className="ml-auto flex items-center gap-0.5 sm:gap-1">
          {nav.map((n) => {
            const active = n.screen === 'conveyor' ? inShow : state.screen === n.screen;
            return (
              <button
                key={n.screen}
                onClick={() => dispatch({ type: 'go', screen: n.screen })}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex min-h-11 min-w-9 items-center justify-center gap-1.5 rounded-lg px-1.5 text-sm min-[360px]:px-2 font-semibold transition sm:px-3 ${
                  active ? 'bg-mustard text-ink' : 'text-cream/85 hover:bg-cream/10'
                }`}
              >
                {n.icon}
                <span className="hidden md:inline">{n.label}</span>
                <span className="sr-only md:hidden">{n.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center">
          <button
            onClick={() => dispatch({ type: 'toggleSound' })}
            className="inline-flex h-11 w-9 items-center justify-center rounded-lg text-cream/85 hover:bg-cream/10 min-[360px]:w-10 sm:w-11"
            aria-pressed={state.sound}
            aria-label={state.sound ? 'Sound on. Turn sound off' : 'Sound off. Turn sound on'}
            title={state.sound ? 'Sound on' : 'Sound off'}
          >
            {state.sound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
          </button>
          <button
            onClick={() => dispatch({ type: 'setReduceMotion', value: !reduceMotion })}
            className="inline-flex h-11 w-9 items-center justify-center rounded-lg text-cream/85 hover:bg-cream/10 min-[360px]:w-10 sm:w-11"
            aria-pressed={reduceMotion}
            aria-label={reduceMotion ? 'Motion reduced. Turn animations on' : 'Animations on. Reduce motion'}
            title={reduceMotion ? 'Motion reduced' : 'Animations on'}
          >
            {reduceMotion ? <Pause className="size-5" /> : <Sparkles className="size-5" />}
          </button>
        </div>
      </div>

      {inShow && (
        <div className="border-t border-cream/10 bg-black/30">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-2 py-1.5 text-xs sm:px-4 sm:text-sm">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3" aria-label="Scoreboard">
              {state.contestants.map((name, i) => (
                <span key={i} className={`flex items-baseline gap-1.5 ${scores[i] > scores[i === 0 ? 1 : 0] ? 'text-gold' : 'text-cream/70'}`}>
                  <span className="max-w-[6.5rem] truncate sm:max-w-[9rem]">{name}</span>
                  <span className="scoreboard-digit text-sm sm:text-base">{String(scores[i]).padStart(3, '0')}</span>
                </span>
              ))}
            </div>
            <span className="shrink-0 text-cream/70">
              <span className="scoreboard-digit">{mainCast.length - decided}</span> <span className="hidden sm:inline">prizes undecided</span><span className="sm:hidden">left</span>
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
