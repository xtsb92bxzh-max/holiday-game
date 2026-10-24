/** Presenter copy bank. Rotated by a stable index so lines do not repeat on every card. */

export const copy = {
  opening: 'Welcome to the only dating show where the prize is paying for your own holiday.',
  rules: 'You are judging destinations. They are not allowed to judge your hand luggage.',
  price: 'A romantic proposal. From a spreadsheet.',
  pricePending: 'Our glamorous finance department has not confirmed a return airfare.',
  match: 'Two people willing to endure the same airport security queue.',
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

/** The same three questions go to every contestant. Clue n answers question n. */
export const hostQuestions = [
  'What’s the first thing I’d notice about you?',
  'Tell me something about yourself that might surprise me.',
  'And finally: how will I recognise you at arrivals?',
];

export const showCopy = {
  intros: 'First, a few words from each of our hopefuls.',
  choose: 'Decision time. Keep it to yourself.',
  quickChoose: 'Decision time. Confer quietly.',
  handover: 'Pass the phone. The nation demands an independent opinion.',
  revealIntro: 'Before we meet your date, let’s see who you turned down.',
  match: 'Somebody fetch the confetti. And the passports.',
  split: 'One of you has questions. Both of you have a date.',
  chosen: 'A date has been arranged. Bring a coat.',
};

export const finalCopy = {
  secondChance: 'Before the final, one last chance. Each of you may rescue one contestant nobody chose.',
  choose: 'One holiday. No conferring.',
  split: 'Two hearts, two destinations. Somebody is going to have to compromise.',
};

export function pick<T>(list: T[], seed: string): T {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return list[h % list.length];
}
