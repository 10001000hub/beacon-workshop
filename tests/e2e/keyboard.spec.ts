import { expect, test, type Locator, type Page } from '@playwright/test';
import { QUESTS, freshStart } from './helpers';
import type { AcceptedCombination, ActivityDefinition } from '../../src/core/types';

/** Move focus with real Tab presses until the target is focused (proves it is reachable by keyboard). */
async function tabTo(page: Page, target: Locator): Promise<void> {
  const handle = await target.elementHandle();
  if (!handle) throw new Error('target not found');
  for (let i = 0; i < 250; i++) {
    if (await handle.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`could not reach ${await handle.evaluate((el) => el.outerHTML.slice(0, 80))} with Tab`);
}

async function fillByKeyboard(page: Page, a: ActivityDefinition, combo: AcceptedCombination): Promise<void> {
  const board = page.locator('.wb-work');
  if (combo.kind === 'placements') {
    for (const [slot, rule] of Object.entries(combo.slots)) {
      for (const card of [...(rule.required ?? []), ...(rule.requireAny?.slice(0, 1) ?? [])]) {
        await tabTo(page, board.locator(`[data-card="${card}"]`));
        await page.keyboard.press('Enter');
        await tabTo(page, board.locator(`[data-place="${slot}"]`));
        await page.keyboard.press('Space');
      }
    }
  } else if (combo.kind === 'sequence') {
    if (combo.ordered) {
      for (const card of combo.sequence) {
        await tabTo(page, board.locator(`[data-add="${card}"]`));
        await page.keyboard.press('Enter');
      }
    } else {
      for (const card of combo.required) {
        await tabTo(page, board.locator(`input[data-card="${card}"]`));
        await page.keyboard.press('Space');
      }
    }
  } else {
    for (const [item, options] of Object.entries(combo.picks)) {
      const radios = board.locator(`input[type="radio"][name="${a.id}:${item}"]`);
      const values = await radios.evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));
      const index = values.indexOf(options[0]!);
      expect(index, `${a.id}:${item} option ${options[0]}`).toBeGreaterThanOrEqual(0);
      await tabTo(page, radios.first());
      if (index > 0) for (let i = 0; i < index; i++) await page.keyboard.press('ArrowDown');
      else await page.keyboard.press('Space');
      await expect(radios.nth(index)).toBeChecked();
    }
  }
}

test('AC16: all 18 activities can be completed with the keyboard only (all four components)', async ({ page }) => {
  test.setTimeout(600_000);
  await freshStart(page);
  const typesSeen = new Set<string>();
  for (const q of QUESTS) {
    for (const a of q.activities) {
      typesSeen.add(a.type);
      await page.goto(`#/quest/${q.id}/a/${a.id}`);
      await expect(page.locator('h1')).toContainText(a.id.toUpperCase());
      await fillByKeyboard(page, a, a.grading.accepted[0]!);
      await tabTo(page, page.getByTestId('submit'));
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('feedback')).toHaveClass(/is-correct/);
    }
  }
  expect([...typesSeen].sort()).toEqual(['change_review', 'evidence_board', 'prompt_builder', 'triage_decision']);
  await expect(page.getByTestId('header-progress')).toContainText('18/18');
});
