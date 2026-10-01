# Release readiness

Branch `feat/claude-finish-20261001`. `docs/PRODUCT_SPEC.md` is canonical and unchanged; the acceptance denominator stays 30.

## Current state

**Polished playable candidate / Working MVP** with original art and bilingual (ja/en) content. A **full Release Candidate** (spec §17.1) is **pending real-practice verification**: the `desktop_windows_codex` route and its 6 practice cards are still unverified. This is not a claim that the app is unfinished — the product is usable — but the RC label must not be used until that verification is done.

## What is true now

- Usable: 6 quests / 18 activities / 4 board types / 600 XP / ending; deterministic grading; storage limited to the two `beacon-workshop.*` keys; no network or AI calls.
- No known §17.4 gameplay, data or privacy blocker.
- Automated evidence (see `docs/VERIFY.md`): Chromium checks pass locally; CI on `18bd254` (push run 36837057863, PR run 36837148985) was green with check 146 tests / Chromium 34 / WebKit 34. That is history relative to the later English edits; CI for the follow-up commit is pending.
- Root's AI visual inspection of the 20 assets in native Windows Chrome contact sheets and of q01–q06 app screenshots found no shipping blocker. This is AI inspection, not owner/human aesthetic approval.
- English: AI editorial review done (`docs/ENGLISH_REVIEW.md`); no native-speaker review.

- Native Windows Chrome actual browser 200% zoom: **PASS (automated)**, all 6 quests / 18 activities / 600 XP / ending / reload; 26 screen checks and 18 axe scans, zero violations, all 20 asset IDs loaded. Inner width 1424→712, DPR 1→2, visualViewport scale 1. Native AX headings and live feedback were checked. See [FEASIBLE_REVIEW](FEASIBLE_REVIEW.md). This is not screen-reader speech or a human 200% usability check.

## Required before claiming "fully verified RC" or a public release

- `desktop_windows_codex` route and the 6 practice cards verified in the real Windows Codex desktop environment (AC20/AC21).
- Real iPhone Safari check.
- Native English-speaker review.
- Screen-reader speech and human 200% usability check (automatic native-browser zoom and AX/axe evidence are already complete).

## Not blockers (improvement items)

Minor style or art preferences from the owner are improvements. They do not block preparing an OSS application.

## Minimum honest application package (nothing submitted)

- Public MIT repository.
- Playable 6-quest / 18-activity product.
- Reproducible checks, screenshots and art provenance (`art/README.md`).
- Accurate status: unverified items listed above, and not deployed.
- Value statement of 500 characters or fewer.
- Owner/maintainer attestation.

Not promised: acceptance, any $100 tier, or API credits. Final terms belong to the parent/owner; no new terms research is done here.

## Separate owner decisions (none taken now)

1. Merge of this branch.
2. Public deployment.
3. Actual application submission.

Each is its own decision. No merge, deploy or submission has been done.

## Windows environment (as observed)

Installed Chrome is available. Existing ChatGPT/Codex, Web GPT and runner processes are present and were left untouched. No independent GUI or screen-reader control/listening tool is exposed for the official Codex route. The installed browser is independently automated in an isolated profile; existing application windows were not controlled. This does not mean Codex is absent, and a CLI or third-party wrapper must not be presented as the verified official desktop route.

The defined AC27 manifest/provenance/terms/fallback requirements, plus actual AI visual inspection of all 20 assets, are satisfied. Owner aesthetic adoption remains unclaimed and is an improvement/review decision, not an additional AC27 gate. Acceptance: **25/30 FULL PASS (83.3%)**, four partially verified items (AC17/18/20/22), one human-only item (AC21). This is the acceptance-item ratio, not overall completion.
