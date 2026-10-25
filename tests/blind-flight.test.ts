import { test } from 'node:test';
import assert from 'node:assert/strict';
import assumptions from '../src/data/assumptions.json';
import { destinationById, hasPrice, itineraries, itineraryById } from '../src/lib/catalogue';
import { isEligibleTrip, nightsBetween } from '../src/lib/dates';
import {
  awkwardBits,
  ballotOrder,
  contenderIds,
  episodesFor,
  featuredIds,
  seededShuffle,
  selectedVariant,
  showDestinationIds,
  variantsFor,
  type ShowEpisode,
} from '../src/blind-flight/lib/cast';
import { mixedEpisodes } from '../src/blind-flight/data/episodes';
import { costBreakdown, guessVerdict } from '../src/blind-flight/lib/cost';
import { loadState, sanitise, saveState, STORAGE_KEY } from '../src/blind-flight/lib/persistence';
import {
  cityPointsFor,
  defaultFinalists,
  duelResult,
  duelTarget,
  finalPool,
  finalStage,
  finalVerdict,
  guessOptions,
  leader,
  priceOf,
  scores,
  episodeProgress,
  episodeStage,
  episodeVerdict,
  groupLabels,
  groups,
  identityPublic,
  initialState,
  isUnmasked,
  QUESTIONS,
  reducer,
  resultsReady,
  resumeHref,
  revealOrder,
  secondChanceOptions,
  showEpisodes,
  type Action,
  type GameState,
} from '../src/blind-flight/lib/state';
import { finalistRows, summaryCsv, summaryText, verdictFor } from '../src/blind-flight/lib/summary';
import { profiles } from '../src/blind-flight/data/profiles';

const run = (actions: Action[], from: GameState = initialState) => actions.reduce(reducer, from);

/** Calls time, takes both secret choices and unmasks everyone. */
const play = (e: ShowEpisode, a: string, b: string, from: GameState = initialState) =>
  run(
    [
      { type: 'startChoosing', episodeId: e.id },
      { type: 'pick', episodeId: e.id, destinationId: a },
      { type: 'passPhone', episodeId: e.id },
      { type: 'pick', episodeId: e.id, destinationId: b },
    ],
    from,
  );
const unmaskAll = (e: ShowEpisode, from: GameState) => run(e.cast.map(() => ({ type: 'unmask', episodeId: e.id }) as Action), from);
/** Unmasks everyone and skips the price duel. */
const finish = (e: ShowEpisode, from: GameState) => reducer(unmaskAll(e, from), { type: 'skipDuel', episodeId: e.id });
const playAll = (from: GameState, ...rounds: [ShowEpisode, string, string][]) =>
  rounds.reduce((s, [e, a, b]) => finish(e, play(e, a, b, s)), from);
const playQuick = (from: GameState, e: ShowEpisode, id: string) =>
  finish(e, run([{ type: 'startChoosing', episodeId: e.id }, { type: 'pick', episodeId: e.id, destinationId: id }], from));

