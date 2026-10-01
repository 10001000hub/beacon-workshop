# Art provenance

Status: **candidate** — original art, owner visual review pending. Nothing here is signed off.

## What
The 20 assets in `src/content/asset-manifest.json`: MAP01, BG01–06, CH01–09 (Nagi, Koto, Ritsu × normal/think/happy), FX01, LOGO01, ICONS01 (12 symbols), BADGES01 (6 badges). Style follows spec §10: paper-diorama harbor town, light from the upper left, quiet centre, no embedded text.

## How (reproducible)
1. `npx tsx scripts/generate-art.ts` — writes editable SVG sources to `art/source/<ID>.svg` and the manifest. Drawing code: `scripts/art/` (`lib.ts` helpers/filters/palette, `props.ts`, `chars.ts`, `bgs.ts`, `map.ts`, `vector.ts`, `targets.ts`, `manifest.ts`).
2. `npx tsx scripts/render-art.ts [--preview]` — Playwright Chromium rasterizes each SVG to canvas and encodes WebP (`public/assets/art/<ID>.webp`; transparent where specified). Vector assets are copied as SVG. `--preview` additionally writes PNG previews to a git-ignored local folder.
3. Paper look = SVG filters only: `feTurbulence`+`feDisplacementMap` (hand-cut edges), `feDiffuseLighting` (paper fibre), `feDropShadow` toward the lower right.

## Tools and date
The drawing code was authored on 2026-10-01 in Claude Code (Claude, via the existing local claude.ai Pro subscription), so development itself used network access and an AI model. The committed scripts are different: `generate-art.ts` and `render-art.ts` run locally and deterministically (seeded RNG), make no network requests and call no paid API; rasterization uses locally installed Playwright 1.61.0 Chromium. No image-generation model, stock image, font, third-party artwork or paid API was used to produce the pixels. No text is drawn in any asset.

## Usage terms
Original work created for this repository and offered under the repository's MIT License (`LICENSE`; no license change). This is a statement of how the files were made, not a legal guarantee that no third party holds rights; the owner should confirm before relying on it.

## Edit history
Palette tokens (§10): ink #202830, paper #F5F0E6, harbor #203F49, light #E5B85A, mist #7D8792, repair #A73D42, verified #226B56. Iterations were reviewed as PNG previews by the author only; no owner review has happened.
