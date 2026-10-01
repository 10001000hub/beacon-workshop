// BG01–BG06: 1920×1080 backgrounds. No text is drawn. Detail sits near the edges; the central ~50%
// (x 480–1440, y 270–810) is kept as a calm, low-contrast surface so the UI/dialogue stays readable (§10.5).
import { awning, cloud, crate, gear, lantern, plankLines, sheet, shelfUnit, tag, book } from './props';
import { C, band, ell, layer, lightDef, lightWash, line, lin, P, poly, rad, rect, rng, svgDoc, vignette, vignetteDef } from './lib';

const W = 1920;
const H = 1080;

/** Wooden desk plane across the bottom with a visible front edge. */
function desk(top: number, base = C.woodLight, edge = C.wood, seedPlanks = 6): string[] {
  return [
    P(`M0 ${top}H${W}V${H}H0Z`, base, { sw: 2.6 }),
    plankLines(0, top, W, H - top - 70, seedPlanks, C.woodDark, 0.28),
    P(`M0 ${H - 74}H${W}V${H}H0Z`, edge, { sw: 2.6 }),
    line(`M0 ${top + 8}H${W}`, '#e8c796', 3, 'opacity="0.7"'),
  ];
}

export function bg01(): string {
  const r = rng(101);
  const defs = lin('sky1', [[0, '#F6EACB'], [1, '#DDE7DC']]) + vignetteDef(0.3) + lightDef;
  const out: string[] = [];
  out.push(`<rect width="${W}" height="${H}" fill="url(#sky1)"/>`);
  // far harbour strip + sails
  out.push(layer([band(0, W, 300, 10, 240, 520, '#9CC7BE', 0.4), band(0, W, 340, 8, 200, 520, '#7FB3AD', 1.3)], 'pieceSoft'));
  out.push(
    layer([
      poly([[620, 330], [620, 250], [676, 330]], '#FBF6EA', { sw: 2 }),
      rect(612, 328, 80, 12, 4, C.wood, { sw: 2 }),
      poly([[1180, 336], [1180, 270], [1224, 336]], '#F3D9A0', { sw: 2 }),
      rect(1172, 334, 64, 10, 4, C.wood, { sw: 2 }),
    ]),
  );
  // ground / cobbles (low contrast)
  const cob: string[] = [P(`M0 440H${W}V720H0Z`, '#D9CDB0', { sw: 0, stroke: 'none' })];
  for (let i = 0; i < 90; i++) cob.push(ell(r() * W, 470 + r() * 240, 30 + r() * 22, 10 + r() * 6, '#CDBF9F', { sw: 1.2, stroke: '#bfae8a', op: 0.7 }));
  out.push(layer(cob, 'pieceFlat'));
  // stalls (left and right)
  const stallL = [
    rect(60, 190, 12, 270, 3, C.woodDark, { sw: 2 }),
    rect(500, 190, 12, 270, 3, C.woodDark, { sw: 2 }),
    rect(72, 300, 428, 150, 6, '#F3E6C6', { sw: 2.2 }),
    awning(40, 150, 492, 120, C.teal, '#F5EEDC', 10),
    rect(52, 420, 460, 60, 6, C.wood, { sw: 2.4 }),
    crate(86, 372, 96, 56),
    crate(196, 384, 78, 46, C.wood),
    ell(330, 410, 22, 20, '#D98C4A', { sw: 2 }),
    ell(366, 414, 20, 18, '#C65A4F', { sw: 2 }),
    ell(400, 410, 22, 20, '#D98C4A', { sw: 2 }),
    ell(436, 414, 20, 18, '#E1B24F', { sw: 2 }),
  ];
  const stallR = [
    rect(1388, 210, 12, 250, 3, C.woodDark, { sw: 2 }),
    rect(1850, 210, 12, 250, 3, C.woodDark, { sw: 2 }),
    rect(1400, 310, 450, 140, 6, '#EADFC8', { sw: 2.2 }),
    awning(1368, 170, 512, 120, '#6A6174', '#F5EEDC', 10),
    rect(1380, 420, 490, 60, 6, C.wood, { sw: 2.4 }),
    crate(1430, 366, 100, 62),
    crate(1550, 380, 82, 48, C.wood),
    rect(1690, 372, 40, 56, 6, '#8FB7B0', { sw: 2 }),
    rect(1742, 380, 40, 48, 6, '#C9A24F', { sw: 2 }),
    rect(1794, 374, 38, 54, 6, '#8FB7B0', { sw: 2 }),
  ];
  out.push(layer(stallL, 'piece'));
  out.push(layer(stallR, 'piece'));
  // bunting + lanterns across the top
  const bunt: string[] = [line('M520 168Q960 250 1380 188', C.line, 3)];
  const cols = [C.teal, C.light, '#F5EEDC', '#C65A4F', C.tealLight];
  for (let i = 0; i < 12; i++) {
    const t = (i + 0.5) / 12;
    const x = 520 + 860 * t;
    const y = 168 + (1 - Math.pow(2 * t - 1, 2)) * 62 + (t - 0.5) * 20 - 0;
    bunt.push(poly([[x - 16, y + 2], [x + 16, y + 2], [x, y + 40]], cols[i % cols.length]!, { sw: 2 }));
  }
  out.push(layer(bunt));
  out.push(lantern(700, 270, 18), lantern(960, 292, 18), lantern(1220, 262, 18));
  // desk with map, sheets and scattered tags near the edges
  out.push(layer(desk(700, '#C99B68', '#8A5A36'), 'piece'));
  out.push(
    layer([
      // big blank map at left
      P('M60 780L420 740L520 900L120 960Z', '#F6EEDB', { sw: 2.4 }),
      line('M120 800L440 770M150 860L470 820', '#e3d7bb', 2.5),
      line('M220 850Q260 810 320 830T430 810', '#bfae8a', 3, 'stroke-dasharray="3 12"'),
      sheet(520, 940, 160, 110, -8),
      sheet(1450, 830, 200, 140, 7),
      sheet(1500, 850, 200, 140, -3, '#F4EDDB'),
      sheet(1760, 900, 140, 100, 12),
    ]),
  );
  out.push(
    layer([
      tag(1360, 960, -14, C.teal),
      tag(1700, 780, 10, C.light),
      tag(80, 1010, 8, '#F5EEDC'),
      tag(330, 1020, -20, '#C65A4F', 66, 90),
      tag(1840, 1000, -8, C.tealLight),
      tag(700, 1030, 14, C.light, 60, 80),
      line('M1620 800L1600 860', '#6b5a40', 2),
    ]),
  );
  out.push(lightWash(W, H), vignette(W, H));
  return svgDoc(W, H, defs, out.join('\n'), 'Market request desk');
}

