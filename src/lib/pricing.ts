import assumptions from '../data/assumptions.json';

export type Assumptions = {
  adults: number;
  baggagePerAdultGBP: number;
  transfersForTwoGBP: number;
};

export const defaultAssumptions: Assumptions = assumptions;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Illustrative extras for the party: baggage per adult plus shared transfers. */
export function extrasForParty(a: Assumptions = defaultAssumptions): number {
  return round2(a.baggagePerAdultGBP * a.adults + a.transfersForTwoGBP);
}

/**
 * Total for two = (return fare per person × adults) + one room + extras.
 * Returns null unless both a fare and a room quote exist for the itinerary.
 */
export function estimateTotal(
  flightsPerPerson: number | null,
  roomForTwo: number | null,
  a: Assumptions = defaultAssumptions,
): number | null {
  if (flightsPerPerson == null || roomForTwo == null) return null;
  if (!Number.isFinite(flightsPerPerson) || !Number.isFinite(roomForTwo)) return null;
  return round2(flightsPerPerson * a.adults + roomForTwo + extrasForParty(a));
}

export function perPerson(totalForTwo: number | null, adults = defaultAssumptions.adults): number | null {
  return totalForTwo == null ? null : round2(totalForTwo / adults);
}

/** Whole pounds for the theatrical reveal. */
export function roundForReveal(total: number): number {
  return Math.round(total);
}

/** Entertainment-only closeness points, scaled to the price so dearer trips are no harder to guess. */
export function closenessPoints(guess: number, actual: number): 0 | 3 | 6 | 10 {
  const ratio = Math.abs(guess - actual) / actual;
  if (ratio <= 0.05) return 10;
  if (ratio <= 0.1) return 6;
  if (ratio <= 0.2) return 3;
  return 0;
}

/** Extra points for the closest guess that does not go over, if it is close enough to score at all. */
export const UNDER_BONUS = 2;

/** Each contestant's points for one price: closeness, plus the bonus for the closest scoring guess not over. */
export function duelPoints(guesses: readonly (number | null)[], actual: number): number[] {
  const under = guesses.filter((g): g is number => g != null && g <= actual);
  const best = under.length > 0 ? Math.max(...under) : null;
  return guesses.map((g) => {
    if (g == null) return 0;
    const pts = closenessPoints(g, actual);
    return pts > 0 && g === best ? pts + UNDER_BONUS : pts;
  });
}

export function formatGBP(n: number | null, opts: { pence?: boolean } = {}): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: opts.pence ? 2 : 0,
    maximumFractionDigits: opts.pence ? 2 : 0,
  }).format(n);
}
