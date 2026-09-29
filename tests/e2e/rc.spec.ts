import { expect, test } from '@playwright/test';

test('AC22: the broken Q04 sample reproduces the bug in a browser, in its own storage key', async ({ page }) => {
  await page.goto('./practice/q04-broken-sample/index.html');
  await page.evaluate(() => localStorage.setItem('beacon-workshop.save.v1', 'sentinel'));
  await page.fill('#title', ' ');
  await page.fill('#body', '朝の配達');
  await page.getByRole('button', { name: '追加' }).click();
  await expect(page.locator('#list li')).toHaveCount(1);
  await expect(page.locator('#list li')).toContainText('朝の配達');
  await page.fill('#title', '');
  await page.getByRole('button', { name: '追加' }).click();
  await expect(page.locator('#msg')).toHaveText('題名を入力してください');
  const keys = await page.evaluate(() => Object.keys(localStorage).sort());
  expect(keys).toEqual(['beacon-notes-q04-broken-sample.v1', 'beacon-workshop.save.v1']);
  expect(await page.evaluate(() => localStorage.getItem('beacon-workshop.save.v1'))).toBe('sentinel');
});
