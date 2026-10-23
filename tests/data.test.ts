import { test } from 'node:test';
import assert from 'node:assert/strict';
import { destinations, itineraries, mainCast, mysteryCast, hasPrice, itinerariesFor, selectedItinerary } from '../src/lib/catalogue';
import { isEligibleTrip, nightsBetween } from '../src/lib/dates';
import { estimateTotal } from '../src/lib/pricing';

test('every itinerary fits the travel window and minimum stay', () => {
  for (const it of itineraries) {
    assert.ok(isEligibleTrip(it.departDate, it.returnDate), `${it.id} breaks the window`);
    assert.equal(it.nights, nightsBetween(it.departDate, it.returnDate), `${it.id} nights mismatch`);
  }
});

test('totals exist only for priced itineraries and match the formula and workbook', () => {
  for (const it of itineraries) {
    if (it.fareEvidence === 'priced_indicative') {
      assert.equal(it.estimatedTotalForTwoGBP, estimateTotal(it.flightsPerPersonGBP, it.roomForTwoGBP), it.id);
      assert.equal(it.estimatedTotalForTwoGBP, it.workbookTotalForTwoGBP, `${it.id} differs from workbook`);
    } else {
      assert.equal(it.estimatedTotalForTwoGBP, null, `${it.id} must not carry a price`);
      assert.equal(it.flightsPerPersonGBP, null, `${it.id} must not carry a fare`);
    }
  }
  assert.equal(itineraries.filter(hasPrice).length, 20);
});

test('one card per destination, with alternative itineraries attached', () => {
  const ids = destinations.map((d) => d.id);
  assert.equal(new Set(ids).size, ids.length);
  const kaunas = destinations.find((d) => d.id === 'kaunas')!;
  assert.deepEqual(itinerariesFor(kaunas).map((i) => i.nights).sort(), [4, 5]);
  assert.equal(selectedItinerary(kaunas, 'EU004').estimatedTotalForTwoGBP, 402.87);
  assert.equal(selectedItinerary(kaunas, 'nonsense').id, kaunas.defaultItineraryId);
});

test('main cast is 12–15 distinct priced destinations; mystery cast is unpriced', () => {
  assert.ok(mainCast.length >= 12 && mainCast.length <= 15, `main cast ${mainCast.length}`);
  for (const d of mainCast) assert.ok(hasPrice(selectedItinerary(d)), `${d.id} default must be priced`);
  for (const d of mysteryCast) assert.ok(itinerariesFor(d).every((i) => !hasPrice(i)), `${d.id} must be unpriced`);
});

test('no Jordan or Croatia, and links are real https URLs where present', () => {
  for (const d of destinations) assert.ok(!['Jordan', 'Croatia'].includes(d.country));
  for (const it of itineraries) {
    for (const url of [it.flightSourceUrl, it.roomSourceUrl]) if (url) assert.match(url, /^https:\/\//);
  }
});
