import { destinationById, hasPrice, routeLabel, selectedItinerary, evidenceLabel } from './catalogue';
import { formatDateRange } from './dates';
import { formatGBP, perPerson } from './pricing';
import type { GameState } from './gameState';
import assumptions from '../data/assumptions.json';

export type ShortlistRow = {
  destination: string;
  country: string;
  decision: string;
  winner: boolean;
  dates: string;
  nights: number;
  route: string;
  totalForTwo: number | null;
  perPerson: number | null;
  evidence: string;
  hotel: string;
  flightLink: string;
  roomLink: string;
  caution: string;
};

export function shortlistRows(state: GameState, include: ('keep' | 'maybe')[] = ['keep', 'maybe']): ShortlistRow[] {
  return Object.entries(state.decisions)
    .filter(([, d]) => (include as string[]).includes(d))
    .flatMap(([id, decision]): ShortlistRow[] => {
      const dest = destinationById[id];
      if (!dest) return [];
      const it = selectedItinerary(dest, state.itineraryChoice[id]);
      const total = hasPrice(it) ? it.estimatedTotalForTwoGBP : null;
      const row: ShortlistRow = {
        destination: dest.name,
        country: dest.country,
        decision,
        winner: state.winner === id,
        dates: formatDateRange(it.departDate, it.returnDate),
        nights: it.nights,
        route: `${it.departureAirport} → ${it.arrivalAirport} (${routeLabel[it.routeType]})`,
        totalForTwo: total,
        perPerson: perPerson(total),
        evidence: evidenceLabel[it.fareEvidence],
        hotel: it.hotelName ? `${it.hotelName}${it.hotelReviewOutOf10 ? ` (${it.hotelReviewOutOf10}/10)` : ''}` : '',
        flightLink: it.flightSourceUrl ?? '',
        roomLink: it.roomSourceUrl ?? '',
        caution: [it.routeCaution, dest.caution].filter(Boolean).join(' '),
      };
      return [row];
    })
    .sort((a, b) => Number(b.winner) - Number(a.winner) || (a.decision === b.decision ? 0 : a.decision === 'keep' ? -1 : 1) || (a.totalForTwo ?? Infinity) - (b.totalForTwo ?? Infinity));
}

export function shortlistText(rows: ShortlistRow[]): string {
  if (rows.length === 0) return 'The Great January Getaway: no holidays shortlisted yet.';
  const lines = [
    'THE GREAT JANUARY GETAWAY: our shortlist',
    `Indicative prices for two, observed ${assumptions.pricesObservedOn}. Not live fares. Recheck before booking.`,
    '',
  ];
  rows.forEach((r, i) => {
    lines.push(`${i + 1}. ${r.winner ? '★ ' : ''}${r.destination}, ${r.country} [${r.decision.toUpperCase()}]`);
    lines.push(`   ${r.dates} · ${r.nights} nights · ${r.route}`);
    lines.push(
      r.totalForTwo != null
        ? `   ${formatGBP(r.totalForTwo, { pence: true })} for two (${formatGBP(r.perPerson, { pence: true })} each) · ${r.evidence}`
        : `   Price: ${r.evidence.toLowerCase()}`,
    );
    if (r.hotel) lines.push(`   Stay: ${r.hotel}`);
    if (r.flightLink) lines.push(`   Flights: ${r.flightLink}`);
    if (r.roomLink) lines.push(`   Room: ${r.roomLink}`);
    if (r.caution) lines.push(`   Watch out: ${r.caution}`);
    lines.push('');
  });
  return lines.join('\n').trimEnd();
}

const csvCell = (v: unknown) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function shortlistCsv(rows: ShortlistRow[]): string {
  const header = ['Destination', 'Country', 'Decision', 'Winner', 'Dates', 'Nights', 'Route', 'Total for two (GBP)', 'Per person (GBP)', 'Price status', 'Accommodation', 'Flight link', 'Room link', 'Cautions'];
  const body = rows.map((r) =>
    [r.destination, r.country, r.decision, r.winner ? 'yes' : '', r.dates, r.nights, r.route, r.totalForTwo?.toFixed(2) ?? '', r.perPerson?.toFixed(2) ?? '', r.evidence, r.hotel, r.flightLink, r.roomLink, r.caution]
      .map(csvCell)
      .join(','),
  );
  return [header.join(','), ...body].join('\n');
}
