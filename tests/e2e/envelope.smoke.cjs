/**
 * Browser smoke test for The Envelope.
 * Plays the story at iPhone width, by mouse and by keyboard, and checks
 * for horizontal overflow, saving across a reload, going back, the result,
 * the comparison and revisiting a choice.
 *
 *   npm run build && npm start             # in one terminal
 *   node tests/e2e/envelope.smoke.cjs      # in another (needs Playwright)
 *
 * BASE_URL defaults to http://localhost:3000. SCREENSHOTS=dir saves a PNG per stage.
 */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const base = process.env.BASE_URL || 'http://localhost:3000';
const shots = process.env.SCREENSHOTS;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => d.accept());

  const check = async (name) => {
    await page.waitForTimeout(250);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 0, `${name}: page overflows horizontally by ${overflow}px`);
    if (shots) {
      fs.mkdirSync(shots, { recursive: true });
      await page.screenshot({ path: path.join(shots, `${name}.png`), fullPage: true });
    }
    console.log(`ok  ${name}`);
  };
  const heading = () => page.locator('#scene-heading').innerText();
  const pick = async (label) => page.getByRole('button', { name: label }).click();

  // The home page lists the new game.
  await page.goto(`${base}/`);
  await page.getByRole('link', { name: /The Envelope/ }).click();
  await page.waitForURL('**/the-envelope');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('heading', { name: 'The Envelope' }).waitFor();
  await check('01-title');

  await pick('Open the envelope');
  assert.equal(await heading(), 'The hotel');
  // Focus moves to the scene heading for screen readers.
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'scene-heading');
  await check('02-arrival');

  // Keyboard: press 1 for the first option.
  await page.keyboard.press('1');
  assert.equal(await heading(), 'Breakfast');
  assert.match(await page.locator('article').innerText(), /pencilled three times/, 'the bar choice is honoured');

  // Back a step, then choose differently.
  await page.getByRole('button', { name: 'Back a step' }).click();
  assert.equal(await heading(), 'The hotel');
  await pick(/Go out into the rain/);
  assert.match(await page.locator('article').innerText(), /soaked to the knees/, 'the walk choice is honoured');
  await check('03-morning');

  await pick(/Plan the day properly/);
  await pick(/Accept her offer of a tour of the cellars/);
  assert.equal(await heading(), 'The bookshop');
  assert.match(await page.locator('article').innerText(), /forty minutes/);
  await check('04-bookshop');

  // Reload keeps progress and reopens the same scene.
  await page.reload();
  await page.locator('#scene-heading').waitFor();
  assert.equal(await heading(), 'The bookshop');
  // The title page offers to carry on.
  await page.locator('header summary').click();
  await page.getByRole('button', { name: 'Title page' }).click();
  await page.getByRole('button', { name: 'Carry on with the story' }).click();
  assert.equal(await heading(), 'The bookshop');

  await pick('Stay and hear what she knows.');
  assert.match(await page.locator('article').innerText(), /liked their stationery/, 'callback to the museum cellars');
  await pick(/Ask to see Teodora’s old studio/);
  await pick(/Write Teodora a letter/);
  await pick(/Follow the music down to a cellar bar/);
  await check('05-day-three');
  await pick(/Give the day to the old town/);
  await pick(/Fill them: every mark/);

  // A tiebreak may appear if the top two are close.
  if ((await heading()) === 'One more choice') {
    await check('06-tiebreak');
    await page.locator('ol button').first().click();
  }
  assert.equal(await heading(), 'Drawer 14');
  assert.match(await page.locator('article').innerText(), /spelling mistake/, 'the letter is remembered at the end');
  await check('07-ending');

  await pick('See where your map points');
  await page.getByRole('heading', { name: 'Practical check' }).waitFor();
  await page.getByText('I’d rather avoid it').click();
  await page.getByText('Cost comes first').click();
  await check('08-practical');
  await pick('Show the suggestion');

  await page.getByRole('heading', { name: 'Where your map points' }).waitFor();
  const result = await page.locator('main').innerText();
  assert.match(result, /Your choices (suggest|sit near|point)/);
  assert.match(result, /The main compromise/);
  assert.match(result, /Runner-up|Credible match/i);
  assert.match(result, /rather avoid days around freezing/);
  assert.doesNotMatch(result, /(\S+) and \1 and/, 'no doubled names');
  assert.doesNotMatch(result, /%/, 'no invented confidence percentages');
  await check('09-result');

  const compare = page.getByRole('button', { name: 'Compare the top two' });
  if (await compare.count()) {
    await compare.click();
    await page.getByRole('heading', { name: 'Side by side' }).waitFor();
    await check('10-compare');
  }

  // Revisit the bookshop decision and take the train instead.
  await page.getByText('Revisit a choice').click();
  await page.getByRole('button', { name: 'Change this' }).nth(3).click();
  assert.equal(await heading(), 'The bookshop');
  await pick('Take the train and follow the address on the envelope.');
  assert.equal(await heading(), 'The train');
  await check('11-train');

  // Play the rest with the keyboard alone.
  for (let i = 0; i < 12; i++) {
    const h = await heading().catch(() => '');
    if (!h) break;
    if (h === 'Drawer 14') {
      await page.getByRole('button', { name: 'See where your map points' }).focus();
      await page.keyboard.press('Enter');
      break;
    }
    await page.keyboard.press('2');
    await page.waitForTimeout(50);
  }
  await page.getByRole('heading', { name: 'Practical check' }).waitFor();
  await pick('Show the suggestion');
  await page.getByRole('heading', { name: 'Where your map points' }).waitFor();

  // Replay clears the story.
  await pick('Replay the story');
  assert.equal(await heading(), 'The hotel');

  assert.deepEqual(errors, [], 'no page errors');
  await browser.close();
  console.log('All Envelope checks passed.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
