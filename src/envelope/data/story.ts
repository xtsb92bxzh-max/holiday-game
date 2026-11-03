/**
 * The Envelope: every scene, choice and ending. Edit freely.
 *
 * How it fits together
 * - The story starts at `START`. Each choice names its next scene.
 * - Every choice taken sets a flag `sceneId.choiceId`. Paragraphs and later
 *   choices can test these flags, or named flags set with `sets`.
 * - `effects` move the hidden preference dimensions (see dimensions.ts).
 *   Each decision should usually move more than one. Keep values within -2..2.
 * - `recap` is quoted back in the explanation, so it must describe exactly
 *   what the player chose.
 * - `@finale` goes to a tiebreak if the top two matches are close, otherwise
 *   to an ending. `@ending` picks the first matching route in `ENDING_ROUTES`.
 * - `@practical` leaves the story for the practical check.
 *
 * No scene may name the city, a country, or any shortlisted destination.
 * A test checks this.
 */
import type { Dim, Paragraph, Scene } from '../lib/types';

export const START = 'arrival';

// Places with sea, river light or open sky. Used in the ending's callbacks.
const COASTAL = [
  'museum.tower',
  'market.harbour',
  'bookshop.river',
  'train.shore',
  'river.ferry',
  'river-afternoon.boat',
  'vera.fort',
  'visit.lighthouse',
  'town-morning.lighthouse',
  'evening-town.beach',
  'city-day.lagoons',
];
const INDOORS = ['museum.cellars', 'vera.studio', 'river.history', 'visit.kitchen', 'city-day.oldtown', 'teodora.tour'];
const PEOPLE = [
  'market.unknown',
  'vera.lunch',
  'cafe.crossword',
  'city-day.deeper-vera',
  'city-day.deeper-nadia',
  'city-day.deeper-bookshop',
  'river.embankment',
  'train.conductor',
];
const NIGHTS_AWAY = ['teodora.stay', 'visit.stayover', 'town-morning.anothernight'];
const TRAVELLED = ['bookshop.train', 'visit.lighthouse', 'visit.kitchen', 'city-day.lagoons'];

/** The city responds to what the player keeps choosing. One line at most. */
const cityMood: Paragraph = {
  firstOf: 1,
  options: [
    { if: { lean: 'light', side: 'high' }, text: 'The sky has cleared, as if the city has noticed you keep heading outdoors.' },
    { if: { lean: 'light', side: 'low' }, text: 'It has started raining again. The city seems confident you will find a door to go through.' },
    { if: { lean: 'pace', side: 'low' }, text: 'You have stopped checking the time. The streets seem to have got shorter.' },
    { if: { lean: 'pace', side: 'high' }, text: 'Your map is covered in neat pencil ticks. The city, to its credit, is keeping up.' },
    { if: { lean: 'novelty', side: 'high' }, text: 'Shopkeepers have started recommending things to you without being asked.' },
    { if: { lean: 'novelty', side: 'low' }, text: 'The waiter at the café on the corner nods when you pass. You appear to have a usual.' },
    { if: { lean: 'evenings', side: 'high' }, text: 'Someone you met last night waves at you across the square. You wave back as if you remember their name.' },
    { if: { lean: 'evenings', side: 'low' }, text: 'You are sleeping better here than you have in months. The city seems to approve.' },
  ],
};

// ─────────────── The drawer: shared by every ending ───────────────

const drawerOpens: Paragraph[] = [
  { if: 'arrival.bar', text: 'It is the plan chest you put your glass on the first night. You have decided not to mention this.' },
  'The key turns with a click you feel in your teeth. Drawer 14 is full of maps.',
  'There are thirteen, each signed and dated by a guest before you. All show this city. No two agree. One is almost all coastline. One is a dense knot of streets. One spends a night somewhere small, then settles down for a long stay. One is mostly cafés, with ratings.',
  'Underneath is a blank sheet of the same heavy paper, and a pen.',
];

const drawnRoute: Paragraph = {
  firstOf: 2,
  options: [
    { if: { any: NIGHTS_AWAY }, text: 'You draw the railway line first, and the town at the end of it, much larger than it really is.' },
    { if: { any: TRAVELLED }, text: 'You draw the railway line running off the edge of the page, with a small arrow where you followed it.' },
    { if: { any: COASTAL }, text: 'The coast gets more ink than anything else. You find you cannot help it.' },
    { if: { any: INDOORS }, text: 'In the old centre you draw the insides of buildings rather than the streets between them.' },
    { if: { any: PEOPLE }, text: 'You add small crosses for the people who fed you, talked to you or argued with you.' },
    { if: { any: ['evening.cellar', 'evening-town.fish'] }, text: 'You mark the bar with a small star and then, after some thought, a second one.' },
    { if: { any: ['evening.quiet', 'evening-town.early', 'arrival.sleep'] }, text: 'You mark the hotel with a small bed. It has earned it.' },
    { if: 'last-days.wander', text: 'Large parts of your map simply say “lost”, written with affection.' },
    { if: 'last-days.full', text: 'Your route is neat, numbered and complete. Teodora would call it suspicious.' },
    { if: 'last-days.return', text: 'One place on your map has been drawn over so many times the paper has gone soft.' },
  ],
};

const reveal = [{ id: 'reveal', label: 'See where your map points', effects: {}, next: '@practical', recap: '' }];

// ─────────────── Tiebreaks: offered only when the top two are close ───────────────

const tiebreakIntro =
  'Your last afternoon. The drawer can wait until seven. The city, which has been paying close attention all week, seems to be offering you one more choice, as if it has noticed you have not quite made up your mind.';

const letItDecide = {
  id: 'both',
  label: 'Sit in the hotel lobby with the key in your pocket and let the afternoon decide for itself.',
  effects: {},
  next: '@ending',
  recap: 'On your last afternoon you sat in the lobby and let the time decide itself.',
  pole: 0 as const,
};

