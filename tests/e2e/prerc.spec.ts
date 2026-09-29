import { expect, test, type Page } from '@playwright/test';
import { QUESTS, freshStart, solveActivity } from './helpers';

const SAVE_KEY = 'beacon-workshop.save.v1';
const BACKUP_KEY = 'beacon-workshop.backup.v1';
const raw = (p: Page, k: string) => p.evaluate((key) => localStorage.getItem(key), k);

for (const [label, value] of [
  ['unsupported schema version 2', JSON.stringify({ schemaVersion: 2, future: true })],
  ['corrupt JSON', '{broken json'],
] as const) {
  test(`B1: another tab writes ${label}; this tab's next action never overwrites it`, async ({ context }) => {
    const a = await context.newPage();
    await freshStart(a);
    await a.goto('#/map');
    const b = await context.newPage();
    await b.goto('./#/map');
    await b.evaluate(([k, v]) => localStorage.setItem(k!, v!), [SAVE_KEY, value]);
    // Tab A makes a state-changing action.
    await a.goto('#/settings');
    await a.locator('#set-motion').check();
    await expect(a.getByTestId('blocked-banner')).toBeVisible();
    await expect(a.getByTestId('blocked-banner').locator('a[href="#/recover"]')).toBeVisible();
    expect(await raw(a, SAVE_KEY)).toBe(value);
    // Real progress is still not written over it.
    const act = QUESTS[0]!.activities[0]!;
    await a.goto(`#/quest/q01/a/${act.id}`);
    await solveActivity(a, act);
    expect(await raw(a, SAVE_KEY)).toBe(value);
    // Recovery is explicit: the learner opens it and chooses.
    await a.getByTestId('blocked-banner').locator('a').click();
    await expect(a.getByTestId('recover')).toBeVisible();
    expect(await raw(a, SAVE_KEY)).toBe(value);
  });
}

test('I8: navigation alone never conflicts another tab; real progress does', async ({ context }) => {
  const a = await context.newPage();
  await freshStart(a);
  await a.goto('#/map');
  const b = await context.newPage();
  await b.goto('./#/map');
  const before = await raw(a, SAVE_KEY);
  for (const hash of ['#/settings', '#/notebook', '#/glossary', '#/quest/q01', '#/quest/q01/a/q01-a', '#/map']) {
    await a.goto(hash);
    await expect(a.locator('h1')).toBeVisible();
  }
  expect(await raw(a, SAVE_KEY)).toBe(before);
  await expect(b.getByTestId('conflict-banner')).toHaveCount(0);
  // Genuine progress in tab A now conflicts tab B.
  const act = QUESTS[0]!.activities[0]!;
  await a.goto(`#/quest/q01/a/${act.id}`);
  await solveActivity(a, act);
  await expect(b.getByTestId('conflict-banner')).toBeVisible();
});

test('I1: the pre-reset save stays recoverable after navigating, and restore returns it', async ({ page }) => {
  await freshStart(page);
  for (const act of QUESTS[0]!.activities) {
    await page.goto(`#/quest/q01/a/${act.id}`);
    await solveActivity(page, act);
  }
  await page.goto('#/settings');
  await page.getByTestId('reset').click();
  await page.getByTestId('reset-confirm').click();
  await expect(page.getByTestId('header-progress')).toContainText('0/18');
  for (const hash of ['#/map', '#/notebook', '#/glossary', '#/quest/q02', '#/settings']) {
    await page.goto(hash);
    await expect(page.locator('h1')).toBeVisible();
  }
  const backup = JSON.parse((await raw(page, BACKUP_KEY))!);
  expect(Object.keys(backup.completedActivities)).toHaveLength(3);
  // Make the current save unreadable, then restore the backup explicitly.
  await page.evaluate((k) => localStorage.setItem(k, '{broken'), SAVE_KEY);
  await page.reload();
  await page.getByTestId('recover-backup').click();
  await expect(page.getByTestId('header-progress')).toContainText('3/18');
});

test('I3: finishing after the worked example keeps normal XP and shows the assisted state', async ({ page }) => {
  await freshStart(page);
  const act = QUESTS[0]!.activities[0]!;
  await page.goto(`#/quest/q01/a/${act.id}`);
  for (let i = 0; i < 3; i++) await page.getByTestId('hint-button').click();
  await solveActivity(page, act);
  await expect(page.getByTestId('header-progress')).toContainText('1/18');
  await page.goto('#/quest/q01');
  await expect(page.getByTestId('assisted-tag')).toHaveCount(1);
  const stored = JSON.parse((await raw(page, SAVE_KEY))!);
  expect(stored.completedActivities[act.id].maxHintLevel).toBe(3);
  // Finish the rest with no hints: the other two carry no assisted tag.
  for (const other of QUESTS[0]!.activities.slice(1)) {
    await page.goto(`#/quest/q01/a/${other.id}`);
    await solveActivity(page, other);
  }
  await page.goto('#/quest/q01/clear');
  await expect(page.getByTestId('clear-hint-summary').first()).toBeVisible();
  await expect(page.locator('[data-testid="clear-hint-summary"][data-hint-level="3"]')).toHaveCount(1);
});

test('I5: reset confirmation focuses Cancel, and cancelling returns focus to the trigger', async ({ page }) => {
  await freshStart(page);
  await page.goto('#/settings');
  await page.getByTestId('reset').click();
  await expect(page.getByTestId('reset-cancel')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('reset')).toBeFocused();
  await expect(page.getByTestId('reset-confirm')).toHaveCount(0);
  await expect(page.getByTestId('header-progress')).toContainText('0/18');
});

test('I6: Japanese content shown under the English UI is exposed as lang="ja"', async ({ page }) => {
  await freshStart(page);
  await page.goto('#/settings');
  await page.locator('#set-locale').selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  for (const hash of ['#/prologue', '#/quest/q01', '#/quest/q01/a/q01-a', '#/glossary']) {
    await page.goto(hash);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    const unmarked = await page.evaluate(() => {
      const jp = /[぀-ヿ一-鿿]/;
      const out: string[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const el = (n as Text).parentElement;
        if (!el || el.closest('script,style,noscript')) continue;
        if (jp.test((n as Text).data) && !(el.closest('[lang]')?.getAttribute('lang') ?? '').startsWith('ja')) out.push((n as Text).data.slice(0, 40));
      }
      return out;
    });
    expect(unmarked, hash).toEqual([]);
  }
  // English UI text is not marked as Japanese; grading is unaffected by the UI language.
  await expect(page.getByRole('link', { name: 'Map' }).first()).toBeVisible();
  expect(await page.locator('nav [lang="ja"]').count()).toBe(0);
  const act = QUESTS[0]!.activities[0]!;
  await page.goto(`#/quest/q01/a/${act.id}`);
  await solveActivity(page, act);
});
