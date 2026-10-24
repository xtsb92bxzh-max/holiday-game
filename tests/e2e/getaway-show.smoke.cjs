/**
 * Browser smoke test for The Great British Getaway Show.
 * Plays every round at iPhone width and checks for horizontal overflow.
 *
 *   npm run build && npm start            # in one terminal
 *   node tests/e2e/getaway-show.smoke.cjs # in another (needs Playwright)
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
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => d.accept());

  const check = async (name) => {
    await page.waitForTimeout(400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 0, `${name}: page overflows horizontally by ${overflow}px`);
    if (shots) {
      fs.mkdirSync(shots, { recursive: true });
      await page.screenshot({ path: path.join(shots, `${name}.png`) });
    }
    console.log(`ok  ${name}`);
  };

  await page.goto(`${base}/getaway-show`);
  await page.getByRole('heading', { name: /Great British/ }).waitFor();
  await check('01-title');

  await page.getByRole('button', { name: 'Roll the titles' }).click();
  await page.getByLabel('Traveller A nickname').fill('Ali');
  await page.getByLabel('Traveller B nickname').fill('Sam');
  await check('02-audience');
  await page.getByRole('button', { name: 'Start the show' }).click();

  // Round 1: the city name is not readable before the reveal.
  await page.waitForURL('**/catch-a-flight');
  await page.getByRole('button', { name: 'Show me a bit more' }).click();
  const before = await page.locator('main').innerText();
  assert.ok(!before.includes('Wrocław'), 'city name visible before reveal');
  assert.equal(await page.locator('main img[alt*="Wrocław"]').count(), 0, 'alt text gives the city away');
  await check('03-round1-clues');
  await page.getByRole('button', { name: 'Reveal the city' }).click();
  await page.getByRole('heading', { name: 'Wrocław' }).waitFor();
  await page.getByRole('button', { name: 'We got it' }).click();
  await page.getByRole('button', { name: 'Add to my possibles' }).click();
  await check('04-round1-revealed');

  // Round 2
  await page.goto(`${base}/getaway-show/higher-or-lower`);
  await page.getByRole('button', { name: 'Higher' }).click();
  await page.getByText('Correct!').waitFor();
  await check('05-round2-duel');

  // Round 3
  await page.goto(`${base}/getaway-show/bullseye`);
  await page.getByRole('button', { name: /The curious wildcard/ }).click();
  await page.getByRole('button', { name: 'Add to the ballot' }).first().click();
  await check('06-round3-board');

  // Round 4: Traveller A
  await page.goto(`${base}/getaway-show/vote`);
  await page.getByRole('heading', { name: 'Ali’s ballot' }).waitFor();
  const yes = page.locator('label', { hasText: /^Yes$/ });
  const maybe = page.locator('label', { hasText: /^Maybe$/ });
  const count = await yes.count();
  assert.equal(count, 13, 'twelve featured plus one wildcard');
  for (let i = 0; i < count; i++) await yes.nth(i).click();
  await check('07-ballot-a');
  await page.getByRole('button', { name: 'Lock in my votes' }).click();
  await page.getByRole('heading', { name: 'Pass the phone' }).waitFor();
  await check('08-handover');
  await page.getByRole('button', { name: /Start my ballot/ }).click();

  // Traveller B sees no checked votes from A.
  await page.getByRole('heading', { name: 'Sam’s ballot' }).waitFor();
  assert.equal(await page.locator('input[type=radio]:checked').count(), 0, 'A’s votes leaked into B’s ballot');
  for (let i = 0; i < count; i++) await (i % 2 ? maybe : yes).nth(i).click();
  await page.getByRole('button', { name: 'Lock in my votes' }).click();
  await page.getByRole('button', { name: 'Reveal the results' }).click();

  await page.waitForURL('**/results');
  await page.getByRole('heading', { name: /The public have spoken/ }).waitFor();
  await check('09-results');

  await page.getByRole('link', { name: 'To the grand final' }).click();
  await page.waitForURL('**/final');
  await page.getByRole('button', { name: 'Choose as our winner' }).first().click();
  await page.getByText('Congratulations. You have won the right to buy two plane tickets.').waitFor();
  await check('10-final');

  // Reload resumes.
  await page.reload();
  await page.getByText('Your winner').first().waitFor();

  await page.goto(`${base}/getaway-show/holidays`);
  await page.getByText('45 trips').waitFor();
  await check('11-table');

  assert.deepEqual(errors, [], `page errors: ${errors.join('; ')}`);
  await browser.close();
  console.log('Smoke test passed.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
