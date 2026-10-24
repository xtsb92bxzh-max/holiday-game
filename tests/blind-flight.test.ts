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
  selectedVariant,
  showDestinationIds,
  variantsFor,
} from '../src/blind-flight/lib/cast';
import { costBreakdown, guessVerdict } from '../src/blind-flight/lib/cost';
import { loadState, sanitise, saveState, STORAGE_KEY } from '../src/blind-flight/lib/persistence';
import {
  canSeeOtherVotes,
  defaultFinalists,
  groups,
  initialState,
  nextUnvoted,
  phase,
  reducer,
  resultsReady,
  resumeHref,
  type Action,
  type GameState,
  type Vote,
} from '../src/blind-flight/lib/state';
import { finalistRows, summaryCsv, summaryText } from '../src/blind-flight/lib/summary';
import { matchCategory } from '../src/blind-flight/lib/voteMatching';
import { profiles } from '../src/blind-flight/data/profiles';

const run = (actions: Action[], from: GameState = initialState) => actions.reduce(reducer, from);
const voteAll = (v: Vote | ((id: string, i: number) => Vote)): Action[] =>
  featuredIds.map((id, i) => ({ type: 'vote', destinationId: id, vote: typeof v === 'function' ? v(id, i) : v }));

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

// ───────────── Price rounds ─────────────

