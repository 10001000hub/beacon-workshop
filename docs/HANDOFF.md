# HANDOFF — Beacon Workshop

## Current state
Working MVP complete. Japanese learners can play from the introduction through Q01–Q06 (18 activities) to the lighthouse ending, using placeholder art. All checks pass locally and on GitHub Actions (Chromium). The repository is published (public, https://github.com/10001000hub/beacon-workshop, pushed with owner authorization on 2026-09-29). The application is **not deployed**, and there is no main branch or merge. The pre-RC defect fixes below are committed locally and **not pushed yet**.

## Completed WPs
| WP | Result | Commit |
|---|---|---|
| WP00 | Spec confirmed, branch `feat/working-mvp`, no other repo touched | 005186f |
| WP01 | Contracts (`src/core/types.ts`), deterministic grading, reducer/selectors, storage + session, four activity boards | 005186f / 70b5cc4 |
| WP02 | Q01–Q06 content, feedback, 3-level hints, story scenes, ending | 005186f |
| WP03 | 6 practice cards (status `draft`), routes (untested, null version), sources (`unchecked`) | 005186f |
| WP04 | Progress (sim / read / practice separated), notebook, glossary (24), settings, English UI strings | 70b5cc4 |
| WP05 | Placeholder art + 20-entry asset manifest, responsive 320–1440, keyboard, reduced motion, text scale | 70b5cc4 / 4aa6f05 |
| WP06 | Unit, content, E2E suites; fixes (recovery navigation, 320px overflow) | 4aa6f05 |
| WP07 | README, AGENTS/CLAUDE, VERIFY, HANDOFF, CI workflow (green on GitHub Actions) | 0f1f7ab, c4d44a9, e9f154a |

## Branch / last commit
- Branch: `feat/working-mvp` → `origin` (public; currently the default branch because there is no `main`)
- Baseline (published): `a3c8c13`
- Implementation commit (pre-RC fixes, tested): `aebbef8`. HEAD = this docs commit on top of it (docs only)

## Files being changed
None. The working tree is clean after the docs commit.

## Tests last run (2026-09-29, WSL2, Node 22.23.1, on `aebbef8`)
- `npm run check`: PASS (exit 0) = typecheck, `npm test` (7 files, 138 tests), `validate:content` (6 quests, 18 activities), build, `test:e2e` (30 tests, Chromium)
- GitHub Actions for `aebbef8`: NOT RUN (not pushed). Run 36498603515 belongs to `c4d44a9` and is not evidence for the fixes.
- Clean-clone reproduction after the fixes: NOT RUN
- NOT RUN: Playwright WebKit, iPhone Safari, Windows, screen reader, real Codex

## PASS / FAIL / NOT RUN (AC01–AC30; details in `docs/VERIFY.md`)
- PASS: AC01–AC16, AC19, AC23–AC26, AC28–AC30 (AC10/13/15/16 re-established with new evidence on `aebbef8`)
- FAIL: none
- NOT RUN: AC17 (manual screen reader / zoom)
- DEFERRED TO RELEASE CANDIDATE: AC18, AC20 (device part), AC21, AC22, AC27 (final art)

## pre-RC fixes (review findings)
- B1: a corrupt/unsupported value in `beacon-workshop.save.v1` is never overwritten by ordinary writes; the session becomes blocked (banner + recovery link), recovery stays explicit.
- I1: the valid save is snapshotted into the backup key before Reset / Import and held for the session. Limitation: the hold is in memory, so after a page reload the next ordinary write rotates the backup. Export is the primary safety net.
- I8: navigation no longer persists (`Session.noteResume` is memory-only); the resume position is saved with the next real change.
- I2 Q06-A needs a decision and a reason per case; I4 Q05-A has insufficient v0.4 records; I3 "解答例を見て完了" marker (XP unchanged, hints not gated); I5 reset dialog focus; I6 `lang="ja"` marking of Japanese fallback content (attributes and `document.title` cannot be marked).
- Added `CONTRIBUTING.md`, `SECURITY.md`; README limitations.

## Design decisions recorded
- SaveData adds `readSections`, `activityProgress`, `introSeenAt`. XP is always derived from completion records.
- `Session` (in `src/core/session.ts`) owns the save status: saved / memory / blocked (corrupt or newer, with a deferred "continue without saving" mode) / conflict.
- Activity drafts are held in memory only. They are not saved.
- Reading mode shows answers but never completes activities or awards XP.
- English: all UI keys exist. Content falls back to Japanese until RC.
- Asset manifest is at `src/content/asset-manifest.json`. All entries are `placeholder`.
- Sources are `unchecked` and practice cards are `draft`. Nothing is `device_verified`.
- License: MIT (owner decision, 2026-09-29). `LICENSE`, `package.json` and the About text (`about.license`) reflect it.

## Blockers
None.

## Deferred to Release Candidate
- English content and practice text (AC18)
- Final art replacing the 20 placeholders, with origin and usage terms (AC27)
- Device verification of the 6 practice cards and the Windows route, recording date and product version (AC20, AC21)
- Q04 broken-sample repository/fixture and its check (AC22)
- WebKit and real iPhone Safari runs (§17.3)
- Manual screen-reader and 200% zoom checks (AC17)

## Exact next action
Owner: authorize pushing the pre-RC fix commits, then confirm the CI run for the pushed SHA (record it separately). After that, RC work, starting with the Q04 broken-sample fixture and its check (AC22). Then English content (AC18), final art (AC27), and device verification of the practice cards (AC20/AC21).
