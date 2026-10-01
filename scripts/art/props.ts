// Reusable paper props for the scene backgrounds.
import { C, ell, g, line, P, poly, rect, rng } from './lib';

/** Striped market awning with a scalloped lower edge. */
export function awning(x: number, y: number, w: number, h: number, a: string, b: string, stripes = 8): string {
  const sw = w / stripes;
  const out: string[] = [];
  for (let i = 0; i < stripes; i++) {
    const x0 = x + i * sw;
    out.push(P(`M${x0} ${y}H${x0 + sw}L${x0 + sw + 3} ${y + h - 14}Q${x0 + sw / 2} ${y + h + 10} ${x0 - 3} ${y + h - 14}Z`, i % 2 ? b : a, { sw: 2 }));
  }
  return out.join('');
}

export function crate(x: number, y: number, w: number, h: number, fill = C.woodLight): string {
  return (
    rect(x, y, w, h, 4, fill, { sw: 2.2 }) +
    line(`M${x + 4} ${y + h * 0.33}H${x + w - 4}M${x + 4} ${y + h * 0.66}H${x + w - 4}`, C.woodDark, 2, 'opacity="0.55"') +
    line(`M${x + 8} ${y + 4}L${x + w - 8} ${y + h - 4}`, C.woodDark, 2, 'opacity="0.35"')
  );
}

export function lantern(x: number, y: number, r = 18, glow = true): string {
  return (
    (glow ? `<circle cx="${x}" cy="${y}" r="${r * 2.6}" fill="${C.amber}" opacity="0.28" filter="url(#blur8)"/>` : '') +
    line(`M${x} ${y - r - 18}V${y - r + 2}`, C.line, 2.4) +
    rect(x - r * 0.45, y - r - 4, r * 0.9, 8, 3, C.brass, { sw: 2 }) +
    ell(x, y, r * 0.82, r, '#FFE3A0', { sw: 2.4 }) +
    line(`M${x - r * 0.4} ${y - r * 0.7}Q${x - r * 0.5} ${y} ${x - r * 0.4} ${y + r * 0.7}M${x + r * 0.4} ${y - r * 0.7}Q${x + r * 0.5} ${y} ${x + r * 0.4} ${y + r * 0.7}`, '#c99a45', 1.6) +
    rect(x - r * 0.45, y + r - 4, r * 0.9, 8, 3, C.brass, { sw: 2 })
  );
}

/** Blank paper tag (札) with a string hole. */
export function tag(x: number, y: number, rot: number, fill: string, w = 74, h = 100): string {
  return g(
    [
      P(`M${x - w / 2 + 14} ${y - h / 2}H${x + w / 2 - 14}L${x + w / 2} ${y - h / 2 + 18}V${y + h / 2 - 6}Q${x + w / 2} ${y + h / 2} ${x + w / 2 - 6} ${y + h / 2}H${x - w / 2 + 6}Q${x - w / 2} ${y + h / 2} ${x - w / 2} ${y + h / 2 - 6}V${y - h / 2 + 18}Z`, fill, { sw: 2 }),
      ell(x, y - h / 2 + 15, 5.5, 5.5, '#2a373d', { sw: 0, stroke: 'none', op: 0.65 }),
      line(`M${x} ${y - h / 2 + 15}Q${x + 14} ${y - h / 2 - 12} ${x + 30} ${y - h / 2 - 8}`, '#6b5a40', 2),
    ],
    `transform="rotate(${rot} ${x} ${y})"`,
  );
}

export function sheet(x: number, y: number, w: number, h: number, rot: number, fill = '#FBF8F0'): string {
  return g(
    [
      P(`M${x} ${y}H${x + w}V${y + h}H${x}Z`, fill, { sw: 2 }),
      P(`M${x + w - 28} ${y + h}L${x + w} ${y + h - 28}V${y + h}Z`, '#e3dac4', { sw: 1.6 }),
    ],
    `transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"`,
  );
}

