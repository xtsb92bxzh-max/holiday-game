'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Volume2, VolumeX, Zap, ZapOff } from 'lucide-react';
import credits from '@/data/imageCredits.json';
import assumptions from '@/data/assumptions.json';
import { destinationById } from '@/lib/catalogue';
import type { ImageCredit } from '@/lib/types';
import { copy } from '../data/copy';
import { progress, resultsReady, resumeHref } from '../lib/state';
import { useShow } from './BlindFlightProvider';
import { btn } from './ui';

/** The heart-and-aeroplane mark. Original artwork. */
export function Mark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={className}>
      <path
        d="M32 56 C10 41 4 30 4 21 C4 12 11 6 19 6 C25 6 29.5 9 32 13 C34.5 9 39 6 45 6 C53 6 60 12 60 21 C60 30 54 41 32 56Z"
        fill="#de4b4b"
        stroke="#f3c95e"
        strokeWidth="3"
      />
      {/* Top-down airliner, nose to the upper right. */}
      <g transform="translate(32 28) rotate(45)" fill="#fff6e5">
        <path d="M-2.5 -15 Q0 -19 2.5 -15 L2.5 -3 L15 4 L15 7 L2.5 3 L2.5 10 L6 13 L6 15 L0 13.5 L-6 15 L-6 13 L-2.5 10 L-2.5 3 L-15 7 L-15 4 L-2.5 -3Z" />
      </g>
    </svg>
  );
}

