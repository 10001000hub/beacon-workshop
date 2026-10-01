// MAP01 (2048×1536) and FX01 (768×768 mist). The map draws only the land: names, pins, mist and lit-up
// lights are HTML/CSS overlays (§10.4). Route: market → workshop → warehouse → bridge → inspection → lighthouse,
// harbour bottom-left, lighthouse upper-right (matches PIN_POS in src/ui/screens/story.ts).
import { cloud, crate, lantern, tree } from './props';
import { C, ell, g, layer, lightDef, lightWash, line, lin, P, poly, rect, rng, svgDoc, vignette, vignetteDef } from './lib';

const W = 2048;
const H = 1536;
const f = (n: number) => String(Math.round(n * 10) / 10);

/** Closed smooth blob through the given points. */
function blob(pts: [number, number][]): string {
  const n = pts.length;
  const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(pts[n - 1]!, pts[0]!);
  let d = `M${f(start[0])} ${f(start[1])}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i]!;
    const m = mid(p, pts[(i + 1) % n]!);
    d += `Q${f(p[0])} ${f(p[1])} ${f(m[0])} ${f(m[1])}`;
  }
  return d + 'Z';
}

/** Open smooth curve through points (Catmull-Rom → cubic). */
function smooth(pts: [number, number][]): string {
  let d = `M${f(pts[0]![0])} ${f(pts[0]![1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[Math.min(pts.length - 1, i + 2)]!;
    const c1: [number, number] = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: [number, number] = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

const ROAD: [number, number][] = [
  [200, 1215],
  [320, 1130],
  [470, 1090],
  [620, 1010],
  [800, 1010],
  [981, 900],
  [1140, 830],
  [1300, 720],
  [1450, 650],
  [1579, 521],
  [1690, 440],
  [1800, 300],
];
const PINS: [number, number][] = [
  [260, 1180],
  [620, 1010],
  [981, 900],
  [1300, 720],
  [1579, 521],
  [1800, 300],
];
const RIVER: [number, number][] = [
  [930, -40],
  [990, 160],
  [1040, 300],
  [1060, 380],
  [1160, 560],
  [1300, 720],
  [1420, 880],
  [1540, 1060],
  [1640, 1260],
  [1700, 1560],
];
const COAST: [number, number][] = [
  [-40, 1090],
  [140, 1230],
  [250, 1350],
  [380, 1410],
  [560, 1450],
  [700, 1490],
  [790, 1580],
  [-40, 1580],
];

function nearRoad(x: number, y: number, d: number): boolean {
  // sample the road densely by interpolating between its control points
  for (let i = 0; i < ROAD.length - 1; i++) {
    const [x0, y0] = ROAD[i]!;
    const [x1, y1] = ROAD[i + 1]!;
    for (let t = 0; t <= 1; t += 0.1) if (Math.hypot(x0 + (x1 - x0) * t - x, y0 + (y1 - y0) * t - y) < d) return true;
  }
  return false;
}
function nearRiver(x: number, y: number, d: number): boolean {
  for (let i = 0; i < RIVER.length - 1; i++) {
    const [x0, y0] = RIVER[i]!;
    const [x1, y1] = RIVER[i + 1]!;
    for (let t = 0; t <= 1; t += 0.1) if (Math.hypot(x0 + (x1 - x0) * t - x, y0 + (y1 - y0) * t - y) < d) return true;
  }
  return false;
}
function inSea(x: number, y: number): boolean {
  // coast is a monotone curve; test against a straight approximation per segment
  for (let i = 0; i < COAST.length - 3; i++) {
    const [x0, y0] = COAST[i]!;
    const [x1, y1] = COAST[i + 1]!;
    if (x >= x0 - 60 && x <= x1 + 60) {
      const t = (x - x0) / (x1 - x0 || 1);
      if (y > y0 + (y1 - y0) * Math.max(0, Math.min(1, t)) - 70) return true;
    }
  }
  return false;
}

export function map01(): string {
  const r = rng(2048);
  const defs = lin('seag', [[0, '#7FB6B3'], [1, '#2F6F76']], 0, 0, 0.4, 1) + vignetteDef(0.32) + lightDef + lin('cliff', [[0, '#CFC8B6'], [1, '#9C9585']]);
  const out: string[] = [];
  out.push(`<rect width="${W}" height="${H}" fill="#E7DDC6"/>`);
  // land base + rising contour layers toward the upper right
  out.push(layer([`<rect x="30" y="30" width="${W - 60}" height="${H - 60}" rx="28" fill="#C9D2AE" stroke="${C.line}" stroke-width="2.6"/>`], 'pieceSoft'));
  out.push(
    layer([
      P(blob([[760, 900], [1000, 640], [1250, 420], [1500, 180], [1800, 50], [2030, 40], [2030, 980], [1700, 1180], [1300, 1080], [980, 1050]]), '#BBC99D', { sw: 2.4 }),
      P(blob([[1300, 700], [1480, 420], [1700, 210], [2030, 100], [2030, 760], [1800, 880], [1520, 860]]), '#A9BD8B', { sw: 2.4 }),
    ], 'pieceSoft'),
  );
  // river, then sea with a sandy shore
  out.push(
    layer([
      line(smooth(RIVER), '#2f6f76', 92),
      line(smooth(RIVER), C.sea, 78),
      line(smooth(RIVER), C.seaLight, 46, 'opacity="0.7"'),
    ], 'piece'),
  );
  const coastPath = smooth(COAST.slice(0, 7)) + `L790 1580L-40 1580Z`;
  out.push(
    layer([
      `<path d="${coastPath}" fill="#E8D9A8" stroke="${C.line}" stroke-width="2.4" transform="translate(30 -34)"/>`,
      `<path d="${coastPath}" fill="url(#seag)" stroke="${C.line}" stroke-width="2.6"/>`,
      `<path d="${coastPath}" fill="${C.seaLight}" opacity="0.28" transform="translate(-40 60) scale(0.92)"/>`,
    ], 'piece'),
  );
  // wave ticks
  const waves: string[] = [];
  for (let i = 0; i < 28; i++) {
    const x = r() * 700;
    const y = 1300 + r() * 230;
    if (!inSea(x, y) || y < COAST[0]![1] + 30) continue;
    waves.push(line(`M${f(x)} ${f(y)}q16 -12 32 0t32 0`, '#CFE9E4', 4, 'opacity="0.75"'));
  }
  out.push(g(waves));
  // cliff for the lighthouse
  out.push(layer([P(blob([[1730, 340], [1790, 250], [1910, 220], [2020, 250], [2025, 440], [1920, 480], [1790, 450]]), 'url(#cliff)', { sw: 2.6 })], 'piece'));
  // road
  out.push(
    layer([
      line(smooth(ROAD), '#8a7a5a', 54),
      line(smooth(ROAD), '#F3E6C6', 42),
      line(smooth(ROAD), '#D6C195', 4, 'stroke-dasharray="2 22"'),
    ], 'piece'),
  );
  // trees (kept away from the road, river, sea and the six places)
  const trees: string[] = [];
  const tpts: { x: number; y: number; s: number }[] = [];
  for (let i = 0; i < 400 && tpts.length < 70; i++) {
    const x = 70 + r() * (W - 140);
    const y = 90 + r() * (H - 180);
    if (nearRoad(x, y, 95) || nearRiver(x, y, 100) || inSea(x, y)) continue;
    if (PINS.some(([px, py]) => Math.abs(x - px) < 170 && y > py - 110 && y < py + 160)) continue;
    if (x > 1700 && y > 150 && y < 500) continue;
    if (tpts.some((t) => Math.hypot(t.x - x, t.y - y) < 70)) continue;
    tpts.push({ x, y, s: 0.8 + r() * 0.7 });
  }
  tpts.sort((a, b) => a.y - b.y);
  for (const t of tpts) trees.push(tree(t.x, t.y, t.s, t.x > 1100 ? '#4C8E68' : C.verified, t.x > 1100 ? '#5FA37A' : '#3A8A6E'));
  out.push(layer(trees, 'piece'));

  // 1 market stalls (260,1180)
  const sx = 260;
  const sy = 1180;
  const stall = (x: number, y: number, a: string, b: string) => [
    rect(x - 4, y + 10, 8, 56, 2, C.woodDark, { sw: 1.8 }),
    rect(x + 56, y + 10, 8, 56, 2, C.woodDark, { sw: 1.8 }),
    rect(x, y + 44, 68, 26, 3, C.wood, { sw: 2 }),
    poly([[x - 10, y + 12], [x + 78, y + 12], [x + 68, y - 12], [x, y - 12]], a, { sw: 2.2 }),
    poly([[x + 10, y + 12], [x + 28, y + 12], [x + 24, y - 12], [x + 8, y - 12]], b, { sw: 0, stroke: 'none' }),
    poly([[x + 44, y + 12], [x + 62, y + 12], [x + 58, y - 12], [x + 42, y - 12]], b, { sw: 0, stroke: 'none' }),
  ];
  out.push(layer([...stall(sx - 120, sy + 20, C.teal, '#F5EEDC'), ...stall(sx - 30, sy + 40, '#6A6174', '#F5EEDC'), ...stall(sx + 60, sy + 20, '#C65A4F', '#F5EEDC'), crate(sx - 60, sy + 96, 36, 26), crate(sx + 4, sy + 102, 30, 22, C.wood)], 'piece'));
  // pier + boats in the harbour
  out.push(
    layer([
      rect(150, 1300, 150, 22, 3, C.woodLight, { sw: 2.2 }),
      rect(150, 1300, 12, 70, 2, C.woodDark, { sw: 1.8 }),
      rect(288, 1300, 12, 70, 2, C.woodDark, { sw: 1.8 }),
      P('M90 1470Q160 1520 250 1470L230 1448H110Z', '#C65A4F', { sw: 2.2 }),
      poly([[170, 1448], [170, 1370], [222, 1448]], '#FBF6EA', { sw: 2 }),
      P('M330 1500Q400 1540 480 1500L462 1478H348Z', C.wood, { sw: 2.2 }),
      poly([[408, 1478], [408, 1416], [452, 1478]], '#F3D9A0', { sw: 2 }),
      ell(60, 1330, 11, 11, C.repair, { sw: 2 }),
      ell(570, 1440, 11, 11, C.light, { sw: 2 }),
    ], 'piece'),
  );

  // 2 workshop (620,1010) — house below the label
  const wx = 620;
  const wy = 1070;
  out.push(
    layer([
      rect(wx - 62, wy - 30, 124, 90, 4, C.woodLight, { sw: 2.4 }),
      poly([[wx - 78, wy - 28], [wx, wy - 92], [wx + 78, wy - 28]], C.teal, { sw: 2.6 }),
      rect(wx + 30, wy - 94, 20, 40, 2, C.stoneDark, { sw: 2.2 }),
      rect(wx - 44, wy - 6, 34, 36, 3, '#FFE3A0', { sw: 2.2 }),
      rect(wx + 6, wy + 4, 36, 56, 3, C.woodDark, { sw: 2.2 }),
      line(`M${wx - 44} ${wy + 12}H${wx - 10}M${wx - 27} ${wy - 6}V${wy + 30}`, C.woodDark, 2),
      ell(wx - 90, wy + 40, 16, 16, C.brass, { sw: 2.2 }),
    ], 'piece'),
  );
  // 3 warehouse (981,900)
  const hx = 981;
  const hy = 960;
  out.push(
    layer([
      rect(hx - 110, hy - 24, 220, 84, 4, '#D9CDB0', { sw: 2.4 }),
      poly([[hx - 124, hy - 22], [hx - 96, hy - 66], [hx + 96, hy - 66], [hx + 124, hy - 22]], '#6A6174', { sw: 2.6 }),
      rect(hx - 40, hy - 4, 80, 64, 3, C.woodDark, { sw: 2.4 }),
      line(`M${hx} ${hy - 4}V${hy + 60}`, C.wood, 3),
      rect(hx - 96, hy - 4, 36, 28, 3, '#FFE3A0', { sw: 2 }),
      rect(hx + 60, hy - 4, 36, 28, 3, '#FFE3A0', { sw: 2 }),
      crate(hx + 120, hy + 24, 40, 34),
      crate(hx - 160, hy + 28, 36, 30, C.wood),
    ], 'piece'),
  );
  // 4 bridge over the river (1300,720): rotated along the road
  out.push(
    layer([
      g(
        [
          P('M-150 8H150V44H-150Z', C.stoneDark, { sw: 2.6 }),
          P('M-120 44V30A44 44 0 0 1 -32 30V44ZM32 44V30A44 44 0 0 1 120 30V44Z', C.sea, { sw: 2.2 }),
          rect(-156, -14, 312, 26, 5, C.stone, { sw: 2.6 }),
          line('M-140 -14V-40M-70 -14V-40M0 -14V-40M70 -14V-40M140 -14V-40M-140 -36H140', C.woodDark, 4),
        ],
        `transform="translate(1300 745) rotate(-32)"`,
      ),
      // blank tag hanging on the rail
      g([P('M-10 -4H10L14 8V34H-14V8Z', '#F5EEDC', { sw: 2 })], `transform="translate(1300 790)"`),
    ], 'piece'),
  );
  // 5 inspection pavilion (1579,521)
  const ix = 1579;
  const iy = 590;
  out.push(
    layer([
      poly([[ix - 70, iy + 56], [ix - 56, iy - 24], [ix + 56, iy - 24], [ix + 70, iy + 56]], '#D9CDB0', { sw: 2.4 }),
      P(`M${ix - 80} ${iy - 22}Q${ix} ${iy - 110} ${ix + 80} ${iy - 22}Z`, C.teal, { sw: 2.6 }),
      ell(ix, iy + 14, 28, 28, '#CFE3E0', { sw: 4, stroke: C.brass }),
      P(`M${ix - 16} ${iy + 2}Q${ix - 8} ${iy - 8} ${ix + 6} ${iy - 10}`, 'none', { sw: 3, stroke: '#ffffff', op: 0.8 }),
      rect(ix - 80, iy + 54, 160, 16, 3, C.stoneDark, { sw: 2.2 }),
      ell(ix, iy - 106, 8, 8, C.light, { sw: 2 }),
    ], 'piece'),
  );
  // 6 lighthouse (tower to the right of its label)
  const lx = 1905;
  const ly = 400;
  out.push(
    layer([
      P(`M${lx - 52} ${ly}L${lx - 36} ${ly - 190}H${lx + 36}L${lx + 52} ${ly}Z`, '#F5EEDC', { sw: 2.8 }),
      P(`M${lx - 46} ${ly - 60}L${lx - 42} ${ly - 100}H${lx + 42}L${lx + 46} ${ly - 60}Z`, C.teal, { sw: 0, stroke: 'none' }),
      P(`M${lx - 40} ${ly - 150}L${lx - 37} ${ly - 186}H${lx + 37}L${lx + 40} ${ly - 150}Z`, C.teal, { sw: 0, stroke: 'none' }),
      rect(lx - 50, ly - 214, 100, 26, 5, C.harbor, { sw: 2.6 }),
      rect(lx - 32, ly - 258, 64, 48, 6, '#FFE9A8', { sw: 2.8 }),
      line(`M${lx} ${ly - 258}V${ly - 210}M${lx - 16} ${ly - 258}V${ly - 210}M${lx + 16} ${ly - 258}V${ly - 210}`, C.brass, 2.4),
      poly([[lx - 44, ly - 258], [lx, ly - 300], [lx + 44, ly - 258]], C.harbor, { sw: 2.6 }),
      rect(lx - 14, ly - 40, 28, 40, 14, C.woodDark, { sw: 2.2 }),
      rect(lx - 62, ly - 2, 124, 20, 4, C.stoneDark, { sw: 2.2 }),
    ], 'piece'),
  );
  out.push(`<circle cx="${lx}" cy="${ly - 234}" r="70" fill="${C.amber}" opacity="0.32" filter="url(#blur20)"/>`);
  out.push(lantern(1700, 480, 14, false), lantern(1460, 600, 14, false));
  // drifting paper clouds (decorative, low contrast)
  out.push(layer([cloud(430, 220, 1.6, '#F8F2E4'), cloud(980, 150, 1.2, '#F8F2E4'), cloud(1160, 1220, 1.4, '#F8F2E4')], 'pieceSoft', 'opacity="0.55"'));
  out.push(lightWash(W, H), vignette(W, H));
  return svgDoc(W, H, defs, out.join('\n'), 'Map of Lumen harbor town');
}

export function fx01(): string {
  const r = rng(77);
  const out: string[] = [];
  const defs = `<radialGradient id="puff" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#6c7784" stop-opacity="0.55"/><stop offset="1" stop-color="#6c7784" stop-opacity="0"/></radialGradient>`;
  // soft underlay
  out.push(`<g filter="url(#blur20)">`);
  for (let i = 0; i < 7; i++) out.push(`<circle cx="${180 + r() * 400}" cy="${240 + r() * 280}" r="${110 + r() * 70}" fill="#59636f" opacity="0.5"/>`);
  out.push('</g>');
  // thin curved paper slivers gathered into a cloud (dark, soft; no text)
  const tones = ['#5b6672', '#69747f', '#7D8792', '#8993a0', '#4f5a66'];
  const slivers: string[] = [];
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2;
    const rad = Math.sqrt(r()) * 250;
    const cx = 384 + Math.cos(a) * rad * 1.05;
    const cy = 384 + Math.sin(a) * rad * 0.72;
    const len = 90 + r() * 120;
    const th = 14 + r() * 22;
    const rot = (r() - 0.5) * 70;
    slivers.push(
      `<g transform="rotate(${f(rot)} ${f(cx)} ${f(cy)})"><path d="M${f(cx - len / 2)} ${f(cy)}Q${f(cx)} ${f(cy - th * 1.4)} ${f(cx + len / 2)} ${f(cy)}Q${f(cx)} ${f(cy + th * 0.8)} ${f(cx - len / 2)} ${f(cy)}Z" fill="${tones[i % tones.length]}" fill-opacity="${f(0.62 + r() * 0.3)}" stroke="#3a444f" stroke-opacity="0.55" stroke-width="1.8" stroke-linejoin="round"/></g>`,
    );
  }
  out.push(layer(slivers, 'pieceSoft'));
  out.push(`<ellipse cx="330" cy="330" rx="170" ry="110" fill="url(#puff)" opacity="0.5"/>`);
  return svgDoc(768, 768, defs, out.join('\n'), 'Mist');
}
