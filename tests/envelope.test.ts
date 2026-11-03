import { test } from 'node:test';
import assert from 'node:assert/strict';
import { itineraryById } from '../src/lib/catalogue';
import { isEligibleTrip } from '../src/lib/dates';
import { DIM_IDS, DIMENSIONS, RULES } from '../src/envelope/data/dimensions';
import { PRACTICAL_QUESTIONS } from '../src/envelope/data/practical';
import { SHORTLIST } from '../src/envelope/data/shortlist';
import { SCENES, START, TIEBREAKS } from '../src/envelope/data/story';
import { allPaths, audit, type PathResult } from '../src/envelope/lib/audit';
import { choicesFor, isFinished, paragraphsFor, sceneById, walk } from '../src/envelope/lib/engine';
import { confirmedDeparture, practicalLines, practicalNotes, segmentDates, TRIP_START, tripEnd, verifiedTotal } from '../src/envelope/lib/practical';
import { contributions, explain, profileOf, rank, recommend, splittingDim } from '../src/envelope/lib/scoring';
import { initialState, loadState, reducer, sanitise, saveState, STORAGE_KEY, type Action, type State } from '../src/envelope/lib/state';
import { resultCopy } from '../src/envelope/lib/summary';
import type { Step } from '../src/envelope/lib/types';

// Every path through the story, enumerated once.
const PATHS: PathResult[] = [...allPaths()];
const SUMMARY = audit();
const isTiebreak = (s: Step) => sceneById[s.sceneId]?.kind === 'tiebreak';
const storyKey = (p: PathResult) => JSON.stringify(p.steps.filter((s) => !isTiebreak(s)));
// A deterministic sample for the slower checks.
const SAMPLE = PATHS.filter((_, i) => i % 7 === 0);
const run = (actions: Action[], from: State = initialState) => actions.reduce(reducer, from);
const choose = (s: Step): Action => ({ type: 'choose', sceneId: s.sceneId, choiceId: s.choiceId });

test('every path through the story finishes, with 8 to 12 decisions', () => {
  assert.ok(PATHS.length > 1000);
  for (const p of PATHS) {
    assert.ok(isFinished(walk(p.steps)), `path ends at the practical check: ${storyKey(p)}`);
    assert.ok(p.decisions >= 8 && p.decisions <= 12, `${p.decisions} decisions`);
    assert.ok(p.ending.startsWith('ending-'));
  }
});

test('every path has the same number of scored decisions, so no branch is longer than another', () => {
  const scored = new Set(PATHS.map((p) => walk(p.steps).trail.filter((e) => e.scene.kind === 'decision').length));
  assert.deepEqual([...scored], [9]);
});

test('every decision point offers at most three options', () => {
  for (const p of SAMPLE) {
    for (let k = 0; k < p.steps.length; k++) {
      const w = walk(p.steps.slice(0, k));
      assert.ok(choicesFor(sceneById[w.current], w.ctx).length <= 3, w.current);
    }
  }
});

test('every scene and every choice can be reached, except tiebreaks the current shortlist never needs', () => {
  const taken = new Set(PATHS.flatMap((p) => p.steps.map((s) => `${s.sceneId}.${s.choiceId}`)));
  const neededTiebreaks = new Set<string>();
  for (const a of SHORTLIST) for (const b of SHORTLIST) if (a !== b) neededTiebreaks.add(`tiebreak-${splittingDim(a, b)}`);
  for (const scene of SCENES) {
    if (scene.kind === 'tiebreak' && !neededTiebreaks.has(scene.id)) continue;
    for (const c of scene.choices) assert.ok(taken.has(`${scene.id}.${c.id}`), `never taken: ${scene.id}.${c.id}`);
  }
});

test('every pair of trips that can finish close has a tiebreak scene for the dimension that splits them', () => {
  for (const a of SHORTLIST) for (const b of SHORTLIST) if (a !== b) assert.ok(sceneById[`tiebreak-${splittingDim(a, b)}`]);
  for (const t of TIEBREAKS) {
    assert.deepEqual(
      t.choices.map((c) => c.pole).sort(),
      [-1, 0, 1],
      `${t.id} offers each side and a "both" option`,
    );
  }
});

