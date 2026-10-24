'use client';

import Link from 'next/link';
import { Check, Plus } from 'lucide-react';
import Photo from '@/components/Photo';
import { destinationById } from '@/lib/catalogue';
import { formatGBP } from '@/lib/pricing';
import { contenderIds, selectedVariant, variantsFor } from '../lib/cast';
import { costBreakdown } from '../lib/cost';
import { resultsReady } from '../lib/state';
import { useShow } from './BlindFlightProvider';
import { Shell } from './Chrome';
import { btn, HostSays } from './ui';

export default function ContendersScreen() {
  const { state, dispatch } = useShow();
  const done = resultsReady(state) || state.ballotComplete.traveller1;
  return (
    <Shell>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:py-12">
        <section className="space-y-3">
          <Link href="/blind-flight/show" className={btn.link}>
            ← Back to the show
          </Link>
          <h1 className="bf-logo text-4xl sm:text-5xl">More eligible contenders</h1>
          <HostSays>They didn’t make the main show, but they’ve brought their own luggage.</HostSays>
          <p className="max-w-2xl text-bf-cream/85">
            Every destination here has a trip that fits your dates. Some have a priced quote. Others only have a flight timetable and a room quote, so
            their total stays blank. Added contestants join a bonus round for both travellers.
          </p>
          {done && (
            <p className="max-w-2xl rounded-xl bg-bf-custard/10 p-3 text-sm">
              A ballot is already locked in. Anyone added now is unjudged on that ballot and counts neither way. That traveller can vote on them later with Edit on the results page.
            </p>
          )}
        </section>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contenderIds.map((id) => {
            const d = destinationById[id];
            const it = selectedVariant(id, state.preferredItineraryByDestination[id])!;
            const c = costBreakdown(it);
            const added = state.destinationOrder.includes(id);
            const n = variantsFor(id).length;
            return (
              <li key={id} className="bf-paper flex flex-col overflow-hidden rounded-3xl">
                <Photo src={d.imagePath} name={d.name} country={d.country} className="aspect-[16/10]" sizes="(max-width: 640px) 100vw, 380px" />
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h2 className="bf-display text-2xl text-bf-red">{d.name}</h2>
                  <p className="text-sm opacity-80">{d.country}</p>
                  <p className="text-sm">{d.intro}</p>
                  <p className="font-bold">
                    {c ? `${formatGBP(c.headline)} for two` : 'Price pending — flights not yet priced'}
                    {n > 1 && <span className="text-sm font-normal opacity-75"> · {n} date options</span>}
                  </p>
                  <p className="text-sm text-bf-red">{d.caution}</p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    <Link href={`/blind-flight/show/${id}`} className={btn.ghostInk}>
                      Profile
                    </Link>
                    <button
                      type="button"
                      aria-pressed={added}
                      className={added ? btn.ghostInk : btn.primary.replace('text-lg', 'text-base')}
                      onClick={() => dispatch({ type: added ? 'removeContender' : 'addContender', destinationId: id })}
                    >
                      {added ? (
                        <>
                          <Check aria-hidden className="size-4" /> On the show (remove)
                        </>
                      ) : (
                        <>
                          <Plus aria-hidden className="size-4" /> Add to the show
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Shell>
  );
}
