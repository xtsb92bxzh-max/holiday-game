/**
 * The recommendation method. Everything here is deterministic and inspectable.
 *
 * 1. Each decision scene "covers" the dimensions that any of its offered
 *    options move. Taking an option adds its effect on each covered
 *    dimension (0 where it has none).
 * 2. The player's position on a dimension is the average of those effects
 *    over the decisions that covered it. Averaging, not summing, means a
 *    longer branch cannot pile up more weight than a shorter one. The
 *    average is then divided by the dimension's typical spread (RULES.scale).
 * 3. Each shortlisted trip has a target position. The distance to a trip is
 *    the weighted sum of squared differences, over dimensions the story
 *    actually asked about. The nearest trip is the best match.
 * 4. If the runner-up is within RULES.closeMargin, the result is close and
 *    the story offers a tiebreak on the dimension where the two differ most.
 *
 * Because each position is a plain average, every decision's share of the
 * gap between any two trips can be worked out exactly (see `contributions`).
 */
import { DIM_IDS, RULES, dimById } from '../data/dimensions';
import { SHORTLIST, shortlistById } from '../data/shortlist';
import type { Choice, Dim, Scene, ShortlistOption } from './types';

/** One decision taken, with the dimensions its scene covered at the time. */
export type TrailEntry = { scene: Scene; choice: Choice; covered: Dim[] };

export type Profile = {
  /** The plain average of effects on each dimension. */
  value: Record<Dim, number>;
  /** The average divided by the dimension's typical spread (RULES.scale). Compared with targets. */
  scaled: Record<Dim, number>;
  sum: Record<Dim, number>;
  count: Record<Dim, number>;
};

const zero = (): Record<Dim, number> => Object.fromEntries(DIM_IDS.map((d) => [d, 0])) as Record<Dim, number>;

/** Dimensions moved by any of the options on offer. */
export function coveredDims(choices: Choice[]): Dim[] {
  return DIM_IDS.filter((d) => choices.some((c) => (c.effects[d] ?? 0) !== 0));
}

/** Tiebreaks and endings never move the profile. */
const counts = (e: TrailEntry) => e.scene.kind === 'decision';

export function profileOf(trail: TrailEntry[]): Profile {
  const sum = zero();
  const count = zero();
  for (const e of trail) {
    if (!counts(e)) continue;
    for (const d of e.covered) {
      sum[d] += e.choice.effects[d] ?? 0;
      count[d] += 1;
    }
  }
  const value = zero();
  const scaled = zero();
  for (const d of DIM_IDS) {
    value[d] = count[d] > 0 ? sum[d] / count[d] : 0;
    scaled[d] = value[d] / RULES.scale[d];
  }
  return { value, scaled, sum, count };
}

export type Ranked = { option: ShortlistOption; distance: number; byDim: Record<Dim, number> };

export function distanceTo(p: Profile, o: ShortlistOption): Ranked {
  const byDim = zero();
  let distance = 0;
  for (const d of DIM_IDS) {
    if (p.count[d] === 0) continue;
    byDim[d] = RULES.weights[d] * (p.scaled[d] - o.target[d]) ** 2;
    distance += byDim[d];
  }
  return { option: o, distance, byDim };
}

/** Nearest first. Ties keep shortlist order, so the result never depends on chance. */
export function rank(p: Profile, shortlist: ShortlistOption[] = SHORTLIST): Ranked[] {
  return shortlist.map((o) => distanceTo(p, o)).sort((a, b) => a.distance - b.distance);
}

export const isClose = (ranked: Ranked[]) => ranked.length > 1 && ranked[1].distance - ranked[0].distance < RULES.closeMargin;

/** The dimension that best separates two trips. */
export function splittingDim(a: ShortlistOption, b: ShortlistOption): Dim {
  let best: Dim = DIM_IDS[0];
  let gap = -1;
  for (const d of DIM_IDS) {
    const g = RULES.weights[d] * Math.abs(a.target[d] - b.target[d]);
    if (g > gap) {
      gap = g;
      best = d;
    }
  }
  return best;
}

/**
 * How much each decision pushed the result towards `a` rather than `b`.
 * Positive favours `a`. The entries plus `baseline` add up exactly to
 * distance(b) - distance(a), the margin by which `a` beats `b`.
 */
