import { expect, test } from '@playwright/test';
import { QUESTS, freshStart, solveActivity } from './helpers';

const SAVE_KEY = 'beacon-workshop.save.v1';
const BACKUP_KEY = 'beacon-workshop.backup.v1';

test('progress persists across reload and other localStorage keys are untouched', async ({ page }) => {
  await freshStart(page);
  await page.evaluate(() => localStorage.setItem('someone-else', 'keep'));
  const a = QUESTS[0]!.activities[0]!;
  await page.goto(`#/quest/q01/a/${a.id}`);
  await solveActivity(page, a);
  await page.reload();
  await expect(page.getByTestId('header-progress')).toContainText('1/18');
  expect(await page.evaluate(() => localStorage.getItem('someone-else'))).toBe('keep');
  const keys = await page.evaluate(() => Object.keys(localStorage).sort());
  expect(keys).toEqual([BACKUP_KEY, SAVE_KEY, 'someone-else'].sort());
});

test('a corrupt save is kept, and the learner can restore the backup', async ({ page }) => {
  await freshStart(page);
  const a = QUESTS[0]!.activities[0]!;
  await page.goto(`#/quest/q01/a/${a.id}`);
  await solveActivity(page, a);
  // One more write, so the backup (the previous save) already contains the completion.
  await page.goto('#/settings');
  await page.locator('#set-motion').check();
  await page.evaluate((k) => localStorage.setItem(k, '{broken json'), SAVE_KEY);
  await page.reload();
  await expect(page.getByTestId('recover')).toBeVisible();
  // Navigating elsewhere still lands on recovery; nothing overwrote the corrupt value.
  await page.goto('#/map');
  await expect(page.getByTestId('recover')).toBeVisible();
  expect(await page.evaluate((k) => localStorage.getItem(k), SAVE_KEY)).toBe('{broken json');
  await page.getByTestId('recover-backup').click();
  await expect(page.locator('h1')).toHaveText('町のマップ');
  await expect(page.getByTestId('header-progress')).toContainText('1/18');
});

test('an unknown newer schema version is protected; continuing without saving does not overwrite it', async ({ page }) => {
  await freshStart(page);
  const newer = JSON.stringify({ schemaVersion: 42, future: true });
  await page.evaluate(([k, v]) => localStorage.setItem(k!, v!), [SAVE_KEY, newer]);
  await page.reload();
  await expect(page.getByTestId('recover')).toContainText('42');
  await page.getByTestId('recover-defer').click();
  await expect(page.getByTestId('blocked-banner')).toBeVisible();
  const a = QUESTS[0]!.activities[0]!;
  await page.goto(`#/quest/q01/a/${a.id}`);
  await solveActivity(page, a);
  expect(await page.evaluate((k) => localStorage.getItem(k), SAVE_KEY)).toBe(newer);
  await page.goto('#/recover');
  await page.getByTestId('recover-startover').click();
  await page.getByTestId('recover-startover-confirm').click();
  await expect(page).toHaveURL(/#\/start$/);
  expect(JSON.parse((await page.evaluate((k) => localStorage.getItem(k), SAVE_KEY))!).schemaVersion).toBe(1);
});

test('when storage throws, the app keeps working in memory and warns', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException('full', 'QuotaExceededError');
    };
  });
  await page.goto('#/map');
  const a = QUESTS[0]!.activities[0]!;
  await page.goto(`#/quest/q01/a/${a.id}`);
  await solveActivity(page, a);
  await expect(page.getByTestId('memory-banner')).toBeVisible();
  await expect(page.getByTestId('header-progress')).toContainText('1/18');
});

test('when localStorage is inaccessible, the app still starts in memory mode', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('denied', 'SecurityError');
      },
    });
  });
  await page.goto('#/map');
  await expect(page.getByTestId('memory-banner')).toBeVisible();
  await expect(page.locator('h1')).toHaveText('町のマップ');
});

test('two tabs: the older tab stops writing and can load the newer save', async ({ context }) => {
  const a = await context.newPage();
  await freshStart(a);
  await a.goto('#/map');
  const b = await context.newPage();
  await b.goto('./#/map');
  const act = QUESTS[0]!.activities[0]!;
  await b.goto(`./#/quest/q01/a/${act.id}`);
  await solveActivity(b, act);
  await expect(a.getByTestId('conflict-banner')).toBeVisible();
  // A change in tab A must not overwrite B's progress.
  await a.goto('#/settings');
  await a.locator('#set-motion').check();
  const stored = JSON.parse((await a.evaluate((k) => localStorage.getItem(k), SAVE_KEY))!);
  expect(Object.keys(stored.completedActivities)).toContain(act.id);
  await a.getByTestId('conflict-reload').click();
  await expect(a.getByTestId('conflict-banner')).toHaveCount(0);
  await expect(a.getByTestId('header-progress')).toContainText('1/18');
});

test('export, then import with confirmation; imported text stays inert', async ({ page }) => {
  await freshStart(page);
  const act = QUESTS[0]!.activities[0]!;
  await page.goto(`#/quest/q01/a/${act.id}`);
  await solveActivity(page, act);
  await page.goto('#/settings');
  const download = page.waitForEvent('download');
  await page.getByTestId('export').click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^beacon-workshop-save-\d{4}-\d{2}-\d{2}\.json$/);
  const exported = await page.locator('.export-text').inputValue();
  const data = JSON.parse(exported);
  expect(data.schemaVersion).toBe(1);

  // Start over, then import the exported text with a hostile note added.
  await page.getByTestId('reset').click();
  await page.getByTestId('reset-confirm').click();
  await expect(page.getByTestId('header-progress')).toContainText('0/18');
  data.notes = { q01: '<img src=x onerror="window.__pwned=1"><script>window.__pwned=2</script>' };
  data.unknownField = '<b>x</b>';
  await page.getByTestId('import-text').fill(JSON.stringify(data));
  await page.getByTestId('import-check').click();
  await expect(page.getByTestId('import-summary')).toContainText('1/18');
  await page.getByTestId('import-apply').click();
  await expect(page.getByTestId('header-progress')).toContainText('1/18');
  await page.goto('#/notebook');
  await expect(page.locator('textarea[data-note="q01"]')).toHaveValue(/<img src=x/);
  expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();
  expect(await page.locator('main img[src="x"]').count()).toBe(0);
  const stored = JSON.parse((await page.evaluate((k) => localStorage.getItem(k), SAVE_KEY))!);
  expect(stored.unknownField).toBeUndefined();

  // Oversize and newer-version imports are refused.
  await page.goto('#/settings');
  await page.getByTestId('import-text').fill('x'.repeat(70_000));
  await page.getByTestId('import-check').click();
  await expect(page.getByTestId('import-error')).toContainText(/64 ?KiB/);
  await page.getByTestId('import-text').fill(JSON.stringify({ ...data, schemaVersion: 9 }));
  await page.getByTestId('import-check').click();
  await expect(page.getByTestId('import-error')).toBeVisible();
  await expect(page.getByTestId('header-progress')).toContainText('1/18');
});