export function Logo({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  if (size === 'lg') {
    return (
      <h1 className="bf-logo text-center">
        <span className="block text-[3.4rem] sm:text-8xl">Blind</span>
        <span className="block text-[3.4rem] sm:text-8xl">Flight</span>
      </h1>
    );
  }
  return (
    <Link href="/blind-flight" className="flex min-h-11 items-center gap-2" aria-label="Blind Flight: back to the title screen">
      <Mark className="size-8" />
      <span className="bf-logo text-xl [text-shadow:2px_2px_0_var(--color-bf-red)]">Blind Flight</span>
    </Link>
  );
}

const nav = [
  { href: '/blind-flight/show', label: 'The show' },
  { href: '/blind-flight/contenders', label: 'More eligible contenders' },
  { href: '/blind-flight/results', label: 'Results' },
  { href: '/blind-flight/compare', label: 'Skip to comparison' },
  { href: '/blind-flight/holidays', label: copy.refuse },
  { href: '/blind-flight/about', label: 'About these prices' },
];

export function Toggles() {
  const { state, dispatch, reduceMotion } = useShow();
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-full text-bf-cream/85 hover:bg-bf-cream/10 hover:text-bf-cream"
        aria-pressed={state.soundEnabled}
        aria-label={state.soundEnabled ? 'Sound is on. Turn it off' : 'Sound is off. Turn it on'}
        onClick={() => dispatch({ type: 'setSound', on: !state.soundEnabled })}
      >
        {state.soundEnabled ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
      </button>
      <button
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-full text-bf-cream/85 hover:bg-bf-cream/10 hover:text-bf-cream"
        aria-pressed={reduceMotion}
        aria-label={reduceMotion ? 'Reduced motion is on. Allow animation' : 'Animation is on. Reduce motion'}
        onClick={() => dispatch({ type: 'setReduceMotion', value: !reduceMotion })}
      >
        {reduceMotion ? <ZapOff className="size-5" /> : <Zap className="size-5" />}
      </button>
    </div>
  );
}

export function Header() {
  const { state } = useShow();
  const pathname = usePathname();
  const p = progress(state);
  const status = resultsReady(state) ? (state.mode === 'quick' ? 'Shortlist ready' : 'Results are in') : `Episode ${Math.min(p.done + 1, p.total)} of ${p.total}`;

  return (
    <header className="sticky top-0 z-40 border-b border-bf-cream/10 bg-bf-deep/90 backdrop-blur supports-[backdrop-filter]:bg-bf-deep/75">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-bf-custard focus:px-3 focus:py-2 focus:text-bf-ink">
        Skip to content
      </a>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-1.5 sm:px-4">
        <Logo />
        <div className="flex min-w-0 items-center gap-1">
          <span className="hidden truncate rounded-full bg-bf-cream/10 px-3 py-1 text-xs font-semibold text-bf-cream/90 min-[400px]:inline">
            {status}
          </span>
          <Toggles />
          <details className="group relative">
            <summary className="inline-flex size-11 cursor-pointer list-none items-center justify-center rounded-full text-bf-cream/85 hover:bg-bf-cream/10 [&::-webkit-details-marker]:hidden">
              <Menu className="size-5" aria-hidden />
              <span className="sr-only">Menu</span>
            </summary>
            <nav className="absolute right-0 top-12 w-64 overflow-hidden rounded-2xl border border-bf-cream/15 bg-bf-deep shadow-2xl">
              <p className="border-b border-bf-cream/10 px-4 py-2 text-xs text-bf-cream/70 min-[400px]:hidden">{status}</p>
              <ul>
                {nav.map((n) => (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      aria-current={pathname === n.href ? 'page' : undefined}
                      className="block min-h-11 px-4 py-3 text-sm text-bf-cream hover:bg-bf-cream/10 aria-[current=page]:text-bf-custard"
                      onClick={(e) => e.currentTarget.closest('details')?.removeAttribute('open')}
                    >
                      {n.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/" className="block min-h-11 border-t border-bf-cream/10 px-4 py-3 text-sm text-bf-cream/80 hover:bg-bf-cream/10">
                    Back to all games
                  </Link>
                </li>
              </ul>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const { dispatch } = useShow();
  return (
    <footer className="border-t border-bf-cream/10 bg-black/25 px-4 py-8 text-xs text-bf-cream/70">
      <div className="mx-auto max-w-6xl space-y-3">
        <p className="break-words">
          Source: {assumptions.sourceWorkbook}, compiled {assumptions.pricesObservedOn}. Totals are for two adults sharing one room and include
          return flights, the room, £{assumptions.baggagePerAdultGBP} baggage per person and £{assumptions.transfersForTwoGBP} transfers. Food,
          sightseeing, local spending and getting to the UK airport are excluded.
        </p>
        <p>An original parody of British Saturday-night dating shows. No affiliation with any programme, broadcaster, airline or hotel.</p>
        <details>
          <summary className="min-h-11 cursor-pointer py-2 text-bf-cream/85">Photo credits (Wikimedia Commons)</summary>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {Object.entries(credits as Record<string, ImageCredit>).map(([key, c]) => (
              <li key={key}>
                <span className="text-bf-cream/85">{destinationById[key]?.name ?? key}:</span>{' '}
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
          <Link href="/blind-flight/holidays" className={btn.link}>
            {copy.refuse}
          </Link>
          <Link href="/" className={btn.link}>
            Back to all games
          </Link>
          <button
            type="button"
            className={btn.link}
            onClick={() => {
              if (window.confirm('Clear every choice and finalist and start the show again?')) dispatch({ type: 'reset' });
            }}
          >
            Reset the whole show
          </button>
        </div>
      </div>
    </footer>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" className="relative">
        {children}
      </main>
      <Footer />
    </>
  );
}

/** Shown when a page needs the whole show decided and it is not yet. */
export function NotYet({ title, children }: { title: string; children?: React.ReactNode }) {
  const { state } = useShow();
  return (
    <section className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="bf-logo text-4xl">{title}</h1>
      <div className="mt-4 space-y-3 text-bf-cream/85">{children}</div>
      <div className="mt-8 flex flex-col items-center gap-3">
        <Link href={resumeHref(state)} className={btn.primary}>
          Back to the show
        </Link>
        {!resultsReady(state) && (
          <Link href="/blind-flight/holidays" className={btn.link}>
            Browse every holiday instead
          </Link>
        )}
      </div>
    </section>
  );
}
