'use client';

import Link from 'next/link';
import { SHORTLIST } from '../data/shortlist';
import { isFinished } from '../lib/engine';
import { lowerFirst } from '../lib/summary';
import { btn, COMPARE_ALL_HREF, Mark } from './Chrome';
import { useEnvelope } from './EnvelopeProvider';

export default function TitleScreen() {
  const { state, dispatch, story } = useEnvelope();
  const saved = state.history.length > 0;
  const finished = isFinished(story);
  return (
    <div className="en-fade space-y-10">
      <header className="space-y-5 pt-4 text-center sm:pt-10">
        <Mark className="mx-auto size-12 text-en-lamp" />
        <h1 className="font-serif text-5xl italic leading-none text-en-paper sm:text-7xl">The Envelope</h1>
        <p className="mx-auto max-w-md font-serif text-lg leading-snug text-en-mist sm:text-xl">
          A short story in an unfamiliar city. What you choose to do there suggests where to go in January.
        </p>
      </header>

      <figure className="en-paper mx-auto max-w-xl -rotate-1 rounded-sm px-6 py-7 sm:px-9">
        <blockquote className="font-serif text-lg leading-relaxed sm:text-xl">
          <p>
            You arrive in an unfamiliar city with five nights free and an envelope left for you at reception. Inside is a hand-drawn map, a key and a
            note:
          </p>
          <p className="mt-4 text-center text-xl italic text-en-rust sm:text-2xl">“There is more than one way to find what you came for.”</p>
        </blockquote>
      </figure>

      <div className="flex flex-col items-center gap-3">
        {saved ? (
          <>
            <button type="button" className={btn.primary} onClick={() => dispatch({ type: 'resume' })} autoFocus>
              {finished ? 'See your recommendation' : 'Carry on with the story'}
            </button>
            <button
              type="button"
              className={btn.ghost}
              onClick={() => {
                if (window.confirm('Start the story again from the first night? Your choices will be cleared.')) dispatch({ type: 'start' });
              }}
            >
              Start again
            </button>
          </>
        ) : (
          <button type="button" className={btn.primary} onClick={() => dispatch({ type: 'start' })} autoFocus>
            Open the envelope
          </button>
        )}
        <p className="text-sm text-en-mist">About 5–8 minutes · 9 or 10 decisions · saved on this device</p>
      </div>

      <section className="mx-auto max-w-xl space-y-3 text-sm leading-relaxed text-en-mist">
        <details className="rounded-2xl border border-en-paper/15 px-4 py-1">
          <summary className="min-h-11 cursor-pointer py-3 font-semibold text-en-paper">How the suggestion works</summary>
          <div className="space-y-2 pb-4">
            <p>
              Each decision quietly moves a handful of travel preferences, such as pace, setting and how far you are willing to travel for something. No
              choice is worth points to a particular destination.
            </p>
            <p>
              At the end, your average on each preference is compared with a profile for each trip on the shortlist. The nearest one is suggested, with the
              runner-up beside it. If the two are close, the story says so and offers one last choice.
            </p>
            <p>
              After the story there is an optional practical check about cold weather, early flights and cost. Those answers add notes. They do not change
              what the story suggests.
            </p>
            <p>The shortlist: {SHORTLIST.map((o) => `${o.name} (${lowerFirst(o.split)})`).join('; ')}.</p>
          </div>
        </details>
        <p className="text-center">
          Not in the mood for a story?{' '}
          <Link href={COMPARE_ALL_HREF} className="underline decoration-dotted underline-offset-4 hover:text-en-paper">
            Compare every holiday
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
