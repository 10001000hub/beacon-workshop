// Generates the flat placeholder SVGs and the asset manifest (§10.4, §10.6).
// These are simple color blocks + labels made in this repo. They are NOT production art
// and must never be presented as final assets. Run: npx tsx scripts/generate-placeholders.ts

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public/assets/placeholders');
mkdirSync(outDir, { recursive: true });

const C = { ink: '#202830', paper: '#F5F0E6', harbor: '#203F49', light: '#E5B85A', mist: '#7D8792', repair: '#A73D42', verified: '#226B56' };

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function frame(w: number, h: number, body: string, label: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(label)}">\n${body}\n<text x="${w - 12}" y="${h - 12}" text-anchor="end" font-family="sans-serif" font-size="${Math.round(h / 28)}" fill="${C.mist}">PLACEHOLDER</text>\n</svg>\n`;
}

interface Entry {
  id: string;
  kind: 'map' | 'background' | 'character' | 'effect' | 'logo' | 'sprite';
  path: string;
  alt: { ja: string; en: string };
  finalSpec: string;
  status: 'placeholder';
}

const manifest: Entry[] = [];
function emit(id: string, kind: Entry['kind'], svg: string, alt: Entry['alt'], finalSpec: string) {
  const file = `${id}.svg`;
  writeFileSync(join(outDir, file), svg);
  manifest.push({ id, kind, path: `assets/placeholders/${file}`, alt, finalSpec, status: 'placeholder' });
}

// MAP01 — six places on one road, harbor bottom-left, lighthouse top-right.
{
  const pts: [number, number][] = [[260, 1180], [620, 1010], [980, 900], [1300, 720], [1580, 520], [1800, 300]];
  const road = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
  const body = [
    `<rect width="2048" height="1536" fill="${C.paper}"/>`,
    `<path d="M0 1536 L0 1250 Q400 1150 700 1536 Z" fill="${C.harbor}" opacity="0.85"/>`,
    `<path d="${road}" fill="none" stroke="${C.mist}" stroke-width="28" stroke-linecap="round" stroke-dasharray="4 40"/>`,
    ...pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="70" fill="${C.paper}" stroke="${C.harbor}" stroke-width="10"/>`),
    `<rect x="1770" y="140" width="60" height="160" fill="${C.harbor}"/><circle cx="1800" cy="130" r="36" fill="${C.light}"/>`,
  ].join('\n');
  emit('MAP01', 'map', frame(2048, 1536, body, 'Harbor town map placeholder'), { ja: '港町ルーメンの地図（仮素材）', en: 'Map of Lumen harbor town (placeholder)' }, '2048×1536 WebP, text/pins overlaid in HTML');
}

// BG01–BG06 — quiet center area, a single motif per place.
const bgs: [string, string, string, string][] = [
  ['BG01', '#EFE6D2', '市場の依頼机', 'Market request desk'],
  ['BG02', '#E9DCC4', '工房の作業机', 'Workshop bench'],
  ['BG03', '#E3E0D6', '記録倉庫の棚', 'Record warehouse shelves'],
  ['BG04', '#DDE3E2', '伝言橋', 'Message bridge'],
  ['BG05', '#E2E1E6', '鏡の検査机', 'Mirror inspection desk'],
  ['BG06', '#E6E0D0', '灯台の内部', 'Lighthouse interior'],
];
for (const [id, tint, ja, en] of bgs) {
  const body = [
    `<rect width="1920" height="1080" fill="${tint}"/>`,
    `<rect x="0" y="820" width="1920" height="260" fill="${C.harbor}" opacity="0.18"/>`,
    `<rect x="480" y="270" width="960" height="540" rx="24" fill="${C.paper}" opacity="0.55"/>`,
    `<text x="60" y="110" font-family="sans-serif" font-size="56" fill="${C.harbor}">${id}</text>`,
  ].join('\n');
  emit(id, 'background', frame(1920, 1080, body, `${en} placeholder`), { ja: `${ja}（仮素材）`, en: `${en} (placeholder)` }, '1920×1080 WebP, no embedded text');
}

// CH01–CH09 — simple silhouettes; expression shown by a small mark.
const people: [string, string, string, string][] = [
  ['nagi', 'ナギ', 'Nagi', '#2F6B68'],
  ['koto', 'コト', 'Koto', '#B08A3E'],
  ['ritsu', 'リツ', 'Ritsu', '#4B4452'],
];
const exprs: [string, string, string][] = [
  ['normal', '通常', 'normal'],
  ['think', '考える', 'thinking'],
  ['happy', '喜ぶ', 'happy'],
];
let n = 1;
for (const [pid, pja, pen, color] of people) {
  for (const [eid, eja, een] of exprs) {
    const id = `CH0${n++}`;
    const shape =
      pid === 'koto'
        ? `<rect x="234" y="330" width="300" height="260" rx="60" fill="${color}"/><path d="M234 460 L150 420 L234 520 Z M534 460 L618 420 L534 520 Z" fill="${C.paper}" stroke="${color}" stroke-width="6"/><circle cx="384" cy="300" r="26" fill="${C.light}"/>`
        : `<circle cx="384" cy="330" r="130" fill="${color}"/><rect x="224" y="480" width="320" height="480" rx="120" fill="${color}"/>`;
    const mark =
      eid === 'think'
        ? `<text x="560" y="220" font-family="sans-serif" font-size="96" fill="${C.ink}">?</text>`
        : eid === 'happy'
          ? `<text x="540" y="220" font-family="sans-serif" font-size="96" fill="${C.light}">★</text>`
          : '';
    const body = [`<rect width="768" height="1024" fill="none"/>`, shape, mark, `<text x="384" y="1000" text-anchor="middle" font-family="sans-serif" font-size="44" fill="${C.ink}">${id}</text>`].join('\n');
    emit(id, 'character', frame(768, 1024, body, `${pen} ${een} placeholder`), { ja: `${pja}（${eja}・仮素材）`, en: `${pen} (${een}, placeholder)` }, '768×1024 transparent WebP');
  }
}

// FX01 — soft mist cloud, no text meaning.
{
  const body = [1, 2, 3, 4, 5]
    .map((i) => `<ellipse cx="${200 + i * 70}" cy="${360 + (i % 2) * 60}" rx="170" ry="110" fill="${C.mist}" opacity="0.35"/>`)
    .join('\n');
  emit('FX01', 'effect', frame(768, 768, body, 'Mist placeholder'), { ja: 'モヤ（仮素材）', en: 'Mist (placeholder)' }, '768×768 transparent WebP');
}

// LOGO01 — original lighthouse + notebook mark.
{
  const body = `<rect x="8" y="40" width="48" height="20" rx="3" fill="${C.paper}" stroke="${C.harbor}" stroke-width="3"/><path d="M26 40 L28 12 L36 12 L38 40 Z" fill="${C.harbor}"/><circle cx="32" cy="10" r="6" fill="${C.light}"/>`;
  emit('LOGO01', 'logo', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Beacon Workshop mark">${body}</svg>\n`, { ja: 'Beacon Workshop の印（仮素材）', en: 'Beacon Workshop mark (placeholder)' }, 'Original vector SVG');
}

