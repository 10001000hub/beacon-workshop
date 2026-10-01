# English review (AI editorial pass)

Date: 2026-10-01. Branch `feat/claude-finish-20261001`, base head 18bd254.

## What this is — and is not

- This is an **AI editorial review** by Claude: each English string was read against its Japanese source for meaning, fluency and terminology consistency.
- It is **not** native-speaker approval. No native English speaker has reviewed this app. That check remains `HUMAN_ONLY` (see `set.localeNote` in `src/content/locales/en.json`, which already tells learners this).

## Reviewed (all read in full, ja vs en)

| File | Entries |
|---|---|
| `src/content/locales/ja.json` / `en.json` | 324 keys each; key sets identical (also test-enforced) |
| `src/content/quests/q01.json` | 194 ja/en pairs |
| `src/content/quests/q02.json` | 183 pairs |
| `src/content/quests/q03.json` | 175 pairs |
| `src/content/quests/q04.json` | 176 pairs |
| `src/content/quests/q05.json` | 217 pairs |
| `src/content/quests/q06.json` | 220 pairs |
| `src/content/glossary.json` | 24 terms |
| `src/content/sources.json` | 6 sources |
| `src/content/routes.json` | 1 route |
| `src/content/practice.json` | 6 practice cards |
| `src/content/story.json` | characters 5, regions 6, future topics 4, all story lines |

Quests total 1,165 pairs across 6 quests / 18 activities.

## Issues fixed (17 string edits in 10 groups, English text only)

No keys, IDs, answer IDs, outcome keys or ja text were changed.

1. **Usage-limit terminology** (`glossary.json` quota, `practice.json` pc-q01 requiredState and failure situation): "allowance" / "real-device practice" were mixed with the term title "Usage limit". The term title stays "Usage limit" (ja unchanged). The definition sentence now reads "When you have used up your quota, simply skip real practice and return to the practice screen." (a limit is a ceiling; a quota can be used up). pc-q01 uses "usage quota" and "real practice".
2. **Done criteria** (`glossary.json`): "what to check to be done" → "what to check before the work counts as done".
3. **Sources S5 / S6**: "background of the production" → "the project's background"; "avoiding misunderstanding" → "avoiding being mistaken for an official product" (the Japanese means 誤認回避).
4. **Worked example vs sample answer** (q05 / q06 `sample`, q06 `notesState`): 完成見本 was rendered "Sample answer", colliding with 解答例 (hint text, kept as "Sample answer"). Now "Worked example".
5. **q01 b** "I want not to forget…" → "I don't want to forget…".
6. **q02 a** folder constraint: "Real work locations are not used for practice." → "Your work folders are not used for practice."
7. **q02 c `missing_step.why`, q03 c `no_persistence_check.why`**: ungrammatical "Only when … are all present can …" → "You can check … only when … are all included."
8. **q03 b** option explain: "Judge by the relation to this goal." → "Judge by how well it fits this goal."
9. **q05 / q06**: "is not grounds…" → "is not a valid reason…" (q05 c1-feeling, q06 i3-wait).
10. **q06 a** minor_as_blocker.what: "Working work" → "Work that runs correctly".

## Consistency checks

- XP: 18 activities × 20 + 6 quests × 40 = 600; practice grants none. JA and EN statements agree.
- 6 quests / 18 activities unchanged (`validate:content`: "6 quests, 18 required activities").
- Codex route and practice cards still say unverified/draft; nothing was marked verified.

## Limits / not fixed

- Test-data strings such as 「氷の配達」「朝の配達」 are intentionally left in Japanese inside English text (they are the literal values the learner types).
- Decision label "Check" (確認する) is short and could be read as a noun; it is explained by its own description line, so it was left as is rather than adding wording not in the Japanese.
- Some phrasing is literal but understandable (e.g. "a point of appearance"); changed only where comprehension was at risk.
- No device, screen-reader or real-Codex verification was done or claimed.

## Verification run after the edits

All run standalone, with real exit codes of 0:

- `npx tsc --noEmit` — pass
- `npx vitest run --maxWorkers=2` — 8 files / 146 tests passed
- `npm run validate:content` — "content OK: 6 quests, 18 required activities"
- `npx playwright test --project=chromium tests/e2e/ui.spec.ts tests/e2e/a11y.spec.ts --workers=1` — 16 passed

The full E2E suite was not repeated.

## Remaining human check

A native English speaker should read the learner-facing English (HUMAN_ONLY). Until then, the English UI is labelled as not natively reviewed.
