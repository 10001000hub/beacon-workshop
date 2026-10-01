// Tiny SVG authoring helpers for the original paper-diorama art (§10.1).
// Everything here is code written for this repo; there is no third-party artwork, stock asset,
// font, or network/AI call. The look comes from three things: flat paper pieces with a dark
// hand-drawn contour, a displacement filter that wobbles each layer's edge slightly, and a
// paper-fibre lighting filter with a soft drop shadow toward the lower right (light = upper left, §10.5).

export const C = {
  ink: '#202830',
  line: '#2a373d',
  paper: '#F5F0E6',
  ivory: '#EFE6D2',
  cream: '#EADFC8',
  harbor: '#203F49',
  teal: '#2F7F7A',
  tealDark: '#245E5C',
  tealLight: '#5FA9A0',
  light: '#E5B85A',
  amber: '#F0C873',
  mist: '#7D8792',
  repair: '#A73D42',
  verified: '#226B56',
  wood: '#A9784A',
  woodDark: '#7C5233',
  woodLight: '#C79A66',
  brass: '#B98F3E',
  brassLight: '#DDB765',
  leather: '#8A5A36',
  slate: '#34414A',
  plum: '#4B4452',
  plumLight: '#6A6174',
  skin: '#E8BC98',
  skinShade: '#CF9E7C',
  sea: '#3C7F86',
  seaDeep: '#2A5F68',
  seaLight: '#7FB6B3',
  stone: '#B9B2A2',
  stoneDark: '#8F8A7D',
};

export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number) => String(Math.round(n * 10) / 10);

export interface Style {
  stroke?: string;
  sw?: number;
  op?: number;
  fillOp?: number;
  extra?: string;
}

/** A paper piece: filled path with a dark contour. */
export function P(d: string, fill: string, s: Style = {}): string {
  const stroke = s.stroke ?? C.line;
  const sw = s.sw ?? 2.4;
  const op = s.op !== undefined ? ` opacity="${s.op}"` : '';
  const fo = s.fillOp !== undefined ? ` fill-opacity="${s.fillOp}"` : '';
  const strokeAttr =
    stroke === 'none' ? ' stroke="none"' : ` stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"`;
  return `<path d="${d}" fill="${fill}"${fo}${strokeAttr}${op}${s.extra ? ' ' + s.extra : ''}/>`;
}

export const rect = (x: number, y: number, w: number, h: number, r: number, fill: string, s: Style = {}) =>
  P(
    `M${f(x + r)} ${f(y)}H${f(x + w - r)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)}V${f(y + h - r)}Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)}H${f(x + r)}Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)}V${f(y + r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Z`,
    fill,
    s,
  );

export const ell = (cx: number, cy: number, rx: number, ry: number, fill: string, s: Style = {}) =>
  P(`M${f(cx - rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)} ${f(cy)}Z`, fill, s);

export const poly = (pts: [number, number][], fill: string, s: Style = {}) =>
  P(`M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}Z`, fill, s);

/** Open stroke only. */
export function line(d: string, color: string, w = 3, extra = ''): string {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
}

/** A wavy horizontal ribbon (paper hill / wave band) from x0 to x1, filled down to `bottom`. */
export function band(x0: number, x1: number, y: number, amp: number, wavelength: number, bottom: number, fill: string, phase = 0, s: Style = {}): string {
  const pts: string[] = [];
  const step = wavelength / 2;
  let x = x0;
  let i = 0;
  pts.push(`M${f(x0)} ${f(bottom)}L${f(x0)} ${f(y + Math.sin(phase) * amp)}`);
  while (x < x1) {
    const nx = Math.min(x + step, x1);
    const cy1 = y + Math.sin(phase + i * 1.7) * amp;
    const ny = y + Math.sin(phase + (i + 1) * 1.7) * amp;
    pts.push(`Q${f((x + nx) / 2)} ${f(cy1 - amp * 0.6)} ${f(nx)} ${f(ny)}`);
    x = nx;
    i++;
  }
  pts.push(`L${f(x1)} ${f(bottom)}Z`);
  return P(pts.join(''), fill, s);
}