export function contributions(trail: TrailEntry[], a: ShortlistOption, b: ShortlistOption) {
  const p = profileOf(trail);
  const perEntry = trail.map((e) => {
    const byDim = zero();
    let total = 0;
    if (counts(e)) {
      for (const d of e.covered) {
        const v = (RULES.weights[d] * 2 * (a.target[d] - b.target[d]) * (e.choice.effects[d] ?? 0)) / (p.count[d] * RULES.scale[d]);
        byDim[d] = v;
        total += v;
      }
    }
    return { entry: e, total, byDim };
  });
  let baseline = 0;
  for (const d of DIM_IDS) {
    if (p.count[d] === 0) continue;
    baseline -= RULES.weights[d] * (a.target[d] ** 2 - b.target[d] ** 2);
  }
  return { perEntry, baseline };
}

export type Recommendation = {
  profile: Profile;
  ranked: Ranked[];
  /** True when the top two were within the close margin before any tiebreak. */
  close: boolean;
  top: ShortlistOption;
  runnerUp: ShortlistOption;
  /** Set when a tiebreak was played. */
  tiebreak?: { dim: Dim; entry: TrailEntry; outcome: 'top' | 'swapped' | 'both' };
  /** Both presented as equally credible matches. */
  shared: boolean;
};

export function recommend(trail: TrailEntry[]): Recommendation {
  const profile = profileOf(trail);
  const ranked = rank(profile);
  const close = isClose(ranked);
  let top = ranked[0].option;
  let runnerUp = ranked[1].option;
  let shared = false;
  let tiebreak: Recommendation['tiebreak'];
  const tb = trail.find((e) => e.scene.kind === 'tiebreak');
  if (close && tb && tb.scene.tiebreakDim) {
    const dim = tb.scene.tiebreakDim;
    const pole = tb.choice.pole ?? 0;
    const topSide = Math.sign(top.target[dim] - runnerUp.target[dim]);
    if (pole === 0) {
      shared = true;
      tiebreak = { dim, entry: tb, outcome: 'both' };
    } else if (pole === topSide) {
      tiebreak = { dim, entry: tb, outcome: 'top' };
    } else {
      [top, runnerUp] = [runnerUp, top];
      tiebreak = { dim, entry: tb, outcome: 'swapped' };
    }
  }
  return { profile, ranked, close, top, runnerUp, tiebreak, shared };
}

// ─────────────── The explanation ───────────────

export type Explanation = {
  /** Pole phrases the player's choices clearly leaned towards, matching the top trip. */
  enjoys: string[];
  /** Decisions that most supported the top trip over the others. */
  reasons: TrailEntry[];
  /** The preference that would make the runner-up the better choice. */
  runnerUpPreference: string;
  runnerUpDim: Dim;
  /** A decision that already leaned towards the runner-up on that dimension, if any. */
  runnerUpEvidence?: TrailEntry;
};

const poleText = (d: Dim, side: number) => (side < 0 ? dimById[d].low : dimById[d].high);

export function explain(trail: TrailEntry[], rec: Recommendation): Explanation {
  const { profile, top, runnerUp } = rec;
  const t = RULES.preferenceThreshold;

  const enjoys = DIM_IDS.filter(
    (d) =>
      profile.count[d] > 0 &&
      Math.abs(profile.scaled[d]) >= t &&
      Math.abs(top.target[d]) >= 0.5 &&
      Math.sign(profile.scaled[d]) === Math.sign(top.target[d]),
  )
    .sort((x, y) => Math.abs(profile.scaled[y]) - Math.abs(profile.scaled[x]))
    .slice(0, 3)
    .map((d) => poleText(d, profile.scaled[d]));

  // Support for the top trip against the average of the rest of the shortlist.
  const others = SHORTLIST.filter((o) => o.id !== top.id);
  const support = new Map<TrailEntry, number>();
  for (const o of others) {
    for (const { entry, total } of contributions(trail, top, o).perEntry) support.set(entry, (support.get(entry) ?? 0) + total / others.length);
  }
  const reasons = [...support.entries()]
    .filter(([e, v]) => v > 0 && e.choice.recap)
    .sort((x, y) => y[1] - x[1])
    .slice(0, RULES.recapCount)
    .map(([e]) => e)
    // Quote them in the order they happened.
    .sort((x, y) => trail.indexOf(x) - trail.indexOf(y));

  const runnerUpDim = splittingDim(top, runnerUp);
  const side = Math.sign(runnerUp.target[runnerUpDim] - top.target[runnerUpDim]);
  const runnerUpPreference = poleText(runnerUpDim, side);
  const towardsRunnerUp = contributions(trail, top, runnerUp)
    .perEntry.filter((c) => c.byDim[runnerUpDim] < 0 && c.entry.choice.recap)
    .sort((x, y) => x.byDim[runnerUpDim] - y.byDim[runnerUpDim]);

  return { enjoys, reasons, runnerUpPreference, runnerUpDim, runnerUpEvidence: towardsRunnerUp[0]?.entry };
}

export const optionById = (id: string) => shortlistById[id];