// ICONS01 — sprite of 12 symbols.
{
  const ids = ['purpose', 'material', 'constraint', 'done', 'make', 'change', 'fix', 'check', 'handoff', 'hint', 'source', 'settings'];
  const glyph: Record<string, string> = {
    purpose: '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/>',
    material: '<rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 10h8M8 14h5" stroke="currentColor" stroke-width="2"/>',
    constraint: '<rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/>',
    done: '<path d="M5 12l4 4 10-10" fill="none" stroke="currentColor" stroke-width="2.5"/>',
    make: '<path d="M4 20l6-6M14 4l6 6-8 8-6-6z" fill="none" stroke="currentColor" stroke-width="2"/>',
    change: '<path d="M4 8h13l-3-3M20 16H7l3 3" fill="none" stroke="currentColor" stroke-width="2"/>',
    fix: '<path d="M14 4a5 5 0 0 0-5 7l-5 5 3 3 5-5a5 5 0 0 0 7-5l-3 3-3-3z" fill="none" stroke="currentColor" stroke-width="2"/>',
    check: '<circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 15l5 5" stroke="currentColor" stroke-width="2"/>',
    handoff: '<path d="M4 12h12M12 7l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2"/>',
    hint: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3 11v2h6v-2a6 6 0 0 0-3-11z" fill="none" stroke="currentColor" stroke-width="2"/>',
    source: '<path d="M5 4h10l4 4v12H5z" fill="none" stroke="currentColor" stroke-width="2"/>',
    settings: '<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke="currentColor" stroke-width="2"/>',
  };
  const symbols = ids.map((i) => `<symbol id="icon-${i}" viewBox="0 0 24 24">${glyph[i]}</symbol>`).join('\n');
  emit('ICONS01', 'sprite', `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true">\n${symbols}\n</svg>\n`, { ja: 'アイコン集（仮素材）', en: 'Icon sprite (placeholder)' }, 'Single SVG sprite, 12 symbols, 24/48px');
}

// BADGES01 — six quest badges.
{
  const motifs = [
    '<rect x="20" y="16" width="24" height="32" rx="3" fill="none" stroke="currentColor" stroke-width="3"/>',
    '<circle cx="32" cy="30" r="10" fill="currentColor"/>',
    '<path d="M18 20h28v26H18z M18 28h28" fill="none" stroke="currentColor" stroke-width="3"/>',
    '<path d="M14 40 Q32 20 50 40" fill="none" stroke="currentColor" stroke-width="3"/>',
    '<ellipse cx="32" cy="30" rx="12" ry="16" fill="none" stroke="currentColor" stroke-width="3"/>',
    '<path d="M27 48 L29 18 L35 18 L37 48 Z" fill="currentColor"/>',
  ];
  const symbols = motifs
    .map((m, i) => `<symbol id="badge-q0${i + 1}" viewBox="0 0 64 64"><circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" stroke-width="3"/>${m}</symbol>`)
    .join('\n');
  emit('BADGES01', 'sprite', `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true">\n${symbols}\n</svg>\n`, { ja: '章の達成印（仮素材）', en: 'Quest badges (placeholder)' }, 'Single SVG sprite, 6 badges, 64px');
}

writeFileSync(join(root, 'src/content/asset-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`wrote ${manifest.length} placeholder assets`);
