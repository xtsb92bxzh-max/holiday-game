import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isEligibleTrip, nightsBetween } from '../src/lib/dates';
import { closenessPoints, duelPoints, estimateTotal, extrasForParty, perPerson, roundForReveal } from '../src/lib/pricing';
import { reducer, initialState, currentGuess, loadState, scoreFor } from '../src/lib/gameState';

test('date eligibility follows the trip rules', () => {
  assert.equal(isEligibleTrip('2027-01-17', '2027-01-21'), true);
  assert.equal(isEligibleTrip('2027-01-17', '2027-01-22'), true);
  assert.equal(isEligibleTrip('2027-01-18', '2027-01-22'), true);
  assert.equal(isEligibleTrip('2027-01-18', '2027-01-21'), false, '18→21 is only three nights');
  assert.equal(isEligibleTrip('2027-01-16', '2027-01-21'), false);
  assert.equal(isEligibleTrip('2027-01-17', '2027-01-23'), false);
  assert.equal(nightsBetween('2027-01-17', '2027-01-22'), 5);
});

test('total for two = fare × 2 + room + baggage × 2 + transfers', () => {
  assert.equal(extrasForParty(), 100);
  assert.equal(estimateTotal(47, 104.18), 298.18); // Wrocław
  assert.equal(estimateTotal(77, 130.37), 384.37); // Kaunas 4 nights
  assert.equal(estimateTotal(71, 160.87), 402.87); // Kaunas 5 nights
  assert.equal(estimateTotal(null, 129.75), null, 'no fare → no total');
  assert.equal(estimateTotal(50, null), null, 'no room → no total');
  assert.equal(estimateTotal(50, 100, { adults: 2, baggagePerAdultGBP: 0, transfersForTwoGBP: 0 }), 200);
  assert.equal(perPerson(384.37), 192.19);
  assert.equal(roundForReveal(420.89), 421);
});

test('closeness points scale with the price', () => {
  assert.equal(closenessPoints(400, 400), 10);
  assert.equal(closenessPoints(420, 400), 10, 'within 5%');
  assert.equal(closenessPoints(360, 400), 6, 'within 10%');
  assert.equal(closenessPoints(321, 400), 3, 'within 20%');
  assert.equal(closenessPoints(319, 400), 0);
  assert.equal(closenessPoints(481, 400), 0);
});

test('the closest guess that does not go over earns the bonus', () => {
  assert.deepEqual(duelPoints([390, 405], 400), [12, 10], 'under and nearer the same band: the under guess gets the bonus');
  assert.deepEqual(duelPoints([350, 380], 400), [3 + 0, 10 + 2]);
  assert.deepEqual(duelPoints([450, 500], 400), [3, 0], 'both over: no bonus');
  assert.deepEqual(duelPoints([380, 380], 400), [12, 12], 'a tie shares the bonus');
  assert.deepEqual(duelPoints([null, 390], 400), [0, 12], 'no guess scores nothing');
  assert.deepEqual(duelPoints([1, 500], 400), [0, 0], 'a silly low guess earns no bonus');
  assert.deepEqual(duelPoints([330, 405], 400), [3 + 2, 10], 'the bonus needs a scoring guess, not the best one');
});

test('both contestants lock in a guess once, and points add up after the reveal', () => {
  let s = reducer(initialState, { type: 'lockGuess', destinationId: 'kaunas', itineraryId: 'EU002', contestant: 0, guess: 380 });
  s = reducer(s, { type: 'lockGuess', destinationId: 'kaunas', itineraryId: 'EU002', contestant: 0, guess: 999 });
  assert.deepEqual(currentGuess(s, 'kaunas', 'EU002')?.guesses, [380, null], 'a locked guess cannot change');
  s = reducer(s, { type: 'lockGuess', destinationId: 'kaunas', itineraryId: 'EU002', contestant: 1, guess: 450 });
  assert.deepEqual(scoreFor(s), [0, 0], 'nothing scores before the reveal');
  s = reducer(s, { type: 'reveal', destinationId: 'kaunas', itineraryId: 'EU002', points: [12, 3] });
  assert.deepEqual(scoreFor(s), [12, 3]);
  assert.equal(reducer(s, { type: 'lockGuess', destinationId: 'kaunas', itineraryId: 'EU002', contestant: 1, guess: 1 }), s);
});

test('a save from the one-guess version keeps revealed guesses and drops drafts', () => {
  const old = {
    ...initialState,
    contestants: ['Ali', 'Sam'],
    contestantTurn: 1,
    guesses: {
      kaunas: { itineraryId: 'EU002', guess: 380, revealed: true, points: 10, contestant: 'Sam' },
      prague: { itineraryId: 'EU010', guess: 500, revealed: false, points: 0 },
    },
  };
  const s = loadState({ getItem: () => JSON.stringify(old) })!;
  assert.deepEqual(s.guesses.kaunas, { itineraryId: 'EU002', guesses: [null, 380], revealed: true, points: [0, 10] });
  assert.equal(s.guesses.prague, undefined);
  assert.equal('contestantTurn' in s, false);
  assert.deepEqual(scoreFor(s), [0, 10]);
});

test('changing itinerary resets guess and reveal state', () => {
  let s = reducer(initialState, { type: 'lockGuess', destinationId: 'kaunas', itineraryId: 'EU002', contestant: 0, guess: 380 });
  s = reducer(s, { type: 'reveal', destinationId: 'kaunas', itineraryId: 'EU002', points: [10, 0] });
  assert.equal(currentGuess(s, 'kaunas', 'EU002')?.revealed, true);
  s = reducer(s, { type: 'chooseItinerary', destinationId: 'kaunas', itineraryId: 'EU004' });
  assert.equal(currentGuess(s, 'kaunas', 'EU004'), undefined);
  assert.equal(currentGuess(s, 'kaunas', 'EU002'), undefined);
});

