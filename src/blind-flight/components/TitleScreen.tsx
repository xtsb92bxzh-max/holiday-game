'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Users, Zap } from 'lucide-react';
import { copy } from '../data/copy';
import { featuredIds } from '../lib/cast';
import { anyProgress, players, progress, resumeHref, type PlayMode } from '../lib/state';
import { useShow } from './BlindFlightProvider';
import { Logo, Mark, Toggles } from './Chrome';
import { btn, HostSays } from './ui';

const modes: { id: PlayMode; title: string; blurb: string; Icon: typeof Users }[] = [
  {
    id: 'two_person',
    title: 'Two-person game',
    blurb: 'Watch each episode together, then choose in secret and pass the phone. Matches are revealed together.',
    Icon: Users,
  },
  {
    id: 'quick',
    title: 'Quick play',
    blurb: 'One shared choice per episode and a faster show. You still get a shortlist.',
    Icon: Zap,
  },
];

export default function TitleScreen() {
  const { state, dispatch, sfx } = useShow();
  const router = useRouter();
  const anyChoices = anyProgress(state);
  const p = progress(state);

  const start = () => {
    dispatch({ type: 'start' });
    sfx('fanfare');
    router.push(state.started ? resumeHref(state) : '/blind-flight/show');
  };

  return (
    <div className="relative isolate flex min-h-dvh flex-col">
      {/* Stage set: curtains and valance. Decorative only. */}
      <div aria-hidden className="bf-valance pointer-events-none absolute inset-x-0 top-0 z-10 h-10" />
      <div aria-hidden className="bf-curtain pointer-events-none absolute bottom-0 left-0 top-0 w-[9vw] max-w-28 rounded-br-[60%_8%]" />
      <div aria-hidden className="bf-curtain pointer-events-none absolute bottom-0 right-0 top-0 w-[9vw] max-w-28 rounded-bl-[60%_8%]" />
      <div aria-hidden className="bf-floor pointer-events-none absolute inset-x-0 bottom-0 h-40" />

      <div className="relative z-20 flex items-center justify-between px-[max(1rem,10vw)] pt-12 sm:pt-14">
        <Link href="/" className={btn.link}>
          ← All games
        </Link>
        <Toggles />
      </div>

      <main id="main" className="relative z-20 mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-[max(1rem,10vw)] pb-16 text-center sm:px-6">
        <div className="relative mt-4 grid place-items-center py-6">
          <div aria-hidden className="bf-starburst bf-spin-slow absolute size-72 bg-bf-tomato/25 sm:size-[26rem]" />
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 160, damping: 14 }}
            className="relative"
          >
            <Mark className="mx-auto mb-2 size-16 sm:size-20" />
            <Logo size="lg" />
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-2">
          <p className="bf-display text-xl text-bf-seafoam sm:text-2xl">Love at first flight. Regret at baggage claim.</p>
          <p className="text-sm text-bf-cream/85 sm:text-base">The dating show where you fall for a destination, not a person.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 max-w-xl">
          <HostSays>
            Two hopeful holidaymakers. A suspicious number of European destinations. And absolutely no prizes, because you’re paying for it
            yourselves.
          </HostSays>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 w-full max-w-md space-y-5 text-left"
        >
          <fieldset>
            <legend className="mb-2 text-xs font-bold uppercase tracking-widest text-bf-custard">How are you playing?</legend>
            <div className="grid gap-3">
              {modes.map(({ id, title, blurb, Icon }) => (
                <label
                  key={id}
                  className={`flex cursor-pointer gap-3 rounded-2xl border-2 p-4 transition ${
                    state.mode === id ? 'border-bf-custard bg-bf-custard/10' : 'border-bf-cream/20 bg-black/20 hover:border-bf-cream/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={id}
                    checked={state.mode === id}
                    className="mt-1 size-5 accent-[#f3c95e]"
                    onChange={() => {
                      if (anyChoices && !window.confirm('Changing how you play clears the choices so far. Carry on?')) return;
                      dispatch({ type: 'setMode', mode: id });
                    }}
                  />
                  <span>
                    <span className="flex items-center gap-2 font-bold text-bf-cream">
                      <Icon aria-hidden className="size-4" />
                      {title}
                      {id === 'two_person' && <span className="text-xs font-normal text-bf-cream/70">(recommended)</span>}
                    </span>
                    <span className="mt-1 block text-sm text-bf-cream/80">{blurb}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {state.mode === 'two_person' && (
            <fieldset className="rounded-2xl border border-bf-cream/20 bg-black/20 p-4">
              <legend className="px-2 text-xs font-bold uppercase tracking-widest text-bf-custard">Tonight’s travellers (optional)</legend>
              <div className="grid grid-cols-2 gap-3">
                {players.map((p, i) => (
                  <label key={p} className="text-xs text-bf-cream/75">
                    Traveller {i + 1}
                    <input
                      value={state.nicknames[p]}
                      placeholder={`Traveller ${i + 1}`}
                      maxLength={24}
                      onChange={(e) => dispatch({ type: 'setNickname', player: p, name: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-bf-cream/30 bg-bf-deep px-3 py-2 text-base text-bf-cream placeholder:text-bf-cream/40"
                      autoComplete="off"
                    />
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-bf-cream/60">Nicknames stay on this phone. They are never included in the shared summary.</p>
            </fieldset>
          )}

          <div className="flex flex-col items-stretch gap-3 pt-2">
            <button type="button" className={btn.primary + ' text-xl'} onClick={start}>
              {state.started ? 'Continue the show' : 'Start the show'}
            </button>
            <Link href="/blind-flight/holidays" className={btn.gold}>
              Skip to the holidays
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-x-5">
              <Link href="/blind-flight/show" className={btn.link} onClick={() => dispatch({ type: 'start' })}>
                Skip intro
              </Link>
              <Link href="/blind-flight/about" className={btn.link}>
                About these prices
              </Link>
              {state.started && (
                <button
                  type="button"
                  className={btn.link}
                  onClick={() => {
                    if (window.confirm('Clear every choice and finalist and start again?')) dispatch({ type: 'reset' });
                  }}
                >
                  Start again
                </button>
              )}
            </div>
            {state.started && (
              <p className="text-center text-xs text-bf-cream/60">
                Saved on this phone: {p.done} of {p.total} episodes decided.
              </p>
            )}
          </div>
        </motion.div>

        <p className="mt-10 max-w-md text-xs text-bf-cream/60">
          {featuredIds.length} featured contestants for 17–22 January 2027 from Edinburgh or Glasgow. Prices are indicative estimates for two,
          compiled 23 October 2026. {copy.rules}
        </p>
      </main>
    </div>
  );
}