class MemoryStorage {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

// ───────────── Data and casting ─────────────

test('1. every show itinerary fits 17/18 → 21/22 January and has 4+ nights', () => {
  for (const id of showDestinationIds) {
    for (const it of variantsFor(id)) {
      assert.ok(isEligibleTrip(it.departDate, it.returnDate), `${it.id} outside window`);
      assert.equal(nightsBetween(it.departDate, it.returnDate), it.nights, `${it.id} nights mismatch`);
      assert.ok(it.nights >= 4);
    }
  }
});

test('the standard show has 12 distinct, priced, illustrated featured contestants with three clues each', () => {
  assert.equal(featuredIds.length, 12);
  assert.equal(new Set(featuredIds).size, 12);
  for (const id of featuredIds) {
    const it = selectedVariant(id);
    assert.ok(it && hasPrice(it), `${id} default trip should be priced`);
    assert.ok(destinationById[id].imagePath, `${id} needs a photo`);
    assert.equal(profiles[id].clues.filter((c) => c.trim()).length, 3, `${id} needs three clues`);
    assert.ok(!profiles[id].clues[0].toLowerCase().includes(destinationById[id].name.toLowerCase()), `${id} clue 1 gives the game away`);
  }
});

/** Words that settle a guess outright: the places, people and landmarks behind the clues. */
const giveaways = [
  'Polish', 'Czech', 'Danish', 'Spanish', 'Lithuanian', 'Estonian', 'Cypriot', 'Canary', 'Silesia', 'Andalusia',
  'Costa del Sol', 'Vistula', 'Vltava', 'Wawel', 'Kazimierz', 'Cloth Hall', 'Charles Bridge', 'Nyhavn', 'Little Mermaid',
  'Chopin', 'Picasso', 'Andersen', 'Teide',
];
const plain = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

test('no one-liner or clue names a show city, a country or a settling landmark', () => {
  const banned = [
    ...showDestinationIds.map((id) => destinationById[id].name),
    ...new Set(showDestinationIds.map((id) => destinationById[id].country.replace(/\s*\(.*\)$/, ''))),
    ...giveaways,
  ].map(plain);
  for (const id of featuredIds) {
    const p = profiles[id];
    for (const line of [p.stageIntro, ...p.clues]) {
      const hit = banned.find((w) => new RegExp(`\\b${w}\\b`).test(plain(line)));
      assert.equal(hit, undefined, `${id}: "${line}" names ${hit}`);
    }
  }
});

test('excluded countries and connections-to-verify rows never appear as contestants', () => {
  for (const id of showDestinationIds) {
    const d = destinationById[id];
    for (const c of assumptions.excludedCountries) assert.ok(!d.country.includes(c));
    for (const it of variantsFor(id)) assert.notEqual(it.fareEvidence, 'needs_manual_review');
  }
  assert.ok(!showDestinationIds.includes('riga'), 'Riga only has a connections-to-verify row');
});

test('2. a total exists only for priced trips with every component; unpriced trips stay null', () => {
  for (const it of itineraries) {
    const cost = costBreakdown(it);
    if (it.fareEvidence !== 'priced_indicative') {
      assert.equal(it.estimatedTotalForTwoGBP, null, `${it.id} must not carry a total`);
      assert.equal(cost, null);
    } else {
      assert.ok(cost, `${it.id} should have a breakdown`);
    }
  }
});

test('3 & 10. breakdown uses the workbook total, does not add extras twice, and adds up to the penny', () => {
  for (const it of itineraries.filter(hasPrice)) {
    const c = costBreakdown(it)!;
    assert.equal(c.totalForTwo, it.estimatedTotalForTwoGBP);
    assert.equal(Math.round((c.flightsForTwo + c.roomForTwo + c.extrasForTwo) * 100) / 100, c.totalForTwo, it.id);
    assert.equal(c.extrasForTwo, c.baggageForTwo + c.transfersForTwo, it.id);
    assert.equal(c.perPerson, Math.round((c.totalForTwo / 2) * 100) / 100);
    assert.equal(c.headline, Math.round(c.totalForTwo));
  }
  const wro = costBreakdown(itineraryById.EU001)!;
  assert.deepEqual([wro.flightsForTwo, wro.roomForTwo, wro.extrasForTwo, wro.totalForTwo, wro.perPerson], [94, 104.18, 100, 298.18, 149.09]);
});

test('5 & 11. links, hotels and photos stay tied to their own destination and are never invented', () => {
  for (const id of showDestinationIds) {
    for (const it of variantsFor(id)) {
      assert.equal(it.destinationId, id);
      if (it.roomSourceUrl) assert.match(it.roomSourceUrl, /^https:\/\//);
    }
    const img = destinationById[id].imagePath;
    if (img) assert.ok(img.includes(id), `${id} photo path should name the destination`);
  }
  // Connections-to-verify rows have no flight link and must keep none.
  assert.equal(itineraryById.CV005.flightSourceUrl, undefined);
  const rows = finalistRows(initialState, ['riga']);
  assert.equal(rows.length, 0, 'not a show destination');
});

test('6. Kaunas is one contestant with two date variants', () => {
  assert.equal(featuredIds.filter((id) => id === 'kaunas').length, 1);
  assert.deepEqual(
    variantsFor('kaunas').map((v) => v.id).sort(),
    ['EU002', 'EU004'],
  );
  assert.equal(ballotOrder(initialState.destinationOrder).filter((id) => id === 'kaunas').length, 1);
});

test('more contenders exist outside the featured twelve and can join as bonus episodes', () => {
  assert.ok(contenderIds.includes('venice'));
  assert.ok(contenderIds.includes('helsinki'));
  assert.ok(contenderIds.includes('rome'));
  for (const id of featuredIds) assert.ok(!contenderIds.includes(id));
  const s = run([{ type: 'addContender', destinationId: 'venice' }, { type: 'addContender', destinationId: 'venice' }]);
  assert.equal(s.destinationOrder.filter((id) => id === 'venice').length, 1);
  const eps = episodesFor(s.destinationOrder);
  assert.equal(eps.length, 5);
  assert.ok(eps[4].bonus);
  assert.deepEqual(eps[4].cast, ['venice']);
  assert.equal(run([{ type: 'addContender', destinationId: 'riga' }]).destinationOrder.length, 12, 'unviable trips cannot join');
});

// ───────────── Trips and prices ─────────────

test('4 & scenario 6. switching Kaunas from 4 to 5 nights changes the trip', () => {
  let s = initialState;
  assert.equal(selectedVariant('kaunas', s.preferredItineraryByDestination.kaunas)!.id, 'EU002');
  s = reducer(s, { type: 'chooseItinerary', destinationId: 'kaunas', itineraryId: 'EU004' });
  const it = selectedVariant('kaunas', s.preferredItineraryByDestination.kaunas)!;
  assert.equal(it.id, 'EU004');
  assert.equal(it.nights, 5);
  assert.equal(it.departDate, '2027-01-17');
  assert.equal(it.estimatedTotalForTwoGBP, 402.87);
  // An itinerary from another destination is refused.
  assert.equal(reducer(s, { type: 'chooseItinerary', destinationId: 'kaunas', itineraryId: 'EU008' }), s);
});

test('scenario 7. unpriced Venice and Helsinki have no total but keep their room quote', () => {
  for (const id of ['venice', 'helsinki']) {
    for (const it of variantsFor(id)) {
      assert.equal(it.fareEvidence, 'scheduled_unpriced');
      assert.equal(costBreakdown(it), null);
      assert.ok(it.roomForTwoGBP && it.roomForTwoGBP > 0);
    }
  }
  const rows = finalistRows(initialState, ['venice']);
  assert.equal(rows[0].totalForTwo, null);
  assert.match(summaryText(rows), /Price pending/);
});

test('guess badges', () => {
  assert.equal(guessVerdict(300, 298.18).badge, 'Unnecessarily Accurate');
  assert.equal(guessVerdict(900, 298.18).badge, 'Big Spender');
  assert.equal(guessVerdict(100, 298.18).badge, 'Eternal Optimist');
});

// ───────────── Episodes ─────────────

const featuredEpisodes = episodesFor(featuredIds);

const ep = featuredEpisodes[0];
const [one, two, three] = ep.cast;

test('the host asks up to three questions, and none once the choosing starts', () => {
  let s = run([1, 2, 3, 4].map(() => ({ type: 'nextQuestion', episodeId: ep.id }) as Action));
  assert.equal(episodeProgress(s, ep.id).questionsShown, QUESTIONS);
  s = run([{ type: 'startChoosing', episodeId: ep.id }]);
  assert.equal(reducer(s, { type: 'nextQuestion', episodeId: ep.id }), s);
  assert.equal(reducer(initialState, { type: 'nextQuestion', episodeId: 'atlantis' }), initialState);
});

test('7. two-person choosing is secret: Traveller 1, handover, Traveller 2, then the reveal', () => {
  let s = initialState;
  assert.equal(episodeStage(s, ep.id), 'watching');
  assert.equal(reducer(s, { type: 'pick', episodeId: ep.id, destinationId: one }), s, 'no picking before the host calls time');
  s = reducer(s, { type: 'startChoosing', episodeId: ep.id });
  assert.equal(episodeStage(s, ep.id), 'choosing');
  assert.equal(reducer(s, { type: 'pick', episodeId: ep.id, destinationId: 'prague' }), s, 'only this episode’s cast');
  s = reducer(s, { type: 'pick', episodeId: ep.id, destinationId: two });
  assert.equal(episodeStage(s, ep.id), 'handover');
  assert.equal(reducer(s, { type: 'pick', episodeId: ep.id, destinationId: one }), s, 'Traveller 1 has already chosen');
  assert.equal(episodeVerdict(s, ep), undefined, 'nothing is decided with one choice in');
  assert.equal(identityPublic(s, two), false);
  s = reducer(s, { type: 'passPhone', episodeId: ep.id });
  assert.equal(s.activePlayer, 'traveller2');
  assert.equal(episodeStage(s, ep.id), 'choosing');
  s = reducer(s, { type: 'pick', episodeId: ep.id, destinationId: two });
  assert.equal(episodeStage(s, ep.id), 'reveal');
  assert.equal(s.activePlayer, 'traveller1', 'the next episode starts with Traveller 1');
  assert.equal(identityPublic(s, two), false, 'still masked until the reveal reaches them');
});

test('Traveller 1 can change their mind before passing the phone, but not after', () => {
  let s = run([
    { type: 'startChoosing', episodeId: ep.id },
    { type: 'pick', episodeId: ep.id, destinationId: one },
    { type: 'unpick', episodeId: ep.id },
  ]);
  assert.equal(episodeStage(s, ep.id), 'choosing');
  s = run([{ type: 'pick', episodeId: ep.id, destinationId: three }, { type: 'passPhone', episodeId: ep.id }], s);
  assert.equal(reducer(s, { type: 'unpick', episodeId: ep.id }), s);
});

test('Traveller 2 can never choose first', () => {
  const s = { ...run([{ type: 'startChoosing', episodeId: ep.id }]), activePlayer: 'traveller2' as const };
  assert.equal(reducer(s, { type: 'pick', episodeId: ep.id, destinationId: one }), s);
});

test('the reveal unmasks the turned-down first and a mutual choice last', () => {
  let s = play(ep, two, two);
  assert.deepEqual(revealOrder(s, ep).at(-1), two);
  s = reducer(s, { type: 'unmask', episodeId: ep.id });
  assert.notEqual(episodeProgress(s, ep.id).unmasked[0], two);
  s = run([{ type: 'unmask', episodeId: ep.id }, { type: 'unmask', episodeId: ep.id }], s);
  assert.equal(episodeProgress(s, ep.id).unmasked.at(-1), two);
  assert.equal(episodeStage(s, ep.id), 'duel');
  assert.equal(reducer(s, { type: 'unmask', episodeId: ep.id }), s);
  s = reducer(s, { type: 'skipDuel', episodeId: ep.id });
  assert.equal(episodeStage(s, ep.id), 'done');
  assert.deepEqual(episodeVerdict(s, ep), { kind: 'match', id: two });

  const split = play(ep, one, three);
  assert.equal(revealOrder(split, ep)[0], two, 'nobody chose number two, so they go first');
  assert.deepEqual(episodeVerdict(split, ep), { kind: 'split', ids: { traveller1: one, traveller2: three } });
});

test('scenarios 1–4 & 8. matches, split decisions and the default final', () => {
  const [e1, e2, e3, e4] = featuredEpisodes;
  let s = playAll(initialState, [e1, e1.cast[0], e1.cast[0]], [e2, e2.cast[0], e2.cast[1]], [e3, e3.cast[2], e3.cast[2]]);
  assert.equal(resultsReady(s), false, 'not until every episode is decided');
  assert.deepEqual(defaultFinalists(s), []);
  assert.equal(verdictFor(s, e1.cast[0]), '');
  s = playAll(s, [e4, e4.cast[1], e4.cast[2]]);
  assert.equal(resultsReady(s), true);
  const g = groups(s);
  assert.equal(g.kind, 'two_person');
  if (g.kind !== 'two_person') return;
  assert.deepEqual(g.match, [e1.cast[0], e3.cast[2]]);
  assert.deepEqual(g.split, [e2.cast[0], e2.cast[1], e4.cast[1], e4.cast[2]]);
  assert.equal(g.unpicked.length, 12 - 6);
  assert.deepEqual(defaultFinalists(s), [e1.cast[0], e3.cast[2], e2.cast[0], e2.cast[1]], 'matches first, up to four');
  assert.equal(verdictFor(s, e1.cast[0]), groupLabels.match);
  assert.equal(verdictFor(s, e2.cast[1]), groupLabels.split);
  assert.equal(verdictFor(s, e2.cast[2]), groupLabels.unpicked);
  assert.equal(resumeHref(s), '/blind-flight/results');
});

test('9. quick play has one shared choice per episode and never produces a match', () => {
  let s = run([{ type: 'setMode', mode: 'quick' }, { type: 'startChoosing', episodeId: ep.id }, { type: 'pick', episodeId: ep.id, destinationId: one }]);
  assert.equal(episodeStage(s, ep.id), 'reveal');
  assert.equal(reducer(s, { type: 'passPhone', episodeId: ep.id }), s);
  s = finish(ep, s);
  assert.deepEqual(episodeVerdict(s, ep), { kind: 'chosen', id: one });
  for (const e of featuredEpisodes.slice(1)) s = playQuick(s, e, e.cast[0]);
  const g = groups(s);
  assert.equal(g.kind, 'quick');
  assert.ok(!('match' in g));
  assert.equal(verdictFor(s, one), groupLabels.chosen);
});

test('12. choose again clears the choices but keeps the contestants unmasked', () => {
  let s = playAll(initialState, [ep, one, two]);
  s = reducer(s, { type: 'pickAgain', episodeId: ep.id });
  assert.equal(episodeStage(s, ep.id), 'choosing');
  assert.equal(episodeProgress(s, ep.id).unmasked.length, 3);
  s = run([{ type: 'pick', episodeId: ep.id, destinationId: two }, { type: 'passPhone', episodeId: ep.id }, { type: 'pick', episodeId: ep.id, destinationId: two }], s);
  assert.equal(episodeStage(s, ep.id), 'done', 'no second reveal needed');
  assert.deepEqual(episodeVerdict(s, ep), { kind: 'match', id: two });
});

test('bonus contestants arrive unmasked, and adding one reopens the show', () => {
  let s = initialState;
  for (const e of featuredEpisodes) s = playAll(s, [e, e.cast[0], e.cast[0]]);
  assert.equal(resultsReady(s), true);
  s = reducer(s, { type: 'addContender', destinationId: 'venice' });
  assert.equal(resultsReady(s), false);
  const bonus = showEpisodes(s).at(-1)!;
  assert.equal(bonus.id, 'bonus-1');
  assert.equal(isUnmasked(s, bonus.id, 'venice'), true);
  assert.equal(resumeHref(s), '/blind-flight/episode/bonus-1');
  s = run([{ type: 'startChoosing', episodeId: bonus.id }, { type: 'pick', episodeId: bonus.id, destinationId: 'venice' }], s);
  s = run([{ type: 'passPhone', episodeId: bonus.id }, { type: 'pick', episodeId: bonus.id, destinationId: 'venice' }], s);
  assert.equal(episodeStage(s, bonus.id), 'done', 'nothing to unmask');
  assert.equal(resultsReady(s), true);
  s = reducer(s, { type: 'removeContender', destinationId: 'venice' });
  assert.equal(s.episodes['bonus-1'], undefined);
  assert.equal(resultsReady(s), true);
});

test('changing mode clears the choices; reset keeps sound and motion preferences', () => {
  const s = run([{ type: 'setSound', on: true }, { type: 'nextQuestion', episodeId: ep.id }, { type: 'setMode', mode: 'quick' }]);
  assert.deepEqual(s.episodes, {});
  const r = reducer(s, { type: 'reset' });
  assert.equal(r.soundEnabled, true);
  assert.equal(r.mode, 'two_person');
  assert.equal(initialState.soundEnabled, false, 'sound is off by default');
});

test('winner is a manual choice and can be changed', () => {
  let s = run([{ type: 'setWinner', destinationId: 'prague' }]);
  assert.equal(s.winnerDestinationId, 'prague');
  s = reducer(s, { type: 'setWinner', destinationId: 'kaunas' });
  assert.equal(s.winnerDestinationId, 'kaunas');
  s = reducer(s, { type: 'setWinner' });
  assert.equal(s.winnerDestinationId, undefined);
});

// ───────────── Shuffled line-ups ─────────────

test('a new show shuffles who shares a stage, the running order and the seats', () => {
  const s = run([{ type: 'start', seed: 12345 }]);
  assert.equal(s.seed, 12345);
  const eps = showEpisodes(s);
  assert.equal(eps.length, 4);
  assert.deepEqual(eps.map((e) => e.id), ['round-1', 'round-2', 'round-3', 'round-4']);
  assert.ok(eps.every((e) => e.cast.length === 3 && mixedEpisodes.some((m) => m.title === e.title)));
  assert.deepEqual([...eps.flatMap((e) => e.cast)].sort(), [...featuredIds].sort(), 'everyone appears exactly once');
  assert.deepEqual(showEpisodes(s), eps, 'the same seed gives the same show, so a reload keeps it');
  // Different seeds give different line-ups.
  const lineups = new Set([1, 2, 3, 4, 5].map((seed) => JSON.stringify(episodesFor(featuredIds, seed).map((e) => e.cast))));
  assert.ok(lineups.size > 1);
  assert.deepEqual(seededShuffle([1, 2, 3], 7), seededShuffle([1, 2, 3], 7));
});

test('a new shuffled show keeps countries and themes apart on every stage', () => {
  const themes = new Map(episodesFor(featuredIds).flatMap((e) => e.cast.map((id) => [id, e.id] as const)));
  const country = (id: string) => destinationById[id].country.replace(/\s*\(.*\)$/, '');
  const lineups = new Set<string>();
  for (let seed = 0; seed < 200; seed++) {
    const s = run([{ type: 'start', seed }]);
    assert.equal(s.balancedDeal, true);
    const eps = showEpisodes(s);
    assert.deepEqual([...eps.flatMap((e) => e.cast)].sort(), [...featuredIds].sort(), `seed ${seed}: everyone appears once`);
    for (const e of eps) {
      assert.equal(new Set(e.cast.map(country)).size, e.cast.length, `seed ${seed}: ${e.cast} share a country`);
      assert.equal(new Set(e.cast.map((id) => themes.get(id))).size, e.cast.length, `seed ${seed}: ${e.cast} share a theme`);
    }
    lineups.add(JSON.stringify(eps.map((e) => e.cast)));
  }
  assert.ok(lineups.size > 100, 'the deal still varies from show to show');
});

test('a shuffled show saved before balanced deals keeps its line-up; reshuffling balances it', () => {
  const s = run([{ type: 'start', seed: 12345 }]);
  const { balancedDeal: _, ...old } = s;
  const loaded = sanitise(JSON.parse(JSON.stringify(old)))!;
  assert.equal(loaded.balancedDeal, false);
  assert.deepEqual(
    showEpisodes(loaded).map((e) => e.cast),
    episodesFor(featuredIds, 12345).map((e) => e.cast),
    'the old deal is untouched',
  );
  assert.equal(reducer(loaded, { type: 'reshuffle', seed: 7 }).balancedDeal, true);
  assert.equal(sanitise(JSON.parse(JSON.stringify(s)))!.balancedDeal, true, 'a balanced show reloads balanced');
});

test('the line-up only changes before anything has happened', () => {
  let s = run([{ type: 'start', seed: 1 }]);
  assert.equal(reducer(s, { type: 'start', seed: 2 }).seed, 1, 'Continue keeps the show you started');
  s = reducer(s, { type: 'reshuffle', seed: 3 });
  assert.equal(s.seed, 3);
  s = reducer(s, { type: 'nextQuestion', episodeId: showEpisodes(s)[0].id });
  assert.equal(reducer(s, { type: 'reshuffle', seed: 4 }), s);
  assert.equal(reducer(s, { type: 'reset' }).seed, null);
  // A show already under way from before shuffling existed stays themed.
  const old = run([{ type: 'nextQuestion', episodeId: ep.id }]);
  assert.equal(reducer(old, { type: 'start', seed: 9 }).seed, null);
});

test('a shuffled show saves and reloads, and plays through to the results', () => {
  const store = new MemoryStorage();
  let s = run([{ type: 'start', seed: 99 }]);
  for (const e of showEpisodes(s)) s = playAll(s, [e, e.cast[1], e.cast[1]]);
  assert.equal(resultsReady(s), true);
  saveState(store, s);
  const loaded = loadState(store)!;
  assert.equal(loaded.seed, 99);
  assert.equal(resultsReady(loaded), true);
  assert.equal(sanitise({ ...JSON.parse(JSON.stringify(s)), seed: 'banana' })!.seed, null);
});

// ───────────── Scoring ─────────────

test('city guesses: four options including the truth, and fewer questions score more', () => {
  const opts = guessOptions(ep, two);
  assert.equal(opts.length, 4);
  assert.ok(opts.includes(two));
  assert.ok(opts.every((id) => id === two || !ep.cast.includes(id)), 'decoys never come from the same episode');
  assert.deepEqual(guessOptions(ep, two), opts, 'stable across renders');
  assert.deepEqual([0, 1, 2, 3].map(cityPointsFor), [4, 3, 2, 1]);

  const wrong = opts.find((id) => id !== two)!;
  let s = run([
    { type: 'nextQuestion', episodeId: ep.id },
    { type: 'startChoosing', episodeId: ep.id },
    { type: 'pick', episodeId: ep.id, destinationId: two, guessId: two },
    { type: 'passPhone', episodeId: ep.id },
    { type: 'pick', episodeId: ep.id, destinationId: two, guessId: wrong },
  ]);
  assert.deepEqual(episodeProgress(s, ep.id).cityPoints, { traveller1: 3, traveller2: 0 });
  assert.equal(scores(s).traveller1.city, 3);
  // A guess that isn't on the card is ignored.
  s = run([{ type: 'startChoosing', episodeId: ep.id }, { type: 'pick', episodeId: ep.id, destinationId: one, guessId: 'atlantis' }]);
  assert.equal(episodeProgress(s, ep.id).cityGuesses.traveller1, undefined);
});

test('changing your mind before the handover forfeits the banked guess; choosing again keeps it', () => {
  let s = run([
    { type: 'startChoosing', episodeId: ep.id },
    { type: 'pick', episodeId: ep.id, destinationId: two, guessId: two },
    { type: 'unpick', episodeId: ep.id },
  ]);
  assert.deepEqual(episodeProgress(s, ep.id).cityPoints, {});
  s = finish(ep, run([{ type: 'pick', episodeId: ep.id, destinationId: two, guessId: two }, { type: 'passPhone', episodeId: ep.id }, { type: 'pick', episodeId: ep.id, destinationId: one }], s));
  const before = scores(s).traveller1.city;
  assert.equal(before, 4);
  s = reducer(s, { type: 'pickAgain', episodeId: ep.id });
  assert.equal(scores(s).traveller1.city, before);
});

test('the price duel is over your date, hides nothing it shouldn’t, and closest without going over wins', () => {
  let s = unmaskAll(ep, play(ep, two, two));
  assert.equal(episodeStage(s, ep.id), 'duel');
  assert.equal(duelTarget(s, ep), two);
  const actual = priceOf(s, two)!;
  assert.equal(reducer(s, { type: 'priceGuess', episodeId: ep.id, player: 'traveller2', value: 100 }), s, 'Traveller 1 guesses first');
  assert.equal(reducer(s, { type: 'priceGuess', episodeId: ep.id, player: 'traveller1', value: -5 }), s);
  s = reducer(s, { type: 'priceGuess', episodeId: ep.id, player: 'traveller1', value: actual - 10 });
  assert.equal(episodeStage(s, ep.id), 'duel');
  s = reducer(s, { type: 'priceGuess', episodeId: ep.id, player: 'traveller2', value: actual + 1 });
  assert.equal(episodeStage(s, ep.id), 'done');
  assert.deepEqual(duelResult(s, ep)!.points, { traveller1: 3, traveller2: 0 }, 'within 5% earns the bonus; over earns nothing');
  assert.equal(leader(s), 'traveller1');

  const both = run(
    [
      { type: 'priceGuess', episodeId: ep.id, player: 'traveller1', value: actual * 2 },
      { type: 'priceGuess', episodeId: ep.id, player: 'traveller2', value: actual * 3 },
    ],
    unmaskAll(ep, play(ep, two, two)),
  );
  assert.deepEqual(duelResult(both, ep)!.points, { traveller1: 0, traveller2: 0 });

  const tie = run(
    [
      { type: 'priceGuess', episodeId: ep.id, player: 'traveller1', value: Math.floor(actual / 2) },
      { type: 'priceGuess', episodeId: ep.id, player: 'traveller2', value: Math.floor(actual / 2) },
    ],
    unmaskAll(ep, play(ep, two, two)),
  );
  assert.deepEqual(duelResult(tie, ep)!.points, { traveller1: 2, traveller2: 2 });
  assert.equal(leader(tie), undefined);
});

test('the duel target is fixed once guessing starts, and points never change a match', () => {
  let s = unmaskAll(ep, play(ep, one, three));
  const target = duelTarget(s, ep)!;
  s = run(
    [
      { type: 'priceGuess', episodeId: ep.id, player: 'traveller1', value: 300 },
      { type: 'priceGuess', episodeId: ep.id, player: 'traveller2', value: 400 },
    ],
    s,
  );
  const scored = s;
  s = run([{ type: 'pickAgain', episodeId: ep.id }, { type: 'pick', episodeId: ep.id, destinationId: two }, { type: 'passPhone', episodeId: ep.id }, { type: 'pick', episodeId: ep.id, destinationId: two }], s);
  assert.equal(duelTarget(s, ep), target);
  assert.deepEqual(scores(s), scores(scored));
  assert.deepEqual(episodeVerdict(s, ep), { kind: 'match', id: two });
});

test('quick play duels score the badge points', () => {
  let s = run([{ type: 'setMode', mode: 'quick' }, { type: 'startChoosing', episodeId: ep.id }, { type: 'pick', episodeId: ep.id, destinationId: one }]);
  s = unmaskAll(ep, s);
  s = reducer(s, { type: 'priceGuess', episodeId: ep.id, player: 'traveller1', value: priceOf(s, duelTarget(s, ep)!)! });
  assert.equal(episodeStage(s, ep.id), 'done');
  assert.equal(scores(s).traveller1.price, 3);
  assert.equal(reducer(s, { type: 'priceGuess', episodeId: ep.id, player: 'traveller2', value: 5 }), s);
});

// ───────────── Grand final ─────────────

const decideShow = (from: GameState = initialState) => {
  const [e1, e2, e3, e4] = featuredEpisodes;
  return playAll(from, [e1, e1.cast[0], e1.cast[0]], [e2, e2.cast[0], e2.cast[1]], [e3, e3.cast[2], e3.cast[2]], [e4, e4.cast[1], e4.cast[1]]);
};

test('the final opens only once the show is decided, with a second chance each', () => {
  assert.equal(finalStage(initialState), 'locked');
  let s = decideShow();
  assert.equal(finalStage(s), 'secondChance');
  const [e1, e2, e3, e4] = featuredEpisodes;
  assert.deepEqual(finalPool(s), [e1.cast[0], e3.cast[2], e4.cast[1], e2.cast[0], e2.cast[1]]);
  const rescue = secondChanceOptions(s)[0];
  assert.equal(reducer(s, { type: 'secondChance', player: 'traveller1', destinationId: e1.cast[0] }), s, 'only someone nobody chose');
  s = reducer(s, { type: 'startFinal' });
  assert.equal(finalStage(s), 'secondChance', 'not until everyone has decided');
  s = run(
    [
      { type: 'secondChance', player: 'traveller1', destinationId: rescue },
      { type: 'secondChance', player: 'traveller2', destinationId: null },
      { type: 'startFinal' },
    ],
    s,
  );
  assert.equal(finalStage(s), 'choosing');
  assert.ok(finalPool(s).includes(rescue));
  assert.equal(finalPool(s).length, 6);
});

test('agreeing in the final crowns the winner; a split waits, and the leader can settle it', () => {
  const ready = run(
    [
      { type: 'secondChance', player: 'traveller1', destinationId: null },
      { type: 'secondChance', player: 'traveller2', destinationId: null },
      { type: 'startFinal' },
    ],
    decideShow(),
  );
  const [a, b] = finalPool(ready);
  let s = reducer(ready, { type: 'finalPick', destinationId: a });
  assert.equal(finalStage(s), 'handover');
  s = run([{ type: 'finalPassPhone' }, { type: 'finalPick', destinationId: a }], s);
  assert.equal(finalStage(s), 'decided');
  assert.deepEqual(finalVerdict(s), { kind: 'match', id: a });
  assert.equal(s.winnerDestinationId, a);

  s = run([{ type: 'finalPick', destinationId: a }, { type: 'finalPassPhone' }, { type: 'finalPick', destinationId: b }], ready);
  assert.equal(finalVerdict(s)!.kind, 'split');
  assert.equal(s.winnerDestinationId, undefined, 'a split final names no winner by itself');
  assert.equal(reducer(s, { type: 'finalPick', destinationId: b }), s);
  s = reducer(s, { type: 'finalAgain' });
  assert.equal(finalStage(s), 'secondChance');
});

test('choosing again in an episode reopens the final', () => {
  let s = run(
    [
      { type: 'secondChance', player: 'traveller1', destinationId: null },
      { type: 'secondChance', player: 'traveller2', destinationId: null },
      { type: 'startFinal' },
    ],
    decideShow(),
  );
  s = reducer(s, { type: 'pickAgain', episodeId: ep.id });
  assert.equal(finalStage(s), 'locked');
  assert.deepEqual(s.final.secondChance, {});
});

// ───────────── Persistence ─────────────

test('scenario 5. reload mid-show resumes at the right episode', () => {
  const store = new MemoryStorage();
  const s = run([{ type: 'start' }, { type: 'nextQuestion', episodeId: featuredEpisodes[1].id }], playAll(initialState, [ep, one, two]));
  saveState(store, s);
  const loaded = loadState(store)!;
  assert.deepEqual(JSON.parse(JSON.stringify(loaded)), JSON.parse(JSON.stringify(s)));
  assert.equal(resumeHref(loaded), `/blind-flight/episode/${featuredEpisodes[1].id}`);
});

test('scenario 5b. reload during Traveller 2’s turn keeps the phone with Traveller 2', () => {
  const store = new MemoryStorage();
  const s = run([
    { type: 'startChoosing', episodeId: ep.id },
    { type: 'pick', episodeId: ep.id, destinationId: one },
    { type: 'passPhone', episodeId: ep.id },
  ]);
  saveState(store, s);
  const loaded = loadState(store)!;
  assert.equal(loaded.activePlayer, 'traveller2');
  assert.equal(episodeStage(loaded, ep.id), 'choosing');
});

test('corrupt, old-schema or tampered saves are refused or cleaned', () => {
  const store = new MemoryStorage();
  store.setItem(STORAGE_KEY, '{not json');
  assert.equal(loadState(store), null);
  store.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 2 }));
  assert.equal(loadState(store), null);
  assert.equal(loadState(undefined), null);

