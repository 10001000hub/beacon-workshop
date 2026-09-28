import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, type Page } from '@playwright/test';
import type { AcceptedCombination, ActivityDefinition, QuestDefinition } from '../../src/core/types';

export const QUEST_IDS = ['q01', 'q02', 'q03', 'q04', 'q05', 'q06'] as const;

export function loadQuest(id: string): QuestDefinition {
  return JSON.parse(readFileSync(resolve(process.cwd(), `src/content/quests/${id}.json`), 'utf8')) as QuestDefinition;
}

export const QUESTS = QUEST_IDS.map(loadQuest);

/** Fill the board with the given accepted combination, using only clicks/keys on real controls. */
export async function fillAccepted(page: Page, a: ActivityDefinition, combo: AcceptedCombination = a.grading.accepted[0]!): Promise<void> {
  const board = page.locator('.wb-work');
  switch (combo.kind) {
    case 'placements':
      if (await board.getByTestId('reset-board').count()) await board.getByTestId('reset-board').click();
      for (const [slot, rule] of Object.entries(combo.slots)) {
        const cards = [...(rule.required ?? []), ...(rule.requireAny?.slice(0, 1) ?? [])];
        for (const card of cards) {
          await board.locator(`[data-card="${card}"]`).click();
          await board.locator(`[data-place="${slot}"]`).click();
        }
      }
      return;
    case 'sequence':
      if (combo.ordered) {
        for (const card of combo.sequence) await board.locator(`[data-add="${card}"]`).click();
      } else {
        for (const card of combo.required) await board.locator(`input[data-card="${card}"]`).check();
      }
      return;
    case 'picks':
      for (const [item, options] of Object.entries(combo.picks)) {
        await board.locator(`input[name="${a.id}:${item}"][value="${options[0]}"]`).check();
      }
      return;
  }
}

export async function solveActivity(page: Page, a: ActivityDefinition): Promise<void> {
  await expect(page.locator('h1')).toContainText(a.id.toUpperCase());
  await fillAccepted(page, a);
  await page.getByTestId('submit').click();
  const fb = page.getByTestId('feedback');
  await expect(fb).toBeVisible();
  await expect(fb).toHaveClass(/is-correct/);
}

/** Play one quest from its brief through the clear screen. */
export async function playQuest(page: Page, q: QuestDefinition): Promise<void> {
  await page.goto(`#/quest/${q.id}`);
  await expect(page.locator('h1')).toBeVisible();
  for (const a of q.activities) {
    await page.goto(`#/quest/${q.id}/a/${a.id}`);
    await solveActivity(page, a);
  }
  await page.getByTestId('next').click();
  await expect(page).toHaveURL(new RegExp(`#/quest/${q.id}/clear$`));
}

export async function freshStart(page: Page): Promise<void> {
  await page.goto('./');
  await page.evaluate(() => {
    localStorage.removeItem('beacon-workshop.save.v1');
    localStorage.removeItem('beacon-workshop.backup.v1');
  });
  await page.goto('#/');
  await page.reload();
}

export async function noHorizontalScroll(page: Page): Promise<void> {
  const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(sw, 'page must not scroll horizontally').toBeLessThanOrEqual(cw);
}
