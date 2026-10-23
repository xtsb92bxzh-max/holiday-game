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

/** Entertainment-only closeness points. */
export function closenessPoints(guess: number, actual: number): 0 | 5 | 10 {
  const diff = Math.abs(guess - actual);
  if (diff <= 20) return 10;
  if (diff <= 60) return 5;
  return 0;
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
