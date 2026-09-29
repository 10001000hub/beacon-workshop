# HANDOFF — Beacon Workshop

## Current state
Working MVP complete. Japanese learners can play from the introduction through Q01–Q06 (18 activities) to the lighthouse ending, using placeholder art. Release Candidate 実装（この環境で自動検証できる範囲）まで完了。Chromium の全検査はローカルで成功、CI（Chromium・WebKit）も success。The repository is published (public, https://github.com/10001000hub/beacon-workshop, pushed with owner authorization on 2026-09-29). The application is **not deployed**, and there is no main branch or merge. The pre-RC defect fixes below were pushed with owner authorization (2026-09-29).

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
- pre-RC 修正: `aebbef8`。RC 作業: `91a9efe`（AC22）、`a8dd34b`（axe・WebKit 設定）、`662c482`（英語教材・AC18）。`db85a3d`（WebKit 用のテスト修正）。HEAD = その上の docs のみのコミット。すべて origin へ push 済み（オーナー承認 2026-09-30）

## Files being changed
None. The working tree is clean after the docs commit.

## Tests last run (2026-09-30; ローカルは `662c482` のコード、CI は `db85a3d`)
- `npm run check`: PASS (exit 0) = typecheck, `npm test` (8 files, 143 tests), `validate:content` (6 quests, 18 activities), build, `test:e2e` (34 tests, Chromium)
- GitHub Actions run 36622604662 on `db85a3d`: success（`check` = 143 unit + Chromium E2E 34、`webkit` = E2E 34）。run 36621920030（`dd298db`）は webkit のクリップボード権限テストで failure → 修正済み。docs のみの後続コミットの run は追跡しない
- Playwright WebKit: ローカル NOT RUN、CI PASS。NOT RUN: iPhone Safari、Windows、スクリーンリーダー、200% 拡大、実 Codex、クリーン clone 再現

## PASS / FAIL / NOT RUN (AC01–AC30; details in `docs/VERIFY.md`)
- PASS: AC01–AC16、AC18（機械検査の範囲）、AC19、AC22（見本の範囲）、AC23–AC26、AC28、AC30（AC30 は再走査していない旨を VERIFY に記載）
- FAIL: none
- NOT RUN: AC17（手動）、AC29（クリーン clone）
- DEFERRED: AC20（実機部分）、AC21、AC27（最終アート）

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
- English: UI と全教材に英語あり（初訳、母語話者の校閲なし）。`lt()` の日本語フォールバックと `lang` 付与は残してある。
- Asset manifest is at `src/content/asset-manifest.json`. All entries are `placeholder`.
- Sources are `unchecked` and practice cards are `draft`. Nothing is `device_verified`.
- License: MIT (owner decision, 2026-09-29). `LICENSE`, `package.json` and the About text (`about.license`) reflect it.

## Blockers
None.

## Deferred / NOT RUN
- Final art replacing the 20 placeholders, with origin and usage terms (AC27). 画像制作手段がなく、第三者素材は使えないため据え置き
- Device verification of the 6 practice cards and the Windows route (AC20, AC21)
- 実機 iPhone Safari（WebKit エンジンは CI で PASS 済み）
- Manual screen-reader and 200% zoom checks (AC17)
- 英語の母語話者校閲
- 既知の制限: バックアップの保持（`holdBackup`）は再読み込みまで

## Exact next action
オーナー判断: (1) 実機・Windows での実習検証、(2) 最終アートの提供または方針、(3) main の作成・deploy などの公開判断（未実施・未承認）。
