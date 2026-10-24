import assumptions from '../../data/assumptions.json';
import { hasPrice } from '../../lib/catalogue';
import type { Itinerary } from '../../lib/types';

const round2 = (n: number) => Math.round(n * 100) / 100;

export type CostBreakdown = {
  /** The workbook's total for two, including illustrative extras. Never recomputed. */
  totalForTwo: number;
  /** Whole pounds for the big reveal. */
  headline: number;
  perPerson: number;
  flightsPerPerson: number;
  flightsForTwo: number;
  roomForTwo: number;
  extrasForTwo: number;
  baggageForTwo: number;
  transfersForTwo: number;
};

/** Null unless the itinerary has a dated fare and every package component. */
export function costBreakdown(it: Itinerary): CostBreakdown | null {
  if (!hasPrice(it)) return null;
  if (it.flightsPerPersonGBP == null || it.roomForTwoGBP == null || it.extrasForTwoGBP == null) return null;
  const adults = assumptions.adults;
  const total = it.estimatedTotalForTwoGBP;
  return {
    totalForTwo: total,
    headline: Math.round(total),
    perPerson: round2(total / adults),
    flightsPerPerson: it.flightsPerPersonGBP,
    flightsForTwo: round2(it.flightsPerPersonGBP * adults),
    roomForTwo: it.roomForTwoGBP,
    extrasForTwo: it.extrasForTwoGBP,
    baggageForTwo: round2(assumptions.baggagePerAdultGBP * adults),
    transfersForTwo: assumptions.transfersForTwoGBP,
  };
}

export type GuessVerdict = { badge: string; line: string; points: 0 | 1 | 2 | 3 };

/** Entertainment only. Never feeds into matching or ranking. */
export function guessVerdict(guess: number, actual: number): GuessVerdict {
  const ratio = Math.abs(guess - actual) / actual;
  if (ratio <= 0.05) return { badge: 'Unnecessarily Accurate', line: 'The finance department is requesting an interview.', points: 3 };
  if (ratio <= 0.15) return { badge: 'Suspiciously Well Informed', line: 'Close enough to be slightly annoying.', points: 2 };
  if (guess > actual * 1.3) return { badge: 'Big Spender', line: 'You’ve accidentally budgeted for an entire second hotel.', points: 0 };
  if (guess < actual * 0.7) return { badge: 'Eternal Optimist', line: 'We would also prefer that price.', points: 0 };
  return { badge: 'Ballpark Romantic', line: 'Right postcode, wrong street.', points: 1 };
}

/** Slider bounds from every priced show trip, so the thumb gives nothing away. */
export function guessBounds(totals: number[]): { min: number; max: number; step: number } {
  if (totals.length === 0) return { min: 0, max: 1500, step: 10 };
  const lo = Math.min(...totals);
  const hi = Math.max(...totals);
  return { min: Math.max(0, Math.floor((lo * 0.4) / 50) * 50), max: Math.ceil((hi * 1.6) / 50) * 50, step: 5 };
}
