/**
 * The hidden preference dimensions and the scoring rules. Edit freely.
 *
 * Choice effects run from -2 (towards the low pole) to +2 (towards the high pole).
 * The pole phrases are used in the explanation, so they must read naturally
 * after "Your choices suggest you enjoy" and "If you care more about". Avoid
 * "and" inside a phrase, because phrases are joined into a list.
 */
import type { Dim } from '../lib/types';

export const DIMENSIONS: { id: Dim; name: string; low: string; high: string }[] = [
  { id: 'pace', name: 'Pace', low: 'slow, unplanned wandering', high: 'full days with a plan' },
  { id: 'light', name: 'Setting', low: 'atmospheric interiors', high: 'the outdoors, especially by the water' },
  { id: 'depth', name: 'Focus', low: 'everyday local life', high: 'historical depth' },
  { id: 'range', name: 'Range', low: 'getting to know one place well', high: 'moving on to a second city' },
  { id: 'novelty', name: 'Comfort', low: 'familiar comforts', high: 'discovering the less familiar' },
  { id: 'evenings', name: 'Evenings', low: 'quiet evenings', high: 'lively evenings' },
  { id: 'journey', name: 'Journeys', low: 'keeping travel time short', high: 'travelling further for a particular experience' },
];

export const DIM_IDS: Dim[] = DIMENSIONS.map((d) => d.id);
export const dimById = Object.fromEntries(DIMENSIONS.map((d) => [d.id, d])) as Record<Dim, (typeof DIMENSIONS)[number]>;

export const RULES = {
  /**
   * Weight of each dimension in the distance. 1 for all keeps the method
   * simple to explain; raise one to make it count for more.
   */
  weights: { pace: 1, light: 1, depth: 1, range: 1, novelty: 1, evenings: 1, journey: 1 } as Record<Dim, number>,
  /**
   * The typical spread (standard deviation) of players' averages on each
   * dimension, across every path through the story. Each average is divided
   * by this before comparing with the targets, so a dimension the story pulls
   * on less forcefully still counts as much as the others. Targets are in
   * these units. If you change the story's effects a lot, the development
   * view shows the measured spread; a test fails if these drift by over 25%.
   */
  scale: { pace: 0.39, light: 0.29, depth: 0.34, range: 0.69, novelty: 0.33, evenings: 0.79, journey: 0.44 } as Record<Dim, number>,
  /**
   * If the runner-up's distance is within this much of the best match's,
   * the result counts as close and the story offers a tiebreak.
   */
  closeMargin: 0.7,
  /** Scaled average needed before the city starts responding to a leaning. */
  leanThreshold: 1.25,
  /** A dimension counts as a clear preference in the explanation from this scaled average. */
  preferenceThreshold: 0.75,
  /** How many decisions the explanation quotes. */
  recapCount: 3,
};
