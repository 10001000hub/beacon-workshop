// Asset manifest entries (§10.4, §10.6). `status: 'candidate'` = original code-drawn art awaiting owner visual review.
export interface ManifestEntry {
  id: string;
  kind: 'map' | 'background' | 'character' | 'effect' | 'logo' | 'sprite';
  path: string;
  alt: { ja: string; en: string };
  finalSpec: string;
  status: 'candidate';
}

const bg = (id: string, ja: string, en: string): ManifestEntry => ({
  id, kind: 'background', path: `assets/art/${id}.webp`, alt: { ja, en }, finalSpec: '1920×1080 WebP, no embedded text', status: 'candidate',
});

const people: [string, string, string][] = [['nagi', 'ナギ', 'Nagi'], ['koto', 'コト', 'Koto'], ['ritsu', 'リツ', 'Ritsu']];
const exprs: [string, string, string][] = [['normal', '通常', 'normal'], ['think', '考える', 'thinking'], ['happy', '喜ぶ', 'happy']];

export function buildManifest(): ManifestEntry[] {
  const out: ManifestEntry[] = [
    { id: 'MAP01', kind: 'map', path: 'assets/art/MAP01.webp', alt: { ja: '港町ルーメンの地図。港から灯台まで一本の道が続く', en: 'Map of Lumen harbor town: one road runs from the harbor to the lighthouse' }, finalSpec: '2048×1536 WebP, text/pins overlaid in HTML', status: 'candidate' },
    bg('BG01', '市場の依頼机', 'Market request desk'),
    bg('BG02', '工房の作業机', 'Workshop bench'),
    bg('BG03', '記録倉庫の棚', 'Record warehouse shelves'),
    bg('BG04', '伝言橋', 'Message bridge'),
    bg('BG05', '鏡の検査机', 'Mirror inspection desk'),
    bg('BG06', '灯台の内部', 'Lighthouse interior'),
  ];
  let n = 1;
  for (const [, pja, pen] of people) {
    for (const [, eja, een] of exprs) {
      out.push({ id: `CH0${n++}`, kind: 'character', path: `assets/art/CH0${n - 1}.webp`, alt: { ja: `${pja}（${eja}）`, en: `${pen} (${een})` }, finalSpec: '768×1024 transparent WebP', status: 'candidate' });
    }
  }
  out.push(
    { id: 'FX01', kind: 'effect', path: 'assets/art/FX01.webp', alt: { ja: '紙片のモヤ', en: 'Mist of paper slivers' }, finalSpec: '768×768 transparent WebP', status: 'candidate' },
    { id: 'LOGO01', kind: 'logo', path: 'assets/art/LOGO01.svg', alt: { ja: 'Beacon Workshop の印（灯台と帳面）', en: 'Beacon Workshop mark (lighthouse and notebook)' }, finalSpec: 'Original vector SVG', status: 'candidate' },
    { id: 'ICONS01', kind: 'sprite', path: 'assets/art/ICONS01.svg', alt: { ja: 'アイコン集', en: 'Icon sprite' }, finalSpec: 'Single SVG sprite, 12 symbols, 24/48px', status: 'candidate' },
    { id: 'BADGES01', kind: 'sprite', path: 'assets/art/BADGES01.svg', alt: { ja: '章の達成印', en: 'Quest badges' }, finalSpec: 'Single SVG sprite, 6 badges, 64px', status: 'candidate' },
  );
  return out;
}