export function bg02(): string {
  const defs =
    lin('dusk', [[0, '#F7C97B'], [0.5, '#E99A5B'], [1, '#6F7FA0']]) + lin('wall2', [[0, '#8B6240'], [1, '#6A4A32']]) + vignetteDef(0.34) + lightDef +
    lin('shaft', [[0, '#FFE2A0', 0.5], [1, '#FFE2A0', 0]], 0, 0, 1, 1);
  const out: string[] = [];
  out.push(`<rect width="${W}" height="${H}" fill="url(#wall2)"/>`);
  const boards: string[] = [];
  for (let i = 0; i < 24; i++) boards.push(line(`M${i * 80} 0V720`, '#5a3b25', 2.4, 'opacity="0.5"'));
  out.push(layer(boards, 'pieceFlat'));
  // window (upper left) with dusk sky + lighthouse silhouette
  out.push(
    layer([
      rect(130, 70, 460, 420, 14, C.woodDark, { sw: 3 }),
      rect(156, 96, 408, 368, 8, 'url(#dusk)', { sw: 2.4 }),
      band(156, 564, 380, 10, 120, 464, '#4F6F88', 0.5, { sw: 0, stroke: 'none' }),
      rect(412, 262, 22, 120, 2, '#3b4a63', { sw: 1.5 }),
      poly([[408, 262], [438, 262], [423, 236]], '#3b4a63', { sw: 1.5 }),
      ell(423, 248, 7, 7, '#FFE08A', { sw: 0, stroke: 'none' }),
      ell(250, 170, 44, 44, '#FFE8B0', { sw: 0, stroke: 'none', op: 0.8 }),
      rect(352, 96, 14, 368, 0, C.woodDark, { sw: 2 }),
      rect(156, 268, 408, 14, 0, C.woodDark, { sw: 2 }),
    ]),
  );
  // light shaft from the window toward the lower right (soft)
  out.push(`<path d="M160 100L560 100L1250 820L760 820Z" fill="url(#shaft)" opacity="0.5" filter="url(#blur40)"/>`);
  // shelf at right with brass tools
  out.push(
    layer([
      rect(1330, 230, 540, 22, 4, C.wood, { sw: 2.4 }),
      rect(1330, 430, 540, 22, 4, C.wood, { sw: 2.4 }),
      rect(1350, 252, 14, 56, 0, C.woodDark, { sw: 1.5 }),
      gear(1400, 190, 38),
      gear(1480, 206, 24, C.brassLight, 8),
      rect(1540, 150, 34, 80, 6, '#8FB7B0', { sw: 2.2 }),
      rect(1590, 170, 40, 60, 6, '#C65A4F', { sw: 2.2 }),
      rect(1650, 140, 30, 90, 6, '#EADFC8', { sw: 2.2 }),
      rect(1700, 180, 70, 50, 6, C.brass, { sw: 2.2 }),
      rect(1790, 160, 50, 70, 6, '#6A6174', { sw: 2.2 }),
      rect(1350, 372, 110, 58, 4, C.paper, { sw: 2 }),
      ell(1500, 400, 30, 30, '#EADFC8', { sw: 2.2 }),
      ell(1500, 400, 12, 12, C.paper, { sw: 2 }),
      book(1560, 340, 40, 90, C.teal),
      book(1606, 352, 34, 78, '#C65A4F'),
      book(1646, 336, 44, 94, C.light),
      book(1700, 360, 90, 70, '#6A6174'),
    ]),
  );
  // bench
  out.push(layer(desk(730, '#C99B68', '#7C5233', 5)));
  out.push(
    layer([
      // timber stack at left
      rect(40, 840, 360, 40, 5, C.woodLight, { sw: 2.4 }),
      rect(70, 884, 340, 44, 5, C.wood, { sw: 2.4 }),
      rect(30, 930, 380, 42, 5, C.woodLight, { sw: 2.4 }),
      line('M60 860H380M90 906H390M50 952H390', C.woodDark, 2, 'opacity="0.4"'),
      // paper rolls
      rect(430, 960, 190, 38, 19, '#F6EEDB', { sw: 2.4 }),
      ell(430, 979, 14, 19, '#e3d7bb', { sw: 2 }),
      // brass gears + tool right
      gear(1580, 880, 62),
      gear(1680, 944, 38, C.brassLight, 8),
      rect(1760, 810, 130, 24, 12, C.brassLight, { sw: 2.4 }),
      rect(1790, 860, 90, 90, 8, '#EADFC8', { sw: 2.4 }),
      sheet(1420, 950, 150, 100, -9),
    ]),
  );
  out.push(lantern(960, 120, 24), lightWash(W, H), vignette(W, H));
  return svgDoc(W, H, defs, out.join('\n'), 'Workshop bench');
}

