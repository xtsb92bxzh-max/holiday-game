'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { copy } from '../data/copy';
import { featuredIds } from '../lib/cast';
import { phaseHref, resumeHref, type Mode } from '../lib/state';
import { ChannelBug, Footer, Toggles, Wordmark } from './Chrome';
import { useShow, useVisit } from './ShowProvider';
import { btn, HostLine } from './ui';

export default function ShowIntro() {
  const { state, dispatch, hadSavedShow } = useShow();
  const router = useRouter();
  const [audience, setAudience] = useState(false);
  useVisit('intro');
  const canResume = hadSavedShow && state.started;

  const start = () => {
    dispatch({ type: 'start' });
    router.push(phaseHref.picture_reveal);
  };

  return (
    <>
      <main id="main" className="relative isolate overflow-hidden">
        <div aria-hidden className="gb-curtain absolute inset-y-0 left-0 w-[9vw] max-w-24 opacity-90" />
        <div aria-hidden className="gb-curtain absolute inset-y-0 right-0 w-[9vw] max-w-24 opacity-90" />
        <div className="absolute right-3 top-3 flex items-center gap-1">
          <ChannelBug />
          <Toggles />
        </div>

        <div className="mx-auto flex min-h-[92dvh] max-w-3xl flex-col items-center justify-center gap-6 px-[max(1rem,10vw)] py-16 text-center sm:px-24">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gb-paper/80">{copy.channel}</p>
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="gb-bulbs rounded-3xl bg-gb-black/70 px-4 py-6 sm:px-10 sm:py-8"
          >
            <Wordmark size="lg" />
          </motion.div>
          <p className="font-serif text-xl italic text-gb-gold sm:text-2xl">{copy.tagline}</p>
          <p className="text-sm text-gb-paper/85 sm:text-base">{copy.secondary}</p>
          <HostLine className="max-w-xl !text-base text-gb-paper sm:!text-lg">{copy.openingHost}</HostLine>

          {!audience ? (
            <div className="flex w-full max-w-md flex-col items-stretch gap-3">
              {canResume ? (
                <>
                  <Link href={resumeHref(state)} className={btn.primary}>
                    Resume show
                  </Link>
                  <button type="button" className={btn.ghost} onClick={() => setAudience(true)}>
                    Roll the titles again
                  </button>
                </>
              ) : (
                <button type="button" className={btn.primary} onClick={() => setAudience(true)}>
                  Roll the titles
                </button>
              )}
              <Link href="/getaway-show/holidays" className={btn.teal}>
                Skip the nonsense — show holidays
              </Link>
              <Link href="/getaway-show/about" className={btn.link + ' justify-center'}>
                What do these prices include?
              </Link>
              {canResume && (
                <button
                  type="button"
                  className={btn.link + ' justify-center'}
                  onClick={() => {
                    if (window.confirm('Start again? This clears both ballots, all guesses and the finalists on this device.')) {
                      dispatch({ type: 'reset' });
                      setAudience(true);
                    }
                  }}
                >
                  Start again
                </button>
              )}
            </div>
          ) : (
            <Audience onStart={start} onBack={() => setAudience(false)} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function Audience({ onStart, onBack }: { onStart: () => void; onBack: () => void }) {
  const { state, dispatch } = useShow();
  const modes: { id: Mode; title: string; body: string }[] = [
    {
      id: 'two_person',
      title: 'Two-person edition',
      body: 'Play the rounds together, then each of you votes privately on this phone. Results are revealed together.',
    },
    { id: 'quick', title: 'Quick edition', body: 'One shared set of votes and a shortlist. No two-person matching.' },
  ];
  return (
    <section aria-labelledby="audience" className="gb-pinstripe w-full max-w-xl rounded-3xl p-5 text-left shadow-2xl sm:p-6">
      <h2 id="audience" className="gb-display text-3xl text-gb-tomato">
        Members of the audience
      </h2>
      <p className="mt-1 text-sm">
        {featuredIds.length} destinations tonight, about 6 to 10 minutes. Every round can be skipped. Progress is saved on this device only.
      </p>

      <fieldset className="mt-4 space-y-2">
        <legend className="text-sm font-bold">Choose your edition</legend>
        {modes.map((m) => (
          <label
            key={m.id}
            className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border-2 p-3 ${
              state.mode === m.id ? 'border-gb-teal bg-gb-teal/10' : 'border-gb-black/15'
            }`}
          >
            <input
              type="radio"
              name="mode"
              value={m.id}
              checked={state.mode === m.id}
              onChange={() => dispatch({ type: 'setMode', mode: m.id })}
              className="mt-1 size-5 accent-[#196c73]"
            />
            <span>
              <span className="block font-bold">
                {m.title}
                {m.id === 'two_person' && <span className="ml-1 text-xs font-normal">(default)</span>}
              </span>
              <span className="block text-sm opacity-85">{m.body}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {state.mode === 'two_person' && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(['a', 'b'] as const).map((p) => (
            <label key={p} className="text-sm font-bold">
              Traveller {p.toUpperCase()} nickname <span className="font-normal">(optional)</span>
              <input
                value={state.playerNames[p]}
                maxLength={24}
                autoComplete="off"
                onChange={(e) => dispatch({ type: 'setName', player: p, name: e.target.value })}
                placeholder={`Traveller ${p.toUpperCase()}`}
                className="mt-1 block min-h-11 w-full rounded-xl border-2 border-gb-black/20 bg-white px-3 text-base font-normal"
              />
            </label>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs opacity-80">Sound is off unless you turn it on. Use the lightning button to skip animations.</p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button type="button" className={btn.primary} onClick={onStart}>
          Start the show
        </button>
        <button type="button" className={btn.linkInk + ' justify-center px-3'} onClick={onBack}>
          Back
        </button>
      </div>
    </section>
  );
}
