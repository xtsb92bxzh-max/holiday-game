import assumptions from '../../data/assumptions.json';
import { destinationById, evidenceLabel, routeLabel } from '../../lib/catalogue';
import { formatDateRange } from '../../lib/dates';
import { formatGBP } from '../../lib/pricing';
import { catchesFor, selectedVariant } from './cast';
import { costBreakdown } from './cost';
import { outcomeLabels, voteLabels } from './matching';
import { ballotIds, groups, resultsVisible, type GameState } from './state';

/** The voting outcome for one destination, but only once results are public. */
export function verdictFor(state: GameState, id: string): string {
  if (!resultsVisible(state)) return '';
  const g = groups(state);
  if (g.kind === 'quick') {
    const v = state.ballots.a[id];
    return v ? voteLabels[v] : 'Not voted';
  }
  for (const key of ['mutual', 'discuss', 'disagree', 'rejected', 'incomplete'] as const) {
    if (g[key].includes(id)) return outcomeLabels[key];
  }
  return '';
}

function tripLines(state: GameState, id: string): string[] {
  const d = destinationById[id];
  const it = selectedVariant(id, state.preferredItineraryIds[id]);
  if (!d || !it) return [];
  const c = costBreakdown(it);
  const lines = [
    `   ${formatDateRange(it.departDate, it.returnDate)} 2027 · ${it.nights} nights · ${it.departureAirport} → ${it.arrivalAirport} (${routeLabel[it.routeType]})`,
    c
      ? `   ${formatGBP(c.totalForTwo, { pence: true })} for two (${formatGBP(c.perPerson, { pence: true })} each), incl. illustrative bags and transfers · ${evidenceLabel[it.fareEvidence]}`
      : `   Total unknown: flights unpriced${it.roomForTwoGBP != null ? `. Room only ${formatGBP(it.roomForTwoGBP, { pence: true })} for two` : ''}`,
  ];
  if (it.hotelName) lines.push(`   Stay: ${it.hotelName}${it.hotelReviewOutOf10 != null ? ` (${it.hotelReviewOutOf10}/10)` : ''}`);
  if (it.flightSourceUrl) lines.push(`   Flights: ${it.flightSourceUrl}`);
  if (it.roomSourceUrl) lines.push(`   Room: ${it.roomSourceUrl}`);
  const catches = catchesFor(id, it);
  if (catches.length) lines.push(`   The catch: ${catches.join(' ')}`);
  return lines;
}

const header = (title: string) => [
  `THE GREAT BRITISH GETAWAY SHOW: ${title}`,
  `Indicative estimates for two, as researched ${assumptions.pricesObservedOn}. Not live fares. Recheck prices and timings before booking.`,
  '',
];

/** Side-by-side finalists as plain text. Leaves out nicknames and who voted what. */
export function comparisonText(state: GameState, finalists: string[]): string {
  if (finalists.length === 0) return 'The Great British Getaway Show: no finalists chosen yet.';
  const sorted = [...finalists].sort((a, b) => Number(b === state.winnerDestinationId) - Number(a === state.winnerDestinationId));
  const lines = header('the grand final');
  sorted.forEach((id, i) => {
    const d = destinationById[id];
    const verdict = verdictFor(state, id);
    lines.push(`${i + 1}. ${id === state.winnerDestinationId ? '★ WINNER: ' : ''}${d.name}, ${d.country}${verdict ? ` [${verdict}]` : ''}`);
    lines.push(...tripLines(state, id), '');
  });
  return lines.join('\n').trim();
}

/** The whole shortlist by outcome. Never calls a quick-edition ballot a match. */
export function shortlistText(state: GameState): string {
  const lines = header('our shortlist');
  if (!resultsVisible(state)) {
    lines.push('The ballots have not been revealed yet.');
    return lines.join('\n');
  }
  const g = groups(state);
  const sections: [string, string[]][] =
    g.kind === 'quick'
      ? [
          ['Favourites', g.favourites],
          ['Maybes', g.maybes],
          ['Passes', g.passes],
          ['Not voted', g.unvoted],
        ]
      : [
          [outcomeLabels.mutual, g.mutual],
          [outcomeLabels.discuss, g.discuss],
          [outcomeLabels.disagree, g.disagree],
          [outcomeLabels.rejected, g.rejected],
          [outcomeLabels.incomplete, g.incomplete],
        ];
  for (const [title, list] of sections) {
    if (list.length === 0) continue;
    lines.push(`${title.toUpperCase()}`);
    for (const id of list) {
      lines.push(` • ${destinationById[id].name}`);
      if (title !== 'Passes' && title !== outcomeLabels.rejected) lines.push(...tripLines(state, id));
    }
    lines.push('');
  }
  const total = ballotIds(state).length;
  lines.push(`${total} destinations on the ballot.`);
  return lines.join('\n').trim();
}
