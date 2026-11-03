/**
 * The words on the result screen, built only from the player's own trail.
 * Kept separate from the components so the tests can check that every
 * sentence refers to a decision the player actually made.
 */
import { dimById } from '../data/dimensions';
import { explain, recommend, splittingDim, type Recommendation, type TrailEntry } from './scoring';
import type { ShortlistOption } from './types';

export const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export type MatchCopy = {
  option: ShortlistOption;
  /** "Your choices suggest you enjoy …" */
  suggests: string;
  /** Decisions quoted as evidence, in the order they were made. */
  reasons: TrailEntry[];
  /** Shared results only: when to pick this one over the other. */
  chooseIf?: string;
};

export type RunnerUpCopy = {
  option: ShortlistOption;
  sentence: string;
  evidence?: TrailEntry;
};

export type ResultCopy = {
  rec: Recommendation;
  closeNote?: string;
  matches: MatchCopy[];
  runnerUp?: RunnerUpCopy;
};

function suggestsLine(enjoys: string[], o: ShortlistOption) {
  return enjoys.length > 0
    ? `Your choices suggest you enjoy ${joinList(enjoys)}.`
    : `Your choices sit near the middle on most things. ${o.name} is the nearest overall match.`;
}

function matchFor(trail: TrailEntry[], rec: Recommendation, a: ShortlistOption, b: ShortlistOption): MatchCopy {
  const ex = explain(trail, { ...rec, top: a, runnerUp: b });
  return { option: a, suggests: suggestsLine(ex.enjoys, a), reasons: ex.reasons };
}

export function resultCopy(trail: TrailEntry[]): ResultCopy {
  const rec = recommend(trail);
  const { top, runnerUp } = rec;

  if (rec.shared) {
    const d = splittingDim(top, runnerUp);
    const pole = (o: ShortlistOption, other: ShortlistOption) => (o.target[d] < other.target[d] ? dimById[d].low : dimById[d].high);
    return {
      rec,
      closeNote: `Your choices point almost equally to ${top.name} and ${runnerUp.name}. Both are credible matches, so both are shown. The clearest difference between them is ${dimById[d].name.toLowerCase()}.`,
      matches: [
        { ...matchFor(trail, rec, top, runnerUp), chooseIf: `Choose ${top.name} if you care more about ${pole(top, runnerUp)}.` },
        { ...matchFor(trail, rec, runnerUp, top), chooseIf: `Choose ${runnerUp.name} if you care more about ${pole(runnerUp, top)}.` },
      ],
    };
  }

  const ex = explain(trail, rec);
  let closeNote: string | undefined;
  if (rec.close && rec.tiebreak) {
    closeNote = `Your choices pointed almost equally to ${rec.ranked[0].option.name} and ${rec.ranked[1].option.name}. ${rec.tiebreak.entry.choice.recap} That tipped it towards ${top.name}.`;
  } else if (rec.close) {
    closeNote = `Your choices pointed almost equally to ${top.name} and ${runnerUp.name}. Either would be a credible match.`;
  }

  return {
    rec,
    closeNote,
    matches: [{ option: top, suggests: suggestsLine(ex.enjoys, top), reasons: ex.reasons }],
    runnerUp: {
      option: runnerUp,
      sentence: `If you care more about ${ex.runnerUpPreference}, ${runnerUp.name} would be the better choice.`,
      evidence: ex.runnerUpEvidence,
    },
  };
}
