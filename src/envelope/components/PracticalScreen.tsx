'use client';

import { useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { PRACTICAL_QUESTIONS } from '../data/practical';
import { btn } from './Chrome';
import { useEnvelope } from './EnvelopeProvider';

export default function PracticalScreen() {
  const { state, dispatch } = useEnvelope();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    heading.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="en-fade space-y-6">
      <section className="en-paper rounded-sm px-5 py-7 sm:px-10 sm:py-10" aria-labelledby="practical-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-en-rust">Outside the story · optional</p>
        <h1 id="practical-heading" ref={heading} tabIndex={-1} className="mt-1 font-serif text-3xl italic leading-tight outline-none sm:text-4xl">
          Practical check
        </h1>
        <p className="mt-4 leading-relaxed">
          The story cannot tell how you feel about cold weather, early flights or cost, so it does not try. Answer these if they matter to you. They add notes to the
          result. They do not change what your choices suggest.
        </p>

        <div className="mt-6 space-y-6">
          {PRACTICAL_QUESTIONS.map((q) => (
            <fieldset key={q.id} className="rounded-xl border-2 border-en-ink/15 p-4">
              <legend className="px-1 font-serif text-lg font-semibold">{q.legend}</legend>
              <p className="text-sm text-en-ink/80">{q.hint}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {q.options.map((o) => {
                  const checked = state.practical[q.id] === o.id;
                  return (
                    <label
                      key={o.id}
                      className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold transition has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-en-rust ${
                        checked ? 'border-en-ink bg-en-ink text-en-paper' : 'border-en-ink/30 hover:border-en-ink'
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={o.id}
                        checked={checked}
                        onChange={() => dispatch({ type: 'answer', question: q.id, value: o.id })}
                        className="sr-only"
                      />
                      {o.label}
                    </label>
                  );
                })}
                {state.practical[q.id] && (
                  <button type="button" className={btn.linkInk} onClick={() => dispatch({ type: 'answer', question: q.id, value: undefined })}>
                    Clear
                  </button>
                )}
              </div>
            </fieldset>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-en-ink/15 pt-6">
          <button type="button" className={btn.ink} onClick={() => dispatch({ type: 'showResult' })}>
            Show the suggestion
          </button>
          {Object.keys(state.practical).length === 0 && <span className="text-sm text-en-ink/80">or carry on without answering.</span>}
        </div>
      </section>

      <button type="button" className={btn.link} onClick={() => dispatch({ type: 'back' })}>
        <ArrowLeft aria-hidden className="mr-1 size-4" />
        Back to the end of the story
      </button>
    </div>
  );
}
