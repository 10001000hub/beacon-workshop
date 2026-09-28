# HANDOFF — Beacon Workshop

## Current state
Working MVP complete on a local branch. Japanese learners can play from the introduction through Q01–Q06 (18 activities) to the lighthouse ending, using placeholder art. All local checks pass (Chromium). Nothing has been pushed or published.

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
| WP07 | README, AGENTS/CLAUDE, VERIFY, HANDOFF, CI workflow file (not run on GitHub) | WP07 docs commit (`git log -1`) |

## Branch / last commit
- Branch: `feat/working-mvp` (no remote configured)
- Last code commit: `4aa6f05`; HEAD = the WP07 docs commit on top of it

## Files being changed
None. The working tree is clean after the WP07 commit.

## Tests last run (2026-09-29, WSL2, Node 22.23.1)
- `npm run typecheck`: PASS
- `npm test`: PASS (6 files, 119 tests)
- `npm run validate:content`: PASS
- `npm run build`: PASS
- `npm run test:e2e`: PASS (20 tests, Chromium)
- Clean clone in scratch dir + `npm ci` + the commands above: PASS
- NOT RUN: Playwright WebKit (not installed), iPhone Safari, Windows, screen reader, GitHub Actions (no remote)

## PASS / FAIL / NOT RUN (AC01–AC30; details in `docs/VERIFY.md`)
- PASS: AC01–AC16, AC19, AC23–AC25, AC28–AC30
- FAIL: none
- NOT RUN: AC17 (manual screen reader / zoom), AC26 (CI not run on GitHub)
- DEFERRED TO RELEASE CANDIDATE: AC18, AC20 (device part), AC21, AC22, AC27 (final art)

## Design decisions recorded
- SaveData adds `readSections`, `activityProgress`, `introSeenAt`. XP is always derived from completion records.
- `Session` (in `src/core/session.ts`) owns the save status: saved / memory / blocked (corrupt or newer, with a deferred "continue without saving" mode) / conflict.
- Activity drafts are held in memory only. They are not saved.
- Reading mode shows answers but never completes activities or awards XP.
- English: all UI keys exist. Content falls back to Japanese until RC.
- Asset manifest is at `src/content/asset-manifest.json`. All entries are `placeholder`.
- Sources are `unchecked` and practice cards are `draft`. Nothing is `device_verified`.
- License: not chosen (owner decision). The About text says it will be decided before publication.

## Blockers
None for local work. Publication needs owner decisions: a remote/repo, visibility, a license, and device checks.

## Deferred to Release Candidate
- English content and practice text (AC18)
- Final art replacing the 20 placeholders, with origin and usage terms (AC27)
- Device verification of the 6 practice cards and the Windows route, recording date and product version (AC20, AC21)
- Q04 broken-sample repository/fixture and its check (AC22)
- WebKit and real iPhone Safari runs (§17.3)
- Manual screen-reader and 200% zoom checks (AC17)

## Exact next action
The owner decides whether to create a GitHub repository and push `feat/working-mvp`, and whether it is private or public. After pushing, the first GitHub Actions run of `.github/workflows/ci.yml` settles AC26. Until then, the next engineering task is RC work, starting with the Q04 sample fixture (AC22).
