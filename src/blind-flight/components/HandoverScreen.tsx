'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Smartphone } from 'lucide-react';
import { copy } from '../data/copy';
import { displayName, phase } from '../lib/state';
import { useShow } from './BlindFlightProvider';
import { Mark } from './Chrome';
import { btn, HostSays } from './ui';

/** A full-screen cover with no ballot information on it at all. */
export default function HandoverScreen() {
  const { state, dispatch, sfx } = useShow();
  const router = useRouter();
  const ph = phase(state);

  let body: React.ReactNode;
  if (state.mode === 'quick') {
    body = (
      <>
        <p className="text-bf-cream/85">Quick play has one shared ballot, so there is nobody to pass the phone to.</p>
        <Link href="/blind-flight/show" className={btn.primary}>
          Back to the show
        </Link>
      </>
    );
  } else if (ph === 'ballot1') {
    body = (
      <>
        <p className="text-bf-cream/85">{displayName(state, 'traveller1')} is still voting. The handover comes once their ballot is locked in.</p>
        <Link href="/blind-flight/show" className={btn.primary}>
          Back to the show
        </Link>
      </>
    );
  } else if (ph === 'handover') {
    body = (
      <>
        <HostSays>{copy.handover}</HostSays>
        <p className="text-bf-cream/85">
          {displayName(state, 'traveller1')}’s votes are sealed. {displayName(state, 'traveller2')} now judges the same contestants without seeing
          them.
        </p>
        <button
          type="button"
          className={btn.primary + ' text-xl'}
          onClick={() => {
            dispatch({ type: 'startSecondBallot' });
            sfx('fanfare');
            router.push('/blind-flight/show');
          }}
        >
          I’m {displayName(state, 'traveller2')}. Start my ballot
        </button>
        <Link href="/blind-flight/show" className={btn.link}>
          Wait, {displayName(state, 'traveller1')} isn’t finished
        </Link>
      </>
    );
  } else {
    body = (
      <>
        <p className="text-bf-cream/85">The phone has already been passed.</p>
        <Link href={ph === 'results' ? '/blind-flight/results' : '/blind-flight/show'} className={btn.primary}>
          {ph === 'results' ? 'See the results' : 'Back to the show'}
        </Link>
      </>
    );
  }

  return (
    <main id="main" className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-12">
      <div aria-hidden className="bf-curtain pointer-events-none absolute inset-y-0 left-0 w-1/2 opacity-90" />
      <div aria-hidden className="bf-curtain pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-90" />
      <div aria-hidden className="bf-valance pointer-events-none absolute inset-x-0 top-0 h-10" />
      <div className="relative w-full max-w-md space-y-6 rounded-[2rem] border-4 border-bf-custard bg-bf-deep/95 p-6 text-center shadow-2xl sm:p-8">
        <Mark className="mx-auto size-14" />
        <h1 className="bf-logo text-4xl sm:text-5xl">
          Pass the phone.
          <span className="mt-2 block text-3xl text-bf-seafoam [text-shadow:2px_2px_0_var(--color-bf-deep)] sm:text-4xl">No peeking.</span>
        </h1>
        <Smartphone aria-hidden className="mx-auto size-10 text-bf-cream/70" />
        <div className="flex flex-col items-center gap-4">{body}</div>
      </div>
    </main>
  );
}
