# Contributing

Beacon Workshop is an unofficial, static learning game about working with Codex. The app has no backend, no network calls and no AI.

## Setup
- Node.js 22+
- `npm ci` and `npx playwright install chromium`
- `npm run dev` for a dev server

## Before you send a change
Run `npm run check` (typecheck → unit/content tests → `validate:content` → build → Chromium E2E). Report results as they are: a check you did not run is NOT RUN, never PASS. Acceptance evidence lives in `docs/VERIFY.md`.

## Spec and invariants
- The canonical spec is `docs/PRODUCT_SPEC.md`. Do not edit it; do not redesign the world, characters, 6 quests, 18 activities or 4 activity types.
- The invariants are listed in `AGENTS.md`: deterministic grading, only the two `beacon-workshop.*` storage keys (never `localStorage.clear()`), textContent-only rendering (no `innerHTML`), strict CSP.
- No network calls, analytics, auth, LLM or paid API dependencies — in the app, tests or CI.

## Content
Quest content is JSON under `src/content/`. After editing it run `npm run validate:content` and `npm test`: every outcome needs feedback, every accepted answer must grade correct, every wrong outcome must be reachable.

## Privacy
Do not commit secrets, API keys, personal data, local absolute paths, learning logs or exported saves.

## Git
No force-push or history rewrite. Pushing, merging, deploying and license changes are decided by the repository owner.