test('4 & scenario 6. switching Kaunas from 4 to 5 nights changes the trip and resets the guess', () => {
  let s = run([
    { type: 'revealIdentity', destinationId: 'kaunas' },
    { type: 'guess', itineraryId: 'EU002', value: 350 },
    { type: 'revealPrice', itineraryId: 'EU002' },
  ]);
  assert.equal(selectedVariant('kaunas', s.preferredItineraryByDestination.kaunas)!.id, 'EU002');
  s = reducer(s, { type: 'chooseItinerary', destinationId: 'kaunas', itineraryId: 'EU004' });
  const it = selectedVariant('kaunas', s.preferredItineraryByDestination.kaunas)!;
  assert.equal(it.id, 'EU004');
  assert.equal(it.nights, 5);
  assert.equal(it.departDate, '2027-01-17');
  assert.equal(it.estimatedTotalForTwoGBP, 402.87);
  assert.equal(s.players.traveller1.guessedPricesGBP.EU002, undefined);
  assert.equal(s.players.traveller1.priceRevealed.EU002, undefined);
  assert.equal(s.players.traveller1.identityRevealed.kaunas, true, 'the city stays revealed');
  // Switching back does not resurrect the old guess either.
  s = reducer(s, { type: 'chooseItinerary', destinationId: 'kaunas', itineraryId: 'EU002' });
  assert.equal(s.players.traveller1.priceRevealed.EU002, undefined);
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

test('guess badges are entertainment only', () => {
  assert.equal(guessVerdict(300, 298.18).badge, 'Unnecessarily Accurate');
  assert.equal(guessVerdict(900, 298.18).badge, 'Big Spender');
  assert.equal(guessVerdict(100, 298.18).badge, 'Eternal Optimist');
  const a = run([...voteAll('keep'), { type: 'completeBallot' }, { type: 'startSecondBallot' }, ...voteAll('keep'), { type: 'completeBallot' }]);
  const b = run([{ type: 'guess', itineraryId: 'EU001', value: 298 }, { type: 'revealPrice', itineraryId: 'EU001' }], a);
  assert.deepEqual(groups(a), groups(b), '9. price guesses cannot affect matching');
});

// ───────────── Voting and matching ─────────────

test('8. matching rules, including unknown votes', () => {
  assert.equal(matchCategory('keep', 'keep'), 'match');
  assert.equal(matchCategory('keep', 'maybe'), 'potential');
  assert.equal(matchCategory('maybe', 'keep'), 'potential');
  assert.equal(matchCategory('maybe', 'maybe'), 'potential');
  assert.equal(matchCategory('keep', 'pass'), 'questions');
  assert.equal(matchCategory('pass', 'maybe'), 'questions');
  assert.equal(matchCategory('pass', 'pass'), 'mutual_rejection');
  assert.equal(matchCategory('keep', undefined), 'incomplete');
  assert.equal(matchCategory(undefined, 'pass'), 'incomplete', 'unknown is not a pass');
});

function twoBallots(t1: (id: string, i: number) => Vote, t2: (id: string, i: number) => Vote) {
  return run([
    { type: 'start' },
    ...voteAll(t1),
    { type: 'completeBallot' },
    { type: 'startSecondBallot' },
    ...voteAll(t2),
    { type: 'completeBallot' },
  ]);
}

test('scenarios 1–4. keep/keep, keep/maybe, keep/pass and pass/pass land in the right groups', () => {
  const t1: Vote[] = ['keep', 'keep', 'keep', 'pass'];
  const t2: Vote[] = ['keep', 'maybe', 'pass', 'pass'];
  const s = twoBallots(
    (_, i) => t1[i % 4],
    (_, i) => t2[i % 4],
  );
  const g = groups(s);
  assert.equal(g.kind, 'two_person');
  if (g.kind !== 'two_person') return;
  assert.ok(g.match.includes(featuredIds[0]));
  assert.ok(g.potential.includes(featuredIds[1]));
  assert.ok(g.questions.includes(featuredIds[2]));
  assert.ok(!g.match.includes(featuredIds[2]), 'keep + pass is not a match');
  assert.ok(g.mutual_rejection.includes(featuredIds[3]));
  assert.deepEqual(defaultFinalists(s).slice(0, 2), [featuredIds[0], featuredIds[4]]);
  // Mutual passes are recoverable through Reconsider.
  const r = reducer(s, { type: 'toggleFinalist', destinationId: featuredIds[3] });
  assert.ok(r.finalists.includes(featuredIds[3]));
});

test('scenario 8. no keep/keep leaves no matches but keeps the maybes for discussion', () => {
  const s = twoBallots(
    () => 'keep',
    () => 'maybe',
  );
  const g = groups(s);
  if (g.kind !== 'two_person') return assert.fail();
  assert.equal(g.match.length, 0);
  assert.equal(g.potential.length, 12);
  assert.equal(defaultFinalists(s).length, 4);
});

test('all passes gives an empty default final without crashing', () => {
  const s = twoBallots(
    () => 'pass',
    () => 'pass',
  );
  assert.deepEqual(defaultFinalists(s), []);
  assert.equal(finalistRows(s, []).length, 0);
  assert.match(summaryText([]), /no finalists/);
});

test('9. quick play has one ballot and can never produce a two-person match', () => {
  let s = run([{ type: 'setMode', mode: 'quick' }, { type: 'start' }, ...voteAll('keep'), { type: 'completeBallot' }]);
  assert.equal(resultsReady(s), true);
  assert.equal(phase(s), 'results');
  const g = groups(s);
  assert.equal(g.kind, 'quick');
  assert.ok(!('match' in g));
  assert.equal(reducer(s, { type: 'startSecondBallot' }), s);
  s = reducer(s, { type: 'editBallot', player: 'traveller2' });
  assert.equal(s.activePlayer, 'traveller1');
  assert.equal(canSeeOtherVotes({ ...s, showOtherVotes: true }), false);
});

test('7. Traveller 2 cannot see Traveller 1’s votes until both ballots are in', () => {
  let s = run([...voteAll('keep'), { type: 'completeBallot' }]);
  assert.equal(phase(s), 'handover');
  s = reducer(s, { type: 'startSecondBallot' });
  assert.equal(s.activePlayer, 'traveller2');
  assert.equal(phase(s), 'ballot2');
  assert.equal(canSeeOtherVotes({ ...s, showOtherVotes: true }), false, 'even if the switch is on');
  assert.equal(resultsReady(s), false);
  assert.deepEqual(defaultFinalists(s), [], 'nothing derived from ballots leaks to compare');
  assert.equal(finalistRows(s, ['wroclaw'])[0].verdict, '', 'no verdict in summaries');
  assert.equal(nextUnvoted(s), featuredIds[0], 'Traveller 2 starts with a clean ballot');
  assert.equal(s.players.traveller2.identityRevealed.wroclaw, undefined, 'and fresh mysteries');
  s = run([...voteAll('pass'), { type: 'completeBallot' }], s);
  assert.equal(canSeeOtherVotes(s), false, 'hidden until switched on');
  assert.equal(canSeeOtherVotes({ ...s, showOtherVotes: true }), true);
});

test('second ballot cannot start before the first is finished', () => {
  const s = run([{ type: 'vote', destinationId: 'wroclaw', vote: 'keep' }]);
  assert.equal(reducer(s, { type: 'startSecondBallot' }), s);
});

test('12. undo restores the previous vote, and re-voting after results edits only that ballot', () => {
  let s = run([
    { type: 'vote', destinationId: 'wroclaw', vote: 'keep' },
    { type: 'vote', destinationId: 'wroclaw', vote: 'pass' },
  ]);
  s = reducer(s, { type: 'undo' });
  assert.equal(s.players.traveller1.votes.wroclaw, 'keep');
  s = reducer(s, { type: 'undo' });
  assert.equal(s.players.traveller1.votes.wroclaw, undefined);
  assert.equal(reducer(s, { type: 'undo' }), s, 'nothing left to undo');

  const done = twoBallots(
    () => 'keep',
    () => 'keep',
  );
  const edited = run([{ type: 'editBallot', player: 'traveller1' }, { type: 'vote', destinationId: 'wroclaw', vote: 'pass' }], done);
  assert.equal(edited.players.traveller1.votes.wroclaw, 'pass');
  assert.equal(edited.players.traveller2.votes.wroclaw, 'keep');
  assert.equal(resultsReady(edited), true);
});

test('changing mode clears ballots; reset keeps sound and motion preferences', () => {
  const s = run([{ type: 'setSound', on: true }, ...voteAll('keep'), { type: 'setMode', mode: 'quick' }]);
  assert.deepEqual(s.players.traveller1.votes, {});
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

// ───────────── Persistence ─────────────

test('scenario 5. reload mid-ballot resumes at the right contestant', () => {
  const store = new MemoryStorage();
  const s = run([
    { type: 'start' },
    { type: 'vote', destinationId: featuredIds[0], vote: 'keep' },
    { type: 'vote', destinationId: featuredIds[1], vote: 'maybe' },
    { type: 'setActive', destinationId: featuredIds[2] },
  ]);
  saveState(store, s);
  const loaded = loadState(store)!;
  assert.deepEqual(JSON.parse(JSON.stringify(loaded)), JSON.parse(JSON.stringify(s)));
  assert.equal(resumeHref(loaded), `/blind-flight/show/${featuredIds[2]}`);
  assert.equal(nextUnvoted(loaded), featuredIds[2]);
});

test('scenario 5b. reload during Traveller 2’s turn keeps their ballot separate', () => {
  const store = new MemoryStorage();
  const s = run([...voteAll('keep'), { type: 'completeBallot' }, { type: 'startSecondBallot' }]);
  saveState(store, s);
  const loaded = loadState(store)!;
  assert.equal(loaded.activePlayer, 'traveller2');
  assert.deepEqual(loaded.players.traveller2.votes, {});
  assert.equal(resumeHref(loaded), `/blind-flight/show/${featuredIds[0]}`);
});

test('corrupt, old-schema or tampered saves are refused or cleaned', () => {
  const store = new MemoryStorage();
  store.setItem(STORAGE_KEY, '{not json');
  assert.equal(loadState(store), null);
  store.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1 }));
  assert.equal(loadState(store), null);
  assert.equal(loadState(undefined), null);

  const cleaned = sanitise({
    schemaVersion: 2,
    mode: 'two_person',
    activePlayer: 'traveller2',
    destinationOrder: ['wroclaw', 'atlantis', 'riga', 'venice'],
    players: { traveller1: { votes: { wroclaw: 'keep', atlantis: 'keep', prague: 'love' } } },
    ballotComplete: { traveller1: false, traveller2: true },
    preferredItineraryByDestination: { kaunas: 'EU008', prague: 'EU008' },
    finalists: ['atlantis', 'prague'],
  })!;
  assert.deepEqual(cleaned.players.traveller1.votes, { wroclaw: 'keep' });
  assert.equal(cleaned.activePlayer, 'traveller1', 'Traveller 2 cannot be active before Traveller 1 finishes');
  assert.equal(cleaned.ballotComplete.traveller2, false);
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