function tiebreak(
  dim: Dim,
  text: string,
  high: { label: string; recap: string },
  low: { label: string; recap: string },
): Scene {
  return {
    id: `tiebreak-${dim}`,
    kind: 'tiebreak',
    when: 'Day five, afternoon',
    place: 'One more choice',
    night: 5,
    tiebreakDim: dim,
    text: [tiebreakIntro, text],
    choices: [
      { id: 'high', label: high.label, effects: {}, next: '@ending', recap: high.recap, pole: 1 },
      { id: 'low', label: low.label, effects: {}, next: '@ending', recap: low.recap, pole: -1 },
      letItDecide,
    ],
  };
}

export const TIEBREAKS: Scene[] = [
  tiebreak(
    'pace',
    'Someone has slipped a list under your door: six things you have not seen yet, with opening times. Underneath, in different handwriting, someone else has added: “Or don’t.”',
    { label: 'Do the list, properly, in order.', recap: 'On your last afternoon you worked through the list in order.' },
    { label: 'Ignore it. Find a bench with a view and stay until the light goes.', recap: 'On your last afternoon you ignored the list and sat on a bench until the light went.' },
  ),
  tiebreak(
    'light',
    'The rain has come back, softly. On one side of the square the library reading room is lit up green and gold. On the other, a tram is leaving for the river mouth, where the clouds are breaking over the water.',
    { label: 'Take the tram out to the water.', recap: 'On your last afternoon you took the tram out to the water in the rain.' },
    { label: 'Go into the reading room and stay until it closes.', recap: 'On your last afternoon you stayed in the library reading room until it closed.' },
  ),
  tiebreak(
    'depth',
    'The cathedral crypt is open from two until three, for the first time all week. The market is open too, and the woman at the cheese stall has promised to tell you something scandalous about the mayor.',
    { label: 'Go down into the crypt while you can.', recap: 'On your last afternoon you went down into the cathedral crypt.' },
    { label: 'Go to the market and hear about the mayor.', recap: 'On your last afternoon you went to the market for the gossip.' },
  ),
  tiebreak(
    'range',
    'At the station the departures board lists towns you have never heard of. A train to one of them leaves in twenty minutes and comes back at six.',
    { label: 'Take it, just to see somewhere else.', recap: 'On your last afternoon you caught a train to a town you had never heard of.' },
    { label: 'Stay in the streets you know now. They have earned the afternoon.', recap: 'On your last afternoon you stayed in the streets you had come to know.' },
  ),
  tiebreak(
    'novelty',
    'On the left is the café where the waiter already knows your order. On the right is a place with no sign, no menu and a queue of people who look as if they know something.',
    { label: 'Join the queue.', recap: 'On your last afternoon you joined the queue at the place with no sign.' },
    { label: 'Go to your café. The waiter has already started making it.', recap: 'On your last afternoon you went back to the café where they knew your order.' },
  ),
  tiebreak(
    'evenings',
    'Two invitations are waiting at reception. One is to a concert in a cellar that starts at nine and will not finish at a sensible hour. The other is from the hotel: an early table by the window, and the promise of a quiet last night.',
    { label: 'Say yes to the concert.', recap: 'For your last night you said yes to the late concert in the cellar.' },
    { label: 'Take the early table and the quiet night.', recap: 'For your last night you chose the early table and a quiet evening.' },
  ),
  tiebreak(
    'journey',
    'The receptionist mentions a village in the hills with the best view in the region. It is an hour each way on a bus that leaves in ten minutes. Or there is the view from the hotel roof, which is closer and, he admits, not bad.',
    { label: 'Run for the bus.', recap: 'On your last afternoon you took the hour-long bus up to the hill village for the view.' },
    { label: 'Go up to the roof.', recap: 'On your last afternoon you settled for the view from the hotel roof.' },
  ),
];

// ─────────────── The story ───────────────