export function bg03(): string {
  const defs = lin('wall3', [[0, '#E5E0D0'], [1, '#CFCABB']]) + lin('floor3', [[0, '#C9A97C'], [1, '#A9835A']]) + vignetteDef(0.34) + lightDef + rad('pool', [[0, '#FFEDB8', 0.55], [1, '#FFEDB8', 0]]);
  const out: string[] = [];
  out.push(`<rect width="${W}" height="${H}" fill="url(#wall3)"/>`);
  // arched high windows on the back wall
  out.push(
    layer([
      P('M620 70V250H760V70Q690 20 620 70Z', '#CFE3E0', { sw: 3 }),
      P('M1160 70V250H1300V70Q1230 20 1160 70Z', '#CFE3E0', { sw: 3 }),
      line('M690 40V250M1230 40V250M620 160H760M1160 160H1300', C.woodDark, 3),
    ], 'pieceSoft'),
  );
  // floor in perspective
  out.push(layer([P(`M0 700H${W}V${H}H0Z`, 'url(#floor3)', { sw: 2.6 })], 'piece'));
  const fl: string[] = [];
  for (let i = -8; i <= 8; i++) fl.push(line(`M${960 + i * 70} 700L${960 + i * 260} ${H}`, '#7C5233', 2.2, 'opacity="0.3"'));
  fl.push(line(`M0 800H${W}M0 900H${W}M0 1000H${W}`, '#7C5233', 2.2, 'opacity="0.2"'));
  out.push(layer(fl, 'pieceFlat'));
  out.push(`<ellipse cx="960" cy="800" rx="520" ry="110" fill="url(#pool)"/>`);
  // shelving left and right
  const pal = [C.teal, '#C65A4F', C.light, '#6A6174', '#EADFC8', C.tealLight, '#8A5A36'];
  out.push(layer([shelfUnit(40, 130, 440, 5, 118, 31, pal)], 'piece'));
  out.push(layer([shelfUnit(1440, 130, 440, 5, 118, 77, pal, false)], 'piece'));
  // ladder (left), boxes on floor (edges)
  out.push(
    layer([
      line('M500 220L560 760M560 220L620 760', C.woodDark, 10),
      line('M512 300H570M518 380H576M524 460H582M530 540H588M536 620H594M542 700H600', C.wood, 8),
      crate(40, 880, 200, 130),
      crate(250, 930, 140, 90, C.wood),
      crate(1660, 890, 210, 120),
      crate(1530, 940, 120, 80, C.wood),
      sheet(1400, 900, 90, 120, -12),
    ]),
  );
  // tags hanging from the shelf edges (blank cards)
  out.push(layer([tag(250, 150, 0, '#F5EEDC', 52, 70), tag(1650, 150, 4, C.light, 52, 70), tag(1470, 150, -6, C.tealLight, 52, 70)]));
  // hanging lamp, centre top
  out.push(line('M960 0V120', C.line, 3));
  out.push(lantern(960, 160, 32), lightWash(W, H), vignette(W, H));
  return svgDoc(W, H, defs, out.join('\n'), 'Record warehouse shelves');
}

