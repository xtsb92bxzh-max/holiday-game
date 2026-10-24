export type Vote = 'yes' | 'maybe' | 'no';

export type Outcome = 'mutual' | 'discuss' | 'disagree' | 'rejected' | 'incomplete';

export const outcomes: Outcome[] = ['mutual', 'discuss', 'disagree', 'rejected', 'incomplete'];

/**
 * Deterministic two-person outcome.
 * YES+YES = mutual; YES+MAYBE or MAYBE+MAYBE = discuss;
 * YES/MAYBE against NO = disagree; NO+NO = rejected.
 * A missing vote is never treated as a No.
 */
export function outcomeOf(a: Vote | undefined, b: Vote | undefined): Outcome {
  if (!a || !b) return 'incomplete';
  if (a === 'yes' && b === 'yes') return 'mutual';
  if (a === 'no' && b === 'no') return 'rejected';
  if (a === 'no' || b === 'no') return 'disagree';
  return 'discuss';
}

export const outcomeLabels: Record<Outcome, string> = {
  mutual: 'Mutual favourite',
  discuss: 'Worth discussing',
  disagree: 'Disagreement',
  rejected: 'Rejected',
  incomplete: 'Not voted',
};

export const voteLabels: Record<Vote, string> = { yes: 'Yes', maybe: 'Maybe', no: 'No' };

export type TwoPersonGroups = Record<Outcome, string[]>;

/**
 * Groups in ballot order. Within "worth discussing", YES+MAYBE ranks above
 * MAYBE+MAYBE. Nothing else (prices, points, the dartboard) affects order.
 */
export function groupTwoPerson(
  order: string[],
  a: Record<string, Vote | undefined>,
  b: Record<string, Vote | undefined>,
): TwoPersonGroups {
  const groups: TwoPersonGroups = { mutual: [], discuss: [], disagree: [], rejected: [], incomplete: [] };
  for (const id of order) groups[outcomeOf(a[id], b[id])].push(id);
  const strength = (id: string) => Number(a[id] === 'yes') + Number(b[id] === 'yes');
  groups.discuss = groups.discuss
    .map((id, i) => ({ id, i }))
    .sort((x, y) => strength(y.id) - strength(x.id) || x.i - y.i)
    .map((x) => x.id);
  return groups;
}

export type QuickGroups = { favourites: string[]; maybes: string[]; passes: string[]; unvoted: string[] };

/** Quick edition has one shared ballot, so nothing is ever a two-person match. */
export function groupQuick(order: string[], votes: Record<string, Vote | undefined>): QuickGroups {
  const g: QuickGroups = { favourites: [], maybes: [], passes: [], unvoted: [] };
  for (const id of order) {
    const v = votes[id];
    if (v === 'yes') g.favourites.push(id);
    else if (v === 'maybe') g.maybes.push(id);
    else if (v === 'no') g.passes.push(id);
    else g.unvoted.push(id);
  }
  return g;
}
