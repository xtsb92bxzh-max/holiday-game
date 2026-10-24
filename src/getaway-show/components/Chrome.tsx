'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Volume2, VolumeX, Zap, ZapOff } from 'lucide-react';
import credits from '@/data/imageCredits.json';
import assumptions from '@/data/assumptions.json';
import { destinationById } from '@/lib/catalogue';
import type { ImageCredit } from '@/lib/types';
import { copy } from '../data/copy';
import { phaseHref, type Phase } from '../lib/state';
import { useShow } from './ShowProvider';
import { btn } from './ui';

/** Original wordmark: condensed lettering on a faux brass plate. */
export function Wordmark({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  if (size === 'lg') {
    return (
      <h1 className="text-center">
        <span className="gb-display block text-base tracking-[0.35em] text-gb-paper sm:text-xl">The</span>
        <span className="gb-wordmark gb-wordmark-deep block text-[3.3rem] sm:text-8xl">Great British</span>
        <span className="gb-wordmark block text-[4.2rem] text-gb-paper sm:text-[8.5rem] [color:var(--color-gb-paper)] [text-shadow:4px_4px_0_var(--color-gb-teal),8px_8px_0_var(--color-gb-black)]">
          Getaway
        </span>
        <span className="gb-display mt-2 inline-block rounded-md bg-gb-tomato px-4 py-1 text-xl tracking-[0.3em] text-gb-paper sm:text-3xl">Show</span>
      </h1>
    );
  }
  return (
    <Link href="/getaway-show" className="flex min-h-11 items-center gap-2" aria-label="The Great British Getaway Show: back to the title screen">
      <span aria-hidden className="gb-brass grid size-9 place-items-center rounded-md gb-display text-sm leading-none text-gb-black">
        GB
      </span>
      <span className="gb-display text-lg leading-none text-gb-gold sm:text-xl">
        Getaway <span className="text-gb-paper">Show</span>
      </span>
    </Link>
  );
}

/** Fictional channel bug. */
export function ChannelBug({ className = '' }: { className?: string }) {
  return (
    <span
      title={copy.channelNote}
      className={`inline-flex items-center gap-1 rounded border border-gb-paper/30 bg-gb-black/60 px-1.5 py-0.5 gb-display text-xs leading-none tracking-widest text-gb-paper/85 ${className}`}
    >
      GBC
      <span className="sr-only"> (Getaway Broadcasting Corporation, a fictional channel)</span>
    </span>
  );
}

export const steps: { phase: Phase; label: string; short: string }[] = [
  { phase: 'picture_reveal', label: 'Catch a Flight', short: 'R1' },
  { phase: 'higher_lower', label: 'Play Your Flights Right', short: 'R2' },
  { phase: 'wildcard_board', label: 'The Holiday Bullseye', short: 'R3' },
  { phase: 'ballots', label: 'The Nation Has Voted', short: 'Vote' },
  { phase: 'results', label: 'Results', short: 'Results' },
  { phase: 'grand_final', label: 'Grand Final', short: 'Final' },
];

/** Approximate progress through the show. Every stage is reachable. */
function Progress({ current }: { current?: Phase }) {
  const index = steps.findIndex((s) => s.phase === current);
  return (
    <nav aria-label="Show progress" className="border-t border-gb-paper/10 bg-gb-black/40">
      <ol className="no-scrollbar mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 py-1.5 text-xs sm:px-4">
        {steps.map((s, i) => (
          <li key={s.phase} className="shrink-0">
            <Link
              href={phaseHref[s.phase]}
              aria-current={i === index ? 'step' : undefined}
              className={`inline-flex min-h-8 items-center rounded-full px-2.5 font-semibold transition ${
                i === index ? 'bg-gb-gold text-gb-black' : i < index ? 'text-gb-paper/90 hover:bg-gb-paper/10' : 'text-gb-paper/60 hover:bg-gb-paper/10'
              }`}
            >
              <span className="sm:hidden">{s.short}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Toggles() {
  const { state, dispatch, reduceMotion } = useShow();
  const cls = 'inline-flex size-11 items-center justify-center rounded-full text-gb-paper/85 hover:bg-gb-paper/10 hover:text-gb-paper';
  return (
    <div className="flex items-center">
      <button
        type="button"
        className={cls}
        aria-pressed={state.soundEnabled}
        aria-label={state.soundEnabled ? 'Sound is on. Turn it off' : 'Sound is off. Turn it on'}
        onClick={() => dispatch({ type: 'setSound', on: !state.soundEnabled })}
      >
        {state.soundEnabled ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
      </button>
      <button
        type="button"
        className={cls}
        aria-pressed={reduceMotion}
        aria-label={reduceMotion ? 'Animations are skipped. Turn them back on' : 'Skip animations'}
        onClick={() => dispatch({ type: 'setReduceMotion', value: !reduceMotion })}
      >
        {reduceMotion ? <ZapOff className="size-5" /> : <Zap className="size-5" />}
      </button>
    </div>
  );
}

const nav = [
  { href: '/getaway-show', label: 'Title screen' },
  { href: '/getaway-show/final', label: 'Go to sensible comparison' },
  { href: '/getaway-show/holidays', label: copy.table },
  { href: '/getaway-show/about', label: 'What do these prices include?' },
];

export function Header({ phase }: { phase?: Phase }) {
  const pathname = usePathname();
  return (
    <header className="gb-no-print sticky top-0 z-40 border-b border-gb-paper/10 bg-gb-navy/90 backdrop-blur supports-[backdrop-filter]:bg-gb-navy/75">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-gb-gold focus:px-3 focus:py-2 focus:text-gb-black"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-1 sm:px-4">
        <Wordmark />
        <div className="flex items-center gap-1">
          <ChannelBug className="hidden min-[380px]:inline-flex" />
          <Toggles />
          <details className="group relative">
            <summary className="inline-flex size-11 cursor-pointer list-none items-center justify-center rounded-full text-gb-paper/85 hover:bg-gb-paper/10 [&::-webkit-details-marker]:hidden">
              <Menu className="size-5" aria-hidden />
              <span className="sr-only">Menu</span>
            </summary>
            <nav className="absolute right-0 top-12 w-64 overflow-hidden rounded-2xl border border-gb-paper/15 bg-gb-black shadow-2xl">
              <ul>
                {nav.map((n) => (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      aria-current={pathname === n.href ? 'page' : undefined}
                      className="block min-h-11 px-4 py-3 text-sm text-gb-paper hover:bg-gb-paper/10 aria-[current=page]:text-gb-gold"
                      onClick={(e) => e.currentTarget.closest('details')?.removeAttribute('open')}
                    >
                      {n.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/" className="block min-h-11 border-t border-gb-paper/10 px-4 py-3 text-sm text-gb-paper/80 hover:bg-gb-paper/10">
                    Back to all games
                  </Link>
                </li>
              </ul>
            </nav>
          </details>
        </div>
      </div>
      {phase && <Progress current={phase} />}
    </header>
  );
}

export function Footer() {
  const { dispatch } = useShow();
  return (
    <footer className="gb-no-print border-t border-gb-paper/10 bg-gb-black/40 px-4 py-8 text-xs text-gb-paper/75">
      <div className="mx-auto max-w-6xl space-y-3">
        <p className="flex flex-wrap items-center gap-2">
          <ChannelBug /> <span>{copy.channel}. A fictional channel.</span>
        </p>
        <p className="gb-display text-sm tracking-widest text-gb-gold/90">{copy.series}</p>
        <p className="break-words">
          Source: {assumptions.sourceWorkbook}, researched {assumptions.pricesObservedOn}. Totals are for two adults sharing one room and include
          return flights, the room and the source’s illustrative baggage and transfer allowance. Meals, entertainment, sightseeing and UK airport
          transport are excluded.
        </p>
        <p>An original parody of British Saturday-evening game shows. No affiliation with any programme, broadcaster, airline or hotel.</p>
        <details>
          <summary className="min-h-11 cursor-pointer py-2 text-gb-paper/85">Photo credits (Wikimedia Commons)</summary>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {Object.entries(credits as Record<string, ImageCredit>).map(([key, c]) => (
              <li key={key}>
                <span className="text-gb-paper/85">{destinationById[key]?.name ?? key}:</span>{' '}
                <a className="underline" href={c.sourcePage} target="_blank" rel="noopener noreferrer">
                  {c.author || 'Unknown author'}
                </a>
                ,{' '}
                {c.licenseUrl ? (
                  <a className="underline" href={c.licenseUrl} target="_blank" rel="noopener noreferrer">
                    {c.license}
                  </a>
                ) : (
                  c.license
                )}
              </li>
            ))}
          </ul>
        </details>
        <div className="flex flex-wrap gap-x-6">
          <Link href="/getaway-show/holidays" className={btn.link}>
            {copy.table}
          </Link>
          <Link href="/" className={btn.link}>
            Back to all games
          </Link>
          <button
            type="button"
            className={btn.link}
            onClick={() => {
              if (window.confirm('Clear the ballots, guesses and finalists and start the show again?')) dispatch({ type: 'reset' });
            }}
          >
            Start again
          </button>
        </div>
      </div>
    </footer>
  );
}

export function Shell({ phase, children }: { phase?: Phase; children: React.ReactNode }) {
  return (
    <>
      <Header phase={phase} />
      <main id="main" className="relative">
        {children}
      </main>
      <Footer />
    </>
  );
}

/** The controls every stage carries: back, skip, and two ways out of the nonsense. */
export function ProgressControls({
  previous,
  skip,
  skipLabel = 'Skip round',
}: {
  previous?: string;
  skip?: string;
  skipLabel?: string;
}) {
  return (
    <div className="gb-no-print flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-gb-paper/10 pt-4">
      {previous && (
        <Link href={previous} className={btn.link}>
          ← Previous
        </Link>
      )}
      {skip && (
        <Link href={skip} className={btn.link}>
          {skipLabel} →
        </Link>
      )}
      <Link href="/getaway-show/final" className={btn.link}>
        Go to sensible comparison
      </Link>
      <Link href="/getaway-show/holidays" className={btn.link}>
        {copy.table}
      </Link>
    </div>
  );
}
