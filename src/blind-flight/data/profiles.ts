/**
 * Blind Flight editorial copy: the dating-show profile for each featured
 * contestant. Edit freely.
 *
 * Facts do NOT live here. Names, countries, photos, highlights, typical
 * weather, prices, dates, flights and hotels come from the shared data in
 * src/data/ (see README). The awkward truth below is the contestant's own
 * confession; route cautions from the workbook are always shown alongside it.
 *
 * Clues run from broad to obvious. Keep them to checked, real traits.
 */

export type Profile = {
  /** First-person dating-show one-liner, shown before the reveal. */
  stageIntro: string;
  /** Broad → useful → fairly obvious. */
  clues: [string, string, string];
  /** One-line pitch shown after the reveal. */
  shortPitch: string;
  /** The contestant's own caution. Workbook route cautions are added automatically. */
  awkwardTruth: string;
};

export const profiles: Record<string, Profile> = {
  wroclaw: {
    stageIntro: 'I’ve got a handsome old town and remarkably modest financial expectations.',
    clues: [
      'My river splits into channels around a dozen islands, so I come with a great many bridges.',
      'Look down as you walk: hundreds of small bronze gnomes live on my pavements.',
      'I’m the capital of Lower Silesia, and my market square is one of the largest in Poland.',
    ],
    shortPitch: 'The bargain of the evening, with a painted market square and a cathedral island at dusk.',
    awkwardTruth: 'The very low price needs rechecking, and the priced flight timing needs another look.',
  },
  warsaw: {
    stageIntro: 'I bring museums, good food and five entire nights of conversation.',
    clues: [
      'I’m a capital city on a wide river, and I’m better at museums than first impressions.',
      'My old town was rebuilt brick by brick after the Second World War. UNESCO was impressed.',
      'Chopin’s heart is kept in one of my churches, and the Vistula runs right through me.',
    ],
    shortPitch: 'Serious museums, milk-bar lunches and a rebuilt old town with a remarkable story.',
    awkwardTruth: 'Less instantly pretty than some of tonight’s rivals, and the flight times were not reconfirmed.',
  },
  kaunas: {
    stageIntro: 'I like interesting cafés, Baltic city streets and unexpected rail outings.',
    clues: [
      'I sit where two rivers meet, and between the wars I served as my country’s temporary capital.',
      'My streets are lined with interwar modernist buildings, and I keep a red-brick castle.',
      'I’m Lithuania’s second city, and Vilnius is a short train ride away.',
    ],
    shortPitch: 'A compact Baltic city with a direct flight, a castle and a lot of interwar modernism.',
    awkwardTruth: 'January in Lithuania is not a beach holiday. Expect proper cold and short days.',
  },
  krakow: {
    stageIntro: 'Come for the old streets. Stay for the food and Kazimierz.',
    clues: [
      'I was a royal capital for centuries, and I still carry myself accordingly.',
      'My old Jewish quarter is now full of cafés and bars, and there is a castle on my hill.',
      'Wawel Castle, the Cloth Hall, and a dragon statue that breathes real fire.',
    ],
    shortPitch: 'A royal old town, the Kazimierz quarter and some of the best Polish cooking going.',
    awkwardTruth: 'The flight quote needs reconfirming, and still winter days can bring poor air quality.',
  },
  prague: {
    stageIntro: 'I do romance with bridges, pubs and photogenic architecture.',
    clues: [
      'I’m a landlocked capital, and my beer is famously good value.',
      'My castle complex is one of the largest in the world, and my old town has an astronomical clock.',
      'Cross the Charles Bridge over the Vltava and you will find me.',
    ],
    shortPitch: 'Gothic skylines, cellar pubs and five nights to see it at a sensible pace.',
    awkwardTruth: 'Five nights: check whether you would prefer four. The famous bits stay busy even in January.',
  },
  gdansk: {
    stageIntro: 'Waterfront strolls and exceptionally good-looking facades.',
    clues: [
      'I’m a port with centuries of trade across the Baltic behind me.',
      'A medieval harbour crane still stands on my waterfront, and amber is my speciality.',
      'The Solidarity movement began in my shipyard in 1980.',
    ],
    shortPitch: 'Tall merchant houses on the river, Baltic cafés and a crane older than most countries.',
    awkwardTruth: 'The priced example was a connecting itinerary, and damp sea air makes it feel colder.',
  },
  copenhagen: {
    stageIntro: 'Expensive tastes, but my flight quote is suspiciously approachable.',
    clues: [
      'I’m a Nordic capital that has turned being cosy into a national pastime.',
      'Bicycles rule my streets, and my harbour is clean enough for swimming.',
      'My painted harbour, Nyhavn, is on every postcard. The Little Mermaid is smaller than you expect.',
    ],
    shortPitch: 'Candlelit cafés, harbour walks and a direct flight with known times.',
    awkwardTruth: 'Daily spending can be much higher than the starter quote suggests.',
  },
  tallinn: {
    stageIntro: 'Medieval charm and very convincing winter atmosphere.',
    clues: [
      'I’m a small Baltic capital with a big reputation for doing things online.',
      'Much of my medieval town wall and its towers is still standing.',
      'Helsinki is about two hours away by ferry across the gulf.',
    ],
    shortPitch: 'A walled medieval old town that looks its best under snow.',
    awkwardTruth: 'Connections and short winter days are worth checking before you fall for me.',
  },
  malaga: {
    stageIntro: 'If you find everyone else too cold, may I offer you tapas and the sea?',
    clues: [
      'I’m a port city in the south, and I rarely do proper cold.',
      'Picasso was born here, and a Moorish fortress watches over my harbour.',
      'I’m the gateway to the Costa del Sol, in Andalusia.',
    ],
    shortPitch: 'Five mild nights of seafood, museums and a fortress above the port.',
    awkwardTruth: 'Milder, not a guaranteed sunny beach holiday. Rain does happen in January.',
  },
  paphos: {
    stageIntro: 'I have a thing for antiquity and seaside walks.',
    clues: [
      'I’m on an island, and I have been receiving visitors since antiquity.',
      'My Roman floor mosaics are some of the finest in the Mediterranean.',
      'Legend says Aphrodite came ashore just along my coast.',
    ],
    shortPitch: 'Roman mosaics, a harbour fort and a mild winter by the sea.',
    awkwardTruth: 'A connection is involved in the priced example, and I am quieter than a city break.',
  },
  tenerife: {
    stageIntro: 'I am prepared to offer actual winter warmth.',
    clues: [
      'I’m an island, and much further south than I look on a map of Europe.',
      'I have Spain’s highest mountain, and it is a volcano.',
      'I’m the largest of the Canary Islands.',
    ],
    shortPitch: 'The dependable answer to “is there anywhere warm in January?”',
    awkwardTruth: 'Location and onward transport may need a closer look. The south coast is resort-heavy.',
  },
  vilnius: {
    stageIntro: 'History, cafés and a little logistical adventure.',
    clues: [
      'I’m a capital with one of the largest surviving old towns in Northern Europe.',
      'One of my neighbourhoods has declared itself a republic, with its constitution on a wall.',
      'My baroque churches are famous, and tonight you would fly into Kaunas to reach me.',
    ],
    shortPitch: 'A large baroque old town and the artists’ republic of Užupis.',
    awkwardTruth: 'The flight lands at Kaunas; allow for the onward journey each way.',
  },
};
