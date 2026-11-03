/**
 * Practical details for a shortlisted trip, built from the researched
 * itineraries. Nothing here is invented: anything the workbook does not
 * cover is labelled unconfirmed.
 */
import assumptions from '@/data/assumptions.json';
import { hasPrice, itineraryById, routeLabel } from '@/lib/catalogue';
import { formatDate, formatDateRange } from '@/lib/dates';
import { formatGBP } from '@/lib/pricing';
import type { Itinerary } from '@/lib/types';
import type { PracticalAnswers } from '../data/practical';
import { SHORTLIST } from '../data/shortlist';
import type { Ranked } from './scoring';
import type { PracticalLine, ShortlistOption } from './types';

export const TRIP_START = assumptions.travelWindow.departDates[0];
export const OBSERVED_ON = assumptions.pricesObservedOn;

const DAY = 86_400_000;
export function addDays(iso: string, n: number): string {
  return new Date(Date.parse(iso + 'T00:00:00Z') + n * DAY).toISOString().slice(0, 10);
}

/** Start and end date of each segment, starting on the first travel date. */
export function segmentDates(o: ShortlistOption): { start: string; end: string }[] {
  let at = TRIP_START;
  return o.segments.map((s) => {
    const start = at;
    at = addDays(at, s.nights);
    return { start, end: at };
  });
}

export const tripEnd = (o: ShortlistOption) => segmentDates(o)[o.segments.length - 1].end;

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

function outTimes(it: Itinerary) {
  return it.timesConfirmed && it.flightTimes ? `Leaves ${it.flightTimes.leaveUK}, arrives ${it.flightTimes.arriveThere}${it.flightNumbers ? ` (${it.flightNumbers.split('/')[0].trim()})` : ''}.` : 'Times not reconfirmed.';
}
function backTimes(it: Itinerary) {
  return it.timesConfirmed && it.flightTimes ? `Leaves ${it.flightTimes.leaveThere}, arrives ${it.flightTimes.arriveUK}${it.flightNumbers ? ` (${it.flightNumbers.split('/').pop()!.trim()})` : ''}.` : 'Times not reconfirmed.';
}

export function practicalLines(o: ShortlistOption): PracticalLine[] {
  const p = o.practical;
  const lines: PracticalLine[] = [];
  const dates = segmentDates(o);

  if (p.wholeTripItineraryId) {
    const it = itineraryById[p.wholeTripItineraryId];
    const t = it.flightTimes;
    lines.push({
      label: 'Flights',
      text: `${routeLabel[it.routeType]}, ${it.departureAirport} → ${it.arrivalAirport} and back, ${formatDateRange(it.departDate, it.returnDate)} 2027. ${
        it.timesConfirmed && t ? `Out ${t.leaveUK} → ${t.arriveThere}, back ${t.leaveThere} → ${t.arriveUK}.` : 'Flight times not reconfirmed.'
      }`,
      status: 'researched',
    });
    lines.push(
      hasPrice(it)
        ? {
            label: 'Estimated total for two',
            text: `${formatGBP(it.estimatedTotalForTwoGBP, { pence: true })}, covering flights, the room and the workbook’s baggage and transfer allowance. Indicative, not a live fare.`,
            status: 'researched',
          }
        : { label: 'Estimated total for two', text: 'No total: the flights for these dates are not priced.', status: 'unconfirmed' },
    );
  }

  if (p.outboundItineraryId) {
    const it = itineraryById[p.outboundItineraryId];
    lines.push({
      label: 'Getting there',
      text: `${routeLabel[it.routeType]}, ${it.departureAirport} → ${it.arrivalAirport} on ${formatDate(it.departDate)}. ${outTimes(it)}`,
      status: 'researched',
    });
    lines.push({
      label: 'Outbound fare',
      text: hasPrice(it) ? 'The researched fare is for a return trip, so a one-way price is unconfirmed.' : 'No fare has been matched to this flight.',
      status: 'unconfirmed',
    });
  }

  for (const leg of p.timetableLegs ?? []) {
    lines.push({
      label: leg.direction === 'out' ? 'Getting there' : 'Coming home',
      text: `Direct, ${leg.from} → ${leg.to} on ${formatDate(leg.date)}. Leaves ${leg.departs}, arrives ${leg.arrives} (${leg.airline} ${leg.flight}). From the workbook’s uploaded timetable (${leg.source}).`,
      status: 'researched',
    });
    lines.push({
      label: leg.direction === 'out' ? 'Outbound fare' : 'Return fare',
      text: 'No fare has been matched to this flight. A timetable listing does not prove seats are available.',
      status: 'unconfirmed',
    });
  }

  if (p.returnItineraryId) {
    const it = itineraryById[p.returnItineraryId];
    lines.push({
      label: 'Coming home',
      text: `${routeLabel[it.routeType]}, ${it.arrivalAirport} → ${it.departureAirport} on ${formatDate(it.returnDate)}. ${backTimes(it)}`,
      status: 'researched',
    });
    lines.push({
      label: 'Return fare',
      text: hasPrice(it) ? 'The researched fare is for a return trip, so a one-way price is unconfirmed.' : 'No fare has been matched to this flight.',
      status: 'unconfirmed',
    });
  }

  for (const r of p.rooms ?? []) {
    const it = itineraryById[r.itineraryId];
    const seg = o.segments[r.segment];
    const { start, end } = dates[r.segment];
    const hotel = `${it.hotelName ?? 'The suggested stay'}${it.hotelReviewOutOf10 != null ? ` (${it.hotelReviewOutOf10}/10)` : ''}`;
    const exact = it.departDate === start && it.returnDate === end && it.roomForTwoGBP != null;
    lines.push(
      exact
        ? {
            label: `Stay in ${seg.name}`,
            text: `${hotel}: ${formatGBP(it.roomForTwoGBP, { pence: true })} for ${seg.nights} night${seg.nights === 1 ? '' : 's'}, ${formatDateRange(start, end)}.`,
            status: 'researched',
          }
        : {
            label: `Stay in ${seg.name}`,
            text: `${hotel} is the researched suggestion, but its quote covers ${it.nights} nights from ${formatDate(it.departDate)}. The price for ${seg.nights} night${
              seg.nights === 1 ? '' : 's'
            } from ${formatDate(start)} is unconfirmed.`,
            status: 'unconfirmed',
          },
    );
  }

  for (const u of p.unconfirmed) lines.push({ label: 'Not yet known', text: u, status: 'unconfirmed' });
  return lines;
}