test('every destination on the shortlist is reachable, and none dominates', () => {
  for (const o of SHORTLIST) {
    const share = SUMMARY.nearest[o.id] / SUMMARY.storyPaths;
    assert.ok(share >= 0.15 && share <= 0.35, `${o.name} is nearest on ${(share * 100).toFixed(1)}% of story paths`);
    assert.ok(SUMMARY.wins[o.id] > 0, `${o.name} can be the final suggestion`);
  }
});

test('plausible playthroughs reach each destination', () => {
  const personas: Record<string, Step[]> = {
    // Early night, a café window, a long walk to the sea, a quiet stay in one place.
    malaga: [
      ['arrival', 'sleep'], ['morning', 'cafe'], ['cafe', 'crossword'], ['bookshop', 'river'], ['river', 'ferry'], ['river-afternoon', 'stay'],
      ['evening', 'dinner'], ['city-day', 'deeper-nadia'], ['last-days', 'return'],
    ].map(([sceneId, choiceId]) => ({ sceneId, choiceId })),
    // A planned day of archives, a cellar bar and the old town.
    krakow: [
      ['arrival', 'bar'], ['morning', 'plan'], ['museum', 'cellars'], ['bookshop', 'stay'], ['vera', 'studio'], ['vera-afternoon', 'letter'],
      ['evening', 'cellar'], ['city-day', 'oldtown'], ['last-days', 'full'],
    ].map(([sceneId, choiceId]) => ({ sceneId, choiceId })),
    // The train, the beach and nights away in the second town.
    'gdansk-poznan': [
      ['arrival', 'bar'], ['morning', 'plan'], ['museum', 'tower'], ['bookshop', 'train'], ['train', 'end'], ['teodora', 'stay'],
      ['evening-town', 'beach'], ['town-morning', 'anothernight'], ['last-days', 'full'],
    ].map(([sceneId, choiceId]) => ({ sceneId, choiceId })),
    // Curiosity and long journeys, then the old centre.
    'rzeszow-krakow': [
      ['arrival', 'walk'], ['morning', 'tram'], ['market', 'unknown'], ['bookshop', 'stay'], ['vera', 'studio'], ['vera-afternoon', 'promise'],
      ['evening', 'dinner'], ['visit', 'kitchen'], ['last-days', 'full'],
    ].map(([sceneId, choiceId]) => ({ sceneId, choiceId })),
  };
  for (const [id, steps] of Object.entries(personas)) {
    const w = walk(steps);
    assert.equal(w.steps.length, steps.length, `${id} persona replays`);
    const ranked = rank(profileOf(w.trail));
    assert.equal(ranked[0].option.id, id, `${id} persona: nearest is ${ranked[0].option.id}`);
  }
});

test('the profile is an average, so repeating a decision does not add weight', () => {
  const w = walk(PATHS[0].steps);
  const once = profileOf(w.trail);
  const twice = profileOf([...w.trail, ...w.trail]);
  for (const d of DIM_IDS) assert.ok(Math.abs(once.value[d] - twice.value[d]) < 1e-9);
  for (const p of SAMPLE) for (const d of DIM_IDS) assert.ok(Math.abs(p.rec.profile.value[d]) <= 2);
});

test('RULES.scale matches the measured spread of the story to within 25%', () => {
  for (const d of DIM_IDS) {
    const ratio = SUMMARY.spread[d].sd / RULES.scale[d];
    assert.ok(ratio > 0.75 && ratio < 1.25, `${d}: measured ${SUMMARY.spread[d].sd.toFixed(2)}, scale ${RULES.scale[d]}`);
  }
});

test('each decision’s contribution adds up exactly to the margin between two trips', () => {
  for (const p of SAMPLE.slice(0, 400)) {
    const trail = walk(p.steps).trail;
    const [a, b] = p.rec.ranked;
    const c = contributions(trail, a.option, b.option);
    const total = c.perEntry.reduce((s, x) => s + x.total, c.baseline);
    assert.ok(Math.abs(total - (b.distance - a.distance)) < 1e-9);
  }
});

test('going back a step reverses its effect on the scores exactly', () => {
  for (const p of SAMPLE.slice(0, 300)) {
    let state = run([{ type: 'start' }, ...p.steps.map(choose)]);
    assert.equal(state.phase, 'practical');
    for (let k = p.steps.length - 1; k >= 0; k--) {
      state = reducer(state, { type: 'back' });
      const fresh = profileOf(walk(p.steps.slice(0, k)).trail);
      const after = profileOf(walk(state.history).trail);
      assert.deepEqual(after.value, fresh.value);
      assert.deepEqual(after.count, fresh.count);
    }
    assert.equal(state.history.length, 0);
  }
});

