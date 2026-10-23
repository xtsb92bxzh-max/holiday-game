'use client';

import { AlertTriangle, BedDouble, Plane, Clock } from 'lucide-react';
import type { Itinerary } from '@/lib/types';
import { evidenceLabel, routeLabel, hasPrice } from '@/lib/catalogue';
import { extrasForParty, formatGBP, perPerson, defaultAssumptions } from '@/lib/pricing';
import { ExternalLink } from './ui';
import { formatDate } from '@/lib/dates';
import assumptions from '@/data/assumptions.json';

const linkNote: Record<NonNullable<Itinerary['flightLinkKind']>, string> = {
  generic_search: 'General flight search. Enter the dates yourself.',
  route_page: 'Route page. Check the exact dates.',
  timetable: 'Timetable only. No fare.',
};

export function PriceBreakdown({ it }: { it: Itinerary }) {
  if (!hasPrice(it)) {
    return (
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
        <dt>Return flights</dt>
        <dd className="text-right font-semibold">Not confirmed</dd>
        <dt>Room for two ({it.nights} nights)</dt>
        <dd className="text-right font-semibold">{formatGBP(it.roomForTwoGBP, { pence: true })}</dd>
        <dt className="col-span-2 mt-1 text-xs opacity-75">
          No total is shown because no fare was matched to these dates. The room quote alone is not a holiday price.
        </dt>
      </dl>
    );
  }
  const a = defaultAssumptions;
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
      <dt>
        Return flights ({formatGBP(it.flightsPerPersonGBP, { pence: false })} × {a.adults})
      </dt>
      <dd className="text-right tabular-nums">{formatGBP(it.flightsPerPersonGBP! * a.adults, { pence: true })}</dd>
      <dt>Room for two ({it.nights} nights)</dt>
      <dd className="text-right tabular-nums">{formatGBP(it.roomForTwoGBP, { pence: true })}</dd>
      <dt>
        Baggage allowance ({formatGBP(a.baggagePerAdultGBP)} × {a.adults})
      </dt>
      <dd className="text-right tabular-nums">{formatGBP(a.baggagePerAdultGBP * a.adults, { pence: true })}</dd>
      <dt>Transfers for two</dt>
      <dd className="text-right tabular-nums">{formatGBP(a.transfersForTwoGBP, { pence: true })}</dd>
      <dt className="border-t border-current/20 pt-1 font-bold">Estimated total for two</dt>
      <dd className="border-t border-current/20 pt-1 text-right font-bold tabular-nums">{formatGBP(it.estimatedTotalForTwoGBP, { pence: true })}</dd>
      <dt>Per person</dt>
      <dd className="text-right tabular-nums">{formatGBP(perPerson(it.estimatedTotalForTwoGBP), { pence: true })}</dd>
      <dt className="col-span-2 mt-1 text-xs opacity-75">
        Extras ({formatGBP(extrasForParty())}) are illustrative. Food, attractions and getting to the UK airport are not included.
      </dt>
    </dl>
  );
}

export function FlightFacts({ it, tone = 'light' }: { it: Itinerary; tone?: 'light' | 'dark' }) {
  const muted = tone === 'light' ? 'text-ink/70' : 'text-cream/70';
  return (
    <div className="space-y-3 text-sm">
      <p className="flex items-start gap-2">
        <Plane aria-hidden className="mt-0.5 size-4 shrink-0" />
        <span>
          <strong>
            {it.departureAirport} → {it.arrivalAirport}
          </strong>{' '}
          · {routeLabel[it.routeType]}
          {it.flightNumbers && <span className={muted}> · {it.flightNumbers}</span>}
          <span className={`block ${muted}`}>{it.routeEvidence}</span>
        </span>
      </p>
      {it.flightTimes ? (
        <p className="flex items-start gap-2">
          <Clock aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            Out {formatDate(it.departDate)} {it.flightTimes.leaveUK} → lands {it.flightTimes.arriveThere} local. Back{' '}
            {formatDate(it.returnDate)} {it.flightTimes.leaveThere} → lands {it.flightTimes.arriveUK}.
            <span className={`block ${muted}`}>
              Scheduled times from the uploaded timetable
              {it.hoursInDestination ? `; about ${Math.round(it.hoursInDestination)} hours on the ground` : ''}.
            </span>
          </span>
        </p>
      ) : (
        <p className="flex items-start gap-2">
          <Clock aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span className={muted}>Flight times not recorded for this option.</span>
        </p>
      )}
      {it.hotelName && (
        <p className="flex items-start gap-2">
          <BedDouble aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            {it.hotelName}
            {it.hotelReviewOutOf10 != null && <span className={muted}> · rated {it.hotelReviewOutOf10}/10</span>}
          </span>
        </p>
      )}
      {it.routeCaution && (
        <p className="flex items-start gap-2 rounded-lg bg-mustard/20 p-2.5">
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-[#9a6b00]" />
          <span>{it.routeCaution}</span>
        </p>
      )}
    </div>
  );
}

export function ProvenanceLine({ it }: { it: Itinerary }) {
  return (
    <p className="mt-2 text-xs opacity-75">
      {evidenceLabel[it.fareEvidence]} · {it.fareSource || 'source not recorded'} · observed{' '}
      {formatDate(assumptions.pricesObservedOn)} 2026 · workbook ref {it.sourceRef}. Not a live fare.
    </p>
  );
}

export function BookingLinks({ it, className = '' }: { it: Itinerary; className?: string }) {
  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        <ExternalLink href={it.flightSourceUrl} note={it.flightLinkKind && linkNote[it.flightLinkKind]}>
          Check flights
        </ExternalLink>
        <ExternalLink href={it.roomSourceUrl}>View the room</ExternalLink>
      </div>
      <p className="mt-1.5 text-xs opacity-75">
        {it.flightLinkKind ? linkNote[it.flightLinkKind] + ' ' : ''}Prices will have moved since October. Recheck before booking.
      </p>
    </div>
  );
}
