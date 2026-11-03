'use client';

import { useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { choicesFor, paragraphsFor, sceneById } from '../lib/engine';
import { btn } from './Chrome';
import { useEnvelope } from './EnvelopeProvider';

export default function StoryScreen() {
  const { state, dispatch, story } = useEnvelope();
  const scene = sceneById[story.current];
  const heading = useRef<HTMLHeadingElement>(null);

  const paragraphs = scene ? paragraphsFor(scene, story.ctx) : [];
  const choices = scene ? choicesFor(scene, story.ctx) : [];

  // Each new scene starts at the top, and focus moves to its heading so a screen reader reads it next.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    heading.current?.focus({ preventScroll: true });
  }, [scene?.id, state.history.length]);

  // Number keys pick a choice.
  useEffect(() => {
    if (!scene) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= choices.length) {
        e.preventDefault();
        dispatch({ type: 'choose', sceneId: scene.id, choiceId: choices[n - 1].id });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [scene, choices, dispatch]);

  if (!scene) {
    return (
      <div className="en-paper rounded-sm p-6">
        <p>This part of the story could not be found. It may have been edited since you last played.</p>
        <button type="button" className={`${btn.ink} mt-4`} onClick={() => dispatch({ type: 'restart' })}>
          Start again
        </button>
      </div>
    );
  }

  const isEnding = scene.kind === 'ending';

  return (
    <div className="space-y-6">
      <article key={`${scene.id}-${state.history.length}`} className="en-paper en-fade rounded-sm px-5 py-7 sm:px-10 sm:py-10" aria-labelledby="scene-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-en-rust">{scene.when}</p>
        <h1 id="scene-heading" ref={heading} tabIndex={-1} className="mt-1 font-serif text-3xl italic leading-tight outline-none sm:text-4xl">
          {scene.place}
        </h1>
        {scene.kind === 'tiebreak' && (
          <p className="mt-3 rounded-lg bg-en-fold px-3 py-2 text-sm">Your choices so far point almost equally to two trips. This last one helps decide between them.</p>
        )}

        <div className="en-prose mt-6 font-serif text-[1.075rem] leading-relaxed sm:text-lg">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="mt-8 border-t border-en-ink/15 pt-6">
          {isEnding ? (
            <button type="button" className={btn.ink} onClick={() => dispatch({ type: 'choose', sceneId: scene.id, choiceId: choices[0].id })}>
              {choices[0].label}
            </button>
          ) : (
            <fieldset>
              <legend className="mb-3 text-sm font-semibold">What do you do?</legend>
              <ol className="space-y-3">
                {choices.map((c, i) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      aria-keyshortcuts={String(i + 1)}
                      onClick={() => dispatch({ type: 'choose', sceneId: scene.id, choiceId: c.id })}
                      className="group flex min-h-14 w-full items-start gap-3 rounded-xl border-2 border-en-ink/25 bg-white/50 px-4 py-3 text-left font-serif text-base leading-snug transition hover:border-en-ink hover:bg-white focus-visible:border-en-ink sm:text-[1.05rem]"
                    >
                      <span
                        aria-hidden
                        className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-en-ink/40 font-sans text-xs font-bold text-en-ink/80 group-hover:bg-en-ink group-hover:text-en-paper"
                      >
                        {i + 1}
                      </span>
                      <span>{c.label}</span>
                    </button>
                  </li>
                ))}
              </ol>
              <p className="mt-3 hidden text-xs text-en-ink/75 sm:block">Tip: press 1, 2 or 3 to choose.</p>
            </fieldset>
          )}
        </div>
      </article>

      <div className="en-no-print flex flex-wrap items-center justify-between gap-3">
        <button type="button" className={btn.link} onClick={() => dispatch({ type: 'back' })}>
          <ArrowLeft aria-hidden className="mr-1 size-4" />
          {state.history.length === 0 ? 'Back to the title page' : 'Back a step'}
        </button>
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
  );
}
