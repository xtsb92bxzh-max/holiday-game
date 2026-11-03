/**
 * Enumerates every path through the story. Used by the tests and by the
 * development view to check that every path finishes, that every trip on
 * the shortlist can be recommended, and how often results are close.
 */
import { DIM_IDS } from '../data/dimensions';
import { SHORTLIST } from '../data/shortlist';
import { choicesFor, isFinished, PRACTICAL, sceneById, walk } from './engine';
import { recommend, type Recommendation } from './scoring';
import type { Dim, Step } from './types';

export type PathResult = { steps: Step[]; decisions: number; rec: Recommendation; ending: string };

export function* allPaths(prefix: Step[] = []): Generator<PathResult> {
  const w = walk(prefix);
  if (w.steps.length !== prefix.length) throw new Error(`Path does not replay: ${JSON.stringify(prefix)}`);
  if (isFinished(w)) {
    const ending = w.trail[w.trail.length - 1].scene.id;
    yield { steps: w.steps, decisions: w.trail.filter((e) => e.scene.kind !== 'ending').length, rec: recommend(w.trail), ending };
    return;
  }
  const scene = sceneById[w.current];
  if (!scene) throw new Error(`Missing scene "${w.current}" after ${JSON.stringify(prefix)}`);
  const offered = choicesFor(scene, w.ctx);
  if (offered.length === 0) throw new Error(`Dead end at "${scene.id}"`);
  for (const c of offered) yield* allPaths([...prefix, { sceneId: scene.id, choiceId: c.id }]);
}

export type AuditSummary = {
  paths: number;
  minDecisions: number;
  maxDecisions: number;
  /** Full paths, tiebreak options included, where each trip is the final suggestion. Shared results count for both. */
  wins: Record<string, number>;
  /** Story paths where each trip is nearest before any tiebreak. */
  nearest: Record<string, number>;
  /** Story paths where the top two are close. */
  close: number;
  shared: number;
  endings: Record<string, number>;
  scenesVisited: Set<string>;
  /** Paths ignoring which tiebreak option was taken. */
  storyPaths: number;
  /** Mean and standard deviation of players' plain averages, over story paths. Compare with RULES.scale. */
  spread: Record<Dim, { mean: number; sd: number }>;
};

export function audit(): AuditSummary {
  const wins: Record<string, number> = Object.fromEntries(SHORTLIST.map((o) => [o.id, 0]));
  const nearest: Record<string, number> = { ...wins };
  const endings: Record<string, number> = {};
  const scenesVisited = new Set<string>();
  let paths = 0;
  let minDecisions = Infinity;
  let maxDecisions = 0;
  let close = 0;
  let shared = 0;
  const seen = new Set<string>();
  const values: Record<Dim, number[]> = Object.fromEntries(DIM_IDS.map((d) => [d, []])) as unknown as Record<Dim, number[]>;
  for (const p of allPaths()) {
    const key = JSON.stringify(p.steps.filter((s) => !sceneById[s.sceneId] || sceneById[s.sceneId].kind !== 'tiebreak'));
    if (!seen.has(key)) {
      seen.add(key);
      for (const d of DIM_IDS) values[d].push(p.rec.profile.value[d]);
      nearest[p.rec.ranked[0].option.id]++;
      if (p.rec.close) close++;
    }
    paths++;
    minDecisions = Math.min(minDecisions, p.decisions);
    maxDecisions = Math.max(maxDecisions, p.decisions);
    p.steps.forEach((s) => scenesVisited.add(s.sceneId));
    endings[p.ending] = (endings[p.ending] ?? 0) + 1;
    wins[p.rec.top.id]++;
    if (p.rec.shared) {
      wins[p.rec.runnerUp.id]++;
      shared++;
    }
  }
  const spread = Object.fromEntries(
    DIM_IDS.map((d) => {
      const v = values[d];
      const mean = v.reduce((a, b) => a + b, 0) / v.length;
      const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length);
      return [d, { mean, sd }];
    }),
  ) as Record<Dim, { mean: number; sd: number }>;
  return { paths, minDecisions, maxDecisions, wins, nearest, close, shared, endings, scenesVisited, storyPaths: seen.size, spread };
}

export { PRACTICAL };