test('decisions can be changed and cleared; un-keeping the winner clears it', () => {
  let s = reducer(initialState, { type: 'decide', destinationId: 'prague', decision: 'keep' });
  s = reducer(s, { type: 'setWinner', destinationId: 'prague' });
  s = reducer(s, { type: 'decide', destinationId: 'prague', decision: 'bin' });
  assert.equal(s.decisions.prague, 'bin');
  assert.equal(s.winner, null);
  s = reducer(s, { type: 'decide', destinationId: 'prague', decision: null });
  assert.equal(s.decisions.prague, undefined);
});

// ───────────── Shuffled running order ─────────────

test('a new January Getaway deals a shuffled, saved running order', async () => {
  const { mainCast, mysteryCast } = await import('../src/lib/catalogue');
  const { mainLineup, mysteryLineup, loadState, saveState } = await import('../src/lib/gameState');
  assert.deepEqual(mainLineup(initialState), mainCast, 'old games keep the workbook order');
  const s = reducer(initialState, { type: 'shuffle', seed: 42 });
  const lineup = mainLineup(s);
  assert.deepEqual([...lineup].map((d) => d.id).sort(), mainCast.map((d) => d.id).sort(), 'every prize appears once');
  assert.deepEqual(mysteryLineup(s).map((d) => d.id).sort(), mysteryCast.map((d) => d.id).sort());
  const orders = new Set([1, 2, 3, 4, 5].map((seed) => mainLineup(reducer(initialState, { type: 'shuffle', seed })).map((d) => d.id).join()));
  assert.ok(orders.size > 1, 'different games get different orders');

  const store = new Map<string, string>();
  saveState({ setItem: (k, v) => store.set(k, v) }, s);
  const loaded = loadState({ getItem: (k) => store.get(k) ?? null })!;
  assert.deepEqual(mainLineup(loaded), lineup, 'a reload keeps the same order');
});

test('the running order is fixed once anything has been judged', () => {
  const s = reducer(reducer(initialState, { type: 'shuffle', seed: 1 }), { type: 'decide', destinationId: 'prague', decision: 'keep' });
  assert.equal(reducer(s, { type: 'shuffle', seed: 2 }), s);
  assert.equal(reducer(s, { type: 'reset' }).seed, null, 'a reset deals again on the next start');
});

// ───────────── The final vote ─────────────

test('settling the final: agreement wins, a split goes to the points leader, level scores to nobody', async () => {
  const { settleFinal } = await import('../src/lib/finalVote');
  assert.equal(settleFinal(['prague', undefined], [0, 0]), undefined, 'waits for both picks');
  assert.deepEqual(settleFinal(['prague', 'prague'], [0, 9]), { kind: 'agreed', id: 'prague' });
  assert.deepEqual(settleFinal(['prague', 'gdansk'], [4, 9]), { kind: 'split', ids: ['prague', 'gdansk'], casting: 1 });
  assert.deepEqual(settleFinal(['prague', 'gdansk'], [9, 4]), { kind: 'split', ids: ['prague', 'gdansk'], casting: 0 });
  assert.equal((settleFinal(['prague', 'gdansk'], [5, 5]) as { casting: unknown }).casting, null);
});

test('January Getaway final vote: secret picks in order, from kept prizes only', async () => {
  const { finalVerdict, finalPicks } = await import('../src/lib/gameState');
  const keep = (ids: string[]) => ids.map((id) => ({ type: 'decide', destinationId: id, decision: 'keep' }) as const);
  let s = [...keep(['prague', 'gdansk']), { type: 'decide', destinationId: 'kaunas', decision: 'bin' } as const].reduce(reducer, initialState);
  assert.equal(reducer(s, { type: 'finalPick', contestant: 1, destinationId: 'prague' }), s, 'Contestant Two never picks first');
  assert.equal(reducer(s, { type: 'finalPick', contestant: 0, destinationId: 'kaunas' }), s, 'only kept prizes');
  s = reducer(s, { type: 'finalPick', contestant: 0, destinationId: 'prague' });
  assert.equal(reducer(s, { type: 'finalPick', contestant: 0, destinationId: 'gdansk' }), s, 'a pick cannot change');
  const agreed = reducer(s, { type: 'finalPick', contestant: 1, destinationId: 'prague' });
  assert.equal(agreed.winner, 'prague', 'agreement crowns the winner');

  // A split with Contestant Two ahead on points.
  s = reducer(s, { type: 'lockGuess', destinationId: 'kaunas', itineraryId: 'EU002', contestant: 1, guess: 380 });
  s = reducer(s, { type: 'reveal', destinationId: 'kaunas', itineraryId: 'EU002', points: [0, 12] });
  s = reducer(s, { type: 'finalPick', contestant: 1, destinationId: 'gdansk' });
  assert.equal(s.winner, null, 'a split crowns nobody by itself');
  assert.deepEqual(finalVerdict(s), { kind: 'split', ids: ['prague', 'gdansk'], casting: 1 });
  // Binning a picked prize takes that pick out of the vote.
  const binned = reducer(s, { type: 'decide', destinationId: 'gdansk', decision: 'bin' });
  assert.deepEqual(finalPicks(binned), ['prague', null]);
  assert.deepEqual(reducer(s, { type: 'finalVoteAgain' }).finalPicks, [null, null]);
});
