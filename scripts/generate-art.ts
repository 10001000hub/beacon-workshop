// Generates the editable SVG sources in art/source/ and the asset manifest.
// Run: npx tsx scripts/generate-art.ts && npx tsx scripts/render-art.ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bg01, bg02, bg03, bg04, bg05, bg06 } from './art/bgs';
import { fx01, map01 } from './art/map';
import { buildManifest } from './art/manifest';
import { badges01, icons01, logo01 } from './art/vector';
import { koto, nagi, ritsu, type Expr } from './art/chars';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'art/source');
mkdirSync(srcDir, { recursive: true });

const only = process.argv.slice(2);
const wanted = (id: string) => only.length === 0 || only.includes(id);
const write = (id: string, svg: string) => {
  if (wanted(id)) writeFileSync(join(srcDir, `${id}.svg`), svg);
};

write('MAP01', map01());
write('FX01', fx01());
write('BG01', bg01());
write('BG02', bg02());
write('BG03', bg03());
write('BG04', bg04());
write('BG05', bg05());
write('BG06', bg06());

const exprs: Expr[] = ['normal', 'think', 'happy'];
exprs.forEach((e, i) => {
  write(`CH0${1 + i}`, nagi(e));
  write(`CH0${4 + i}`, koto(e));
  write(`CH0${7 + i}`, ritsu(e));
});
write('LOGO01', logo01());
write('ICONS01', icons01());
write('BADGES01', badges01());

if (only.length === 0) {
  writeFileSync(join(root, 'src/content/asset-manifest.json'), JSON.stringify(buildManifest(), null, 2) + '\n');
}
console.log('sources written to art/source');
