import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect, test, type Page } from '@playwright/test';
import { QUESTS, freshStart, solveActivity } from './helpers';

// Automated accessibility scan (axe-core, vendored from node_modules, no network). This is a
// partial check: it does not replace screen-reader or 200% zoom checks by a person (AC17).
const axeSource = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

async function scan(page: Page, label: string, sink: string[]) {
  await page.evaluate(axeSource);
  const result = await page.evaluate(async () => {
    // @ts-expect-error axe is injected above
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } });
    return r.violations.map((v: { id: string; impact: string; nodes: { target: unknown[] }[] }) => ({ id: v.id, impact: v.impact, targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
  });
  for (const v of result) sink.push(`${label}: ${v.id} (${v.impact}) ${v.targets.join(' | ')}`);
}

const SCREENS = ['#/', '#/start', '#/prologue', '#/map', '#/quest/q01', '#/quest/q01/a/q01-a', '#/quest/q05/a/q05-a', '#/quest/q06/a/q06-a', '#/read/q04', '#/practice/q01', '#/notebook', '#/glossary', '#/settings', '#/ending'];

for (const locale of ['ja', 'en'] as const) {
  test(`axe: representative screens have no violations (${locale})`, async ({ page }) => {
    const found: string[] = [];
    await freshStart(page);
    if (locale === 'en') {
      await page.goto('#/settings');
      await page.locator('#set-locale').selectOption('en');
    }
    for (const s of SCREENS) {
      await page.goto(s);
      await expect(page.locator('h1')).toBeVisible();
      await scan(page, `${locale} ${s}`, found);
    }
    expect(found).toEqual([]);
  });
}

test('axe: feedback and recovery screen', async ({ page }) => {
  const found: string[] = [];
  await freshStart(page);
  const a = QUESTS[0]!.activities[0]!;
  await page.goto(`#/quest/q01/a/${a.id}`);
  await solveActivity(page, a);
  await scan(page, 'feedback', found);
  await page.evaluate(() => localStorage.setItem('beacon-workshop.save.v1', '{broken'));
  await page.reload();
  await expect(page.getByTestId('recover')).toBeVisible();
  await scan(page, 'recover', found);
  expect(found).toEqual([]);
});