test('revisiting a choice clears everything after it, and a different choice leads somewhere consistent', () => {
  const p = PATHS[PATHS.length - 1];
  const done = run([{ type: 'start' }, ...p.steps.map(choose), { type: 'showResult' }]);
  assert.equal(done.phase, 'result');
  const back = reducer(done, { type: 'revisit', index: 3 });
  assert.equal(back.phase, 'story');
  assert.deepEqual(back.history, p.steps.slice(0, 3));
  assert.equal(walk(back.history).current, p.steps[3].sceneId);
  // A choice for the wrong scene is ignored.
  assert.equal(reducer(back, { type: 'choose', sceneId: 'arrival', choiceId: 'bar' }), back);
});

test('the explanation only quotes decisions the player made, and they point the right way', () => {
  for (const p of SAMPLE) {
    const trail = walk(p.steps).trail;
    const rec = p.rec;
    const copy = resultCopy(trail);
    const recaps = new Set(trail.map((e) => e.choice.recap));
    for (const m of copy.matches) {
      for (const r of m.reasons) {
        assert.ok(trail.includes(r), 'reason is from this playthrough');
        assert.ok(recaps.has(r.choice.recap) && r.choice.recap.length > 0);
        assert.notEqual(r.scene.kind, 'ending');
      }
      // Quoted in the order they happened.
      const idx = m.reasons.map((r) => trail.indexOf(r));
      assert.deepEqual(idx, [...idx].sort((a, b) => a - b));
    }
    if (!rec.shared) {
      assert.equal(copy.matches.length, 1);
      assert.equal(copy.matches[0].option.id, rec.top.id);
      const ex = explain(trail, rec);
      // Every quoted reason pushed towards the suggestion rather than away from it.
      const others = SHORTLIST.filter((o) => o.id !== rec.top.id);
      for (const r of ex.reasons) {
        const support = others.reduce((s, o) => s + contributions(trail, rec.top, o).perEntry.find((c) => c.entry === r)!.total, 0);
        assert.ok(support > 0, `${r.choice.recap} supports ${rec.top.name}`);
      }
      if (ex.runnerUpEvidence) {
        assert.ok(trail.includes(ex.runnerUpEvidence));
        const c = contributions(trail, rec.top, rec.runnerUp).perEntry.find((x) => x.entry === ex.runnerUpEvidence)!;
        assert.ok(c.byDim[ex.runnerUpDim] < 0, 'the cited choice leaned towards the runner-up');
      }
      assert.match(copy.runnerUp!.sentence, new RegExp(`^If you care more about .+, ${rec.runnerUp.name} would be the better choice\\.$`));
    } else {
      assert.equal(copy.matches.length, 2);
      assert.ok(copy.closeNote?.includes('almost equally'));
    }
    if (rec.tiebreak && !rec.shared) {
      assert.ok(copy.closeNote?.includes(rec.tiebreak.entry.choice.recap), 'the close note quotes the tiebreak actually taken');
      assert.ok(copy.closeNote?.endsWith(`towards ${rec.top.name}.`));
    }
  }
});

test('"you enjoy" phrases come only from dimensions where the player and the trip lean the same way', () => {
  for (const p of SAMPLE) {
    const trail = walk(p.steps).trail;
    const ex = explain(trail, p.rec);
    for (const phrase of ex.enjoys) {
      const dim = DIMENSIONS.find((d) => d.low === phrase || d.high === phrase)!;
      const side = phrase === dim.low ? -1 : 1;
      assert.equal(Math.sign(p.rec.profile.scaled[dim.id]), side);
      assert.equal(Math.sign(p.rec.top.target[dim.id]), side);
      assert.ok(Math.abs(p.rec.profile.scaled[dim.id]) >= RULES.preferenceThreshold);
    }
  }
});

