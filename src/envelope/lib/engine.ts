/**
 * Plays the story. The only saved state is the list of choices taken, so
 * everything else (flags, the current scene, the scores) is worked out again
 * by replaying it. Going back a step simply drops the last choice, which
 * reverses its effect on the scores exactly.
 */
import { RULES } from '../data/dimensions';
import { ENDING_ROUTES, SCENES, START } from '../data/story';
import { coveredDims, isClose, profileOf, rank, splittingDim, type Profile, type TrailEntry } from './scoring';
import type { Choice, Cond, Next, Paragraph, Scene, Step } from './types';

export const PRACTICAL = '@practical';

export const sceneById: Record<string, Scene> = Object.fromEntries(SCENES.map((s) => [s.id, s]));

export type Ctx = { flags: Set<string>; profile: Profile };

export function test(cond: Cond | undefined, ctx: Ctx): boolean {
  if (cond === undefined) return true;
  if (typeof cond === 'string') return ctx.flags.has(cond);
  if ('all' in cond) return cond.all.every((c) => test(c, ctx));
  if ('any' in cond) return cond.any.some((c) => test(c, ctx));
  if ('not' in cond) return !test(cond.not, ctx);
  const v = ctx.profile.scaled[cond.lean];
  if (ctx.profile.count[cond.lean] === 0) return false;
  return cond.side === 'high' ? v >= RULES.leanThreshold : v <= -RULES.leanThreshold;
}

export function choicesFor(scene: Scene, ctx: Ctx): Choice[] {
  return scene.choices.filter((c) => test(c.when, ctx));
}

export function paragraphsFor(scene: Scene, ctx: Ctx): string[] {
  return scene.text.flatMap((p: Paragraph) => {
    if (typeof p === 'string') return [p];
    if ('firstOf' in p) return p.options.filter((o) => test(o.if, ctx)).slice(0, p.firstOf).map((o) => o.text);
    return test(p.if, ctx) ? [p.text] : [];
  });
}

function resolveNext(next: Next, ctx: Ctx, trail: TrailEntry[]): string {
  const target = typeof next === 'string' ? next : (next.find((n) => test(n.if, ctx)) ?? next[next.length - 1]).to;
  if (target === '@finale') {
    const ranked = rank(profileOf(trail));
    if (isClose(ranked)) return `tiebreak-${splittingDim(ranked[0].option, ranked[1].option)}`;
    return resolveNext('@ending', ctx, trail);
  }
  if (target === '@ending') return (ENDING_ROUTES.find((r) => test(r.if, ctx)) ?? ENDING_ROUTES[ENDING_ROUTES.length - 1]).to;
  return target;
}

export type Walk = {
  /** The valid prefix of the history. Anything after an invalid step is dropped. */
  steps: Step[];
  trail: TrailEntry[];
  /** The scene to show now, or PRACTICAL once the story is over. */
  current: string;
  ctx: Ctx;
};

function contextOf(flags: Set<string>, trail: TrailEntry[]): Ctx {
  return { flags, profile: profileOf(trail) };
}

/** Replays a history, stopping at the first step that no longer fits the story. */
export function walk(history: Step[]): Walk {
  const flags = new Set<string>();
  const trail: TrailEntry[] = [];
  const steps: Step[] = [];
  let current = START;
  for (const step of history) {
    if (step.sceneId !== current) break;
    const scene = sceneById[current];
    if (!scene) break;
    const ctx = contextOf(flags, trail);
    const offered = choicesFor(scene, ctx);
    const choice = offered.find((c) => c.id === step.choiceId);
    if (!choice) break;
    trail.push({ scene, choice, covered: coveredDims(offered) });
    flags.add(`${scene.id}.${choice.id}`);
    choice.sets?.forEach((f) => flags.add(f));
    choice.clears?.forEach((f) => flags.delete(f));
    steps.push(step);
    current = resolveNext(choice.next, contextOf(flags, trail), trail);
    if (current === PRACTICAL) break;
  }
  return { steps, trail, current, ctx: contextOf(flags, trail) };
}

export const isFinished = (w: Walk) => w.current === PRACTICAL;

/** The decision scenes already passed through, for "revisit a choice". */
export function decisionsTaken(w: Walk) {
  return w.trail.map((e, i) => ({ index: i, entry: e })).filter(({ entry }) => entry.scene.kind !== 'ending');
}
