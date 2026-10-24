/**
 * The standard show: four mini-episodes of three contestants.
 * Destinations that are missing from the data, or have no eligible trip,
 * drop out automatically. An episode with nobody left is skipped.
 */
export type Episode = {
  id: string;
  title: string;
  presenterLine: string;
  cast: string[];
};

export const episodes: Episode[] = [
  {
    id: 'budget-beauties',
    title: 'The Budget Beauties',
    presenterLine: 'Proof that romance may cost less than you feared.',
    cast: ['wroclaw', 'warsaw', 'kaunas'],
  },
  {
    id: 'old-town-romantics',
    title: 'The Old-Town Romantics',
    presenterLine: 'Cobblestones, cafés and a frankly irresponsible amount of atmosphere.',
    cast: ['krakow', 'prague', 'gdansk'],
  },
  {
    id: 'cool-customers',
    title: 'The Cool Customers',
    presenterLine: 'Some of these suitors are colder than others.',
    cast: ['copenhagen', 'tallinn', 'vilnius'],
  },
  {
    id: 'winter-escapees',
    title: 'The Winter Escapees',
    presenterLine: 'For people no longer prepared to defend Scottish January.',
    cast: ['malaga', 'paphos', 'tenerife'],
  },
];

/** Contestants added from “More eligible contenders” appear in bonus episodes of up to three. */
export const bonusEpisode = {
  title: 'The Late Arrivals',
  presenterLine: 'Contestants who missed the first taxi but insisted on coming anyway.',
};
