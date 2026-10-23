import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isEligibleTrip, nightsBetween } from '../src/lib/dates';
import { closenessPoints, estimateTotal, extrasForParty, perPerson, roundForReveal } from '../src/lib/pricing';
import { reducer, initialState, currentGuess } from '../src/lib/gameState';

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

test('closeness points are entertainment-only bands', () => {
  assert.equal(closenessPoints(400, 420), 10);
  assert.equal(closenessPoints(360, 420), 5);
  assert.equal(closenessPoints(359, 420), 0);
  assert.equal(closenessPoints(480, 420), 5);
});

test('changing itinerary resets guess and reveal state', () => {
  let s = reducer(initialState, { type: 'setGuess', destinationId: 'kaunas', itineraryId: 'EU002', guess: 380 });
  s = reducer(s, { type: 'reveal', destinationId: 'kaunas', itineraryId: 'EU002', points: 10 });
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