  const cleaned = sanitise({
    schemaVersion: 3,
    mode: 'two_person',
    activePlayer: 'traveller2',
    destinationOrder: ['wroclaw', 'atlantis', 'riga', 'venice'],
    episodes: {
      [ep.id]: { questionsShown: 99, choosing: true, picks: { traveller1: 'atlantis', traveller2: one }, unmasked: [one, 'atlantis'] },
      nonsense: 'yes',
    },
    preferredItineraryByDestination: { kaunas: 'EU008', prague: 'EU008' },
    finalists: ['atlantis', 'prague'],
  })!;
  const p = cleaned.episodes[ep.id];
  assert.equal(p.questionsShown, QUESTIONS);
  assert.deepEqual(p.picks, { traveller2: one });
  assert.deepEqual(p.unmasked, [one]);
  assert.equal(cleaned.episodes.nonsense, undefined);
  assert.equal(cleaned.activePlayer, 'traveller1', 'Traveller 2 cannot hold the phone before Traveller 1 has chosen');
  assert.ok(cleaned.destinationOrder.includes('venice'));
  assert.ok(!cleaned.destinationOrder.includes('atlantis'));
  assert.ok(!cleaned.destinationOrder.includes('riga'));
  assert.equal(cleaned.destinationOrder.length, 13);
  assert.deepEqual(cleaned.preferredItineraryByDestination, { prague: 'EU008' });
  assert.deepEqual(cleaned.finalists, ['prague']);
  assert.equal(cleaned.soundEnabled, false);
});

// ───────────── Summary ─────────────

test('summary and CSV carry no nicknames and quote the source date', () => {
  const s = run([{ type: 'setNickname', player: 'traveller1', name: 'Secret Name' }, { type: 'setWinner', destinationId: 'prague' }]);
  const rows = finalistRows(s, ['prague', 'kaunas']);
  const text = summaryText(rows);
  const csv = summaryCsv(rows);
  assert.ok(!text.includes('Secret Name'));
  assert.ok(!csv.includes('Secret Name'));
  assert.match(text, /2026-10-23/);
  assert.match(text, /WINNER: Prague/);
  assert.match(csv, /Prague,Czech Republic,,yes,EU008/);
  assert.equal(csv.split('\n').length, 3);
});

test('the awkward bit always includes the workbook route caution for the chosen trip', () => {
  const bits = awkwardBits('vilnius', selectedVariant('vilnius'));
  assert.ok(bits.some((b) => b.includes('Kaunas')));
  assert.ok(bits.includes(itineraryById.EU007.routeCaution!));
  assert.ok(awkwardBits('berlin', selectedVariant('berlin')).some((b) => b.startsWith('Repeat trip')));
});
