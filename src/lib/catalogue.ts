import itinerariesJson from '../data/itineraries.json';
import { destinationContent } from '../data/destinations';
import type { Destination, Itinerary } from './types';

export const itineraries = itinerariesJson as Itinerary[];

export const itineraryById: Record<string, Itinerary> = Object.fromEntries(itineraries.map((i) => [i.id, i]));

/** Cheapest priced itinerary first, then unpriced ones in workbook order. */
function sortItineraries(list: Itinerary[]): Itinerary[] {
  return [...list].sort((a, b) => {
    const pa = a.estimatedTotalForTwoGBP;
    const pb = b.estimatedTotalForTwoGBP;
    if (pa != null && pb != null) return pa - pb;
    if (pa != null) return -1;
    if (pb != null) return 1;
    return 0;
  });
}

export function buildDestinations(): Destination[] {
  return destinationContent.flatMap(({ preferredItineraryId, ...content }) => {
    const own = sortItineraries(itineraries.filter((i) => i.destinationId === content.id));
    if (own.length === 0) return [];
    const preferred = preferredItineraryId && own.find((i) => i.id === preferredItineraryId);
    return [
      {
        ...content,
        itineraryIds: own.map((i) => i.id),
        defaultItineraryId: (preferred || own[0]).id,
      },
    ];
  });
}

export const destinations = buildDestinations();
export const destinationById: Record<string, Destination> = Object.fromEntries(destinations.map((d) => [d.id, d]));

export const mainCast = destinations.filter((d) => d.role === 'main');
export const mysteryCast = destinations.filter((d) => d.role === 'mystery');

export function itinerariesFor(d: Destination): Itinerary[] {
  return d.itineraryIds.map((id) => itineraryById[id]);
}

/** Resolves the chosen itinerary, falling back to the default if the stored id is stale. */
export function selectedItinerary(d: Destination, chosenId?: string): Itinerary {
  const id = chosenId && d.itineraryIds.includes(chosenId) ? chosenId : d.defaultItineraryId;
  return itineraryById[id];
}

export function hasPrice(it: Itinerary): it is Itinerary & { estimatedTotalForTwoGBP: number } {
  return it.fareEvidence === 'priced_indicative' && it.estimatedTotalForTwoGBP != null;
}

export const evidenceLabel: Record<Itinerary['fareEvidence'], string> = {
  priced_indicative: 'Indicative price',
  scheduled_unpriced: 'Flight price not verified',
  needs_manual_review: 'Needs manual review',
};

export const routeLabel: Record<Itinerary['routeType'], string> = {
  direct: 'Direct',
  connecting: 'Connecting',
  direct_plus_ground: 'Direct + ground transfer',
  unknown: 'Route unknown',
};

export const allCategories = Array.from(new Set(destinations.flatMap((d) => d.categories))).sort();

/** Slider bounds that comfortably cover every priced main-show trip. */
export function guessRange(): { min: number; max: number } {
  const totals = itineraries.filter(hasPrice).map((i) => i.estimatedTotalForTwoGBP);
  const lo = Math.min(...totals);
  const hi = Math.max(...totals);
  return { min: Math.max(0, Math.floor((lo * 0.5) / 50) * 50), max: Math.ceil((hi * 1.5) / 50) * 50 };
}
