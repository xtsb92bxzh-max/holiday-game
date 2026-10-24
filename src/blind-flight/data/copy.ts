/** Presenter copy bank. Rotated by a stable index so lines do not repeat on every card. */

export const copy = {
  opening: 'Welcome to the only dating show where the prize is paying for your own holiday.',
  rules: 'You are judging destinations. They are not allowed to judge your hand luggage.',
  price: 'A romantic proposal. From a spreadsheet.',
  pricePending: 'Our glamorous finance department has not confirmed a return airfare.',
  handover: 'Pass the phone. The nation demands an independent opinion.',
  match: 'It’s a match! Two people are willing to endure the same airport security queue.',
  disagreement: 'One person’s dream getaway. Another person’s connecting flight nightmare.',
  noMatches: 'We have some talking to do.',
  grandFinal: 'And the winner is… a destination you’ll still need to book yourselves.',
  comparison: 'Enough romance. Let’s check the small print.',
  refuse: 'I refuse to participate in this nonsense',
};

export const mysteryIntros = [
  'Behind this podium: attractive architecture and some frankly ambitious January weather.',
  'Our next contestant has asked us to mention their excellent public transport.',
  'This suitor has travelled a long way. Mostly by budget airline.',
  'Ladies, gentlemen and spreadsheet: please welcome our next hopeful.',
  'A contestant who describes themselves as “well connected”. We shall see.',
];

export const voteReactions = {
  keep: [
    'A potential long-term relationship. Of four or five nights.',
    'The heart has spoken. The bank balance will be consulted later.',
    'Into the keep pile. The contestant is visibly moved.',
  ],
  maybe: [
    'Not a no. Every contestant’s favourite answer.',
    'Needs convincing. The contestant has been handed a leaflet.',
    'A cautious maybe. We call that chemistry in this studio.',
  ],
  pass: [
    'A brutal rejection. The city will have to recover in private.',
    'It’s not you, it’s the transfer.',
    'Shown the trapdoor. Politely.',
  ],
};

export function pick<T>(list: T[], seed: string): T {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return list[h % list.length];
}
