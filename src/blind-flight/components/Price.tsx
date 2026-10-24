'use client';

import { Hotel, Plane } from 'lucide-react';
import { formatGBP } from '@/lib/pricing';
import type { Itinerary } from '@/lib/types';
import { costBreakdown } from '../lib/cost';

export function Breakdown({ it, ink = true }: { it: Itinerary; ink?: boolean }) {
  const c = costBreakdown(it);
  if (!c) return null;
  const rows: [string, string, string?][] = [
    ['Estimated total for two', formatGBP(c.totalForTwo, { pence: true })],
    ['Per person', formatGBP(c.perPerson, { pence: true })],
    ['Return flights for two', formatGBP(c.flightsForTwo, { pence: true }), `${formatGBP(c.flightsPerPerson, { pence: true })} each`],
    ['Room for two', formatGBP(c.roomForTwo, { pence: true }), `${it.nights} nights${it.hotelName ? `, ${it.hotelName}` : ''}`],
    [
      'Bags and transfers',
      formatGBP(c.extrasForTwo, { pence: true }),
      `Illustrative: £${c.baggageForTwo / 2} bag each + £${c.transfersForTwo} transfers`,
    ],
  ];
  return (
    <dl className={`divide-y text-sm ${ink ? 'divide-bf-ink/10' : 'divide-bf-cream/10'}`}>
      {rows.map(([k, v, note], i) => (
        <div key={k} className={`flex items-baseline justify-between gap-3 py-2 ${i === 0 ? 'font-bold' : ''}`}>
          <dt>
            {k}
            {note && <span className="block text-xs font-normal opacity-70">{note}</span>}
          </dt>
          <dd className="shrink-0 tabular-nums">{v}</dd>
        </div>
      ))}
      <div className="py-2 text-xs opacity-75">Not included: food, sightseeing, local spending and getting to the UK airport.</div>
    </dl>
  );
}

/** Known facts for a trip with no matched fare. Kept as separate fields; never summed into a package. */
export function PendingFacts({ it }: { it: Itinerary }) {
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <div className="rounded-xl bg-bf-ink/5 p-3">
        <dt className="flex items-center gap-1.5 font-bold">
          <Hotel aria-hidden className="size-4" /> Room quote for two
        </dt>
        <dd className="mt-1">
          {it.roomForTwoGBP != null ? formatGBP(it.roomForTwoGBP, { pence: true }) : 'No room quote recorded'}
          {it.hotelName && <span className="block text-xs opacity-75">{it.hotelName}, {it.nights} nights</span>}
        </dd>
      </div>
      <div className="rounded-xl bg-bf-ink/5 p-3">
        <dt className="flex items-center gap-1.5 font-bold">
          <Plane aria-hidden className="size-4" /> Flights
        </dt>
        <dd className="mt-1">
          <span className="inline-block rounded-full bg-bf-custard px-2 py-0.5 text-xs font-bold text-bf-ink">Fare still needed</span>
          <span className="mt-1 block text-xs opacity-80">
            {it.flightNumbers ? `Timetable found: ${it.flightNumbers}.` : 'No flight schedule established.'} No return fare has been matched to
            these dates.
          </span>
        </dd>
      </div>
    </dl>
  );
}