export function bg04(): string {
  const r = rng(404);
  const defs = lin('sky4', [[0, '#EAF1E7'], [1, '#F7E8C8']]) + lin('water', [[0, '#7FB6B3'], [1, '#2F6F76']]) + vignetteDef(0.3) + lightDef;
  const out: string[] = [];
  out.push(`<rect width="${W}" height="${H}" fill="url(#sky4)"/>`);
  out.push(layer([cloud(220, 190, 1.2), cloud(1380, 150, 1.4), cloud(900, 120, 0.9, '#FFFBF0')], 'pieceSoft'));
  // distant hills
  out.push(
    layer([band(0, W, 330, 26, 360, 640, '#A9C9BF', 0.3), band(0, W, 380, 22, 300, 640, '#86B3AA', 1.1), band(0, W, 430, 16, 260, 640, '#5F9E97', 2.1)], 'pieceSoft'),
  );
  // river (layered bands)
  out.push(layer([`<rect x="0" y="560" width="${W}" height="${H - 560}" fill="url(#water)" stroke="none"/>`], 'pieceFlat'));
  const waves: string[] = [];
  for (let i = 0; i < 6; i++) waves.push(band(0, W, 700 + i * 70, 8 + i * 2, 220 + i * 30, H, i % 2 ? '#3C7F86' : '#4A8F94', i * 1.4, { sw: 1.8, op: 0.9 }));
  out.push(layer(waves, 'piece'));
  // bridge: stone arch with deck
  out.push(
    layer([
      P('M200 560H1720V640H200Z', C.stone, { sw: 2.6 }),
      P('M240 640H1680V800H240ZM260 800A130 130 0 0 1 520 800ZM830 800A130 130 0 0 1 1090 800ZM1400 800A130 130 0 0 1 1660 800Z', C.stoneDark, { sw: 2.6, extra: 'fill-rule="evenodd"' }),
      line('M520 800V700M830 800V700M1090 800V700M1400 800V700', C.stone, 1, 'opacity="0"'),
      line('M200 600H1720', '#d9d2c1', 3, 'opacity="0.6"'),
    ]),
  );
  // railing posts + lanterns + blank message tags on a rope
  const post: string[] = [];
  for (let i = 0; i < 11; i++) post.push(rect(250 + i * 140, 500, 18, 66, 4, C.wood, { sw: 2.2 }));
  post.push(line('M259 520Q960 600 1659 520', '#6b5a40', 3.5));
  out.push(layer(post));
  const tags: string[] = [];
  const tcol = ['#F5EEDC', C.light, C.tealLight, '#F5EEDC', '#C65A4F'];
  for (let i = 0; i < 9; i++) {
    const t = (i + 0.5) / 9;
    const x = 259 + 1400 * t;
    const y = 520 + Math.sin(t * Math.PI) * 52;
    tags.push(tag(x, y + 56, (r() - 0.5) * 16, tcol[i % 5]!, 48, 68));
  }
  out.push(layer(tags.slice(0, 2).concat(tags.slice(7)), 'piece'));
  out.push(lantern(259, 480, 20), lantern(1659, 480, 20));
  // foreground reeds and rocks (corners only)
  const reeds: string[] = [];
  for (let i = 0; i < 14; i++) {
    const x = 20 + i * 30 + r() * 10;
    reeds.push(line(`M${x} ${H}Q${x + (r() - 0.5) * 30} ${H - 120} ${x + (r() - 0.5) * 60} ${H - 190 - r() * 80}`, i % 2 ? '#3A8A6E' : '#2d6f58', 7));
    const x2 = W - 20 - i * 30 - r() * 10;
    reeds.push(line(`M${x2} ${H}Q${x2 + (r() - 0.5) * 30} ${H - 120} ${x2 + (r() - 0.5) * 60} ${H - 190 - r() * 80}`, i % 2 ? '#3A8A6E' : '#2d6f58', 7));
  }
  out.push(layer(reeds));
  out.push(layer([ell(120, 1040, 130, 50, C.stoneDark, { sw: 2.4 }), ell(1800, 1050, 150, 54, C.stoneDark, { sw: 2.4 })]));
  out.push(lightWash(W, H), vignette(W, H));
  return svgDoc(W, H, defs, out.join('\n'), 'Message bridge');
}

