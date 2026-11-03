/**
 * The Envelope: destination shortlist. Edit freely, without touching the story.
 *
 * - `target` places each trip on the hidden dimensions, in units of each
 *   dimension's typical spread (RULES.scale), so most sit between -1.5 and 1.5.
 *   The story never
 *   awards points to a destination; it only moves the player along these
 *   dimensions, and the nearest target wins. See dimensions.ts.
 * - `practical` points at itineraries in src/data/itineraries.json, which is
 *   generated from the researched workbook. Leave a field out when no
 *   researched itinerary matches; say what is missing in `unconfirmed`.
 * - `timetableLegs` are copied by hand from the workbook's "Uploaded outbound"
 *   and "Uploaded return" sheets, which the importer does not read. Keep the
 *   row reference, and recheck them if the workbook changes.
 * - Room prices are shown only when the quote's dates match the segment exactly.
 * - `january` describes typical January climate only. It is not a forecast.
 *
 * To add or swap a destination, add an entry here with a full `target`, then
 * run `npm test`. A test enumerates every path through the story and fails if
 * any shortlisted trip can never be recommended.
 */
import type { ShortlistOption } from '../lib/types';

export const SHORTLIST: ShortlistOption[] = [
  {
    id: 'malaga',
    name: 'Málaga',
    split: 'Five nights in one base',
    segments: [{ name: 'Málaga', destinationId: 'malaga', nights: 5 }],
    target: { pace: -0.5, light: 1.4, depth: -0.7, range: -0.7, novelty: -0.8, evenings: 0.3, journey: -0.5 },
    feel:
      'Coffee in a square that has already found the sun. A long walk along the seafront, coat open by lunchtime if the day is kind. The market at Atarazanas, then a late lunch that drifts towards evening, and the fortress walls going gold at dusk.',
    compromise:
      'One base for five nights, so no second city. January is mild rather than warm: some days will be grey or wet, evenings are cool, and the beach is for walking along rather than lying on. Many UK travellers will find it more familiar than the other options.',
    january: 'Typically around 16–18 °C by day and often sunny, with some rainy spells. Not a beach holiday in January.',
    coldWinter: false,
    practical: {
      wholeTripItineraryId: 'EU014',
      rooms: [{ segment: 0, itineraryId: 'EU014' }],
      unconfirmed: [],
    },
  },
  {
    id: 'krakow',
    name: 'Kraków',
    split: 'Five nights in one base',
    segments: [{ name: 'Kraków', destinationId: 'krakow', nights: 5 }],
    target: { pace: 0.4, light: -1.0, depth: 1.2, range: -0.7, novelty: -0.3, evenings: 0.6, journey: -0.6 },
    feel:
      'Short, cold days spent between the old town, Wawel and the museums, with a café stop every time your fingers protest. Evenings in Kazimierz: cellar bars, candlelit restaurants and food that seems designed for January. Five nights is long enough to stop sightseeing and start having favourite places.',
    compromise:
      'Short, cold January days mean much of the trip happens indoors. There is no second city unless you add day trips. Winter air quality can be poor on still days.',
    january: 'Typically around 0–3 °C by day, with frost likely. Snow is possible but not guaranteed.',
    coldWinter: true,
    practical: {
      wholeTripItineraryId: 'EU006',
      rooms: [{ segment: 0, itineraryId: 'EU006' }],
      unconfirmed: [],
    },
  },
  {
    id: 'gdansk-poznan',
    name: 'Gdańsk and Poznań',
    split: 'Three nights in Gdańsk, then two in Poznań',
    segments: [
      { name: 'Gdańsk', destinationId: 'gdansk', nights: 3 },
      { name: 'Poznań', destinationId: 'poznan', nights: 2 },
    ],
    target: { pace: 1.0, light: 0.8, depth: 0.7, range: 1.4, novelty: 0.5, evenings: -1.1, journey: 0.6 },
    feel:
      'Three nights by the water in Gdańsk: tall merchant houses on the Motława, a damp Baltic wind, smoked fish and long café afternoons. Then a train inland to Poznań for two quieter nights around a painted market square, with the feeling of having travelled somewhere rather than simply stayed.',
    compromise:
      'A travel day in the middle and fewer nights in each city. Damp Baltic cold. The direct flight out leaves Edinburgh at 06:05. The flights, the train and the rooms for this split have not been priced, so the total is unknown.',
    january: 'Typically around 0–3 °C by day in both cities, damp and breezy on the Baltic coast. Snow is possible but not guaranteed.',
    coldWinter: true,
    practical: {
      timetableLegs: [
        {
          direction: 'out',
          from: 'EDI',
          to: 'GDN',
          date: '2027-01-17',
          departs: '06:05',
          arrives: '09:25',
          airline: 'Ryanair',
          flight: 'FR6124',
          source: 'Uploaded outbound, row 10',
        },
      ],
      returnItineraryId: 'EU022',
      rooms: [
        { segment: 0, itineraryId: 'EU005' },
        { segment: 1, itineraryId: 'EU022' },
      ],
      unconfirmed: [
        'Train times and fares between Gdańsk and Poznań are not in the researched data.',
        'The workbook’s priced Gdańsk example is a connecting return trip, so its fare does not apply to this split.',
        'No total is available for this combination.',
      ],
    },
  },
  {
    id: 'rzeszow-krakow',
    name: 'Rzeszów and Kraków',
    split: 'One night in Rzeszów, then four in Kraków',
    segments: [
      { name: 'Rzeszów', nights: 1 },
      { name: 'Kraków', destinationId: 'krakow', nights: 4 },
    ],
    target: { pace: 0.1, light: -0.8, depth: 0.9, range: 0.6, novelty: 1.6, evenings: 0.3, journey: 1.6 },
    feel:
      'A first night somewhere few people you know have been: a small old town, a quiet square and the pleasure of arriving without expectations. Then the train west to Kraków for four nights of old town, museums and Kazimierz evenings, with the sense of having come in by the side door.',
    compromise:
      'A single night in Rzeszów is brief, and starting there adds a train journey. You would fly out from Edinburgh and back into Glasgow. No fares have been matched to either flight, so this option is the least certain on cost.',
    january: 'Typically around freezing by day in both cities, with frost likely. Snow is possible but not guaranteed.',
    coldWinter: true,
    practical: {
      timetableLegs: [
        {
          direction: 'out',
          from: 'EDI',
          to: 'RZE',
          date: '2027-01-17',
          departs: '09:00',
          arrives: '12:50',
          airline: 'Ryanair',
          flight: 'FR4535',
          source: 'Uploaded outbound, row 29',
        },
      ],
      returnItineraryId: 'EU021',
      rooms: [{ segment: 1, itineraryId: 'EU021' }],
      unconfirmed: [
        'The flight out leaves from Edinburgh and the flight home lands in Glasgow.',
        'Train times and fares from Rzeszów to Kraków are not in the researched data.',
        'No room in Rzeszów has been researched.',
        'No total is available for this combination.',
      ],
    },
  },
];

export const shortlistById: Record<string, ShortlistOption> = Object.fromEntries(SHORTLIST.map((o) => [o.id, o]));
