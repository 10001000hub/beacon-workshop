# AGENTS.md — Beacon Workshop

Canonical spec: `docs/PRODUCT_SPEC.md` (do not edit, do not redesign). State of work: `docs/HANDOFF.md`. Acceptance evidence: `docs/VERIFY.md`.

## Commands
- `npm ci` / `npx playwright install chromium`
- `npm run check` = typecheck → `npm test` (Vitest) → `validate:content` → `build` → `test:e2e` (Playwright, chromium)
- E2E reuses a server on :4173 outside CI. If a stale preview is running, kill it by PID (`ss -ltnp | grep 4173`); `pkill -f "vite preview"` kills your own shell.

## Layout
- `src/core/` pure logic: `types.ts` (contracts), `grading.ts` (deterministic, ID/accepted-combination based), `state.ts` (reducer; XP derived from completions), `selectors.ts`, `storage.ts` (keys, backup, import/export), `session.ts` (save status: saved / memory / blocked / conflict), `migrations.ts`.
- `src/content/` JSON content (quests, story, glossary, sources, practice, routes, asset manifest, locales) + `validate.ts`.
- `src/ui/` DOM rendering via `h()` in `dom.ts` (textContent only), screens, four activity boards. `src/app.ts` shell + hash router (`src/router.ts`).
- `tests/unit`, `tests/content`, `tests/e2e`. Placeholder SVGs in `public/assets/placeholders` (from `scripts/generate-placeholders.ts`).

## Invariants (tests enforce most of these)
- 6 quests × 3 activities = 18; 3 objectives, 3 takeaways, 1 practice card per quest. Only types: prompt_builder, evidence_board, change_review, triage_decision.
- XP = 20/activity + 40/quest, max 600; level = min(7, floor(XP/100)+1). Hints and reading mode never award or remove XP; re-answers never double-award.
- Every declared outcome has feedback; every activity has exactly 3 hints; Q05-C/Q06-C contain a case where "proceed" is correct.
- Storage: only `beacon-workshop.save.v1` and `beacon-workshop.backup.v1`; never call `localStorage.clear()`; never silently overwrite corrupt/newer saves; import ≤ 64 KiB, allowlisted fields, text stays inert.
- Never use `innerHTML`; CSP in `index.html` stays strict. No network calls, analytics, auth, LLM or paid API — in app, tests or CI.
- Truthfulness: the simulation banner shows on every screen; nothing is `device_verified`; sources stay `unchecked` until someone actually checks them; no fabricated Codex UI/versions/screenshots.
- Stack: Vite + TypeScript + DOM + CSS. No React, backend, DB, game engine. No third-party/stock art.

## Git / publication
- Work on `feat/working-mvp`; commit checkpoints. No force-push, no `--no-verify`, no history rewrite.
- Creating a remote, pushing, deploying, merging to main, choosing a license: owner only.
- Do not touch other repositories (Orca Quest, orca-learning-workshop, browser-game, my-project, Beads state, timers).