export function bg05(): string {
  const defs =
    lin('wall5', [[0, '#3C6B76'], [1, '#26505A']]) + lin('glass', [[0, '#F4FAF8'], [0.5, '#BFD8D8'], [1, '#8DB4B8']], 0, 0, 1, 1) + lin('felt', [[0, '#2E6B5C'], [1, '#235447']]) + vignetteDef(0.38) + lightDef;
  const out: string[] = [];
  out.push(`<rect width="${W}" height="${H}" fill="url(#wall5)"/>`);
  // wall panels
  const pan: string[] = [];
  for (let i = 0; i < 6; i++) pan.push(rect(30 + i * 316, 110, 280, 520, 8, '#2F5E69', { sw: 2.4, op: 0.9 }));
  out.push(layer(pan, 'pieceFlat'));
  out.push(layer([rect(0, 636, W, 22, 0, C.woodDark, { sw: 2.6 })], 'piece'));
  // standing mirror (left)
  out.push(
    layer([
      P('M300 880L360 700H400L460 880Z', C.woodDark, { sw: 2.4 }),
      ell(300, 470, 190, 300, C.brass, { sw: 3 }),
      ell(300, 470, 166, 276, 'url(#glass)', { sw: 2.4 }),
      P('M190 330Q200 250 260 200L240 300Q216 340 196 420Z', '#ffffff', { stroke: 'none', op: 0.5 }),
      P('M330 640Q380 600 410 520L404 590Q380 650 340 690Z', '#ffffff', { stroke: 'none', op: 0.3 }),
    ]),
  );
  // lamp + shelf (right)
  out.push(
    layer([
      rect(1480, 250, 400, 20, 4, C.wood, { sw: 2.4 }),
      rect(1500, 270, 14, 40, 0, C.woodDark, { sw: 1.5 }),
      // magnifier
      ell(1560, 200, 34, 34, '#CFE3E0', { sw: 4, stroke: C.brass }),
      line('M1584 224L1620 262', C.woodDark, 9),
      // stamp + ruler
      rect(1680, 190, 36, 60, 6, C.woodDark, { sw: 2.2 }),
      rect(1668, 240, 60, 20, 4, C.leather, { sw: 2.2 }),
      rect(1760, 232, 110, 18, 3, '#EADFC8', { sw: 2 }),
      line('M1776 232V244M1796 232V240M1816 232V244M1836 232V240M1856 232V244', C.line, 2),
      // lamp
      line('M1790 340V620', C.brass, 10),
      P('M1700 340Q1790 250 1880 340Z', C.light, { sw: 2.6 }),
    ]),
  );
  out.push(`<ellipse cx="1790" cy="400" rx="170" ry="120" fill="${C.amber}" opacity="0.28" filter="url(#blur20)"/>`);
  // desk, felt blotter, hand mirror
  out.push(layer(desk(700, '#9A6A44', '#6A4429', 4)));
  out.push(
    layer([
      P('M560 800H1360L1400 960H520Z', 'url(#felt)', { sw: 2.4, op: 0.55 }),
      ell(1560, 880, 78, 78, C.brass, { sw: 3 }),
      ell(1560, 880, 62, 62, 'url(#glass)', { sw: 2 }),
      P('M1600 940L1690 1020', C.brass, { sw: 12, stroke: C.brass }),
      line('M1600 940L1690 1020', C.brassLight, 8),
      ell(180, 960, 70, 70, 'url(#glass)', { sw: 4, stroke: C.brass }),
      line('M230 1010L290 1060', C.woodDark, 10),
      sheet(1720, 780, 130, 90, 8),
      tag(1840, 1000, -10, C.light, 60, 84),
    ]),
  );
  out.push(lightWash(W, H), vignette(W, H));
  return svgDoc(W, H, defs, out.join('\n'), 'Inspection desk with mirror');
}

