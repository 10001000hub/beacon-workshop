import { expect, test } from '@playwright/test';
import { QUESTS, fillAccepted, freshStart, playQuest } from './helpers';

test('a Japanese learner plays from the introduction through the lighthouse ending', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.hostname !== '127.0.0.1' && u.protocol !== 'data:' && u.protocol !== 'blob:') external.push(r.url());
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await freshStart(page);
  await expect(page.getByTestId('sim-banner')).toHaveText('練習画面／実際のCodexではありません');
  await page.getByRole('link', { name: '冒険を始める' }).click();
  await expect(page).toHaveURL(/#\/start$/);
  await page.getByTestId('start-practice').click();
  await expect(page).toHaveURL(/#\/prologue$/);
  await page.getByRole('link', { name: '町のマップへ' }).click();
  await expect(page.getByTestId('map-next')).toBeVisible();

  // Q02 is locked before Q01 is cleared.
  await page.goto('#/quest/q02');
  await expect(page).toHaveURL(/#\/quest\/q02$/);
  await expect(page.locator('h1')).toHaveText('町のマップ');
  await expect(page.getByTestId('flash')).toContainText('まだ開いていません');

  // One wrong attempt first: feedback, no XP, retry possible.
  const a0 = QUESTS[0]!.activities[0]!;
  await page.goto(`#/quest/q01/a/${a0.id}`);
  await page.getByTestId('submit').click();
  await expect(page.getByTestId('act-status')).not.toBeEmpty();
  await page.getByTestId('hint-button').click();
  await expect(page.locator('.hint-list li')).toHaveCount(1);
  await page.locator('.wb-work [data-card]').first().click();
  await page.locator('.wb-work [data-place]').first().click();
  await page.getByTestId('submit').click();
  await expect(page.getByTestId('feedback')).toBeVisible();

  for (const q of QUESTS) {
    await playQuest(page, q);
    await expect(page.locator('.takeaway')).toHaveCount(3);
  }

  await page.goto('#/map');
  await expect(page.locator('[data-progress="sim"]')).toContainText('18/18');
  await expect(page.locator('[data-progress="xp"]')).toContainText('600/600');
  await expect(page.locator('[data-progress="xp"]')).toContainText('Lv.7');
  await expect(page.locator('[data-progress="practice"]')).toContainText('0/6');
  await page.getByTestId('map-next').click();
  await expect(page.getByTestId('ending')).toBeVisible();
  await expect(page.getByTestId('ending')).toContainText('18/18');

  // Progress survives a reload.
  await page.reload();
  await expect(page.getByTestId('header-progress')).toContainText('18/18');

  // Replaying a completed activity is review only: XP stays at 600.
  const a = QUESTS[0]!.activities[0]!;
  await page.goto(`#/quest/q01/a/${a.id}`);
  await fillAccepted(page, a);
  await page.getByTestId('submit').click();
  await page.goto('#/map');
  await expect(page.locator('[data-progress="xp"]')).toContainText('600/600');

  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test('every quest also accepts its alternative correct answers', async ({ page }) => {
  await freshStart(page);
  let alternatives = 0;
  for (const q of QUESTS) {
    for (const a of q.activities) {
      const combos = a.grading.accepted;
      if (combos.length > 1) alternatives++;
      await page.goto(`#/quest/${q.id}/a/${a.id}`);
      await fillAccepted(page, a, combos[combos.length - 1]);
      await page.getByTestId('submit').click();
      await expect(page.getByTestId('feedback')).toHaveClass(/is-correct/);
    }
  }
  expect(alternatives).toBeGreaterThan(0);
  await page.goto('#/map');
  await expect(page.locator('[data-progress="sim"]')).toContainText('18/18');
});
