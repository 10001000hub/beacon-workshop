# HANDOFF — Beacon Workshop

## Current state
Working MVP complete. Japanese learners can play from the introduction through Q01–Q06 (18 activities) to the lighthouse ending, with original candidate art (owner visual review pending; see "Art finish"). Release Candidate 実装（この環境で自動検証できる範囲）まで完了。Chromium の全検査はローカルで成功。旧ベースラインの CI（Chromium・WebKit）は success、現在の候補の CI は push 後に確認する。The repository is published (public, https://github.com/10001000hub/beacon-workshop, pushed with owner authorization on 2026-09-29). The application is **not deployed**, and there is no main branch or merge. The pre-RC defect fixes below were pushed with owner authorization (2026-09-29).

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
The art/UI/docs candidate is isolated on `feat/claude-finish-20261001`; the original checkout is untouched.

## Art finish (2026-10-01, branch `feat/claude-finish-20261001` on baseline `354d937`)
- The 20 placeholders were replaced by original code-drawn paper-diorama art (spec §10): `scripts/art/*` → `scripts/generate-art.ts` (SVG sources in `art/source/`, manifest) → `scripts/render-art.ts` (Playwright Chromium → `public/assets/art/*.webp`/`.svg`). Provenance and terms: `art/README.md`.
- UI integration: portrait face-crop wrapper, 16:9 scene backgrounds, decorative FX01 mist over locked map places, real logo/icons/badges, favicon. Manifest status is `candidate`; **owner visual review is pending** (nothing here claims sign-off).
- `public/assets/placeholders/` and the old generator are no longer referenced. The legacy placeholder SVGs stay as explicitly unused historical files (still covered by the SVG security test). `scripts/generate-placeholders.ts` is now a stub that throws so it can never overwrite the current manifest.
- `docs/OSS_APPLICATION.md` is a draft only (nothing submitted).

## Tests last run
- 2026-10-01 (this branch / current candidate): the root verified every `npm run check` stage with actual exit 0 (completed 08:16:44 UTC, 1 worker): typecheck, 146 unit/content tests, validate:content (6 quests, 18 activities), build, 34 Chromium E2E. The root also completed 6 quests / 18 activities / four board types / 600 XP / ending with real controls (reload, 0 external requests, 0 page errors) and captured 15 automated screenshots (automated Chromium, not human/device verification).
- That full run is BEFORE a CSS-only portrait fix (`.portrait` top -4px → -22px). After it: build OK, the 15 screenshots regenerated (faces fit in the 64px circles), and `ui.spec.ts` + `a11y.spec.ts` run alone with 1 worker without piping: 16 passed. The full suite was not re-run after the fix.
- CI for this branch: pending until the root verifies the current head after push (no CI run or PR ID is recorded here). Historical baseline CI: run 36782230473 on `354d937`.
- Historical (old placeholder-art code, not this branch): 2026-09-30 `662c482` 143 unit / 34 E2E; AC29: the original reproduction at `092cd77` is history; the current candidate was built from a fresh isolated clone of `354d937` with a fresh `npm ci`, and its full stages passed with real exit 0 (before the portrait fix; ui/a11y 16 passed after). AC30: pre-commit pattern scan done by the root (144 text files + 17 WebP + 8 metadata-free automated screen PNGs; a pattern scan, not a security guarantee).
- GitHub Actions run 36622604662 on `db85a3d`: success（`check` = 143 unit + Chromium E2E 34、`webkit` = E2E 34）。run 36621920030（`dd298db`）は webkit のクリップボード権限テストで failure → 修正済み。docs のみの後続コミットの run は追跡しない
- Playwright WebKit: CI PASS。ローカルは OS ライブラリ導入に sudo が必要なため実行不可（EXTERNAL_TOOL_ONLY、CI が代替）。HUMAN_ONLY（未実施）: iPhone Safari、Windows、スクリーンリーダー、200% 拡大、実 Codex。クリーン clone 再現は PASS（2026-10-01、`092cd77`、VERIFY の AC29）

## PASS / FAIL / HUMAN_ONLY / EXTERNAL_TOOL_ONLY (AC01–AC30; details in `docs/VERIFY.md`)
- PASS: AC01–AC16、AC19、AC23–AC26、AC28–AC30（AC29 は fresh clone、AC30 は 2026-10-01 に再走査）
- PASS（自動部分）+ HUMAN_ONLY: AC17、AC18、AC20、AC22
- FAIL: none
- NOT RUN（自動で実行可能な未実施）: なし
- HUMAN_ONLY: AC21、および上記の手動・実機部分
- AC27: PASS（自動部分: 20件・WebP寸法・容量・スクリプト/外部参照/埋め込み文字なし・alt・フォールバック）+ HUMAN_ONLY（オーナーの目視確認。署名・承認は未取得）

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
- Asset manifest is at `src/content/asset-manifest.json`. All entries are `candidate` (original art, owner visual review pending). Regenerate with `npx tsx scripts/generate-art.ts && npx tsx scripts/render-art.ts`.
- Sources are `unchecked` and practice cards are `draft`. Nothing is `device_verified`.
- License: MIT (owner decision, 2026-09-29). `LICENSE`, `package.json` and the About text (`about.license`) reflect it.

## Blockers
None.

## HUMAN_ONLY / EXTERNAL_TOOL_ONLY（自動では完了できない残り）
- オーナーによるアートの目視確認（AC27 の人手部分。参考情報であり、PR をブロックする必須ゲートではない。署名・承認は取得していない）。候補版は実装済み。実機での見え方（iPhone・低帯域）も未確認
- Device verification of the 6 practice cards and the Windows route (AC20, AC21)
- 実機 iPhone Safari（WebKit エンジンは CI で PASS 済み）
- Manual screen-reader and 200% zoom checks (AC17)
- 英語の母語話者校閲
- 既知の制限: バックアップの保持（`holdBackup`）は再読み込みまで

## Exact next action
オーナー判断: (1) 実機・Windows での実習検証、(2) アート候補の目視確認と差し替え要否、`docs/OSS_APPLICATION.md` の確認（申請はオーナー本人）、(3) main の作成・deploy などの公開判断（未実施・未承認）。
