# Feasible follow-up review — 2026-10-01

This review used the connected Windows PC and the isolated candidate branch. It did not operate existing ChatGPT/Codex windows or consume the priority projects' implementation sessions. Product/content edits were made by the existing local Claude Code Pro session. Merge, public deployment and application submission remain separate owner decisions.

## Actual visual inspection

Creating screenshots and inspecting them are separate actions. The root AI actually inspected the delivered 20 assets as browser-rendered contact sheets and the actual Q01–Q06 app screenshots. The sheets are source-asset views, not gameplay screens; the earlier chapter captures are gameplay screens. The native Windows course run also loaded all 20 asset IDs during real in-app navigation.

| Assets | Inspection result |
|---|---|
| MAP01 | Harbor lower left, lighthouse upper right, one route through market, workshop, warehouse, bridge and inspection; HTML pins match locations. |
| BG01–BG06 | Distinct request desk, workshop, shelves, safe bridge, mirror desk and lighthouse apparatus; quiet centres, consistent paper texture/palette/light; no embedded text. App crops retain the location cues. |
| CH01–CH09 | Nagi, Koto and Ritsu retain clothing, hair, tools and silhouette across normal/thinking/happy variants. Delivered full figures and actual portrait crops were inspected; faces fit their circles. |
| FX01 | Transparent paper-sliver mist; static and decorative over locked locations, does not obstruct controls. |
| LOGO01 | Original lighthouse + notebook mark; rendered in the title and favicon asset. |
| ICONS01 | All 12 symbols rendered and inspected, with consistent readable strokes. |
| BADGES01 | All six chapter symbols rendered and inspected, matching the course locations. |

No art issue preventing use was found. Owner aesthetic approval is unclaimed. Minor preferences remain review/improvement items; they are not an extra acceptance gate. AC27's defined requirements (20-item manifest, provenance, usage terms and fallback display) are met, with automatic checks and AI visual inspection. Manifest status stays `candidate`, meaning no owner sign-off.

## Native Windows Chrome and browser 200% zoom

Installed Chrome **153.0.8010.54**, native Windows Node (`win32`), isolated test profile and loopback production build. This is automated testing on Windows hardware, not WSL browser emulation and not a human usability session.

Browser zoom was genuinely 200%: equal 1440px outer windows, inner width **1424 → 712**, devicePixelRatio **1 → 2**, visualViewport scale **1**. The isolated profile's browser zoom preference was used; no personal browser preference was changed. [Chromium's zoom preference implementation](https://raw.githubusercontent.com/chromium/chromium/main/chrome/browser/ui/zoom/chrome_zoom_level_prefs.cc) documents that preference. CSS zoom and pinch zoom were not substituted. Viewport captures show readable, wrapped English text at 200% with the app's extra-large text setting enabled.

- All **6 quests / 18 activities / 4 board types / 600 XP / ending** completed using real controls at 200%, with progress retained after reload.
- **26 screen checks**: no horizontal page overflow. Every activity's submit and hint controls and settings export/reset were reachable and unobscured.
- **18 axe scans**, WCAG 2 A/AA, WCAG 2.1 A/AA and best-practice tags: **zero violations**, including feedback, English settings/practice/glossary/notebook, extra-large text and reduced motion.
- Native Chrome accessibility tree exposed headings and result text. The result's separate status element has `aria-live="polite"` and nonempty feedback, and the feedback heading has focus. This confirms browser semantics, not screen-reader speech.
- **Zero page errors and external application requests**. All 20 asset IDs were observed loading during the actual course.

Playwright's initial full-page capture clipped browser-zoom screenshots; it was a capture-method issue, not evidence of application clipping. Those captures are excluded from the published review. Correct native viewport captures use Chrome's screenshot command without changing the viewport; the measurements and control tests above are independent of the screenshots.

## English, Codex route and human-only limits

Claude completed an AI editorial review of 324 UI keys, 1,165 quest ja/en pairs, 24 glossary terms, six source entries, one route, six practice cards and all story text. Seventeen English strings were corrected without changing Japanese, answer IDs, grading or progression; see ENGLISH_REVIEW.md. Native-English-speaker approval remains unclaimed.

Existing ChatGPT/Codex-related processes and a third-party Codex Web GPT wrapper are present. No independent GUI automation for an official Windows Codex desktop session is exposed, and existing writers/windows were left untouched. The six real-Codex practice cards and their official Windows route therefore remain `draft`, with no tested version/date invented. Browser gameplay on Windows does not verify that route. A CLI or third-party wrapper is not evidence for the named official desktop route.

No iPhone or Safari device is available in this execution environment. NVDA/Narrator were not running, and no independent screen-reader control/listening tool is exposed; no reader was installed or launched over the user's active desktop. Real Safari and screen-reader speech remain unverified. Automated browser semantics and actual 200% zoom testing are complete; manual human 200% usability review remains separate.

## Consequences

No known core gameplay, data-loss, privacy or semantic teaching defect blocks the playable simulation or preparation of an honest OSS application. Real Codex/Windows practice and real iPhone Safari are outstanding evidence needed for the spec's fully verified RC/public-release claims; screen-reader speech and human language/usability review remain explicit limits. Art preferences and minor prose/style adjustments are improvement items.

The minimum application preparation is available: public MIT code, working six-quest course, reproducible checks, actual screens, art provenance, truthful unverified/undeployed status and a 422-character value statement. Applicant identity, primary/core-maintainer attestation and current terms eligibility belong to the owner/parent. No acceptance, tier or API credits are promised.

Separate owner decisions are: **merge the reviewed PR**, **choose and authorize a public deployment**, and **approve/send the application and accept its terms**. None of these actions was taken.