export const g = (inner: string[] | string, attrs = '') => `<g ${attrs}>${Array.isArray(inner) ? inner.join('') : inner}</g>`;
/** Layer: one filter pass (wobble + paper fibre + shadow) over a group of pieces. */
export const layer = (inner: string[] | string, filter: 'piece' | 'pieceSoft' | 'pieceFlat' = 'piece', attrs = '') =>
  g(inner, `filter="url(#${filter})" ${attrs}`);

export function lin(id: string, stops: [number, string, number?][], x1 = 0, y1 = 0, x2 = 0, y2 = 1): string {
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops
    .map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`)
    .join('')}</linearGradient>`;
}
export function rad(id: string, stops: [number, string, number?][], cx = 0.5, cy = 0.5, r = 0.5): string {
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops
    .map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`)
    .join('')}</radialGradient>`;
}

/** Shared filters. `piece` = wobble + fibre + lower-right shadow; `pieceSoft` = softer, larger shadow (far layers); `pieceFlat` = wobble + fibre only. */
export const FILTERS = `
<filter id="piece" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="2" seed="7" result="warp"/>
  <feDisplacementMap in="SourceGraphic" in2="warp" scale="5" xChannelSelector="R" yChannelSelector="G" result="shape"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="3" seed="2" result="fibre"/>
  <feDiffuseLighting in="fibre" surfaceScale="0.8" lighting-color="#ffffff" result="lit"><feDistantLight azimuth="225" elevation="70"/></feDiffuseLighting>
  <feComposite in="shape" in2="lit" operator="arithmetic" k1="1.1" k2="0" k3="0" k4="0" result="tex"/>
  <feComposite in="tex" in2="shape" operator="in" result="body"/>
  <feDropShadow in="body" dx="5" dy="8" stdDeviation="4.5" flood-color="#14262c" flood-opacity="0.34"/>
</filter>
<filter id="pieceSoft" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="11" result="warp"/>
  <feDisplacementMap in="SourceGraphic" in2="warp" scale="7" xChannelSelector="R" yChannelSelector="G" result="shape"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" seed="5" result="fibre"/>
  <feDiffuseLighting in="fibre" surfaceScale="0.7" lighting-color="#ffffff" result="lit"><feDistantLight azimuth="225" elevation="72"/></feDiffuseLighting>
  <feComposite in="shape" in2="lit" operator="arithmetic" k1="1.08" k2="0" k3="0" k4="0" result="tex"/>
  <feComposite in="tex" in2="shape" operator="in" result="body"/>
  <feDropShadow in="body" dx="8" dy="12" stdDeviation="9" flood-color="#14262c" flood-opacity="0.28"/>
</filter>
<filter id="pieceFlat" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="4" result="warp"/>
  <feDisplacementMap in="SourceGraphic" in2="warp" scale="3" xChannelSelector="R" yChannelSelector="G" result="shape"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" seed="9" result="fibre"/>
  <feDiffuseLighting in="fibre" surfaceScale="0.7" lighting-color="#ffffff" result="lit"><feDistantLight azimuth="225" elevation="72"/></feDiffuseLighting>
  <feComposite in="shape" in2="lit" operator="arithmetic" k1="1.08" k2="0" k3="0" k4="0" result="tex"/>
  <feComposite in="tex" in2="shape" operator="in"/>
</filter>
<filter id="blur8" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="8"/></filter>
<filter id="blur20" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="20"/></filter>
<filter id="blur40" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>`;

export function svgDoc(w: number, h: number, defs: string, body: string, title: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n<title>${title}</title>\n<defs>${FILTERS}${defs}</defs>\n${body}\n</svg>\n`;
}

/** Soft vignette so the centre stays calm (§10.5: quiet central ~50%). */
export const vignetteDef = (strength = 0.28) => rad('vig', [[0.45, '#14262c', 0], [1, '#14262c', strength]], 0.5, 0.5, 0.78);
export const vignette = (w: number, h: number) => `<rect width="${w}" height="${h}" fill="url(#vig)"/>`;

/** Soft light wash from the upper left. */
export const lightDef = rad('lightwash', [[0, '#FFF3D0', 0.55], [1, '#FFF3D0', 0]], 0.1, 0.05, 0.9);
export const lightWash = (w: number, h: number) => `<rect width="${w}" height="${h}" fill="url(#lightwash)"/>`;
