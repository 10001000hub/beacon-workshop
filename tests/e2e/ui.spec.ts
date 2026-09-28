import { expect, test } from '@playwright/test';
import { QUESTS, freshStart, noHorizontalScroll, playQuest, solveActivity } from './helpers';

const WIDTHS = [320, 390, 768, 1440];
const SCREENS = ['#/', '#/start', '#/prologue', '#/map', '#/quest/q01', '#/quest/q01/a/q01-a', '#/read/q04', '#/practice/q01', '#/notebook', '#/glossary', '#/settings', '#/ending'];

for (const w of WIDTHS) {
  test(`no horizontal page scroll at ${w}px`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 900 });
    await freshStart(page);
    for (const s of SCREENS) {
      await page.goto(s);
      await expect(page.locator('h1')).toBeVisible();
      await noHorizontalScroll(page);
    }
    // A diff-heavy review activity scrolls internally, not the page.
    await page.goto('#/read/q05');
    await noHorizontalScroll(page);
  });
}

test('keyboard only: complete Q01-A with Tab/Enter/Space', async ({ page }) => {
  await freshStart(page);
  await page.goto('#/quest/q01/a/q01-a');
  const a = QUESTS[0]!.activities[0]!;
  const combo = a.grading.accepted[0]!;
  if (combo.kind !== 'placements') throw new Error('Q01-A is a prompt builder');
  for (const [slot, rule] of Object.entries(combo.slots)) {
    for (const card of [...(rule.required ?? []), ...(rule.requireAny?.slice(0, 1) ?? [])]) {
      await page.locator(`[data-card="${card}"]`).focus();
      await page.keyboard.press('Enter');
      await page.locator(`[data-place="${slot}"]`).focus();
      await page.keyboard.press('Space');
    }
  }
  await page.getByTestId('submit').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('feedback')).toHaveClass(/is-correct/);
});

test('keyboard: skip link, visible focus, review tabs with arrow keys, no drag-only UI', async ({ page }) => {
  await freshStart(page);
  await page.goto('#/map');
  // Focus lands on the screen heading after navigation; Shift+Tab walks back to the skip link.
  await expect(page.locator('h1')).toBeFocused();
  for (let i = 0; i < 20; i++) {
    if (await page.locator('.skip-link').evaluate((el) => el === document.activeElement)) break;
    await page.keyboard.press('Shift+Tab');
  }
  const skip = page.locator('.skip-link');
  await expect(skip).toBeFocused();
  expect(await skip.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');
  // The skip link slides in (transition), so wait until it is fully on screen.
  await expect.poll(() => skip.evaluate((el) => el.getBoundingClientRect().top >= 0)).toBe(true);
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  // Buttons show a visible focus ring.
  await page.keyboard.press('Tab');
  expect(await page.locator(':focus').evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');
  // Review tabs respond to arrow keys (Q02-B is the first change review).
  await playQuest(page, QUESTS[0]!);
  await page.goto('#/quest/q02/a/q02-a');
  await solveActivity(page, QUESTS[1]!.activities[0]!);
  await page.goto('#/quest/q02/a/q02-b');
  const tabsEl = page.locator('[role="tab"]');
  await tabsEl.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabsEl.nth(1)).toBeFocused();
  await expect(tabsEl.nth(1)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(tabsEl.last()).toHaveAttribute('aria-selected', 'true');
  // Every interactive control on the activity screen is reachable (no drag-only UI).
  await page.goto('#/quest/q01/a/q01-a');
  const draggable = await page.locator('[draggable="true"]').count();
  expect(draggable).toBe(0);
});

test('unknown hash returns to the map with a message', async ({ page }) => {
  await freshStart(page);
  await page.goto('#/definitely/not/here');
  await expect(page).toHaveURL(/#\/map$/);
  await expect(page.getByTestId('flash')).toBeVisible();
  await page.goto('#/quest/q01/a/q01-c');
  await expect(page.locator('h1')).not.toContainText('Q01-C');
});

test('simulation banner is on every screen', async ({ page }) => {
  await freshStart(page);
  for (const s of ['#/', '#/map', '#/quest/q01/a/q01-a', '#/practice', '#/settings', '#/glossary']) {
    await page.goto(s);
    await expect(page.getByTestId('sim-banner')).toBeVisible();
  }
});

test('settings: English UI, text size and reduced motion persist and do not change progress', async ({ page }) => {
  await freshStart(page);
  await page.goto('#/settings');
  await page.locator('#set-locale').selectOption('en');
  await expect(page.getByTestId('sim-banner')).toHaveText('Practice screen — this is not the real Codex');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.locator('#set-motion').check();
  await page.getByLabel('Extra large').check();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-reduce-motion', '');
  const scale = await page.evaluate(() => document.documentElement.style.getPropertyValue('--text-scale'));
  expect(scale).toBe('1.3');
  await expect(page.getByTestId('header-progress')).toContainText('0/18');
  await page.locator('#set-locale').selectOption('ja');
  await expect(page.getByTestId('sim-banner')).toHaveText('練習画面／実際のCodexではありません');
});

test('practice cards show truthful draft status and a working copy fallback', async ({ page, context }) => {
  await freshStart(page);
  await page.goto('#/practice/q01');
  await expect(page.getByTestId('card-status')).toContainText('下書き');
  await expect(page.getByTestId('route-status')).toContainText('下書き');
  await expect(page.locator('body')).not.toContainText('実機で確認済み');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByTestId('copy').click();
  await expect(page.locator('main')).toContainText(/コピー/);
});

test('reading mode shows answers without completing activities', async ({ page }) => {
  await freshStart(page);
  await page.goto('#/read/q06');
  await expect(page.locator('h1')).toContainText('教材として読む');
  await page.goto('#/map');
  await expect(page.locator('[data-progress="sim"]')).toContainText('0/18');
  await expect(page.locator('[data-progress="read"]')).toContainText('1/6');
  await expect(page.locator('[data-progress="xp"]')).toContainText('0/600');
});
