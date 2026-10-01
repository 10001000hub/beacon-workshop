// Vector marks: logo, 12-icon sprite and 6-badge sprite. Original shapes, no scripts, no external refs.
import { C } from './lib';

const NS = 'xmlns="http://www.w3.org/2000/svg"';
const S = 'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';

export function logo01(): string {
  const o = `stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"`;
  return `<svg ${NS} viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Beacon Workshop mark">
<circle cx="32" cy="14" r="12" fill="${C.light}" opacity="0.28"/>
<path d="M23 54 L27 22 H37 L41 54 Z" fill="${C.paper}" ${o}/>
<path d="M25.4 40 L26.3 32 H37.7 L38.6 40 Z" fill="${C.repair}" opacity="0.9"/>
<rect x="24" y="15" width="16" height="8" rx="1.5" fill="${C.light}" ${o}/>
<path d="M23 15 L32 6 L41 15 Z" fill="${C.harbor}" ${o}/>
<path d="M6 54 H58 V59 Q32 63 6 59 Z" fill="${C.harbor}" ${o}/>
<path d="M10 54 L10 46 Q20 44 29 47 V54 Z M54 54 V46 Q44 44 35 47 V54 Z" fill="${C.paper}" ${o}/>
</svg>
`;
}

const ICON_IDS = ['purpose', 'material', 'constraint', 'done', 'make', 'change', 'fix', 'check', 'handoff', 'hint', 'source', 'settings'] as const;

const ICON_GLYPH: Record<(typeof ICON_IDS)[number], string> = {
  purpose: `<circle cx="12" cy="12" r="8.5" ${S}/><circle cx="12" cy="12" r="4.5" ${S}/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>`,
  material: `<path d="M5 4.5h14v15H5z" ${S}/><path d="M8.5 9h7M8.5 12.5h7M8.5 16h4" ${S}/>`,
  constraint: `<rect x="5" y="11" width="14" height="9" rx="2" ${S}/><path d="M8 11V8a4 4 0 0 1 8 0v3" ${S}/><circle cx="12" cy="15.5" r="1.2" fill="currentColor"/>`,
  done: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M8 12.3l2.9 2.9L16.2 9.5" ${S}/>`,
  make: `<path d="M4.5 19.5l1-4.2L16 4.8a1.8 1.8 0 0 1 2.6 0l.6.6a1.8 1.8 0 0 1 0 2.6L8.7 18.5z" ${S}/><path d="M14.5 6.5l3 3" ${S}/>`,
  change: `<path d="M4.5 9h13.5l-3-3M19.5 15H6l3 3" ${S}/>`,
  fix: `<path d="M14.8 4.5a4.6 4.6 0 0 0-4.3 6.2L4.6 16.6a1.9 1.9 0 0 0 2.7 2.7l5.9-5.9a4.6 4.6 0 0 0 6.2-4.3l-2.9 2.1-2.2-2.2z" ${S}/>`,
  check: `<circle cx="10.5" cy="10.5" r="6" ${S}/><path d="M15 15l5 5" ${S}/><path d="M8 10.5l2 2 3-3.5" ${S}/>`,
  handoff: `<path d="M4 12h13M12.5 6.5L18 12l-5.5 5.5" ${S}/><path d="M20.5 5v14" ${S}/>`,
  hint: `<path d="M9.2 17.5h5.6M10 20.5h4M12 3.5a5.7 5.7 0 0 0-3.2 10.4V16h6.4v-2.1A5.7 5.7 0 0 0 12 3.5z" ${S}/>`,
  source: `<path d="M5.5 3.5h8.5l4.5 4.5v12.5h-13z" ${S}/><path d="M14 3.5V8h4.5" ${S}/><path d="M8.5 13h7M8.5 16.5h5" ${S}/>`,
  settings: `<circle cx="12" cy="12" r="3.2" ${S}/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" ${S}/>`,
};

export function icons01(): string {
  const symbols = ICON_IDS.map((i) => `<symbol id="icon-${i}" viewBox="0 0 24 24">${ICON_GLYPH[i]}</symbol>`).join('\n');
  return `<svg ${NS} aria-hidden="true">\n${symbols}\n</svg>\n`;
}

const B = 'fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"';
const B22 = 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
const B34 = 'fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"';
const BSOFT = 'fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"';
const F = 'fill="currentColor"';
const SOFT = 'fill="currentColor" fill-opacity="0.22"';

// Quest motifs: ticket, light, notebook, bridge, mirror, lighthouse.
const BADGE_MOTIFS = [
  `<path d="M17 21h30a2 2 0 0 1 2 2v5a4 4 0 0 0 0 8v5a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2v-5a4 4 0 0 0 0-8v-5a2 2 0 0 1 2-2z" ${BSOFT}/><path d="M26 22v20" ${B} stroke-dasharray="2.5 3.5"/><path d="M32 28h11M32 35h8" ${B}/>`,
  `<circle cx="32" cy="29" r="9.5" ${SOFT} stroke="currentColor" stroke-width="2.6"/><path d="M32 12v4M17 29h-4M51 29h-4M21.5 18.5l-2.8-2.8M42.5 18.5l2.8-2.8" ${B}/><path d="M27 44h10M28.5 49h7M29 38.5h6v5.5h-6z" ${B}/>`,
  `<path d="M18 15h25a3 3 0 0 1 3 3v28a3 3 0 0 1-3 3H18z" ${SOFT} stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/><path d="M18 15v34" ${B}/><path d="M25 24h14M25 31h14M25 38h8" ${B}/><path d="M44 12l6 6-7 9" ${B22}/>`,
  `<path d="M10 40h44" ${B}/><path d="M12 40a20 20 0 0 1 40 0" ${B}/><path d="M12 40a20 20 0 0 1 40 0z" ${SOFT}/><path d="M20 40V30M32 40V20M44 40V30" ${B22}/><path d="M10 47q5.5 3 11 0t11 0 11 0 11 0" ${B22}/>`,
  `<ellipse cx="29" cy="28" rx="11" ry="14" ${SOFT} stroke="currentColor" stroke-width="2.6"/><path d="M23 22q2-4 6-5" ${B22}/><path d="M36 38l11 12" ${B34}/><path d="M45 22l1.2 3 3 1.2-3 1.2L45 30.4l-1.2-3-3-1.2 3-1.2z" ${F}/>`,
  `<path d="M26 50l2.6-22h6.8L38 50z" ${SOFT} stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/><path d="M27.6 38h8.8" ${B22}/><rect x="27" y="20" width="10" height="8" rx="1.5" ${F}/><path d="M26 20l6-7 6 7z" ${B22}/><path d="M20 24l-5-2M44 24l5-2M20 30l-6 1M44 30l6 1" ${B22}/><path d="M20 50h24" ${B}/>`,
];

export function badges01(): string {
  const symbols = BADGE_MOTIFS.map(
    (m, i) => `<symbol id="badge-q0${i + 1}" viewBox="0 0 64 64"><circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="32" cy="32" r="25" fill="none" stroke="currentColor" stroke-width="1" stroke-opacity="0.5" stroke-dasharray="1.5 3"/>${m}</symbol>`,
  ).join('\n');
  return `<svg ${NS} aria-hidden="true">\n${symbols}\n</svg>\n`;
}
