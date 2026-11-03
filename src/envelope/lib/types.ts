/**
 * Types for The Envelope, the choose-your-own-adventure mode.
 *
 * The story (scenes and choices), the scoring rules and the destination
 * shortlist live in separate files under `src/envelope/data/`, so each can be
 * edited without touching the others.
 */

/** The hidden preference dimensions. Each runs from -2 (low pole) to +2 (high pole). */
export type Dim = 'pace' | 'light' | 'depth' | 'range' | 'novelty' | 'evenings' | 'journey';

export type Effects = Partial<Record<Dim, number>>;

/**
 * A condition on the story so far.
 * - A string is a flag. Every choice taken sets `sceneId.choiceId`; choices can also set named flags.
 * - `lean` is true when the player's running average on a dimension has passed the lean threshold.
 */
export type Cond =
  | string
  | { all: Cond[] }
  | { any: Cond[] }
  | { not: Cond }
  | { lean: Dim; side: 'low' | 'high' };

export type Variant = { if: Cond; text: string };

/** A paragraph: always shown, shown when a condition holds, or the first N matching options. */
export type Paragraph = string | Variant | { firstOf: number; options: Variant[] };

/** Where a choice leads. A list is checked in order; the first entry whose condition holds wins. */
export type Next = string | { if?: Cond; to: string }[];

export type Choice = {
  id: string;
  label: string;
  /** Only offered when this holds. Variants of one option share their effects. */
  when?: Cond;
  effects: Effects;
  /** Named flags this choice sets or clears. */
  sets?: string[];
  clears?: string[];
  next: Next;
  /** One sentence, second person, past tense. Used in the explanation. */
  recap: string;
  /** Tiebreak scenes only: -1 favours the low pole, 1 the high pole, 0 keeps both. */
  pole?: -1 | 0 | 1;
};

export type SceneKind = 'decision' | 'tiebreak' | 'ending';

export type Scene = {
  id: string;
  kind: SceneKind;
  /** e.g. "Day two, morning". Shown above the scene. */
  when: string;
  /** e.g. "The bookshop". */
  place: string;
  /** Which of the five nights the scene belongs to, for the timeline. */
  night: 1 | 2 | 3 | 4 | 5;
  text: Paragraph[];
  choices: Choice[];
  /** Tiebreak scenes: the dimension they separate. */
  tiebreakDim?: Dim;
};

export type Step = { sceneId: string; choiceId: string };

/** A practical line about a trip, with an honest status. */
export type PracticalLine = {
  label: string;
  text: string;
  status: 'researched' | 'unconfirmed';
};

/**
 * A scheduled flight copied from the workbook's "Uploaded outbound" or
 * "Uploaded return" timetable sheets. The importer does not read those
 * sheets, so these are kept by hand with a row reference. No fare is implied.
 */
export type TimetableLeg = {
  direction: 'out' | 'home';
  from: string;
  to: string;
  /** YYYY-MM-DD */
  date: string;
  /** Local times, HH:MM. */
  departs: string;
  arrives: string;
  airline: string;
  flight: string;
  /** Sheet and row in the workbook, e.g. "Uploaded outbound, row 29". */
  source: string;
};

export type Segment = {
  name: string;
  /** Links to `src/data/destinations.ts` when the city is in the researched data. */
  destinationId?: string;
  nights: number;
};

export type ShortlistOption = {
  id: string;
  name: string;
  /** e.g. "Three nights in Gdańsk, then two in Poznań". */
  split: string;
  segments: Segment[];
  /** Where this trip sits on each dimension, -2 to +2. */
  target: Record<Dim, number>;
  /** A short picture of how the holiday could feel. */
  feel: string;
  /** The main compromise. */
  compromise: string;
  /** What January is typically like. Not a forecast. */
  january: string;
  /** True if typical January days are around freezing. Used only by the practical check. */
  coldWinter: boolean;
  practical: {
    /** An itinerary that matches the whole trip. */
    wholeTripItineraryId?: string;
    /** An itinerary whose outbound leg matches the first city. */
    outboundItineraryId?: string;
    /** An itinerary whose return leg matches the last city. */
    returnItineraryId?: string;
    /** Scheduled flights from the workbook's timetable sheets, where no itinerary covers the leg. */
    timetableLegs?: TimetableLeg[];
    /** Room quotes, by segment index. Prices are shown only when the dates match exactly. */
    rooms?: { segment: number; itineraryId: string }[];
    /** Anything the researched data does not cover. */
    unconfirmed: string[];
  };
};
