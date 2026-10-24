export type Vote = 'keep' | 'maybe' | 'pass';

export type MatchCategory = 'match' | 'potential' | 'questions' | 'mutual_rejection' | 'incomplete';

/**
 * Deterministic two-person matching.
 * KEEP+KEEP = match; KEEP+MAYBE or MAYBE+MAYBE = potential;
 * KEEP/MAYBE against PASS = questions; PASS+PASS = mutual rejection.
 * A missing vote is never treated as a pass.
 */
export function matchCategory(a: Vote | undefined, b: Vote | undefined): MatchCategory {
  if (!a || !b) return 'incomplete';
  if (a === 'keep' && b === 'keep') return 'match';
  if (a === 'pass' && b === 'pass') return 'mutual_rejection';
  if (a === 'pass' || b === 'pass') return 'questions';
  return 'potential';
}

export const matchLabels: Record<MatchCategory, string> = {
  match: 'It’s a Match!',
  potential: 'Potential Match',
  questions: 'One of Us Has Questions',
  mutual_rejection: 'Mutual Rejection',
  incomplete: 'Not judged by both',
};

export const voteLabels: Record<Vote, { short: string; long: string }> = {
  keep: { short: 'Keep', long: 'Yes please' },
  maybe: { short: 'Maybe', long: 'Need convincing' },
  pass: { short: 'Pass', long: 'It’s not you, it’s the transfer' },
};

export type TwoPersonGroups = Record<MatchCategory, string[]>;

export function groupTwoPerson(
  order: string[],
  a: Record<string, Vote | undefined>,
  b: Record<string, Vote | undefined>,
): TwoPersonGroups {
  const groups: TwoPersonGroups = { match: [], potential: [], questions: [], mutual_rejection: [], incomplete: [] };
  for (const id of order) groups[matchCategory(a[id], b[id])].push(id);
  return groups;
}

export type QuickGroups = Record<Vote | 'unvoted', string[]>;

/** Quick play has one shared ballot, so there is no such thing as a match. */
export function groupQuick(order: string[], votes: Record<string, Vote | undefined>): QuickGroups {
  const groups: QuickGroups = { keep: [], maybe: [], pass: [], unvoted: [] };
  for (const id of order) groups[votes[id] ?? 'unvoted'].push(id);
  return groups;
}