export function book(x: number, y: number, w: number, h: number, fill: string, band = true): string {
  return (
    rect(x, y, w, h, 3, fill, { sw: 2 }) +
    (band ? line(`M${x + 2} ${y + h * 0.2}H${x + w - 2}M${x + 2} ${y + h * 0.8}H${x + w - 2}`, 'rgba(255,255,255,0.55)', 2.2) : '')
  );
}

/** A shelf unit: boards and a row of books/boxes per shelf. */
export function shelfUnit(x: number, y: number, w: number, rows: number, rowH: number, seed: number, palette: string[], flip = false): string {
  const r = rng(seed);
  const out: string[] = [];
  const h = rows * rowH + 18;
  out.push(rect(x - 14, y - 14, w + 28, h + 14, 6, C.woodDark, { sw: 2.6 }));
  out.push(rect(x, y, w, h - 4, 3, '#5a3b25', { sw: 2 }));
  for (let i = 0; i < rows; i++) {
    const by = y + (i + 1) * rowH;
    let cx = x + 10;
    while (cx < x + w - 24) {
      const bw = 20 + r() * 26;
      const bh = rowH * (0.5 + r() * 0.38);
      const kind = r();
      const col = palette[Math.floor(r() * palette.length)]!;
      if (kind < 0.72) out.push(book(cx, by - 8 - bh, bw, bh, col));
      else out.push(crate(cx, by - 8 - bh * 0.8, bw + 14, bh * 0.8, C.woodLight));
      cx += bw + (kind < 0.72 ? 3 : 17);
    }
    out.push(rect(x - 6, by - 8, w + 12, 14, 3, C.wood, { sw: 2.2 }));
  }
  return flip ? g(out, `transform="translate(${2 * x + w} 0) scale(-1 1)"`) : g(out);
}

export function gear(cx: number, cy: number, r: number, fill = C.brass, teeth = 10): string {
  const pts: [number, number][] = [];
  for (let i = 0; i < teeth * 2; i++) {
    const a = (Math.PI * 2 * i) / (teeth * 2);
    const rr = i % 2 ? r * 0.82 : r;
    const a2 = a + (Math.PI / teeth) * 0.5;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    pts.push([cx + Math.cos(a2) * rr, cy + Math.sin(a2) * rr]);
  }
  return poly(pts, fill, { sw: 2.2 }) + ell(cx, cy, r * 0.28, r * 0.28, C.woodDark, { sw: 2 });
}

/** Paper cloud. */
export function cloud(x: number, y: number, s: number, fill = '#FBF6EA'): string {
  return P(`M${x} ${y}Q${x - 10 * s} ${y - 36 * s} ${x + 40 * s} ${y - 34 * s}Q${x + 62 * s} ${y - 74 * s} ${x + 110 * s} ${y - 46 * s}Q${x + 160 * s} ${y - 62 * s} ${x + 168 * s} ${y - 20 * s}Q${x + 200 * s} ${y - 4 * s} ${x + 170 * s} ${y}Z`, fill, { sw: 2.2 });
}

/** Small paper cone tree. */
export function tree(x: number, y: number, s: number, a = C.verified, b = '#3A8A6E'): string {
  return (
    rect(x - 5 * s, y - 14 * s, 10 * s, 18 * s, 2, C.woodDark, { sw: 1.8 }) +
    poly([[x - 28 * s, y - 10 * s], [x, y - 66 * s], [x + 28 * s, y - 10 * s]], a, { sw: 2 }) +
    poly([[x - 22 * s, y - 40 * s], [x, y - 92 * s], [x + 22 * s, y - 40 * s]], b, { sw: 2 })
  );
}

/** Plank lines over a rect region (wood grain feel). */
export function plankLines(x: number, y: number, w: number, h: number, count: number, color = C.woodDark, op = 0.35): string {
  const out: string[] = [];
  for (let i = 1; i < count; i++) out.push(line(`M${x} ${y + (h * i) / count}H${x + w}`, color, 2.2, `opacity="${op}"`));
  return out.join('');
}
