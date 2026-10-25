/**
 * Running order for The Great British Getaway Show. Edit freely.
 * Destinations missing from the data, or without an eligible trip, drop out
 * automatically, so nothing here fixes a round's length.
 */

export type BroadcastGroup = { id: string; title: string; hostLine: string; cast: string[] };

/** Round 1 cast, in the order the picture reveals run. */
export const broadcastGroups: BroadcastGroup[] = [
  {
    id: 'bargain-basement',
    title: 'The Bargain Basement',
    hostLine: 'Strong value, and three surprisingly different holidays.',
    cast: ['wroclaw', 'kaunas', 'warsaw'],
  },
  {
    id: 'ye-olde-cobblestones',
    title: 'Ye Olde Cobblestones',
    hostLine: 'Architecture, atmosphere and a frankly irresponsible number of cafés.',
    cast: ['krakow', 'prague', 'gdansk'],
  },
  {
    id: 'baltic-freeze',
    title: 'The Baltic Freeze & Other Financial Errors',
    hostLine: 'Cold-weather appeal, with at least one very expensive coffee.',
    cast: ['tallinn', 'copenhagen', 'vilnius'],
  },
  {
    id: 'escape-committee',
    title: 'The Escape Committee',
    hostLine: 'For people no longer prepared to defend Scottish January.',
    cast: ['malaga', 'paphos', 'tenerife'],
  },
];

/**
 * Round 2: the price ladder. Each card is compared with the one before it.
 * Chosen so the answers go up and down and the gaps vary. Unpriced or
 * missing entries are dropped, and a destination never appears twice.
 */
export const priceLadder: string[] = ['wroclaw', 'prague', 'kaunas', 'copenhagen', 'tallinn', 'gdansk', 'tenerife'];

export type BoardSegmentId = 'cheap' | 'old' | 'cold' | 'sun' | 'food' | 'wildcard';

export type BoardSegment = { id: BoardSegmentId; label: string; blurb: string };

export const boardSegments: BoardSegment[] = [
  { id: 'cheap', label: 'Cheap as chips', blurb: 'The lowest priced totals not yet on stage.' },
  { id: 'old', label: 'Very old buildings', blurb: 'Historic towns, churches and architecture.' },
  { id: 'cold', label: 'Possibly hypothermia', blurb: 'Baltic and Nordic winter character.' },
  { id: 'sun', label: 'I require sunshine', blurb: 'Winter sun and milder alternatives.' },
  { id: 'food', label: 'Eat your way round', blurb: 'Food, markets, cafés and local cooking.' },
  { id: 'wildcard', label: 'The curious wildcard', blurb: 'Flights timetabled, but no fare found yet.' },
];

/**
 * Round 1's wrong answers come from the same part of Europe as the right one,
 * so a regional clue ("Central Europe", "The Baltics") never settles the guess.
 * Keyed by the country as written in destinations.ts. A test checks every show
 * destination has a region with at least four members.
 */
export const regions: Record<string, string[]> = {
  central: ['Poland', 'Czech Republic', 'Germany'],
  north: ['Lithuania', 'Estonia', 'Denmark', 'Finland'],
  west: ['France', 'Belgium', 'Netherlands', 'Luxembourg', 'Switzerland'],
  south: ['Spain', 'Portugal', 'Italy'],
  farSouth: ['Spain (Canary Islands)', 'Cyprus', 'Turkey'],
};

/** A priced total above this is not "cheap as chips", however generous the host feels. */
export const CHEAP_CEILING_GBP = 560;

/**
 * Editorial board tags. "cheap" and "wildcard" are worked out from the
 * prices, so they are not listed here.
 */
export const boardTags: Record<string, BoardSegmentId[]> = {
  wroclaw: ['old', 'food'],
  kaunas: ['cold', 'old'],
  warsaw: ['old', 'food'],
  krakow: ['old', 'food'],
  prague: ['old', 'food'],
  gdansk: ['old', 'cold'],
  copenhagen: ['cold', 'food'],
  tallinn: ['cold', 'old'],
  vilnius: ['cold', 'old'],
  malaga: ['sun', 'food'],
  paphos: ['sun', 'old'],
  tenerife: ['sun'],
  berlin: ['food'],
  'pisa-florence': ['old', 'food'],
  munich: ['old', 'food'],
  rome: ['old', 'food'],
  porto: ['food', 'old'],
  paris: ['food'],
  luxembourg: ['old'],
  venice: ['old'],
  helsinki: ['cold'],
  poznan: ['old'],
  madrid: ['food'],
  amsterdam: ['food'],
  brussels: ['food', 'old'],
  istanbul: ['old', 'food'],
  barcelona: ['food'],
  alicante: ['sun'],
  lanzarote: ['sun'],
  'gran-canaria': ['sun'],
  santander: ['food'],
};
