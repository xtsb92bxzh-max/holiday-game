import assumptions from '../../data/assumptions.json';
import { destinationById, evidenceLabel, routeLabel } from '../../lib/catalogue';
import { formatDateRange } from '../../lib/dates';
import { formatGBP } from '../../lib/pricing';
import { awkwardBits, selectedVariant } from './cast';
import { costBreakdown } from './cost';
import { groups, resultsReady, type GameState } from './state';
import { matchLabels, voteLabels } from './voteMatching';

export type FinalistRow = {
  destinationId: string;
  destination: string;
  country: string;
  verdict: string;
  winner: boolean;
  itineraryId: string;
  dates: string;
  nights: number;
  route: string;
  status: string;
  totalForTwo: number | null;
  perPerson: number | null;
  flightsForTwo: number | null;
  roomForTwo: number | null;
  extrasForTwo: number | null;
  hotel: string;
  flightLink: string;
  roomLink: string;
  cautions: string;
};

/** The ballot verdict, but only once it is no longer private. */
export function verdictFor(state: GameState, id: string): string {
  if (!resultsReady(state)) return '';
  const g = groups(state);
  if (g.kind === 'quick') {
    const v = state.players.traveller1.votes[id];
    return v ? voteLabels[v].short : 'Not voted';
  }
  for (const key of ['match', 'potential', 'questions', 'mutual_rejection', 'incomplete'] as const) {
    if (g[key].includes(id)) return matchLabels[key];
  }
  return '';
}

/** No nicknames or votes by person: the summary is safe to forward. */
export function finalistRows(state: GameState, ids: string[]): FinalistRow[] {
  return ids.flatMap((id) => {
    const d = destinationById[id];
    const it = selectedVariant(id, state.preferredItineraryByDestination[id]);
    if (!d || !it) return [];
    const cost = costBreakdown(it);
    return [
      {
        destinationId: id,
        destination: d.name,
        country: d.country,
        verdict: verdictFor(state, id),
        winner: state.winnerDestinationId === id,
        itineraryId: it.id,
        dates: formatDateRange(it.departDate, it.returnDate),
        nights: it.nights,
        route: `${it.departureAirport} → ${it.arrivalAirport} (${routeLabel[it.routeType]})`,
        status: evidenceLabel[it.fareEvidence],
        totalForTwo: cost?.totalForTwo ?? null,
        perPerson: cost?.perPerson ?? null,
        flightsForTwo: cost?.flightsForTwo ?? null,
        roomForTwo: it.roomForTwoGBP,
        extrasForTwo: cost?.extrasForTwo ?? null,
        hotel: it.hotelName ? `${it.hotelName}${it.hotelReviewOutOf10 ? ` (${it.hotelReviewOutOf10}/10)` : ''}` : '',
        flightLink: it.flightSourceUrl ?? '',
        roomLink: it.roomSourceUrl ?? '',
        cautions: awkwardBits(id, it).join(' '),
      },
    ];
  });
}

export function summaryText(rows: FinalistRow[]): string {
  if (rows.length === 0) return 'Blind Flight: no finalists chosen yet.';
  const sorted = [...rows].sort((a, b) => Number(b.winner) - Number(a.winner));
  const lines = [
    'BLIND FLIGHT: our finalists',
    `Indicative estimates for two, compiled ${assumptions.pricesObservedOn}. Not live fares. Recheck before booking.`,
    '',
  ];
  sorted.forEach((r, i) => {
    lines.push(`${i + 1}. ${r.winner ? '★ WINNER: ' : ''}${r.destination}, ${r.country}${r.verdict ? ` [${r.verdict}]` : ''}`);
    lines.push(`   ${r.dates} · ${r.nights} nights · ${r.route}`);
    lines.push(
      r.totalForTwo != null
        ? `   ${formatGBP(r.totalForTwo, { pence: true })} for two (${formatGBP(r.perPerson, { pence: true })} each), incl. illustrative bags and transfers`
        : `   Price pending: flights not yet priced${r.roomForTwo != null ? `. Room quote ${formatGBP(r.roomForTwo, { pence: true })} for two` : ''}`,
    );
    if (r.hotel) lines.push(`   Stay: ${r.hotel}`);
    if (r.flightLink) lines.push(`   Flights: ${r.flightLink}`);
    if (r.roomLink) lines.push(`   Room: ${r.roomLink}`);
    if (r.cautions) lines.push(`   The awkward bit: ${r.cautions}`);
    lines.push('');
  });
  return lines.join('\n').trimEnd();
}

const csvCell = (v: unknown) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function summaryCsv(rows: FinalistRow[]): string {
  const header = [
    'Destination',
    'Country',
    'Verdict',
    'Winner',
    'Itinerary ID',
    'Dates',
    'Nights',
    'Route',
    'Price status',
    'Total for two (GBP)',
    'Per person (GBP)',
    'Flights for two (GBP)',
    'Room for two (GBP)',
    'Bags and transfers (GBP)',
    'Accommodation',
    'Flight link',
    'Room link',
    'Quote compiled',
    'Cautions',
  ];
  const money = (n: number | null) => (n == null ? '' : n.toFixed(2));
  const body = rows.map((r) =>
    [
      r.destination,
      r.country,
      r.verdict,
      r.winner ? 'yes' : '',
      r.itineraryId,
      r.dates,
      r.nights,
      r.route,
      r.status,
      money(r.totalForTwo),
      money(r.perPerson),
      money(r.flightsForTwo),
      money(r.roomForTwo),
      money(r.extrasForTwo),
      r.hotel,
      r.flightLink,
      r.roomLink,
      assumptions.pricesObservedOn,
      r.cautions,
    ]
      .map(csvCell)
      .join(','),
  );
  return [header.join(','), ...body].join('\n');
}
