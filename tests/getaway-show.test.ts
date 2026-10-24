import { test } from 'node:test';
import assert from 'node:assert/strict';
import { destinationById, hasPrice, itineraries, itineraryById } from '../src/lib/catalogue';
import { isEligibleTrip, nightsBetween } from '../src/lib/dates';
import { contestants } from '../src/getaway-show/data/contestants';
import {
  benchIds,
  drawFromSegment,
  duelCount,
  featuredIds,
  ladderIds,
  segmentPool,
  segmentsOf,
  selectedVariant,
  showDestinationIds,
  variantsFor,
} from '../src/getaway-show/lib/cast';
import { costBreakdown } from '../src/getaway-show/lib/cost';
import { outcomeOf, groupTwoPerson } from '../src/getaway-show/lib/matching';
import { loadState, sanitise, saveState, STORAGE_KEY } from '../src/getaway-show/lib/persistence';
import {
  ballotIds,
  ballotStep,
  currentVoter,
  defaultFinalists,
  duelPair,
  duelRecord,
  effectiveFinalists,
  groups,
  initialState,
  rankedShortlist,
  reducer,
  resultsVisible,
  studioPoints,
  type Action,
  type GameState,
  type Vote,
  ladderOrder,
  revealOrder,
} from '../src/getaway-show/lib/state';
import { comparisonText, shortlistText } from '../src/getaway-show/lib/summary';

const run = (actions: Action[], from: GameState = initialState) => actions.reduce(reducer, from);
const voteAll = (v: Vote | ((id: string, i: number) => Vote)): Action[] =>
  featuredIds.map((id, i) => ({ type: 'vote', destinationId: id, vote: typeof v === 'function' ? v(id, i) : v }));
const bothVoted = (a: Vote | ((id: string, i: number) => Vote), b: Vote | ((id: string, i: number) => Vote)): GameState =>
  run([...voteAll(a), { type: 'lockBallot' }, { type: 'startBallotB' }, ...voteAll(b), { type: 'lockBallot' }, { type: 'revealResults' }]);

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

// ───────────── Data ─────────────

