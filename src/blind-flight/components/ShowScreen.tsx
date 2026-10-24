'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Plus } from 'lucide-react';
import { destinationById } from '@/lib/catalogue';
import Photo from '@/components/Photo';
import { contenderIds, episodesFor, seatWords, type ShowEpisode } from '../lib/cast';
import { displayName, nextUnvoted, phase, progress, resultsReady, resumeHref } from '../lib/state';
import { useShow } from './BlindFlightProvider';
import { Shell } from './Chrome';
import { btn, LowerThird, VoteChip } from './ui';

function Podium({ id, seat }: { id: string; seat: number }) {
  const { state } = useShow();
  const me = state.players[state.activePlayer];
  const d = destinationById[id];
  const revealed = Boolean(me.identityRevealed[id]);
  const vote = me.votes[id];
  return (
    <Link
      href={`/blind-flight/show/${id}`}
      className="group flex min-w-0 flex-col items-center text-center focus-visible:outline-offset-4"
      aria-label={`Contestant number ${seatWords[seat - 1].toLowerCase()}${revealed ? `: ${d.name}` : ', identity hidden'}${vote ? `. Your vote: ${vote}` : ''}`}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-[2.5rem] rounded-b-lg border-2 border-bf-custard/60 shadow-xl transition group-hover:-translate-y-1 group-hover:border-bf-custard">
        {revealed ? (
          <Photo src={d.imagePath} name={d.name} country={d.country} className="absolute inset-0" sizes="(max-width: 640px) 33vw, 260px" />
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
      <p className="mt-2 min-h-5 truncate text-sm font-semibold text-bf-cream">{revealed ? d.name : 'Identity hidden'}</p>
      {vote ? <VoteChip vote={vote} className="mt-1" /> : <span className="mt-1 text-xs text-bf-cream/60">No vote yet</span>}
    </Link>
  );
}

function EpisodeStage({ episode }: { episode: ShowEpisode }) {
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
      <div className="relative rounded-3xl border border-bf-cream/10 bg-black/20 px-3 pb-5 pt-6 sm:px-8">
        <div aria-hidden className="bf-floor pointer-events-none absolute inset-x-0 bottom-0 h-1/3 rounded-b-3xl" />
        <div className="relative mx-auto grid max-w-3xl grid-cols-3 gap-3 sm:gap-8">
          {episode.cast.map((id, i) => (
            <Podium key={id} id={id} seat={i + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ShowScreen() {
  const { state, dispatch } = useShow();
  const router = useRouter();
  const ph = phase(state);
  const eps = episodesFor(state.destinationOrder);
  const p = progress(state);
  const who = displayName(state, state.activePlayer);
  const complete = state.ballotComplete[state.activePlayer];
  const unvoted = p.total - p.voted;
  const next = nextUnvoted(state);
  const addable = contenderIds.filter((id) => !state.destinationOrder.includes(id)).length;

  const finish = () => {
    if (unvoted > 0 && !window.confirm(`${unvoted} contestant${unvoted === 1 ? ' has' : 's have'} no vote. They won’t count either way. Finish anyway?`)) return;
    dispatch({ type: 'completeBallot' });
    if (state.mode === 'two_person' && state.activePlayer === 'traveller1' && !state.ballotComplete.traveller1) router.push('/blind-flight/handover');
    else router.push('/blind-flight/results');
  };

  return (
    <Shell>
      <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:py-12">
        <section className="space-y-4">
          {ph === 'handover' ? (
            <div className="rounded-2xl border-2 border-bf-custard bg-bf-custard/10 p-4">
              <p className="font-semibold">Traveller 1 has finished. Time to pass the phone.</p>
              <Link href="/blind-flight/handover" className={btn.primary + ' mt-3'}>
                Go to the handover
              </Link>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-bf-seafoam">
                {ph === 'results' ? `Editing: ${who}` : state.mode === 'quick' ? 'Quick play' : `Now voting: ${who}`}
              </p>
              <h1 className="bf-logo text-4xl sm:text-5xl">Meet the contestants</h1>
              {p.voted === 0 && (
                <p className="max-w-2xl text-bf-cream/85">
                  Each destination flirts first and reveals itself later. Peek at the price, then vote Keep, Maybe or Pass.
                </p>
              )}
              <div className="max-w-md">
                <div className="flex justify-between text-sm text-bf-cream/80">
                  <span>
                    {p.voted} of {p.total} judged — {who}
                  </span>
                  {unvoted > 0 && <span>{unvoted} to go</span>}
                </div>
                <div className="mt-1 h-3 overflow-hidden rounded-full bg-bf-cream/10" role="progressbar" aria-valuemin={0} aria-valuemax={p.total} aria-valuenow={p.voted} aria-label="Ballot progress">
                  <div className="h-full rounded-full bg-bf-seafoam transition-all" style={{ width: `${(p.voted / Math.max(1, p.total)) * 100}%` }} />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {next ? (
                  <Link href={ph === 'results' ? `/blind-flight/show/${next}` : resumeHref(state)} className={btn.primary}>
                    {p.voted === 0 ? 'Meet contestant number one' : 'Next contestant'} <ChevronRight aria-hidden className="size-5" />
                  </Link>
                ) : null}
                {ph === 'results' ? (
                  <Link href="/blind-flight/results" className={btn.gold}>
                    Back to the results
                  </Link>
                ) : (
                  !complete && (
                    <button type="button" onClick={finish} className={next ? btn.ghost : btn.gold}>
                      {state.mode === 'two_person' && state.activePlayer === 'traveller1' ? 'Lock in my ballot' : 'Lock in and see the results'}
                    </button>
                  )
                )}
              </div>
            </>
          )}
        </section>

        {eps.map((e) => (
          <EpisodeStage key={e.id} episode={e} />
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
          {resultsReady(state) && (
            <Link href="/blind-flight/results" className={btn.link}>
              Results
            </Link>
          )}
        </div>
      </div>
    </Shell>
  );
}
