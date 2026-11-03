'use client';

import Link from 'next/link';
import { Menu, Zap, ZapOff } from 'lucide-react';
import assumptions from '@/data/assumptions.json';
import { formatDate } from '@/lib/dates';
import { sceneById } from '../lib/engine';
import { devViewEnabled } from '../lib/dev';
import { useEnvelope } from './EnvelopeProvider';

export const COMPARE_ALL_HREF = '/getaway-show/holidays';

export const btn = {
  primary:
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-en-lamp px-6 py-3 font-serif text-lg font-semibold text-en-night shadow-[0_6px_20px_rgb(241_184_96/0.25)] transition hover:bg-[#f5c77d] disabled:opacity-50',
  ink: 'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-en-ink px-6 py-3 font-serif text-lg font-semibold text-en-paper transition hover:bg-[#2b3346] disabled:opacity-50',
  ghost:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-en-paper/40 px-4 py-2 text-sm font-semibold text-en-paper transition hover:border-en-paper hover:bg-en-paper/10 disabled:opacity-40',
  ghostInk:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-en-ink/30 px-4 py-2 text-sm font-semibold text-en-ink transition hover:border-en-ink hover:bg-en-ink/5 disabled:opacity-40',
  link: 'inline-flex min-h-11 items-center text-sm text-en-mist underline decoration-dotted underline-offset-4 hover:text-en-paper',
  linkInk: 'inline-flex min-h-11 items-center text-sm text-en-ink underline decoration-dotted underline-offset-4',
};

/** The map's mark: a circle with a line through it. */
export function Mark({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M6.5 17.5 17.5 6.5" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <Link href="/the-envelope" className="flex min-h-11 items-center gap-2 text-en-lamp" aria-label="The Envelope: back to the start">
      <Mark className="size-6 shrink-0" />
      <span className="whitespace-nowrap font-serif text-base italic leading-none text-en-paper min-[400px]:text-lg sm:text-xl">The Envelope</span>
    </Link>
  );
}

/** Five nights, with the current one lit. */
function Nights() {
  const { state, story } = useEnvelope();
  if (state.phase !== 'story') return null;
  const night = sceneById[story.current]?.night ?? 1;
  return (
    <p className="flex items-center gap-1.5 text-xs text-en-mist" aria-label={`Night ${night} of 5`}>
      <span aria-hidden className="hidden min-[400px]:inline">Night</span>
      <span aria-hidden className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={`block h-1.5 w-3 rounded-full min-[400px]:w-4 ${n <= night ? 'bg-en-lamp' : 'bg-en-paper/20'}`} />
        ))}
      </span>
    </p>
  );
}

export function Header() {
  const { state, dispatch, reduceMotion } = useEnvelope();
  const close = (e: React.MouseEvent) => e.currentTarget.closest('details')?.removeAttribute('open');
  return (
    <header className="en-no-print sticky top-0 z-40 border-b border-en-paper/10 bg-en-night/90 backdrop-blur supports-[backdrop-filter]:bg-en-night/75">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-en-lamp focus:px-3 focus:py-2 focus:text-en-night"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-1">
        <Wordmark />
        <div className="flex items-center gap-1">
          <Nights />
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full text-en-mist hover:bg-en-paper/10 hover:text-en-paper"
            aria-pressed={reduceMotion}
            aria-label={reduceMotion ? 'Animations are off. Turn them on' : 'Turn animations off'}
            onClick={() => dispatch({ type: 'setReduceMotion', value: !reduceMotion })}
          >
            {reduceMotion ? <ZapOff className="size-5" /> : <Zap className="size-5" />}
          </button>
          <details className="relative">
            <summary className="inline-flex size-11 cursor-pointer list-none items-center justify-center rounded-full text-en-mist hover:bg-en-paper/10 [&::-webkit-details-marker]:hidden">
              <Menu className="size-5" aria-hidden />
              <span className="sr-only">Menu</span>
            </summary>
            <nav className="absolute right-0 top-12 w-64 overflow-hidden rounded-2xl border border-en-paper/15 bg-en-dusk shadow-2xl">
              <ul>
                <li>
                  <button
                    type="button"
                    className="block min-h-11 w-full px-4 py-3 text-left text-sm text-en-paper hover:bg-en-paper/10"
                    onClick={(e) => {
                      close(e);
                      dispatch({ type: 'title' });
                    }}
                  >
                    Title page
                  </button>
                </li>
                {state.history.length > 0 && (
                  <li>
                    <button
                      type="button"
                      className="block min-h-11 w-full px-4 py-3 text-left text-sm text-en-paper hover:bg-en-paper/10"
                      onClick={(e) => {
                        close(e);
                        if (window.confirm('Start the story again from the first night? Your choices will be cleared.')) dispatch({ type: 'restart' });
                      }}
                    >
                      Start the story again
                    </button>
                  </li>
                )}
                <li>
                  <Link href={COMPARE_ALL_HREF} className="block min-h-11 px-4 py-3 text-sm text-en-paper hover:bg-en-paper/10" onClick={close}>
                    Compare every holiday
                  </Link>
                </li>
                {devViewEnabled && (
                  <li>
                    <Link href="/the-envelope/dev" className="block min-h-11 px-4 py-3 text-sm text-en-sea hover:bg-en-paper/10" onClick={close}>
                      Development view
                    </Link>
                  </li>
                )}
                <li>
                  <Link href="/" className="block min-h-11 border-t border-en-paper/10 px-4 py-3 text-sm text-en-mist hover:bg-en-paper/10" onClick={close}>
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
  const { state, dispatch } = useEnvelope();
  return (
    <footer className="en-no-print border-t border-en-paper/10 px-4 py-8 text-xs text-en-mist">
      <div className="mx-auto max-w-3xl space-y-3">
        <p>
          A short interactive story for choosing a January 2027 break. Its suggestion is drawn from the choices you make. It is not a personality test and
          has not been validated as one.
        </p>
        <p className="break-words">
          Practical details come from {assumptions.sourceWorkbook}, researched {formatDate(assumptions.pricesObservedOn)} 2026. Anything it does not cover is
          marked unconfirmed. Recheck everything before booking.
        </p>
        <p>Progress is saved in this browser only. Nothing leaves your device.</p>
        <div className="flex flex-wrap gap-x-6">
          <Link href={COMPARE_ALL_HREF} className={btn.link}>
            Compare every holiday
          </Link>
          <Link href="/" className={btn.link}>
            Back to all games
          </Link>
          {state.history.length > 0 && (
            <button
              type="button"
              className={btn.link}
              onClick={() => {
                if (window.confirm('Start the story again from the first night? Your choices will be cleared.')) dispatch({ type: 'restart' });
              }}
            >
              Start again
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" className="relative mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {children}
      </main>
      <Footer />
    </>
  );
}
