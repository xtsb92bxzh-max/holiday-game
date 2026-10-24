import assumptions from '../../data/assumptions.json';
import { destinationById, destinations, hasPrice, itineraryById } from '../../lib/catalogue';
import { isEligibleTrip, nightsBetween } from '../../lib/dates';
import type { Destination, Itinerary } from '../../lib/types';
import { bonusEpisode, episodes, mixedEpisodes, type Episode } from '../data/episodes';
import { profiles, type Profile } from '../data/profiles';

/**
 * A trip can appear in the show when it fits the travel window and has
 * established flights. "Connections to verify" rows (needs_manual_review)
 * stay in the sensible list only.
 */
export function isShowItinerary(it: Itinerary): boolean {
  return (
    it.fareEvidence !== 'needs_manual_review' &&
    isEligibleTrip(it.departDate, it.returnDate) &&
    nightsBetween(it.departDate, it.returnDate) === it.nights
  );
}

function isExcluded(d: Destination): boolean {
  return assumptions.excludedCountries.some((c) => d.country.toLowerCase().includes(c.toLowerCase()));
}

/** Date/airport variants of one destination. Never more than one contestant per destination. */
export function variantsFor(destinationId: string): Itinerary[] {
  const d = destinationById[destinationId];
  if (!d || isExcluded(d)) return [];
  return d.itineraryIds.map((id) => itineraryById[id]).filter(isShowItinerary);
}

export const showDestinationIds: string[] = destinations.filter((d) => variantsFor(d.id).length > 0).map((d) => d.id);
const showable = new Set(showDestinationIds);

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

export const featuredEpisodes: Episode[] = episodes
  .map((e) => ({ ...e, cast: e.cast.filter((id) => showable.has(id)) }))
  .filter((e) => e.cast.length > 0);

export const featuredIds: string[] = featuredEpisodes.flatMap((e) => e.cast);
const featured = new Set(featuredIds);

/** Everyone else who could join the show: priced first (cheapest first), then unpriced by name. */
export const contenderIds: string[] = showDestinationIds
  .filter((id) => !featured.has(id))
  .sort((a, b) => {
    const pa = selectedVariant(a);
    const pb = selectedVariant(b);
    const ta = pa && hasPrice(pa) ? pa.estimatedTotalForTwoGBP : null;
    const tb = pb && hasPrice(pb) ? pb.estimatedTotalForTwoGBP : null;
    if (ta != null && tb != null) return ta - tb;
    if (ta != null) return -1;
    if (tb != null) return 1;
    return destinationById[a].name.localeCompare(destinationById[b].name);
  });

export const isFeatured = (id: string) => featured.has(id);
export const isShowable = (id: string) => showable.has(id);

export type ShowEpisode = Episode & { bonus: boolean; number: number };

/** A small seeded generator, so a shuffled line-up survives a reload. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(list: readonly T[], seed: number): T[] {
  const rand = mulberry32(seed);
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const newSeed = () => Math.floor(Math.random() * 2 ** 31);

/** Rounds in a shuffled show: the featured contestants, three to a stage. */
export const mixedRoundCount = Math.ceil(featuredIds.length / 3);

/** The featured contestants regrouped at random: who shares a stage, the running order and the seats. */
function mixedEpisodesFor(seed: number): Episode[] {
  const ids = seededShuffle(featuredIds, seed);
  const titles = seededShuffle(mixedEpisodes, seed + 1);
  return Array.from({ length: mixedRoundCount }, (_, i) => ({
    id: `round-${i + 1}`,
    ...titles[i % titles.length],
    cast: ids.slice(i * 3, i * 3 + 3),
  }));
}

/**
 * Featured episodes, then bonus episodes of up to three for any added contenders.
 * With a seed, the featured contestants are shuffled; without one, the themed episodes run as written.
 */
export function episodesFor(order: string[], seed?: number | null): ShowEpisode[] {
  const inOrder = new Set(order);
  const main = (seed == null ? featuredEpisodes : mixedEpisodesFor(seed))
    .map((e) => ({ ...e, cast: e.cast.filter((id) => inOrder.has(id)), bonus: false }))
    .filter((e) => e.cast.length > 0);
  const extras = order.filter((id) => !featured.has(id) && showable.has(id));
  const bonus = [];
  for (let i = 0; i < extras.length; i += 3) {
    const n = i / 3 + 1;
    bonus.push({
      id: `bonus-${n}`,
      title: extras.length > 3 ? `${bonusEpisode.title}, part ${n}` : bonusEpisode.title,
      presenterLine: bonusEpisode.presenterLine,
      cast: extras.slice(i, i + 3),
      bonus: true,
    });
  }
  return [...main, ...bonus].map((e, i) => ({ ...e, number: i + 1 }));
}

/** Contestants in the order the show presents them. */
export function ballotOrder(order: string[], seed?: number | null): string[] {
  return episodesFor(order, seed).flatMap((e) => e.cast);
}

export function seatOf(destinationId: string, order: string[], seed?: number | null): { episode: ShowEpisode; seat: number } | undefined {
  for (const episode of episodesFor(order, seed)) {
    const i = episode.cast.indexOf(destinationId);
    if (i >= 0) return { episode, seat: i + 1 };
  }
  return undefined;
}

export const seatWords = ['One', 'Two', 'Three'];

/** Featured contestants have clues. Late arrivals arrive already unmasked. */
export function profileFor(destinationId: string): Profile & { hasClues: boolean } {
  const p = profiles[destinationId];
  if (p) return { ...p, hasClues: true };
  const d = destinationById[destinationId];
  return {
    stageIntro: d?.intro ?? '',
    clues: ['', '', ''],
    shortPitch: d?.prizeLine ?? d?.intro ?? '',
    awkwardTruth: d?.caution ?? '',
    hasClues: false,
  };
}

/** Every caution for the chosen trip. Nothing is dropped in favour of a joke. */
export function awkwardBits(destinationId: string, it?: Itinerary): string[] {
  const d = destinationById[destinationId];
  const p = profileFor(destinationId);
  return [p.awkwardTruth, it?.routeCaution, d?.repeatVisitNote ? `Repeat trip: ${d.repeatVisitNote}` : undefined].filter(
    (s): s is string => Boolean(s),
  );
}