test('a tiebreak is offered whenever, and only when, the top two are close', () => {
  for (const p of PATHS) {
    const hadTiebreak = p.steps.some(isTiebreak);
    assert.equal(hadTiebreak, p.rec.close, storyKey(p));
    if (hadTiebreak) {
      const tb = p.steps.find(isTiebreak)!;
      const [a, b] = rank(profileOf(walk(p.steps).trail));
      assert.equal(tb.sceneId, `tiebreak-${splittingDim(a.option, b.option)}`);
    }
  }
  const tiebroken = PATHS.filter((p) => p.rec.tiebreak);
  assert.ok(tiebroken.some((p) => p.rec.tiebreak!.outcome === 'swapped'), 'a tiebreak can promote the runner-up');
  assert.ok(tiebroken.some((p) => p.rec.tiebreak!.outcome === 'top'));
  assert.ok(tiebroken.some((p) => p.rec.shared));
});

test('the story never names the city, a country or a shortlisted destination', () => {
  const banned = /\b(M[aá]laga|Krak[oó]w|Gda[nń]sk|Pozna[nń]|Rzesz[oó]w|Poland|Polish|Spain|Spanish|Andalu\w*|Baltic|Wawel|Kazimierz|Mot[lł]awa|Vistula|Alcazaba|tapas|pierogi?)\b/i;
  for (const s of SCENES) {
    const text = JSON.stringify([s.when, s.place, s.text, s.choices.map((c) => [c.label, c.recap])]);
    assert.doesNotMatch(text, banned, s.id);
  }
});

test('story text uses UK spelling', () => {
  const us = /\b(color|favorite|center|theater|realize|organize|neighbor|traveling|gray)\b/i;
  for (const s of SCENES) assert.doesNotMatch(JSON.stringify(s), us, s.id);
  for (const o of SHORTLIST) assert.doesNotMatch(JSON.stringify(o), us, o.id);
});

test('every scene renders some text, and every recap is a full sentence', () => {
  for (const p of SAMPLE.slice(0, 200)) {
    for (let k = 0; k < p.steps.length; k++) {
      const w = walk(p.steps.slice(0, k));
      const paragraphs = paragraphsFor(sceneById[w.current], w.ctx);
      assert.ok(paragraphs.length >= 2, w.current);
    }
  }
  for (const s of SCENES) {
    if (s.kind === 'ending') continue;
    for (const c of s.choices) assert.match(c.recap, /^[A-Z].*\.$/, `${s.id}.${c.id}`);
  }
  assert.equal(sceneById[START].kind, 'decision');
});

test('shortlist targets cover every dimension and nights add up to five', () => {
  for (const o of SHORTLIST) {
    for (const d of DIM_IDS) assert.equal(typeof o.target[d], 'number', `${o.id}.${d}`);
    assert.equal(o.segments.reduce((n, s) => n + s.nights, 0), 5, o.id);
  }
});

test('practical details use researched itineraries on the right dates, and say what is unconfirmed', () => {
  for (const o of SHORTLIST) {
    const p = o.practical;
    const ids = [p.wholeTripItineraryId, p.outboundItineraryId, p.returnItineraryId, ...(p.rooms ?? []).map((r) => r.itineraryId)].filter(Boolean) as string[];
    for (const id of ids) {
      const it = itineraryById[id];
      assert.ok(it, `${o.id}: itinerary ${id} exists`);
      assert.ok(isEligibleTrip(it.departDate, it.returnDate), `${id} is inside the travel window`);
    }
    if (p.wholeTripItineraryId) {
      const it = itineraryById[p.wholeTripItineraryId];
      assert.equal(it.departDate, TRIP_START);
      assert.equal(it.returnDate, tripEnd(o));
      assert.equal(it.destinationId, o.segments[0].destinationId);
    } else {
      assert.equal(verifiedTotal(o), null);
      assert.ok(p.unconfirmed.some((u) => /No total/.test(u)), `${o.id} says it has no total`);
    }
    if (p.outboundItineraryId) {
      const it = itineraryById[p.outboundItineraryId];
      assert.equal(it.departDate, TRIP_START, `${o.id}: outbound on the first day`);
      assert.equal(it.destinationId, o.segments[0].destinationId);
    }
    if (p.returnItineraryId) {
      const it = itineraryById[p.returnItineraryId];
      assert.equal(it.returnDate, tripEnd(o), `${o.id}: home on the last day`);
      assert.equal(it.destinationId, o.segments[o.segments.length - 1].destinationId);
    }
    for (const leg of p.timetableLegs ?? []) {
      assert.equal(leg.date, leg.direction === 'out' ? TRIP_START : tripEnd(o), `${o.id}: ${leg.flight} is on the right day`);
      assert.match(leg.departs, /^\d\d:\d\d$/);
      assert.match(leg.source, /^Uploaded (outbound|return), row \d+$/, 'timetable legs cite their workbook row');
    }
    // Every trip has a way there and a way home, researched or not.
    const hasOut = Boolean(p.wholeTripItineraryId || p.outboundItineraryId || p.timetableLegs?.some((l) => l.direction === 'out'));
    const hasHome = Boolean(p.wholeTripItineraryId || p.returnItineraryId || p.timetableLegs?.some((l) => l.direction === 'home'));
    assert.ok(hasOut && hasHome, `${o.id} has researched flights both ways`);
    const dates = segmentDates(o);
    const lines = practicalLines(o);
    for (const r of p.rooms ?? []) {
      const it = itineraryById[r.itineraryId];
      const line = lines.find((l) => l.label === `Stay in ${o.segments[r.segment].name}`)!;
      const exact = it.departDate === dates[r.segment].start && it.returnDate === dates[r.segment].end;
      assert.equal(line.status, exact ? 'researched' : 'unconfirmed', `${o.id} room ${r.segment}`);
      if (!exact) assert.doesNotMatch(line.text, /£/, 'no borrowed room price');
    }
    // Every price shown is a researched one.
    for (const l of lines) if (/£/.test(l.text)) assert.equal(l.status, 'researched', l.text);
  }
});