export function bg06(): string {
  const defs =
    lin('nightwin', [[0, '#27405E'], [0.7, '#4C6F8E'], [1, '#E9B77A']]) + lin('wall6', [[0, '#C7BFAE'], [1, '#A8A190']]) + rad('lens', [[0, '#FFF1C2', 0.95], [0.5, '#F0C873', 0.4], [1, '#F0C873', 0]]) +
    vignetteDef(0.4) + lightDef + lin('floor6', [[0, '#B88A5A'], [1, '#8C6540']]);
  const out: string[] = [];
  out.push(`<rect width="${W}" height="${H}" fill="url(#wall6)"/>`);
  // stone courses (very low contrast)
  const st: string[] = [];
  for (let y = 0; y < 740; y += 70) st.push(line(`M0 ${y}H${W}`, '#8f8878', 2, 'opacity="0.35"'));
  for (let y = 0; y < 740; y += 70) for (let x = (y / 70) % 2 ? 0 : 60; x < W; x += 120) st.push(line(`M${x} ${y}V${y + 70}`, '#8f8878', 2, 'opacity="0.3"'));
  out.push(layer(st, 'pieceFlat'));
  // arched windows left & right showing night sea turning to dawn
  const win = (x: number) => [
    P(`M${x} 560V250Q${x} 130 ${x + 100} 130Q${x + 200} 130 ${x + 200} 250V560Z`, C.woodDark, { sw: 3 }),
    P(`M${x + 18} 548V254Q${x + 18} 150 ${x + 100} 150Q${x + 182} 150 ${x + 182} 254V548Z`, 'url(#nightwin)', { sw: 2.4 }),
    band(x + 18, x + 182, 480, 8, 80, 548, '#2E4A66', x, { sw: 0, stroke: 'none' }),
    ell(x + 60, 230, 3.5, 3.5, '#FFF1C2', { sw: 0, stroke: 'none' }),
    ell(x + 130, 200, 3, 3, '#FFF1C2', { sw: 0, stroke: 'none' }),
    ell(x + 110, 280, 2.6, 2.6, '#FFF1C2', { sw: 0, stroke: 'none' }),
    line(`M${x + 100} 150V548`, C.woodDark, 5),
  ];
  out.push(layer([...win(150), ...win(1570)], 'piece'));
  // the lens apparatus, top centre (above the quiet area)
  out.push(`<circle cx="960" cy="170" r="260" fill="url(#lens)"/>`);
  const rings: string[] = [];
  for (let i = 0; i < 5; i++) {
    const rw = 300 - i * 38;
    rings.push(ell(960, 170, rw / 2, 110 - i * 12, i % 2 ? '#FFF1C2' : '#F6D98A', { sw: 2.4, stroke: C.brass }));
  }
  const facets: string[] = [];
  for (let i = -4; i <= 4; i++) facets.push(line(`M${960 + i * 28} ${170 - 100 * Math.sqrt(1 - (i / 5.2) ** 2)}V${170 + 100 * Math.sqrt(1 - (i / 5.2) ** 2)}`, C.brass, 2, 'opacity="0.55"'));
  out.push(layer([rect(840, 40, 240, 28, 8, C.brass, { sw: 2.6 }), ...rings, ...facets, rect(820, 266, 280, 26, 8, C.brass, { sw: 2.6 })], 'piece'));
  // floor
  out.push(layer([P(`M0 740H${W}V${H}H0Z`, 'url(#floor6)', { sw: 2.6 })], 'piece'));
  const fl: string[] = [];
  for (let i = 0; i < 12; i++) fl.push(line(`M${i * 180} 740L${960 + (i - 5.5) * 340} ${H}`, '#6d4a2c', 2, 'opacity="0.3"'));
  out.push(layer(fl, 'pieceFlat'));
  // stair at far left, console at right
  const stair: string[] = [];
  for (let i = 0; i < 6; i++) stair.push(rect(0, 700 - i * 40 + 40, 120 + i * 40, 40, 3, i % 2 ? C.wood : C.woodLight, { sw: 2.4 }));
  out.push(layer(stair));
  out.push(
    layer([
      rect(1520, 640, 380, 400, 14, C.brass, { sw: 3 }),
      rect(1546, 670, 328, 150, 10, '#2c3d44', { sw: 2.4 }),
      ell(1620, 745, 40, 40, '#EADFC8', { sw: 2.6 }),
      line('M1620 745L1642 722', C.line, 4),
      ell(1730, 745, 40, 40, '#EADFC8', { sw: 2.6 }),
      line('M1730 745L1710 722', C.line, 4),
      ell(1830, 745, 24, 24, C.light, { sw: 2.6 }),
      rect(1560, 850, 40, 120, 8, C.woodDark, { sw: 2.2 }),
      rect(1640, 850, 40, 120, 8, C.woodDark, { sw: 2.2 }),
      ell(1580, 860, 20, 20, '#C65A4F', { sw: 2.4 }),
      ell(1660, 930, 20, 20, C.verified, { sw: 2.4 }),
      // empty tag slots
      rect(1730, 860, 130, 56, 6, '#F5EEDC', { sw: 2.2 }),
      rect(1730, 930, 130, 56, 6, '#F5EEDC', { sw: 2.2 }),
    ]),
  );
  out.push(lightWash(W, H), vignette(W, H));
  return svgDoc(W, H, defs, out.join('\n'), 'Lighthouse interior');
}
