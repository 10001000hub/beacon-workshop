// Rasterises art/source/*.svg into public/assets/art (WebP with alpha for raster targets, SVG copied as-is
// for the vector targets). Uses the Playwright Chromium that is already installed for the E2E suite:
// the SVG is drawn on a canvas and encoded with canvas.toDataURL('image/webp'). No network, no external
// encoder. Run after `npx tsx scripts/generate-art.ts`:  npx tsx scripts/render-art.ts [ID ...]

import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { RASTER_TARGETS, VECTOR_TARGETS } from './art/targets';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'art/source');
const outDir = join(root, 'public/assets/art');
mkdirSync(outDir, { recursive: true });

const PREVIEW_DIR = process.argv.includes('--preview') ? join(root, '.art-preview') : null;
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const wanted = (id: string) => only.length === 0 || only.includes(id);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('about:blank');
let totalBytes = 0;

for (const t of RASTER_TARGETS) {
  if (!wanted(t.id)) continue;
  const svg = readFileSync(join(srcDir, `${t.id}.svg`), 'utf8');
  const dataUrl = await page.evaluate(
    async ({ svgText, w, h, q }) => {
      const img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText);
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      return canvas.toDataURL('image/webp', q);
    },
    { svgText: svg, w: t.w, h: t.h, q: t.quality },
  );
  if (PREVIEW_DIR) {
    // Optional (--preview): also dump a PNG (decoded from the WebP we just made) so the result can be looked at.
    mkdirSync(PREVIEW_DIR, { recursive: true });
    const png = await page.evaluate(async (url) => {
      const img = new Image();
      img.src = url;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const x = c.getContext('2d')!;
      x.fillStyle = '#c9c3b4';
      x.fillRect(0, 0, c.width, c.height);
      x.drawImage(img, 0, 0);
      return c.toDataURL('image/png');
    }, dataUrl);
    writeFileSync(join(PREVIEW_DIR, `${t.id}.png`), Buffer.from(png.split(',')[1]!, 'base64'));
  }
  if (!dataUrl.startsWith('data:image/webp')) throw new Error(`${t.id}: browser did not produce WebP`);
  const buf = Buffer.from(dataUrl.split(',')[1]!, 'base64');
  writeFileSync(join(outDir, `${t.id}.webp`), buf);
  totalBytes += buf.length;
  console.log(`${t.id}.webp ${t.w}x${t.h} ${(buf.length / 1024).toFixed(0)} KiB`);
}
for (const id of VECTOR_TARGETS) {
  if (!wanted(id)) continue;
  const from = join(srcDir, `${id}.svg`);
  if (!existsSync(from)) throw new Error(`missing source ${from}`);
  copyFileSync(from, join(outDir, `${id}.svg`));
  totalBytes += statSync(from).size;
  console.log(`${id}.svg ${(statSync(from).size / 1024).toFixed(1)} KiB`);
}
console.log(`total ${(totalBytes / 1024 / 1024).toFixed(2)} MiB`);
await browser.close();