test('the practical check adds notes but never changes the suggestion', () => {
  const p = PATHS.find((x) => !x.rec.shared && x.rec.top.coldWinter)!;
  const trail = walk(p.steps).trail;
  const base = run([{ type: 'start' }, ...p.steps.map(choose)]);
  const answered = run(
    [
      { type: 'answer', question: 'cold', value: 'avoid' },
      { type: 'answer', question: 'cost', value: 'first' },
      { type: 'showResult' },
    ],
    base,
  );
  assert.equal(recommend(walk(answered.history).trail).top.id, p.rec.top.id);
  const notes = practicalNotes(answered.practical, p.rec.ranked, [p.rec.top, p.rec.runnerUp]);
  assert.ok(notes.some((n) => n.includes('rather avoid days around freezing')));
  assert.ok(notes.some((n) => /closest story match without freezing days|milder of the two/.test(n)));
  assert.ok(notes.some((n) => n.includes('lowest')));
  assert.equal(resultCopy(trail).matches[0].option.id, p.rec.top.id);
  for (const q of PRACTICAL_QUESTIONS) assert.ok(q.options.length >= 2);

  // Early starts: only confirmed times are quoted.
  const gdansk = SHORTLIST.find((o) => o.id === 'gdansk-poznan')!;
  const malaga = SHORTLIST.find((o) => o.id === 'malaga')!;
  assert.equal(confirmedDeparture(gdansk), '06:05');
  assert.equal(confirmedDeparture(malaga), null, 'the priced Málaga fare has no confirmed times');
  const early = practicalNotes({ early: 'avoid' }, p.rec.ranked, [gdansk, malaga]);
  assert.ok(early.some((n) => n.includes('06:05') && n.includes('early start you wanted to avoid')));
  assert.ok(early.some((n) => n.startsWith('Málaga') && n.includes('not confirmed')));
});

test('saved progress round-trips and drops steps that no longer fit the story', () => {
  const p = PATHS[42];
  const state = run([{ type: 'start' }, ...p.steps.slice(0, 5).map(choose), { type: 'answer', question: 'cold', value: 'fine' }]);
  const storage = new Map<string, string>();
  const s = { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => void storage.set(k, v), removeItem: (k: string) => void storage.delete(k) };
  saveState(s, state);
  assert.deepEqual(loadState(s), state);
  assert.ok(storage.has(STORAGE_KEY));

  const tampered = sanitise({ ...state, history: [...state.history.slice(0, 2), { sceneId: 'nowhere', choiceId: 'x' }, ...state.history.slice(2)], practical: { cold: 'boiling' } });
  assert.deepEqual(tampered?.history, state.history.slice(0, 2));
  assert.deepEqual(tampered?.practical, {});
  assert.equal(sanitise({ version: 99 }), null);
  // A finished story saved on the result screen reopens there.
  const finished = run([{ type: 'start' }, ...p.steps.map(choose), { type: 'showResult' }]);
  assert.equal(sanitise(JSON.parse(JSON.stringify(finished)))?.phase, 'result');
});
