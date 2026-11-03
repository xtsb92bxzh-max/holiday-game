/**
 * The practical check, asked after the story. Edit freely.
 *
 * The story never guesses budget or cold tolerance from fictional behaviour.
 * These answers do not change the ranking. They add plain notes to the result,
 * and point out the best story match that avoids a stated dealbreaker.
 */
export type PracticalQuestion = {
  id: 'cold' | 'cost';
  legend: string;
  hint: string;
  options: { id: string; label: string }[];
};

export const PRACTICAL_QUESTIONS: PracticalQuestion[] = [
  {
    id: 'cold',
    legend: 'Would daytime temperatures around freezing put you off?',
    hint: 'Typical January days are around 0–3 °C in the Polish options and around 16–18 °C in Málaga. Neither is guaranteed.',
    options: [
      { id: 'fine', label: 'That’s fine' },
      { id: 'avoid', label: 'I’d rather avoid it' },
      { id: 'unsure', label: 'Not sure' },
    ],
  },
  {
    id: 'cost',
    legend: 'How much does the total cost decide things?',
    hint: 'Only the single-base trips have a researched total. The two-city splits have not been priced.',
    options: [
      { id: 'first', label: 'Cost comes first' },
      { id: 'matters', label: 'It matters, but it isn’t decisive' },
    ],
  },
];

export type PracticalAnswers = Partial<Record<PracticalQuestion['id'], string>>;
