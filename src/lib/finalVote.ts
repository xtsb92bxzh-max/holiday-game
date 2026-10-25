/**
 * The secret final vote shared by the January Getaway and the Getaway Show.
 * Each traveller picks one finalist without seeing the other's pick. Points
 * never rank a holiday; they only decide who breaks a split.
 */

export type FinalVerdict =
  | { kind: 'agreed'; id: string }
  /** `casting` is the traveller who leads on points, or null when the scores are level. */
  | { kind: 'split'; ids: [string, string]; casting: 0 | 1 | null };

export function settleFinal(picks: readonly [string | undefined, string | undefined], points: readonly [number, number]): FinalVerdict | undefined {
  const [a, b] = picks;
  if (!a || !b) return undefined;
  if (a === b) return { kind: 'agreed', id: a };
  return { kind: 'split', ids: [a, b], casting: points[0] === points[1] ? null : points[0] > points[1] ? 0 : 1 };
}
