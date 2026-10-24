/**
 * The Great British Getaway Show: editorial copy for the featured cast.
 * Edit freely.
 *
 * Facts do NOT live here. Names, countries, photos, highlights, typical
 * weather, prices, dates, flights and hotels come from the shared data in
 * src/data/ (see README). Route cautions from the workbook are always shown
 * next to "the catch" below.
 *
 * Clues run broad → specific and must never name the city.
 */

export type Contestant = {
  /** The presenter's setup line, shown before the reveal. */
  setup: string;
  /** Region → landmark → giveaway. */
  clues: [string, string, string];
  /** One evocative sentence after the reveal. */
  pitch: string;
  /** One unambiguous practical downside. */
  catch: string;
  /** Shown under the photo when it shows somewhere other than where you sleep or land. */
  photoNote?: string;
};

export const contestants: Record<string, Contestant> = {
  wroclaw: {
    setup: 'An old town, a modest price and absolutely no obligation to pronounce it correctly on live television.',
    clues: [
      'Central Europe. A river city in the west of its country.',
      'The river splits around a dozen islands, one of them crowned by a cathedral.',
      'Look down as you walk. Hundreds of small bronze gnomes live on the pavements.',
    ],
    pitch: 'A painted market square, a cathedral island at dusk and the cheapest total on the board.',
    catch: 'The very low price is indicative, and the flight times were not reconfirmed.',
  },
  kaunas: {
    setup: 'Baltic charm on a budget, and a plausible excuse for a train journey.',
    clues: [
      'The Baltics. A city where two rivers meet.',
      'It served as the temporary capital between the world wars and kept the modernist buildings.',
      'Its country’s second city. The capital is a short train ride away.',
    ],
    pitch: 'A compact Baltic city with a red-brick castle, interwar modernism and a direct flight.',
    catch: 'Lithuanian January: properly cold, short days, and quieter than a capital.',
  },
  warsaw: {
    setup: 'Five nights and an almost indecent quantity of museums and restaurants.',
    clues: [
      'Central Europe. A capital on a wide river.',
      'Its old town was rebuilt from rubble after 1945 and is now on the UNESCO list.',
      'The Vistula runs through it, and Chopin’s heart is kept in one of its churches.',
    ],
    pitch: 'Serious museums, milk-bar lunches and a rebuilt old town with a remarkable story.',
    catch: 'The fare is a previously indexed quote, and the flight times need reconfirming.',
  },
  krakow: {
    setup: 'A city prepared to fight dirty using cafés, cobblestones and dinner.',
    clues: [
      'Central Europe. A former royal capital that still carries itself accordingly.',
      'A castle on a hill above the river, and a dragon statue that breathes real fire.',
      'Wawel, the Cloth Hall and the Kazimierz quarter.',
    ],
    pitch: 'A royal old town, the Kazimierz quarter and some of the best Polish cooking going.',
    catch: 'Flight times and fare need rechecking, and still winter days can bring poor air quality.',
  },
  prague: {
    setup: 'A photogenic bridge, atmospheric bars and extremely strong old-town credentials.',
    clues: [
      'Central Europe. A landlocked capital with famously good beer.',
      'A medieval astronomical clock performs on the hour in the old town square.',
      'Charles Bridge, the Vltava and a castle that takes up most of a hill.',
    ],
    pitch: 'Gothic skylines, cellar pubs and five nights to see it at a sensible pace.',
    catch: 'Five nights may be more time than you need, and the famous bits stay busy in January.',
  },
  gdansk: {
    setup: 'A waterfront charmer with a slightly complicated travel history.',
    clues: [
      'The Baltic coast. A port with centuries of trade behind it.',
      'A medieval wooden harbour crane still stands on the waterfront, and amber is in every shop.',
      'The Solidarity movement began in its shipyard in 1980.',
    ],
    pitch: 'Tall merchant houses along the river, smoked fish and a very old crane.',
    catch: 'The priced flight includes a connection.',
  },
  copenhagen: {
    setup: 'Affordable to fly to. The actual coffees are a separate financial event.',
    clues: [
      'Scandinavia. A capital built around a harbour.',
      'More bicycles than seems reasonable, and a small statue of a fairy-tale character by the water.',
      'Nyhavn’s coloured houses and the Tivoli Gardens.',
    ],
    pitch: 'Candlelit cafés, harbour walks and very good food, provided you have a very good budget.',
    catch: 'Daily spending is high. The flight is cheap; the cinnamon buns are not.',
  },
  tallinn: {
    setup: 'Possibly the most convincing winter fairy tale on the board.',
    clues: [
      'The Baltics, on a coast that faces Finland.',
      'Much of its medieval city wall still stands, towers and all.',
      'A capital whose old town is one of the best preserved in Europe. Helsinki is a ferry ride away.',
    ],
    pitch: 'Medieval towers, candlelit cafés and a fair chance of snow on the rooftops.',
    catch: 'The priced flights connect, and January daylight is about six and a half hours.',
  },
  vilnius: {
    setup: 'Lovely streets. Minor logistical plot twist.',
    clues: [
      'The Baltics. An inland capital.',
      'One of the largest baroque old towns in Europe, with an artists’ quarter that declared itself a republic.',
      'Užupis has its own constitution, posted on a wall.',
    ],
    pitch: 'Baroque churches, characterful bars and a self-declared republic for coffee.',
    catch: 'The flight lands at Kaunas. You then need a bus or train to Vilnius.',
    photoNote: 'Pictured: Vilnius. The priced flight lands at Kaunas, so you finish the journey by road or rail.',
  },
  malaga: {
    setup: 'Sunshine-adjacent and extremely persuasive about tapas.',
    clues: [
      'Southern Europe, on the Mediterranean.',
      'A Moorish fortress above the port, in the city where Picasso was born.',
      'The capital of the Costa del Sol, in Andalusia.',
    ],
    pitch: 'The mildest city break on the board, with a hilltop fortress and very good tapas.',
    catch: 'Milder, not guaranteed beach weather. Rain does happen, and evenings are cool.',
  },
  paphos: {
    setup: 'Ancient ruins, sea air and serious winter escape ambitions.',
    clues: [
      'The eastern Mediterranean. An island.',
      'Roman floor mosaics and rock-cut tombs by the sea, all on the UNESCO list.',
      'Legend puts Aphrodite’s birthplace just along this island’s west coast.',
    ],
    pitch: 'Roman mosaics, a harbour fort and a mild winter by the sea.',
    catch: 'The priced flights connect, and it is quieter than a city break.',
  },
  tenerife: {
    setup: 'The only contestant who may actually have remembered what summer looks like.',
    clues: [
      'The Atlantic, off the coast of Africa.',
      'Home to the highest mountain in Spain, which is a volcano.',
      'The largest of the Canary Islands. The mountain is Teide.',
    ],
    pitch: 'Reliable winter warmth, volcanic scenery and fresh fish by the harbour.',
    catch: 'A 06:05 departure, a short last day, and the apartment’s location needs checking.',
    photoNote: 'Pictured: Teide National Park, inland. Check where the apartment is before you pack only shorts.',
  },
  // Non-featured destinations whose photo shows somewhere else.
  'pisa-florence': {
    setup: '',
    clues: ['', '', ''],
    pitch: '',
    catch: '',
    photoNote: 'Pictured: Florence. The priced stay is in Pisa, about an hour away by train.',
  },
  paris: {
    setup: '',
    clues: ['', '', ''],
    pitch: '',
    catch: '',
    photoNote: 'Pictured: central Paris. The priced flight lands at Beauvais, well outside the city.',
  },
};

/** True when a contestant has a full set of clues, so it can play the picture round. */
export const hasClues = (id: string) => Boolean(contestants[id]?.clues.every((c) => c.trim()));