/** A researched total for the whole trip, if one exists. */
export function verifiedTotal(o: ShortlistOption): number | null {
  const id = o.practical.wholeTripItineraryId;
  const it = id ? itineraryById[id] : undefined;
  return it && hasPrice(it) ? it.estimatedTotalForTwoGBP : null;
}

/**
 * The earliest confirmed departure from the UK for a trip, as HH:MM, or null
 * when no outbound time is confirmed in the researched data.
 */
export function confirmedDeparture(o: ShortlistOption): string | null {
  const p = o.practical;
  const times: string[] = [];
  for (const id of [p.wholeTripItineraryId, p.outboundItineraryId]) {
    const it = id ? itineraryById[id] : undefined;
    if (it?.timesConfirmed && it.flightTimes) times.push(it.flightTimes.leaveUK);
  }
  for (const leg of p.timetableLegs ?? []) if (leg.direction === 'out') times.push(leg.departs);
  return times.length ? times.sort()[0] : null;
}

/** Departures before this count as an early start. */
export const EARLY_BEFORE = '07:00';

/** Plain notes from the practical check. They never re-rank the story result. */
export function practicalNotes(answers: PracticalAnswers, ranked: Ranked[], shown: ShortlistOption[]): string[] {
  const notes: string[] = [];
  const top = shown[0];
  if (answers.cold === 'avoid') {
    const cold = shown.filter((o) => o.coldWinter);
    if (cold.length > 0) {
      const which = cold.length > 1 ? 'Both of these trips are' : `${cold[0].name} is`;
      notes.push(`You said you would rather avoid days around freezing. ${which} typically around freezing by day in January.`);
      const mild = ranked.find((r) => !r.option.coldWinter);
      if (mild && !shown.includes(mild.option)) {
        notes.push(`The closest story match without freezing days is ${mild.option.name} (${lower(mild.option.split)}). It is worth comparing.`);
      } else if (mild) {
        notes.push(`${mild.option.name} is the milder of the two.`);
      }
    } else {
      notes.push(`You said you would rather avoid days around freezing. ${top.name} is the mild option, though January there can still be wet.`);
    }
  } else if (answers.cold === 'unsure') {
    for (const o of shown) notes.push(`${o.name} in January: ${lower(o.january)}`);
  }

  if (answers.early === 'avoid') {
    for (const o of shown) {
      const t = confirmedDeparture(o);
      notes.push(
        t == null
          ? `${o.name}: outbound flight times are not confirmed in the researched data, so an early start cannot be ruled out yet.`
          : t < EARLY_BEFORE
            ? `${o.name}: the researched flight out leaves at ${t}, which is the early start you wanted to avoid.`
            : `${o.name}: the researched flight out leaves at ${t}.`,
      );
    }
  }

  if (answers.cost === 'first' || answers.cost === 'matters') {
    const priced = SHORTLIST.map((o) => ({ o, total: verifiedTotal(o) })).filter((x): x is { o: ShortlistOption; total: number } => x.total != null);
    for (const o of shown) {
      const t = verifiedTotal(o);
      notes.push(
        t != null
          ? `${o.name}: researched estimate ${formatGBP(t, { pence: true })} for two, as observed on ${formatDate(OBSERVED_ON)} 2026.`
          : `${o.name}: no researched total, so the cost is unknown.`,
      );
    }
    if (answers.cost === 'first' && priced.length > 1) {
      const cheapest = priced.reduce((a, b) => (b.total < a.total ? b : a));
      notes.push(
        `Of the trips with a researched total, ${cheapest.o.name} is the lowest. The two-city splits have not been priced, so they could come in higher or lower.`,
      );
    }
  }
  return notes;
}
