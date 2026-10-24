'use client';

import Link from 'next/link';
import { ChevronRight, Plus, Shuffle } from 'lucide-react';
import { destinationById } from '@/lib/catalogue';
import Photo from '@/components/Photo';
import { contenderIds, newSeed, seatWords, type ShowEpisode } from '../lib/cast';
import { anyProgress, currentEpisode, displayName, episodeStage, episodeVerdict, isUnmasked, players, progress, resultsReady, resumeHref, showEpisodes } from '../lib/state';
import { useShow } from './BlindFlightProvider';
import { Shell } from './Chrome';
import { btn, LowerThird } from './ui';

function Podium({ episodeId, id, seat }: { episodeId: string; id: string; seat: number }) {
  const { state } = useShow();
  const d = destinationById[id];
  const shown = isUnmasked(state, episodeId, id);
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-[2.5rem] rounded-b-lg border-2 border-bf-custard/60 shadow-xl">
        {shown ? (
          <Photo src={d.imagePath} name={d.name} country={d.country} className="size-full" sizes="(max-width: 640px) 33vw, 260px" />
        ) : (
          <div className="bf-silhouette absolute inset-0 grid place-items-center">
            <span aria-hidden className="bf-display text-6xl text-bf-custard/90 sm:text-8xl">
              ?
            </span>
          </div>
        )}
      </div>
      <div className="bf-podium -mt-1 w-[112%] px-1 pb-2 pt-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-bf-cream/90 sm:text-xs">Contestant No.</p>
        <p className="bf-display text-xl leading-none text-bf-custard sm:text-3xl">{seatWords[seat - 1]}</p>
      </div>
      <p className="mt-2 min-h-5 w-full truncate text-sm font-semibold text-bf-cream">{shown ? d.name : 'Identity hidden'}</p>
    </div>
  );
}

function Status({ episode }: { episode: ShowEpisode }) {
  const { state } = useShow();
  const stage = episodeStage(state, episode.id);
  const v = episodeVerdict(state, episode);
  if (stage === 'done' && v) {
    const name = (id: string) => destinationById[id].name;
    const text =
      v.kind === 'match'
        ? `It’s a match: ${name(v.id)}`
        : v.kind === 'split'
          ? `Split decision: ${players.map((p) => `${displayName(state, p)} chose ${name(v.ids[p])}`).join('; ')}`
          : `You chose ${name(v.id)}`;
    return <p className="font-semibold text-bf-seafoam">{text}</p>;
  }
  const label = { watching: 'Not started', choosing: 'Choosing now', handover: 'Choosing now', reveal: 'Mid-reveal', duel: 'Price duel', done: '' }[stage];
  return <p className="text-sm text-bf-cream/70">{label}</p>;
}

function EpisodeStage({ episode, current }: { episode: ShowEpisode; current: boolean }) {
  const { state } = useShow();
  const stage = episodeStage(state, episode.id);
  return (
    <section aria-labelledby={`ep-${episode.id}`} className="relative">
      <div className="mb-4 space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-bf-seafoam">
          {episode.bonus ? 'Bonus round' : `Episode ${episode.number}`}
        </p>
        <h2 id={`ep-${episode.id}`} className="bf-display text-3xl text-bf-custard sm:text-4xl">
          {episode.title}
        </h2>
        <LowerThird label="Host">{episode.presenterLine}</LowerThird>
      </div>
      <Link
        href={`/blind-flight/episode/${episode.id}`}
        className={`group relative block rounded-3xl border bg-black/20 px-3 pb-5 pt-6 transition hover:border-bf-custard/60 sm:px-8 ${
          current ? 'border-bf-custard' : 'border-bf-cream/10'
        }`}
      >
        <div aria-hidden className="bf-floor pointer-events-none absolute inset-x-0 bottom-0 h-1/3 rounded-b-3xl" />
        <div className="relative mx-auto grid max-w-3xl grid-cols-3 gap-3 sm:gap-8">
          {episode.cast.map((id, i) => (
            <Podium key={id} episodeId={episode.id} id={id} seat={i + 1} />
          ))}
        </div>
        <div className="relative mt-4 flex items-center justify-between gap-3">
          <Status episode={episode} />
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-bf-custard">
            {stage === 'done' ? 'Watch again' : current ? 'Play' : 'Open'} <ChevronRight aria-hidden className="size-4" />
          </span>
        </div>
      </Link>
    </section>
  );
}

export default function ShowScreen() {
  const { state, dispatch, sfx } = useShow();
  const eps = progress(state);
  const current = currentEpisode(state);
  const ready = resultsReady(state);
  const addable = contenderIds.filter((id) => !state.destinationOrder.includes(id)).length;
  const episodes = showEpisodes(state);

  return (
    <Shell>
      <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:py-12">
        <section className="space-y-4">
          <h1 className="bf-logo text-4xl sm:text-5xl">Tonight’s show</h1>
          {eps.done === 0 && (
            <p className="max-w-2xl text-bf-cream/85">
              Each episode has three hidden contestants. The host asks them three questions. Then{' '}
              {state.mode === 'quick' ? 'you choose one together' : 'you each choose one in secret'}, and only then do they reveal who they are.
            </p>
          )}
          <div className="max-w-md">
            <div className="flex justify-between text-sm text-bf-cream/80">
              <span>
                {eps.done} of {eps.total} episodes decided
              </span>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-bf-cream/10" role="progressbar" aria-valuemin={0} aria-valuemax={eps.total} aria-valuenow={eps.done} aria-label="Show progress">
              <div className="h-full rounded-full bg-bf-seafoam transition-all" style={{ width: `${(eps.done / Math.max(1, eps.total)) * 100}%` }} />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {ready ? (
              <Link href="/blind-flight/results" className={btn.gold}>
                See the results <ChevronRight aria-hidden className="size-5" />
              </Link>
            ) : (
              <Link href={resumeHref(state)} className={btn.primary}>
                {eps.done === 0 && current?.number === 1 ? 'Start episode one' : `Continue: ${current?.title}`} <ChevronRight aria-hidden className="size-5" />
              </Link>
            )}
            {!anyProgress(state) && (
              <button
                type="button"
                className={btn.ghost}
                onClick={() => {
                  dispatch({ type: 'reshuffle', seed: newSeed() });
                  sfx('tick');
                }}
              >
                <Shuffle aria-hidden className="size-4" /> Shuffle the line-up
              </button>
            )}
          </div>
        </section>

        {episodes.map((e) => (
          <EpisodeStage key={e.id} episode={e} current={e.id === current?.id} />
        ))}

        <section className="flex flex-col gap-4 rounded-3xl border border-dashed border-bf-cream/30 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="bf-display text-2xl text-bf-custard">More eligible contenders</h2>
            <p className="mt-1 text-sm text-bf-cream/80">
              {addable > 0
                ? `${addable} more destinations fit your dates, including some without a confirmed fare. Add any of them as a bonus round.`
                : 'Every eligible destination is already on the show.'}
            </p>
          </div>
          <Link href="/blind-flight/contenders" className={btn.ghost + ' shrink-0'}>
            <Plus aria-hidden className="size-4" /> See who else is waiting
          </Link>
        </section>

        <div className="flex flex-wrap gap-x-6">
          <Link href="/blind-flight/compare" className={btn.link}>
            Skip to comparison
          </Link>
        </div>
      </div>
    </Shell>
  );
}

