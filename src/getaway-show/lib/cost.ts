import assumptions from '../../data/assumptions.json';
import { hasPrice } from '../../lib/catalogue';
import type { Itinerary } from '../../lib/types';

const round2 = (n: number) => Math.round(n * 100) / 100;

export type CostBreakdown = {
  /** The workbook's total for two, including illustrative extras. Never recomputed. */
  totalForTwo: number;
  /** Whole pounds for the studio placard. */
  placard: number;
  perPerson: number;
  flightsPerPerson: number;
  flightsForTwo: number;
  roomForTwo: number;
  extrasForTwo: number;
};

/** Null unless the itinerary has a dated fare and every package component. */
export function costBreakdown(it: Itinerary | undefined): CostBreakdown | null {
  if (!it || !hasPrice(it)) return null;
  if (it.flightsPerPersonGBP == null || it.roomForTwoGBP == null || it.extrasForTwoGBP == null) return null;
  const total = it.estimatedTotalForTwoGBP;
  return {
    totalForTwo: total,
    placard: Math.round(total),
    perPerson: round2(total / assumptions.adults),
    flightsPerPerson: it.flightsPerPersonGBP,
    flightsForTwo: round2(it.flightsPerPersonGBP * assumptions.adults),
    roomForTwo: it.roomForTwoGBP,
    extrasForTwo: it.extrasForTwoGBP,
  };
}