test('9. all 45 viable rows are present: 20 priced and 25 fare-unpriced, with ids, hotels and links intact', () => {
  const viable = itineraries.filter((i) => i.sourceSheet === 'Viable itineraries');
  assert.equal(viable.length, 45);
  assert.equal(viable.filter((i) => i.fareEvidence === 'priced_indicative').length, 20);
  assert.equal(viable.filter((i) => i.fareEvidence === 'scheduled_unpriced').length, 25);
  for (let n = 1; n <= 45; n++) assert.ok(itineraryById[`EU${String(n).padStart(3, '0')}`], `EU${n} missing`);
  for (const it of viable) {
    assert.equal(it.sourceRef, it.id);
    if (it.roomSourceUrl) assert.match(it.roomSourceUrl, /^https:\/\//);
    if (it.flightSourceUrl) assert.match(it.flightSourceUrl, /^https:\/\//);
  }
});

test('10. the 20 totals match the brief to the penny, extras are not double counted, and missing totals stay null', () => {
  const expected: Record<string, number> = {
    EU001: 298.18, EU002: 384.37, EU003: 391.01, EU004: 402.87, EU005: 407.21, EU006: 410.19, EU007: 418.22,
    EU008: 420.89, EU009: 469.86, EU010: 470.76, EU011: 494.21, EU012: 521.09, EU013: 530.06, EU014: 551.89,
    EU015: 558.9, EU016: 567.03, EU017: 592.22, EU018: 593.52, EU019: 627.09, EU020: 666.66,
  };
  for (const [id, total] of Object.entries(expected)) {
    const c = costBreakdown(itineraryById[id])!;
    assert.equal(c.totalForTwo, total, id);
    assert.equal(Math.round((c.flightsForTwo + c.roomForTwo + c.extrasForTwo) * 100) / 100, total, `${id} components`);
    assert.equal(c.placard, Math.round(total));
    assert.equal(c.perPerson, Math.round((total / 2) * 100) / 100);
  }
  for (const it of itineraries.filter((i) => i.fareEvidence !== 'priced_indicative')) {
    assert.equal(it.estimatedTotalForTwoGBP, null, it.id);
    assert.equal(costBreakdown(it), null, it.id);
  }
});

test('11. every show trip fits 17/18 → 21/22 January with 4 or 5 nights; connections to verify stay out', () => {
  for (const id of showDestinationIds) {
    for (const it of variantsFor(id)) {
      assert.ok(isEligibleTrip(it.departDate, it.returnDate), it.id);
      assert.equal(nightsBetween(it.departDate, it.returnDate), it.nights);
      assert.ok(it.nights === 4 || it.nights === 5);
      assert.notEqual(it.fareEvidence, 'needs_manual_review');
    }
  }
  assert.ok(!showDestinationIds.includes('riga'));
});

// ───────────── Round 1 ─────────────

test('twelve distinct, priced, illustrated contestants, each with three clues that do not name the city', () => {
  assert.equal(featuredIds.length, 12);
  assert.equal(new Set(featuredIds).size, 12);
  for (const id of featuredIds) {
    const it = selectedVariant(id);
    assert.ok(it && hasPrice(it), id);
    assert.ok(destinationById[id].imagePath?.includes(id), `${id} photo`);
    const name = destinationById[id].name.toLowerCase().split(' ')[0];
    for (const clue of contestants[id].clues) assert.ok(!clue.toLowerCase().includes(name), `${id} clue names the city: ${clue}`);
    assert.ok(contestants[id].catch.trim(), `${id} catch`);
  }
});

test('5. one destination is one contestant: Kaunas, Paris and Kraków variants never duplicate', () => {
  assert.equal(featuredIds.filter((id) => id === 'kaunas').length, 1);
  assert.deepEqual(
    variantsFor('kaunas').map((v) => v.id).sort(),
    ['EU002', 'EU004'],
  );
  assert.deepEqual(
    variantsFor('paris').map((v) => v.id).sort(),
    ['EU013', 'EU038', 'EU043'],
  );
  const s = run([{ type: 'addToBallot', destinationId: 'paris' }, { type: 'addToBallot', destinationId: 'paris' }]);
  assert.equal(ballotIds(s).filter((id) => id === 'paris').length, 1);
  assert.equal(ballotIds(s).length, new Set(ballotIds(s)).size);
});

test('studio points depend on how much picture was showing, and are recorded only after a reveal', () => {
  const id = featuredIds[0];
  let s = run([{ type: 'recordGuess', destinationId: id, guessed: true }]);
  assert.equal(studioPoints(s).picture, 0, 'no guess before reveal');
  s = run([{ type: 'showMore', destinationId: id }, { type: 'revealIdentity', destinationId: id }, { type: 'recordGuess', destinationId: id, guessed: true }]);
  assert.equal(studioPoints(s).picture, 2);
  s = run([{ type: 'showMore', destinationId: id }, { type: 'showMore', destinationId: id }, { type: 'showMore', destinationId: id }], s);
  assert.equal(s.revealSteps[id], 2, 'steps cap at 2');
});

// ───────────── Round 2 ─────────────

test('4. every duel compares two distinct priced destinations on their own trips, and the answers go both ways', () => {
  assert.ok(duelCount >= 5 && duelCount <= 6, `duel count ${duelCount}`);
  assert.equal(new Set(ladderIds).size, ladderIds.length);
  const answers = new Set<string>();
  for (let i = 0; i < duelCount; i++) {
    const p = duelPair(initialState, i)!;
    assert.notEqual(p.leftId, p.rightId);
    assert.ok(hasPrice(p.left) && hasPrice(p.right));
    assert.equal(p.left.destinationId, p.leftId);
    assert.equal(p.right.destinationId, p.rightId);
    const expected = p.right.estimatedTotalForTwoGBP > p.left.estimatedTotalForTwoGBP ? 'higher' : 'lower';
    assert.equal(p.answer, expected);
    answers.add(p.answer);
  }
  assert.deepEqual([...answers].sort(), ['higher', 'lower']);
});

test('a duel never plays an unpriced trip, and changing dates resets that duel but keeps the votes', () => {
  // Kaunas is in duels 2 and 3. Answer them, vote, then switch Kaunas dates.
  let s = run([
    { type: 'answerDuel', index: 1, guess: 'lower' },
    { type: 'answerDuel', index: 2, guess: 'higher' },
    { type: 'answerDuel', index: 0, guess: 'higher' },
    { type: 'vote', destinationId: 'kaunas', vote: 'yes' },
  ]);
  assert.equal(duelRecord(s, 1)?.correct, true);
  assert.equal(duelRecord(s, 2)?.correct, true);
  s = reducer(s, { type: 'chooseItinerary', destinationId: 'kaunas', itineraryId: 'EU004' });
  assert.equal(duelRecord(s, 1), undefined, 'duel with Kaunas reset');
  assert.equal(duelRecord(s, 2), undefined, 'duel with Kaunas reset');
  assert.ok(duelRecord(s, 0), 'other duels untouched');
  assert.equal(s.ballots.a.kaunas, 'yes', 'vote kept');
  assert.equal(duelPair(s, 1)!.right.id, 'EU004');

  // Kraków's alternative is unpriced: the duel falls back to its priced trip, never the unpriced one.
  s = reducer(initialState, { type: 'chooseItinerary', destinationId: 'tenerife', itineraryId: 'EU045' });
  const last = duelPair(s, duelCount - 1)!;
  assert.equal(last.rightId, 'tenerife');
  assert.equal(last.right.id, 'EU017');
  assert.ok(hasPrice(last.right));
});

test('answers cannot be changed once given; "show both prices" scores nothing', () => {
  let s = run([{ type: 'answerDuel', index: 0, guess: 'skip' }]);
  assert.equal(duelRecord(s, 0)?.correct, null);
  s = reducer(s, { type: 'answerDuel', index: 0, guess: 'higher' });
  assert.equal(duelRecord(s, 0)?.guess, 'skip');
  assert.equal(studioPoints(s).price, 0);
});

// ───────────── Round 3 ─────────────

test('board segments never repeat a featured destination, wildcards are always unpriced, and empty segments say so', () => {
  for (const seg of ['cheap', 'old', 'cold', 'sun', 'food', 'wildcard'] as const) {
    for (const id of segmentPool(seg)) assert.ok(!featuredIds.includes(id), `${id} is featured`);
  }
  for (const id of segmentPool('wildcard')) {
    assert.ok(variantsFor(id).every((v) => !hasPrice(v)), `${id} wildcard has a price`);
  }
  for (const id of segmentPool('cheap')) assert.ok(variantsFor(id).some(hasPrice));
  const cold = segmentPool('cold');
  assert.deepEqual(drawFromSegment('cold', [...featuredIds, ...cold]), []);
  const first = drawFromSegment('food', featuredIds);
  assert.ok(first.length >= 1 && first.length <= 2);
  const second = drawFromSegment('food', [...featuredIds, ...first]);
  assert.ok(second.every((id) => !first.includes(id)));
  assert.equal(new Set(benchIds).size, benchIds.length);
  assert.ok(segmentsOf('venice').includes('wildcard'));
});

test('unlocking from the board does not add to the ballot; adding a wildcard does, with its total unknown', () => {
  let s = run([{ type: 'unlock', ids: ['venice', 'prague'] }]);
  assert.deepEqual(s.unlockedDestinationIds, ['venice'], 'featured never re-unlocked');
  assert.ok(!ballotIds(s).includes('venice'));
  s = reducer(s, { type: 'addToBallot', destinationId: 'venice' });
  assert.ok(ballotIds(s).includes('venice'));
  assert.equal(costBreakdown(selectedVariant('venice')), null);
});

// ───────────── Round 4 ─────────────

test('7. outcomes: YES+YES mutual; YES+MAYBE and MAYBE+MAYBE discuss; vs NO disagree; NO+NO rejected; missing never NO', () => {
  assert.equal(outcomeOf('yes', 'yes'), 'mutual');
  assert.equal(outcomeOf('yes', 'maybe'), 'discuss');
  assert.equal(outcomeOf('maybe', 'maybe'), 'discuss');
  assert.equal(outcomeOf('yes', 'no'), 'disagree');
  assert.equal(outcomeOf('no', 'maybe'), 'disagree');
  assert.equal(outcomeOf('no', 'no'), 'rejected');
  assert.equal(outcomeOf('yes', undefined), 'incomplete');
  assert.equal(outcomeOf(undefined, 'no'), 'incomplete');
  const g = groupTwoPerson(['x', 'y'], { x: 'maybe', y: 'yes' }, { x: 'maybe', y: 'maybe' });
  assert.deepEqual(g.discuss, ['y', 'x'], 'YES+MAYBE ranks above MAYBE+MAYBE');
});

test('6. Traveller B cannot see or change Traveller A’s votes before the reveal', () => {
  let s = run([...voteAll('yes'), { type: 'lockBallot' }]);
  assert.equal(currentVoter(s), null, 'handover: nobody votes');
  assert.equal(ballotStep(s), 'handover');
  assert.equal(resultsVisible(s), false);
  s = reducer(s, { type: 'startBallotB' });
  assert.equal(currentVoter(s), 'b');
  s = reducer(s, { type: 'vote', destinationId: featuredIds[0], vote: 'no' });
  assert.equal(s.ballots.a[featuredIds[0]], 'yes', 'B’s vote never lands on A');
  assert.equal(s.ballots.b[featuredIds[0]], 'no');
  assert.equal(rankedShortlist(s).length, 0, 'no shortlist before the reveal');
  assert.equal(defaultFinalists(s).length, 0);
  s = reducer(s, { type: 'revealResults' });
  assert.equal(resultsVisible(s), false, 'cannot reveal before B locks in');
  s = run([{ type: 'lockBallot' }], s);
  assert.equal(ballotStep(s), 'ready_to_reveal');
  assert.equal(resultsVisible(s), false, 'still sealed until the explicit reveal');
  s = reducer(s, { type: 'revealResults' });
  assert.equal(resultsVisible(s), true);
});

test('B cannot start before A locks in, and a private edit shows only that traveller', () => {
  let s = reducer(initialState, { type: 'startBallotB' });
  assert.equal(currentVoter(s), 'a');
  s = bothVoted('yes', 'maybe');
  s = reducer(s, { type: 'editBallot', player: 'b' });
  assert.equal(currentVoter(s), 'b');
  assert.equal(resultsVisible(s), false, 'results hidden while editing');
  s = run([{ type: 'vote', destinationId: featuredIds[0], vote: 'yes' }, { type: 'finishEdit' }], s);
  assert.equal(resultsVisible(s), true);
  const g = groups(s);
  assert.ok(g.kind === 'two_person' && g.mutual.includes(featuredIds[0]));
});

test('7. quick edition has one ballot and never produces a two-person match', () => {
  let s = run([{ type: 'setMode', mode: 'quick' }, ...voteAll('yes'), { type: 'lockBallot' }, { type: 'startBallotB' }, { type: 'revealResults' }]);
  assert.equal(s.activeBallot, 'a');
  const g = groups(s);
  assert.equal(g.kind, 'quick');
  assert.equal('mutual' in g, false);
  assert.ok(!shortlistText(s).toLowerCase().includes('mutual'));
  assert.ok(shortlistText(s).includes('FAVOURITES'));
});

test('ranking follows votes only: mutual first, then strongest maybes, featured before added wildcards', () => {
  const s0 = run([{ type: 'addToBallot', destinationId: 'venice' }]);
  const a: Vote[] = ['maybe', 'yes', 'no', 'maybe', 'no', 'no', 'no', 'no', 'no', 'no', 'no', 'yes'];
  const b: Vote[] = ['maybe', 'maybe', 'no', 'yes', 'no', 'no', 'no', 'no', 'no', 'no', 'no', 'yes'];
  let s = run([...voteAll((_, i) => a[i]), { type: 'vote', destinationId: 'venice', vote: 'yes' }, { type: 'lockBallot' }, { type: 'startBallotB' }], s0);
  s = run([...voteAll((_, i) => b[i]), { type: 'vote', destinationId: 'venice', vote: 'yes' }, { type: 'lockBallot' }, { type: 'revealResults' }], s);
  const ranked = rankedShortlist(s);
  assert.deepEqual(ranked.slice(0, 2), [featuredIds[11], 'venice'], 'mutual featured, then mutual wildcard');
  assert.deepEqual(ranked.slice(2), [featuredIds[1], featuredIds[3], featuredIds[0]]);
  assert.equal(defaultFinalists(s).length, 3);
});

test('8. no votes, or all NO, give an honest empty shortlist rather than a fabricated winner', () => {
  const none = bothVoted('no', 'no');
  assert.deepEqual(rankedShortlist(none), []);
  assert.deepEqual(effectiveFinalists(none), []);
  assert.equal(none.winnerDestinationId, undefined);
  const s = run([{ type: 'lockBallot' }, { type: 'startBallotB' }, { type: 'lockBallot' }, { type: 'revealResults' }]);
  const g = groups(s);
  assert.ok(g.kind === 'two_person' && g.incomplete.length === 12 && g.rejected.length === 0, 'unvoted is not rejected');
});

test('finalists cap at three; removing the last one leaves none; the winner must be a finalist', () => {
  let s = bothVoted('yes', 'yes');
  assert.equal(effectiveFinalists(s).length, 3);
  s = reducer(s, { type: 'toggleFinalist', destinationId: featuredIds[5] });
  assert.equal(effectiveFinalists(s).length, 3, 'cannot add a fourth');
  s = reducer(s, { type: 'setWinner', destinationId: featuredIds[5] });
  assert.equal(s.winnerDestinationId, undefined);
  s = reducer(s, { type: 'setWinner', destinationId: featuredIds[0] });
  assert.equal(s.winnerDestinationId, featuredIds[0]);
  for (const id of effectiveFinalists(s)) s = reducer(s, { type: 'toggleFinalist', destinationId: id });
  assert.deepEqual(effectiveFinalists(s), []);
  assert.equal(s.winnerDestinationId, undefined);
});

// ───────────── Saving and summaries ─────────────

test('13. saved progress survives a reload; bad or old data is dropped', () => {
  const storage = new MemoryStorage();
  const s = run([{ type: 'start' }, { type: 'setName', player: 'a', name: 'Ali' }, ...voteAll('maybe'), { type: 'lockBallot' }]);
  saveState(storage, s);
  assert.deepEqual(loadState(storage), s);
  storage.setItem(STORAGE_KEY, '{not json');
  assert.equal(loadState(storage), null);
  assert.equal(sanitise({ ...s, version: 2 }), null);
  const tampered = sanitise({
    ...s,
    ballots: { a: { atlantis: 'yes', prague: 'definitely' }, b: { prague: 'yes' } },
    ballotLocked: { a: false, b: true },
    preferredItineraryIds: { kaunas: 'EU999', paris: 'EU043' },
    ballotExtraIds: ['prague', 'venice', 'riga'],
  })!;
  assert.deepEqual(tampered.ballots.a, {});
  assert.equal(tampered.ballotLocked.b, false, 'B cannot be locked before A');
  assert.deepEqual(tampered.preferredItineraryIds, { paris: 'EU043' });
  assert.deepEqual(tampered.ballotExtraIds, ['venice']);
});

test('14. summaries use real links, flag unknown totals and never claim a booking', () => {
  let s = run([{ type: 'addToBallot', destinationId: 'venice' }]);
  s = run([{ type: 'setFinalists', ids: ['wroclaw', 'venice'] }, { type: 'setWinner', destinationId: 'venice' }], s);
  const text = comparisonText(s, effectiveFinalists(s));
  assert.ok(text.includes('★ WINNER: Venice'));
  assert.ok(text.includes('Total unknown'));
  assert.ok(text.includes('£298.18 for two'));
  assert.ok(text.includes(itineraryById.EU001.roomSourceUrl!));
  assert.ok(!/\bbooked\b|\bconfirmed booking\b|\blive fare\b(?!s)/i.test(text.replace('Not live fares', '')));
});

// ───────────── Shuffled running order ─────────────

test('a new show shuffles the reveal order, the price pairings and the board draws', () => {
  assert.deepEqual(revealOrder(initialState), featuredIds, 'a show without a seed keeps the written order');
  const s = run([{ type: 'start', seed: 2024 }]);
  assert.equal(s.seed, 2024);
  assert.deepEqual([...revealOrder(s)].sort(), [...featuredIds].sort(), 'everyone appears once');
  assert.deepEqual([...ladderOrder(s)].sort(), [...ladderIds].sort());
  assert.deepEqual(ballotIds(s).slice(0, 12), revealOrder(s), 'the ballot follows tonight’s order');
  const orders = new Set([1, 2, 3, 4, 5].map((seed) => revealOrder(run([{ type: 'start', seed }])).join()));
  assert.ok(orders.size > 1);
  const ladders = new Set([1, 2, 3, 4, 5].map((seed) => ladderOrder(run([{ type: 'start', seed }])).join()));
  assert.ok(ladders.size > 1, 'different shows meet different pairs in the price round');
  for (let i = 0; i < duelCount; i++) {
    const pair = duelPair(s, i)!;
    assert.equal(pair.leftId, ladderOrder(s)[i]);
    assert.equal(pair.rightId, ladderOrder(s)[i + 1]);
  }
  const draws = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((seed) => drawFromSegment('food', featuredIds, seed).join()));
  assert.ok(draws.size > 1, 'the board draws vary between shows');
  for (const id of drawFromSegment('food', featuredIds, 3)) assert.ok(segmentPool('food').includes(id));
});

test('the running order survives a reload and is fixed once the show is under way', () => {
  const store = new MemoryStorage();
  let s = run([{ type: 'start', seed: 7 }]);
  saveState(store, s);
  assert.deepEqual(revealOrder(loadState(store)!), revealOrder(s));
  assert.equal(reducer(s, { type: 'start', seed: 8 }).seed, 7, 'Resume keeps tonight’s order');
  s = reducer(initialState, { type: 'revealIdentity', destinationId: featuredIds[0] });
  assert.equal(reducer(s, { type: 'start', seed: 8 }).seed, null, 'a show from before shuffling keeps its order');
  assert.equal(sanitise({ ...JSON.parse(JSON.stringify(s)), seed: -3 })!.seed, null);
});