export const SCENES: Scene[] = [
  {
    id: 'arrival',
    kind: 'decision',
    when: 'Night one',
    place: 'The hotel',
    night: 1,
    text: [
      'The taxi leaves you at a hotel whose revolving door has given up revolving. It is late and raining. The city smells of wet stone and somebody’s dinner.',
      'The receptionist hands you an envelope before you have finished saying your name. Inside are a hand-drawn map, a brass key on a paper tag marked 14, and a note: “There is more than one way to find what you came for.”',
      'On the back, in the same hand, is an address you cannot place. The map shows an old centre, a river and a railway that runs off the edge of the paper. A small mark, a circle with a line through it, appears in several places.',
      '“It came with instructions,” the receptionist says. “Mainly not to be helpful.”',
      'You have five nights. Nobody is expecting you anywhere.',
    ],
    choices: [
      {
        id: 'bar',
        label: 'Spread the map out in the hotel bar and study it over a nightcap.',
        effects: { pace: 1, evenings: 1 },
        next: 'morning',
        recap: 'On the first night you studied the map over a nightcap in the hotel bar.',
      },
      {
        id: 'walk',
        label: 'Go out into the rain now and walk until the streets stop matching the map.',
        effects: { pace: -1.5, novelty: 1 },
        next: 'morning',
        recap: 'On the first night you went out walking in the rain with no plan.',
      },
      {
        id: 'sleep',
        label: 'Put the envelope on the bedside table and sleep. The city will still be there.',
        effects: { evenings: -1.5, novelty: -0.5 },
        next: 'morning',
        recap: 'On the first night you chose sleep over the city.',
      },
    ],
  },

  {
    id: 'morning',
    kind: 'decision',
    when: 'Day two, morning',
    place: 'Breakfast',
    night: 2,
    text: [
      {
        if: 'arrival.bar',
        text: 'The map gave up a secret over your nightcap. Beside the station someone has pencilled three times in tiny figures: 07:40, 11:20, 16:05. The barman, polishing a glass like a man avoiding conversation, glanced at the mark and said one word: “Vera.” Then he went back to the glass.',
      },
      {
        if: 'arrival.walk',
        text: 'You came back after midnight, soaked to the knees. Down by the river you found the mark chalked on the embankment wall, fresh enough to smudge. Your shoes are on the radiator. They will not forgive you.',
      },
      {
        if: 'arrival.sleep',
        text: 'You wake before your alarm, properly rested for the first time in weeks. The day receptionist, who is far chattier than her night-time colleague, looks at your map and says that paper is sold in only one shop. She draws an arrow to it, which feels like cheating.',
      },
      'Breakfast is strong coffee and bread that fights back. The rain has thinned to a sort of damp opinion. One of the marks sits on a street of shops in the old centre. Another is on the river. A third is on the railway, just before it leaves the page.',
    ],
    choices: [
      {
        id: 'plan',
        label: 'Plan the day properly: the city museum first, then each mark in turn.',
        effects: { pace: 2, depth: 1 },
        next: 'museum',
        recap: 'You planned your first full day around the city museum and the marks in order.',
      },
      {
        id: 'tram',
        label: 'Take the tram to the market at the end of the line, where the receptionist says the city actually lives.',
        effects: { depth: -1.5, novelty: 1 },
        next: 'market',
        recap: 'You rode the tram out to the market before seeing a single sight.',
      },
      {
        id: 'cafe',
        label: 'Find a café with a window seat and let the city show its hand first.',
        effects: { pace: -1.5, light: -1 },
        next: 'cafe',
        recap: 'You began your first morning in a café window, watching the city before joining it.',
      },
    ],
  },

  {
    id: 'museum',
    kind: 'decision',
    when: 'Day two, morning',
    place: 'The city museum',
    night: 2,
    text: [
      'The museum occupies a former customs house and treats every visitor as a mild smuggling risk. In a case of old city plans you find your mark, printed beside the name of the mapmakers’ guild. The label says the guild was dissolved in a year that makes you feel very young.',
      'A curator in a cardigan notices you comparing it with your own map. She becomes, very quietly, extremely interested.',
      '“That’s a guild mark,” she says. “Nobody has used it in a century. Except one woman, and she does it to annoy us.” She will not say who.',
    ],
    choices: [
      {
        id: 'cellars',
        label: 'Accept her offer of a tour of the cellars, where the guild’s records are kept.',
        effects: { depth: 2, light: -1.5 },
        next: 'bookshop',
        recap: 'You took the curator’s tour of the guild records in the museum cellars.',
      },
      {
        id: 'tower',
        label: 'Climb the customs tower instead. From the top, she says, you can see the coast.',
        effects: { light: 1.5, range: 0.5 },
        next: 'bookshop',
        recap: 'You climbed the museum tower for the view of the coast instead of going down to the archive.',
      },
      {
        id: 'leave',
        label: 'Thank her and go. You have seen enough glass cases, and the café across the square has steamed-up windows.',
        effects: { depth: -1, pace: -1 },
        next: 'bookshop',
        recap: 'You left the museum early for the café across the square.',
      },
    ],
  },

  {
    id: 'market',
    kind: 'decision',
    when: 'Day two, morning',
    place: 'The market at the end of the line',
    night: 2,
    text: [
      'The tram empties at a covered market built like a railway station that changed its mind. Inside it is warm and loud. People are buying cabbages with the seriousness of stockbrokers.',
      'At a soup stall the cook sees the map under your arm, taps the mark with her ladle and says, “Teodora. She bought her bread two stalls down, before she moved to the end of the railway line.” She says it as if the end of the railway line were the moon.',
      'She also says the bookshop in the old centre sells Teodora’s paper, and that you look hungry.',
    ],
    choices: [
      {
        id: 'unknown',
        label: 'Let the cook choose your lunch, and do not ask what is in it.',
        effects: { novelty: 2, depth: -0.5 },
        next: 'bookshop',
        recap: 'At the market you let the cook choose your lunch without asking what it was.',
      },
      {
        id: 'known',
        label: 'Order the soup you recognise, and ask the cook more about Teodora.',
        effects: { novelty: -1.5, depth: 0.5 },
        next: 'bookshop',
        recap: 'At the market you ordered the soup you recognised and asked about the mapmaker.',
      },
      {
        id: 'harbour',
        label: 'Take the fishmonger’s advice and walk out to the old harbour basin behind the market.',
        effects: { light: 1.5, pace: -0.5 },
        next: 'bookshop',
        recap: 'You walked out to the old harbour basin behind the market.',
      },
    ],
  },

  {
    id: 'cafe',
    kind: 'decision',
    when: 'Day two, morning',
    place: 'A café in the old centre',
    night: 2,
    text: [
      'The café has mirrors on every wall, so you can watch the city from six angles while appearing to read. Two old men argue over a newspaper. A woman in a fur hat eats a cake with the focus of a surgeon.',
      'When the bill comes, it is tucked into a bookmark from a shop two streets away. The bookmark carries your mark, printed small in one corner.',
    ],
    choices: [
      {
        id: 'crossword',
        label: 'Stay for a second coffee and help the old man at the next table with his crossword.',
        effects: { pace: -1.5, depth: -1, light: -0.5 },
        next: 'bookshop',
        recap: 'You stayed in the café for a second coffee and a stranger’s crossword.',
      },
      {
        id: 'plan',
        label: 'Use the back of the map to plan the rest of the week, properly.',
        effects: { pace: 1.5, novelty: -1 },
        next: 'bookshop',
        recap: 'You sat in the café and planned the rest of your week on the back of the map.',
      },
      {
        id: 'ask',
        label: 'Ask the waiter about the shop on the bookmark, and go straight there.',
        effects: { novelty: 1, pace: 0.5 },
        next: 'bookshop',
        recap: 'You followed the bookmark straight from the café to the bookshop.',
      },
    ],
  },

  {
    id: 'bookshop',
    kind: 'decision',
    when: 'Day two, late morning',
    place: 'The bookshop',
    night: 2,
    text: [
      { if: 'morning.plan', text: 'The curator would not say who annoys the guild, but she wrote down the name of a bookshop on the back of a museum leaflet.' },
      { if: 'morning.tram', text: 'The cook’s directions take you back into the old centre, to a narrow bookshop with a bell that rings slightly too late.' },
      { if: 'morning.cafe', text: 'The bookmark leads you two streets away, to a narrow bookshop with a bell that rings slightly too late.' },
      'The bookseller is called Vera. She recognises the mark on your map before you have unfolded it fully.',
      { if: 'arrival.bar', text: 'So this is Vera. The barman was right, which he will be unbearable about.' },
      'She can explain it over coffee, she says, but the next train to the address on your envelope leaves in forty minutes. Outside, the rain has stopped for the first time all morning.',
      { if: 'arrival.bar', text: 'Forty minutes: the 11:20, as the pencilled figures on your map predicted.' },
      { if: 'arrival.walk', text: 'Through the window you can see the street that runs down to the river, where you saw the same mark last night.' },
    ],
    choices: [
      {
        id: 'stay',
        label: 'Stay and hear what she knows.',
        effects: { range: -1.5, depth: 1, journey: -0.5 },
        sets: ['metVera'],
        next: 'vera',
        recap: 'You stayed to hear Vera out and let the train go without you.',
      },
      {
        id: 'train',
        label: 'Take the train and follow the address on the envelope.',
        effects: { range: 1.5, journey: 1 },
        sets: ['metTeodora'],
        next: 'train',
        recap: 'You left Vera’s coffee for the train and the address on the envelope.',
      },
      {
        id: 'river',
        label: 'Walk towards the river, where the same mark appears.',
        effects: { light: 1, pace: -1, journey: -0.5 },
        sets: ['metNadia'],
        next: 'river',
        recap: 'When the rain stopped, you walked down to the river instead of sitting down for coffee or catching the train.',
      },
    ],
  },

  // ─────────── Branch A: staying with Vera ───────────

  {
    id: 'vera',
    kind: 'decision',
    when: 'Day two, late morning',
    place: 'Over coffee',
    night: 2,
    text: [
      'Vera makes coffee on a stove behind the counter that would fail any inspection. While it boils, she tells you about Teodora.',
      'For forty years Teodora drew maps for guests at your hotel, one each, never the same twice. She left them at reception with a key and a note. Vera has never known what the keys open. “She numbers things,” she says. “Drawers, mostly. Grandchildren, if they let her.”',
      { if: 'museum.cellars', text: 'You mention the guild records in the museum cellars. Vera snorts. “She was never in the guild. She just liked their stationery.”' },
      'Teodora retired last spring to the town at the end of the railway line. She sends Vera a postcard every week, mostly about the weather and other people’s grammar.',
    ],
    choices: [
      {
        id: 'studio',
        label: 'Ask to see Teodora’s old studio, above the shop.',
        effects: { depth: 1.5, light: -1.5 },
        next: 'vera-afternoon',
        recap: 'You spent the afternoon in Teodora’s old studio above the bookshop.',
      },
      {
        id: 'lunch',
        label: 'Go with Vera to the canteen where she has eaten lunch every day for twenty years.',
        effects: { depth: -2, pace: -0.5 },
        next: 'vera-afternoon',
        recap: 'You ate lunch with Vera at her canteen, among people who have been going there for decades.',
      },
      {
        id: 'fort',
        label: 'Take her advice and walk up to the old fort on the hill while the sky is clear.',
        effects: { light: 1.5, pace: 1 },
        next: 'vera-afternoon',
        recap: 'You climbed to the fort above the city while the sky was clear.',
      },
    ],
  },

  {
    id: 'vera-afternoon',
    kind: 'decision',
    when: 'Day two, afternoon',
    place: 'The bookshop',
    night: 2,
    text: [
      {
        if: 'vera.studio',
        text: 'The studio is cold and bright and smells of ink. Teodora’s pens are still standing in a jam jar. On the floorboards is a pale rectangle where something large once stood. “A plan chest,” says Vera. “Twenty drawers. It went somewhere when she retired. I wasn’t told where. I was told not to tell.”',
      },
      {
        if: 'vera.lunch',
        text: 'The canteen serves one soup, one stew and one opinion, which belongs to the woman at the till. Vera introduces you to four people whose names you immediately forget and a dog whose name you will remember for life. Everyone, it turns out, has had a map from Teodora. Nobody will say what their key opened. They just smile, which is irritating.',
      },
      {
        if: 'vera.fort',
        text: 'From the fort walls the city looks like a model of itself: the river, the spires, the railway curving away towards a flat bright line of sea. Somewhere along that line is Teodora. On the way down you buy a pair of enormous gloves. Nobody needs to know.',
      },
      'Back at the shop, Vera writes Teodora’s address on a scrap of paper. It matches the envelope. “Two hours on the train, if it’s in a good mood,” she says. “She would like a visitor. She would never say so.”',
    ],
    choices: [
      {
        id: 'promise',
        label: 'Promise to go and see her tomorrow, first thing.',
        effects: { range: 1.5, journey: 1 },
        sets: ['planVisit', 'metTeodora'],
        next: 'evening',
        recap: 'You promised Vera you would travel out to see Teodora.',
      },
      {
        id: 'letter',
        label: 'Write Teodora a letter and leave it with Vera. Your days are here.',
        effects: { range: -1.5, journey: -1 },
        sets: ['wroteLetter'],
        next: 'evening',
        recap: 'You wrote Teodora a letter rather than travel out to see her.',
      },
    ],
  },

  // ─────────── Branch B: the train ───────────

  {
    id: 'train',
    kind: 'decision',
    when: 'Day two, midday',
    place: 'The train',
    night: 2,
    text: [
      { if: 'arrival.bar', text: 'It is the 11:20. Of course it is.' },
      'The train is older than it needs to be and warmer than it looks. The city thins into allotments, then reed beds, then a long grey-green coast where the sea and the sky cannot agree on a border.',
      'The conductor clips your ticket and looks at the envelope with professional curiosity. “End of the line,” he says. “Nothing happens there in January. That’s why people like it.”',
      'Two stops before the end, your map shows the mark beside the railway, right where the line meets the shore.',
    ],
    choices: [
      {
        id: 'shore',
        label: 'Get off at the shore stop and walk the last stretch along the beach.',
        effects: { light: 1.5, pace: -0.5 },
        next: 'teodora',
        recap: 'You got off the train early to walk the last stretch along the beach.',
      },
      {
        id: 'end',
        label: 'Stay on to the end of the line and go straight to the address.',
        effects: { pace: 1.5, journey: 0.5 },
        next: 'teodora',
        recap: 'You stayed on the train to the end of the line and went straight to the address.',
      },
      {
        id: 'conductor',
        label: 'Ask the conductor what people actually do there, and take his advice.',
        effects: { novelty: 1, depth: -1 },
        next: 'teodora',
        recap: 'You asked the conductor about the town and took his advice.',
      },
    ],
  },

  {
    id: 'teodora',
    kind: 'decision',
    when: 'Day two, afternoon',
    place: 'The town at the end of the line',
    night: 2,
    text: [
      {
        if: 'train.shore',
        text: 'The beach is wide and empty, the sand packed hard by winter. Halfway along, a woman of about eighty is walking a very small dog into a very large wind. Your mark is embroidered on her hat. That seems conclusive. “You’re early,” she says. “People usually have the coffee first.”',
      },
      {
        if: 'train.end',
        text: 'The address is a narrow blue house near the harbour. The woman who opens the door is about eighty, has ink on her fingers and does not seem surprised. “You’re early,” she says. “People usually have the coffee first.”',
      },
      {
        if: 'train.conductor',
        text: 'The conductor sends you to the bakery, where the woman ahead of you in the queue has ink on her fingers and buys exactly one bun. She is about eighty. “You’re early,” she says, without turning round. “People usually have the coffee first.”',
      },
      'This is Teodora. She has drawn maps for your hotel’s guests for forty years. “People arrive with a list,” she says. “I give them a map with no list on it. Then they show me what they actually like.”',
      'She will not say what the key opens, only that it is not here. “You have carried it in the wrong direction,” she says, looking pleased. The last train back leaves at six.',
    ],
    choices: [
      {
        id: 'stay',
        label: 'Stay the night. The guesthouse by the harbour has a room, and Teodora says the fish place is quiet in January.',
        effects: { range: 2, evenings: -1 },
        sets: ['inTown'],
        next: 'evening-town',
        recap: 'You stayed the night in the town at the end of the line instead of going back.',
      },
      {
        id: 'back',
        label: 'Catch the last train back. The city will be lit up by the time you arrive.',
        effects: { range: -1, evenings: 1.5 },
        next: 'evening',
        recap: 'You caught the last train back so you could spend the evening in the city.',
      },
      {
        id: 'tour',
        label: 'Ask Teodora to show you the town’s old quarter before the last train.',
        effects: { depth: 1.5, range: -0.5 },
        next: 'evening',
        recap: 'You asked Teodora for a tour of the town’s old quarter before taking the last train back.',
      },
    ],
  },

  // ─────────── Branch C: the river ───────────

  {
    id: 'river',
    kind: 'decision',
    when: 'Day two, late morning',
    place: 'The river',
    night: 2,
    text: [
      'The river is wide and brown and in no hurry. Gulls stand on the embankment wall like a committee waiting for a quorum. The mark is there, chalked beside a set of steps that lead down to a small ferry landing.',
      { if: 'arrival.walk', text: 'Somebody has redrawn it since last night.' },
      'The ferry is a flat-bottomed boat with a wheelhouse the size of a phone box. Its skipper, Nadia, is drinking tea from a flask lid. She looks at your map, then at you. “Teodora’s,” she says. “She taught me to read a chart. Then she criticised my handwriting for ten years.”',
      'Nadia runs the boat down to the river mouth and back twice a day. The next trip leaves in ten minutes.',
    ],
    choices: [
      {
        id: 'ferry',
        label: 'Take the ferry out to where the river meets the sea.',
        effects: { light: 1.5, journey: 0.5 },
        next: 'river-afternoon',
        recap: 'You took Nadia’s ferry down to where the river meets the sea.',
      },
      {
        id: 'embankment',
        label: 'Stay on foot and follow the embankment upstream, into the old warehouse district.',
        effects: { pace: -1.5, depth: -1 },
        next: 'river-afternoon',
        recap: 'You wandered upstream on foot into the old warehouse district.',
      },
      {
        id: 'history',
        label: 'Ask Nadia to tell you about the river while she finishes her tea.',
        effects: { depth: 2, pace: -0.5 },
        next: 'river-afternoon',
        recap: 'You stayed on the landing while Nadia told you the river’s history.',
      },
    ],
  },

  {
    id: 'river-afternoon',
    kind: 'decision',
    when: 'Day two, afternoon',
    place: 'The ferry landing',
    night: 2,
    text: [
      {
        if: 'river.ferry',
        text: 'The boat shoulders out past cranes and sandbanks until the river opens and the sea arrives all at once, enormous and pewter-coloured. The wind is spectacular. Nadia hands you a hat without comment. On the far shore a railway line runs along the dunes towards a scatter of houses.',
      },
      {
        if: 'river.embankment',
        text: 'The warehouses have become workshops, a flea market and a bar that seems to be mostly dog. A man is selling old maps from a trestle table. None of them is as good as yours. You buy a postcard of the river you have just walked along and feel inexplicably pleased.',
      },
      {
        if: 'river.history',
        text: 'Nadia tells you about the floods, the merchants and the winter the river froze so hard that people held a market on it. Her version involves more smuggling than the museum’s. Her tea goes cold. She does not seem to mind.',
      },
      'Back at the landing, Nadia mentions that Teodora lives at the end of the railway line now. “I could take you down the coast on the boat tomorrow. Three hours, if the wind behaves. The train does it in two. Or you could stay put. She would forgive you either way. Eventually.”',
    ],
    choices: [
      {
        id: 'boat',
        label: 'Take the long way tomorrow, on Nadia’s boat.',
        effects: { journey: 2, light: 0.5 },
        sets: ['planVisit', 'metTeodora'],
        next: 'evening',
        recap: 'You chose three hours on Nadia’s boat over the quicker train to reach Teodora.',
      },
      {
        id: 'trainplan',
        label: 'Take the train tomorrow. Two hours is plenty.',
        effects: { range: 1, journey: 0.5 },
        sets: ['planVisit', 'metTeodora'],
        next: 'evening',
        recap: 'You planned to take the train out to see Teodora.',
      },
      {
        id: 'stay',
        label: 'Stay in the city. There is plenty here you have not seen.',
        effects: { range: -1.5, journey: -1 },
        next: 'evening',
        recap: 'You decided to stay in the city rather than travel out to see Teodora.',
      },
    ],
  },

  // ─────────── Evening of day two ───────────

  {
    id: 'evening',
    kind: 'decision',
    when: 'Day two, evening',
    place: 'The city at night',
    night: 2,
    text: [
      { if: 'bookshop.stay', text: 'Vera closes the shop at six by turning the sign round and carrying on working. You leave her to it.' },
      { if: 'bookshop.river', text: 'Nadia ties up the boat and says she is going for a drink, and that you are welcome if you are not tedious. You say you will see how the evening goes.' },
      { if: 'bookshop.train', text: 'The last train delivers you back as the lamps come on. The station clock is wrong, with great confidence.' },
      'The city at night is a different place. The squares have filled up. Somewhere a band is tuning up badly, on purpose.',
      cityMood,
    ],
    choices: [
      {
        id: 'cellar',
        label: 'Follow the music down to a cellar bar and stay until it closes.',
        effects: { evenings: 2, light: -1 },
        next: [{ if: 'planVisit', to: 'visit' }, { to: 'city-day' }],
        recap: 'On your second night you stayed in a cellar bar until it closed.',
      },
      {
        id: 'dinner',
        label: 'Find the restaurant with the shortest menu you cannot read, and order from it.',
        effects: { novelty: 1.5, evenings: 0.5 },
        next: [{ if: 'planVisit', to: 'visit' }, { to: 'city-day' }],
        recap: 'You ordered dinner from a menu you could not read.',
      },
      {
        id: 'quiet',
        label: 'Go back to the hotel for a bath, a book and an early night.',
        effects: { evenings: -2, novelty: -0.5 },
        next: [{ if: 'planVisit', to: 'visit' }, { to: 'city-day' }],
        recap: 'On your second night you went back to the hotel for a bath and an early night.',
      },
    ],
  },

  {
    id: 'evening-town',
    kind: 'decision',
    when: 'Day two, evening',
    place: 'The town at the end of the line',
    night: 2,
    text: [
      'The town in January has the quiet of a place that has done its summer and is now having a lie-down. Your room at the guesthouse has blankets heavy enough to count as furniture. Teodora has gone home, leaving detailed instructions about the fish.',
      'The harbour lights come on one at a time, as if someone is walking along switching them on by hand.',
    ],
    choices: [
      {
        id: 'fish',
        label: 'Eat at the fish place, then find the harbour bar and see who is in.',
        effects: { evenings: 1.5, novelty: 0.5 },
        next: 'town-morning',
        recap: 'In the town you ate at the fish place and ended the night in the harbour bar.',
      },
      {
        id: 'beach',
        label: 'Borrow the guesthouse torch and walk the beach in the dark.',
        effects: { light: 0.5, evenings: -1 },
        next: 'town-morning',
        recap: 'You walked the beach in the dark on your night in the town.',
      },
      {
        id: 'early',
        label: 'Eat bread and cheese in your room and sleep for ten hours.',
        effects: { evenings: -2, novelty: -1 },
        next: 'town-morning',
        recap: 'You had a quiet supper in your room and slept for ten hours.',
      },
    ],
  },

  // ─────────── Day three ───────────

  {
    id: 'visit',
    kind: 'decision',
    when: 'Day three',
    place: 'The town at the end of the line',
    night: 3,
    text: [
      {
        if: 'river-afternoon.boat',
        text: 'Nadia’s boat takes three hours, two of which are spectacular and one of which is mainly spray. She drops you at a harbour of blue and green houses and says she will be back at four.',
      },
      {
        if: { not: 'river-afternoon.boat' },
        text: 'The train takes two hours. The city thins into allotments, then reed beds, then a long grey-green coast. The town at the end of the line is a harbour of blue and green houses.',
      },
      { if: 'bookshop.stay', text: 'Teodora opens the door before you knock. She is about eighty, with ink on her fingers. “Vera telephoned,” she says. “Twice. Come in. Don’t touch anything that’s wet.”' },
      { if: 'bookshop.river', text: 'Teodora opens the door before you knock. She is about eighty, with ink on her fingers. “Nadia telephoned,” she says. “Twice. Come in. Don’t touch anything that’s wet.”' },
      'She has drawn maps for your hotel’s guests for forty years. “People arrive with a list,” she says. “I give them a map with no list on it. Then they show me what they actually like.”',
    ],
    choices: [
      {
        id: 'lighthouse',
        label: 'Let her walk you out along the coast to the lighthouse, in a wind with opinions.',
        effects: { light: 1.5, pace: 0.5 },
        next: 'last-days',
        recap: 'You walked the coast path to the lighthouse with Teodora.',
      },
      {
        id: 'kitchen',
        label: 'Sit at her kitchen table while she shows you forty years of maps.',
        effects: { depth: 1.5, light: -1.5 },
        next: 'last-days',
        recap: 'You spent the day at Teodora’s kitchen table, going through forty years of her maps.',
      },
      {
        id: 'stayover',
        label: 'Stay the night at the harbour guesthouse and take the morning train back.',
        effects: { range: 1.5, evenings: -0.5 },
        next: 'last-days',
        recap: 'You stayed the night in Teodora’s town rather than heading straight back.',
      },
    ],
  },

  {
    id: 'town-morning',
    kind: 'decision',
    when: 'Day three',
    place: 'The town at the end of the line',
    night: 3,
    text: [
      { if: 'evening-town.fish', text: 'Your head is slightly heavier than your blankets. The harbour bar was busier than the town.' },
      { if: 'evening-town.beach', text: 'You slept to the sound of the sea, with the torch still in your coat pocket.' },
      { if: 'evening-town.early', text: 'You slept for ten hours and woke feeling like a different, better-organised person.' },
      'Teodora is at the bakery when it opens at six, buying exactly one bun. She buys you one too, as if it is a test. “Stay as long as you like,” she says. “The city isn’t going anywhere. Neither is your key.”',
    ],
    choices: [
      {
        id: 'anothernight',
        label: 'Stay another night. The town is starting to recognise you.',
        effects: { range: 1.5, pace: -1 },
        next: 'last-days',
        recap: 'You stayed a second night in the town at the end of the line.',
      },
      {
        id: 'firsttrain',
        label: 'Catch the first train back. There is a key to deal with.',
        effects: { range: -1, pace: 1 },
        next: 'last-days',
        recap: 'You caught the first train back to the city to get on with the key.',
      },
      {
        id: 'lighthouse',
        label: 'Let her walk you along the coast to the lighthouse, then take the afternoon train.',
        effects: { light: 1.5, journey: 0.5 },
        next: 'last-days',
        recap: 'You walked the coast path to the lighthouse with Teodora before heading back.',
      },
    ],
  },

  {
    id: 'city-day',
    kind: 'decision',
    when: 'Day three',
    place: 'The city',
    night: 3,
    text: [
      { if: 'vera-afternoon.letter', text: 'You leave your letter with Vera, who reads the envelope and says “Hm” in a way that could mean anything.' },
      { if: 'river-afternoon.stay', text: 'Nadia’s boat goes down the river without you, which feels like a small betrayal on both sides.' },
      { if: 'train.shore', text: 'You wake in the hotel with sand from the town at the end of the line still in your shoes.' },
      { if: { any: ['train.end', 'train.conductor'] }, text: 'You wake in the hotel with yesterday’s train ticket still in your pocket and Teodora’s “wrong direction” still in your head.' },
      'Day three, and the city has started to feel familiar at the edges.',
      cityMood,
    ],
    choices: [
      {
        id: 'lagoons',
        label: 'Take the slow coastal bus two hours east to the salt lagoons everyone keeps mentioning, and come back after dark.',
        effects: { journey: 2, light: 0.5 },
        next: 'last-days',
        recap: 'You spent a whole day travelling out to the salt lagoons and back.',
      },
      {
        id: 'deeper-vera',
        when: 'bookshop.stay',
        label: 'Accept Vera’s invitation to a long lunch with her family, across the river.',
        effects: { range: -1.5, depth: -1, journey: -0.5 },
        next: 'last-days',
        recap: 'You stayed in the city for a long lunch with Vera’s family.',
      },
      {
        id: 'deeper-nadia',
        when: 'bookshop.river',
        label: 'Accept Nadia’s invitation to lunch at her mother’s flat above the chandlery.',
        effects: { range: -1.5, depth: -1, journey: -0.5 },
        next: 'last-days',
        recap: 'You stayed in the city for lunch at Nadia’s mother’s flat.',
      },
      {
        id: 'deeper-bookshop',
        when: 'bookshop.train',
        label: 'Go back to the bookshop you walked out of yesterday, and let Vera take you to lunch.',
        effects: { range: -1.5, depth: -1, journey: -0.5 },
        sets: ['metVera'],
        next: 'last-days',
        recap: 'You went back to the bookshop you had left for the train, and had lunch with Vera after all.',
      },
      {
        id: 'oldtown',
        label: 'Give the day to the old town: the cathedral, the town hall and the guild house, one after another.',
        effects: { depth: 1.5, pace: 1, light: -0.5, journey: -0.5 },
        next: 'last-days',
        recap: 'You gave a whole day to the cathedral, the town hall and the guild house.',
      },
    ],
  },

  // ─────────── Days four and five ───────────

  {
    id: 'last-days',
    kind: 'decision',
    when: 'Days four and five',
    place: 'Back where you started',
    night: 4,
    text: [
      {
        if: { any: ['visit.lighthouse', 'town-morning.lighthouse'] },
        text: 'The lighthouse turns out to be closed for the winter, which Teodora regards as a feature. You stand at the bottom of it in a wind strong enough to lean on, and she points out which way the city is.',
      },
      {
        if: 'visit.kitchen',
        text: 'Teodora’s maps cover the table, then the chairs, then the floor: the city in flood, the city in snow, the city with tram lines that were never built. You miss the four o’clock entirely, and do not mind.',
      },
      { if: 'visit.stayover', text: 'You stay the night at the harbour guesthouse. In the morning the sea is flat and silver, and the train back is full of people who look as if they have been somewhere.' },
      { if: 'town-morning.anothernight', text: 'You stay a second night in the town. By the end of it the woman at the bakery has started saving you a bun.' },
      { if: 'town-morning.firsttrain', text: 'The first train back is nearly empty. You watch the coast give way to reed beds, then allotments, then the city, which seems pleased to see you.' },
      {
        if: 'city-day.lagoons',
        text: 'The bus takes two hours and the lagoons take your breath away, mainly because of the wind. There are thousands of birds, a man selling smoked fish from a van, and light on the water that makes everyone stop talking.',
      },
      { if: 'city-day.deeper-vera', text: 'Lunch with Vera’s family lasts four hours. Nobody asks what you do for a living. Someone’s uncle explains the city’s politics using cutlery.' },
      { if: 'city-day.deeper-nadia', text: 'Nadia’s mother feeds you until you cannot move, then shows you photographs of the river frozen solid, with a market on it.' },
      {
        if: 'city-day.deeper-bookshop',
        text: 'Vera says, “You’re the one who took the train,” and forgives you over lunch at her canteen. Everyone there has had a map from Teodora at some point. Nobody will say what their key opened.',
      },
      {
        if: 'city-day.oldtown',
        text: 'The cathedral, the town hall and the guild house take all day and most of your feet. High on a wall in the guild house is your mark, carved in stone and looking very pleased with itself.',
      },
      {
        if: 'metTeodora',
        text: 'Teodora’s last word on the key was: “It is back where you started. You walked straight past it.” At the hotel you look at the lobby properly for the first time. Behind reception, under some tired lilies, is a plan chest with twenty narrow drawers.',
      },
      {
        if: { not: 'metTeodora' },
        text: 'On day four the receptionist hands you a second envelope in the same hand: “You have walked far enough to deserve a clue. Drawer 14 is behind reception. Open it on your last evening, not before. T.” Behind reception, under some tired lilies, is a plan chest with twenty narrow drawers.',
      },
      { if: 'vera-afternoon.letter', text: 'It seems your letter reached her.' },
      '“The last evening,” says the receptionist, a hand on the chest. “She underlined it twice.” Which leaves two days.',
    ],
    choices: [
      {
        id: 'full',
        label: 'Fill them: every mark on the map you have not reached yet, in order, with lunch booked.',
        effects: { pace: 2, depth: 0.5 },
        next: '@finale',
        recap: 'You filled your last two days with every mark you had not reached, in order.',
      },
      {
        id: 'wander',
        label: 'Leave them empty. Walk until you are lost, then let the river bring you back.',
        effects: { pace: -2 },
        next: '@finale',
        recap: 'You left your last two days unplanned and walked until you were lost.',
      },
      {
        id: 'return',
        label: 'Go back to the place you liked best this week and give it the time it deserves.',
        effects: { novelty: -1.5, pace: -0.5 },
        next: '@finale',
        recap: 'You spent your last days going back to the place you liked best, rather than finding somewhere new.',
      },
    ],
  },

  // ─────────── Endings ───────────

  {
    id: 'ending-teodora',
    kind: 'ending',
    when: 'Night five',
    place: 'Drawer 14',
    night: 5,
    text: [
      'At seven on your last evening the receptionist steps back from the plan chest like a man defusing a bomb he respects.',
      'Teodora is in the lobby’s worst armchair. She came in on the afternoon train, she says, because the pastries here are better and she wanted to see your face.',
      ...drawerOpens,
      '“Go on,” she says. “Draw where you went. It is the only accurate map of this city anyone has ever made.”',
      drawnRoute,
      'It looks like no one else’s. Teodora studies it for a long time, then files it with the others. “Good,” she says. “Now you know what you came for. The rest is just booking.”',
    ],
    choices: reveal,
  },
  {
    id: 'ending-vera',
    kind: 'ending',
    when: 'Night five',
    place: 'Drawer 14',
    night: 5,
    text: [
      'Vera arrives at the hotel at seven o’clock, carrying a cake tin and a postcard. The postcard is from Teodora.',
      { if: 'vera-afternoon.letter', text: 'It says, in full: “Tell them to open it. And tell them their letter had a spelling mistake.”' },
      { if: { not: 'vera-afternoon.letter' }, text: 'It says, in full: “Tell them to open it.”' },
      ...drawerOpens,
      'Vera reads over your shoulder, disagreeing quietly with other people’s routes.',
      drawnRoute,
      'It looks like no one else’s. Vera holds it at arm’s length. “I’ll post it to her,” she says. “You may get it back with corrections.” Then she opens the cake tin.',
    ],
    choices: reveal,
  },
  {
    id: 'ending-nadia',
    kind: 'ending',
    when: 'Night five',
    place: 'Drawer 14',
    night: 5,
    text: [
      'Nadia turns up at the hotel at seven o’clock, smelling of river and diesel, because, she says, somebody has to make sure you do this properly.',
      ...drawerOpens,
      '“Well?” says Nadia. “Draw it, then. She’ll want to see it.”',
      drawnRoute,
      'It looks like no one else’s. Nadia holds it up to the light, as if checking it for leaks. “I’ll take it down the coast next week,” she says. “She’ll complain about your handwriting. That means she likes it.”',
    ],
    choices: reveal,
  },
  ...TIEBREAKS,
];

/** Which ending plays. The first route whose condition holds wins. */
export const ENDING_ROUTES: { if?: string; to: string }[] = [
  { if: 'metTeodora', to: 'ending-teodora' },
  { if: 'metVera', to: 'ending-vera' },
  { if: 'metNadia', to: 'ending-nadia' },
  { to: 'ending-vera' },
];
