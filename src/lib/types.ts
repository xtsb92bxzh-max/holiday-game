export type EvidenceStatus =
  | 'priced_indicative' // dated quote, not guaranteed live
  | 'scheduled_unpriced' // flight schedule identified, fare not confirmed
  | 'needs_manual_review';

export type RouteType = 'direct' | 'connecting' | 'direct_plus_ground' | 'unknown';

export type Itinerary = {
  id: string;
  destinationId: string;
  label: string;
  departureAirport: 'GLA' | 'EDI';
  arrivalAirport: string;
  departDate: string; // YYYY-MM-DD
  returnDate: string;
  nights: 4 | 5;
  routeType: RouteType;
  routeEvidence: string;
  routeCaution?: string;
  timesConfirmed: boolean;
  flightTimes?: { leaveUK: string; arriveThere: string; leaveThere: string; arriveUK: string };
  hoursInDestination?: number;
  flightNumbers?: string;
  flightsPerPersonGBP: number | null;
  roomForTwoGBP: number | null;
  extrasForTwoGBP: number | null;
  estimatedTotalForTwoGBP: number | null;
  workbookTotalForTwoGBP: number | null;
  fareEvidence: EvidenceStatus;
  fareSource: string;
  flightSourceUrl?: string;
  flightLinkKind?: 'generic_search' | 'route_page' | 'timetable';
  roomSourceUrl?: string;
  hotelName?: string;
  hotelReviewOutOf10?: number;
  sourceSheet: string;
  sourceRef: string;
  workbookNote?: string;
};

export type Destination = {
  id: string;
  name: string;
  country: string;
  regionOrCategory: string; // e.g. Baltic winter, food/culture, winter sun
  categories: string[];
  intro: string;
  prizeLine?: string;
  highlights: string[];
  caution: string;
  winterTypical?: string;
  repeatVisitNote?: string;
  imagePath?: string;
  itineraryIds: string[];
  defaultItineraryId: string;
  role: 'main' | 'mystery' | 'extra';
};

export type Decision = 'keep' | 'maybe' | 'bin';

export type ImageCredit = {
  file: string;
  sourcePage: string;
  author: string;
  license: string;
  licenseUrl: string;
};
