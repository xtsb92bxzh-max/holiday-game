import assumptions from '../../data/assumptions.json';
import { destinationById, destinations, hasPrice, itineraryById } from '../../lib/catalogue';
import { isEligibleTrip, nightsBetween } from '../../lib/dates';
import type { Destination, Itinerary } from '../../lib/types';
import { contestants, hasClues } from '../data/contestants';
import { boardSegments, boardTags, broadcastGroups, CHEAP_CEILING_GBP, priceLadder, type BoardSegmentId } from '../data/show';

/**
 * A trip can be on the show when it fits the travel window and has
 * established flights. "Connections to verify" rows stay in the table only.
 */
export function isShowItinerary(it: Itinerary): boolean {
  return (
    it.sourceSheet === 'Viable itineraries' &&
    it.fareEvidence !== 'needs_manual_review' &&
    isEligibleTrip(it.departDate, it.returnDate) &&
    nightsBetween(it.departDate, it.returnDate) === it.nights
  );
}

function isExcluded(d: Destination): boolean {
  return assumptions.excludedCountries.some((c) => d.country.toLowerCase().includes(c.toLowerCase()));
}

/** Date and airport variants of one destination. One destination is always one contestant. */
export function variantsFor(destinationId: string): Itinerary[] {
  const d = destinationById[destinationId];
  if (!d || isExcluded(d)) return [];
  return d.itineraryIds.map((id) => itineraryById[id]).filter(isShowItinerary);
}

export const showDestinationIds: string[] = destinations.filter((d) => variantsFor(d.id).length > 0).map((d) => d.id);
const showable = new Set(showDestinationIds);
export const isShowable = (id: string) => showable.has(id);

export function defaultVariantId(destinationId: string): string | undefined {
  const variants = variantsFor(destinationId);
  const d = destinationById[destinationId];
  return (variants.find((v) => v.id === d?.defaultItineraryId) ?? variants[0])?.id;
}

/** The chosen variant, falling back to the default when the stored choice is stale. */
export function selectedVariant(destinationId: string, preferredId?: string): Itinerary | undefined {
  const variants = variantsFor(destinationId);
  return variants.find((v) => v.id === preferredId) ?? variants.find((v) => v.id === defaultVariantId(destinationId));
}

export type PricedItinerary = Itinerary & { estimatedTotalForTwoGBP: number };

export function pricedVariants(destinationId: string): PricedItinerary[] {
  return variantsFor(destinationId).filter(hasPrice);
}

export const isPricedDestination = (id: string) => pricedVariants(id).length > 0;

// ───────────── Round 1: the featured cast ─────────────

export const featuredGroups = broadcastGroups
  .map((g) => ({ ...g, cast: g.cast.filter((id) => showable.has(id) && hasClues(id)) }))
  .filter((g) => g.cast.length > 0);

export const featuredIds: string[] = featuredGroups.flatMap((g) => g.cast);
const featured = new Set(featuredIds);
export const isFeatured = (id: string) => featured.has(id);

export function groupOf(destinationId: string) {
  return featuredGroups.find((g) => g.cast.includes(destinationId));
}

/** Every caution for the chosen trip. Nothing is dropped in favour of a joke. */
export function catchesFor(destinationId: string, it?: Itinerary): string[] {
  const d = destinationById[destinationId];
  const c = contestants[destinationId];
  const own = c?.catch || d?.caution;
  return [own, it?.routeCaution, d?.repeatVisitNote ? `Repeat trip: ${d.repeatVisitNote}` : undefined].filter(
    (s, i, all): s is string => Boolean(s) && all.indexOf(s) === i,
  );
}

export function pitchFor(destinationId: string): string {
  const d = destinationById[destinationId];
  return contestants[destinationId]?.pitch || d?.prizeLine || d?.intro || '';
}

// ───────────── Round 2: higher or lower ─────────────

/** Ladder destinations that have at least one priced trip, without repeats. */
export const ladderIds: string[] = priceLadder.filter((id, i, all) => all.indexOf(id) === i && showable.has(id) && isPricedDestination(id));

/**
 * The trip a destination plays in the price round: the chosen dates if they
 * are priced, otherwise its default priced trip. Never an unpriced one.
 */
export function duelItinerary(destinationId: string, preferredId?: string): PricedItinerary | undefined {
  const chosen = selectedVariant(destinationId, preferredId);
  if (chosen && hasPrice(chosen)) return chosen;
  const priced = pricedVariants(destinationId);
  return priced.find((v) => v.id === destinationById[destinationId]?.defaultItineraryId) ?? priced[0];
}

export type DuelAnswer = 'higher' | 'lower' | 'same';

export function duelAnswer(left: number, right: number): DuelAnswer {
  if (right > left) return 'higher';
  if (right < left) return 'lower';
  return 'same';
}

/** Number of duels in the price round. Follows the data, not a fixed count. */
export const duelCount = Math.max(0, ladderIds.length - 1);

// ───────────── Round 3: the board ─────────────

function cheapestTotal(id: string): number | null {
  const totals = pricedVariants(id).map((v) => v.estimatedTotalForTwoGBP);
  return totals.length ? Math.min(...totals) : null;
}

export function segmentsOf(destinationId: string): BoardSegmentId[] {
  const out = new Set<BoardSegmentId>(boardTags[destinationId] ?? []);
  const cheapest = cheapestTotal(destinationId);
  if (cheapest != null && cheapest <= CHEAP_CEILING_GBP) out.add('cheap');
  if (cheapest == null) out.add('wildcard');
  // A wildcard is only ever an unpriced destination.
  if (cheapest != null) out.delete('wildcard');
  return boardSegments.map((s) => s.id).filter((s) => out.has(s));
}

/** Everyone who is not in Round 1: priced first (cheapest first), then unpriced by name. */
export const benchIds: string[] = showDestinationIds
  .filter((id) => !featured.has(id))
  .sort((a, b) => {
    const ta = cheapestTotal(a);
    const tb = cheapestTotal(b);
    if (ta != null && tb != null) return ta - tb;
    if (ta != null) return -1;
    if (tb != null) return 1;
    return destinationById[a].name.localeCompare(destinationById[b].name);
  });

export function segmentPool(segment: BoardSegmentId): string[] {
  return benchIds.filter((id) => segmentsOf(id).includes(segment));
}

/** One or two destinations from a segment that have not been shown yet. */
export function drawFromSegment(segment: BoardSegmentId, alreadyShown: string[]): string[] {
  const seen = new Set(alreadyShown);
  return segmentPool(segment)
    .filter((id) => !seen.has(id))
    .slice(0, 2);
}
