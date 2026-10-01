// CH01–CH09: Nagi, Koto, Ritsu × (normal, think, happy). 768×1024, transparent.
// Fixed per character (§3.3, §10.3): clothing, hair, bag, proportions (~4 heads), light from the upper left.
// Expressions are only eyes / brows / mouth / small props — no text glyphs are drawn.
import { C, ell, g, layer, line, P, poly, rect, svgDoc } from './lib';

export type Expr = 'normal' | 'think' | 'happy';

const W = 768;
const H = 1024;
const EYE = '#2a2328';

function sparkle(cx: number, cy: number, r: number, fill = C.amber): string {
  const k = r * 0.28;
  return P(`M${cx} ${cy - r}Q${cx + k} ${cy - k} ${cx + r} ${cy}Q${cx + k} ${cy + k} ${cx} ${cy + r}Q${cx - k} ${cy + k} ${cx - r} ${cy}Q${cx - k} ${cy - k} ${cx} ${cy - r}Z`, fill, { sw: 2 });
}

function groundShadow(cx = 384, cy = 985, rx = 190): string {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="20" fill="#14262c" opacity="0.28" filter="url(#blur8)"/>`;
}

/** Eyes/brows/mouth shared by the two humans. `lens` draws glasses (Ritsu). */
function face(expr: Expr, hair: string, mouthCol: string, ox = 0, glasses = false): string {
  const lx = 350 + ox;
  const rx = 418 + ox;
  const ey = 248;
  let eyes = '';
  let brows = '';
  let mouth = '';
  if (expr === 'normal') {
    eyes = [lx, rx].map((x) => `<ellipse cx="${x}" cy="${ey}" rx="8.5" ry="12" fill="${EYE}"/><circle cx="${x - 3}" cy="${ey - 4}" r="3" fill="#fff"/>`).join('');
    brows = line(`M${lx - 17} 224Q${lx} 214 ${lx + 16} 221`, hair, 5) + line(`M${rx - 16} 221Q${rx} 214 ${rx + 17} 224`, hair, 5);
    mouth = line(`M${384 + ox - 14} 290Q${384 + ox} 299 ${384 + ox + 14} 290`, mouthCol, 4);
  } else if (expr === 'think') {
    eyes = [lx - 5, rx - 5].map((x) => `<ellipse cx="${x}" cy="${ey - 5}" rx="8.5" ry="12" fill="${EYE}"/><circle cx="${x - 3}" cy="${ey - 10}" r="3" fill="#fff"/>`).join('');
    brows = line(`M${lx - 22} 214Q${lx - 5} 202 ${lx + 12} 212`, hair, 5) + line(`M${rx - 16} 224Q${rx} 217 ${rx + 16} 226`, hair, 5);
    mouth = line(`M${384 + ox - 12} 293Q${384 + ox + 1} 297 ${384 + ox + 13} 292`, mouthCol, 4);
  } else {
    eyes = [lx, rx].map((x) => line(`M${x - 13} ${ey + 3}Q${x} ${ey - 13} ${x + 13} ${ey + 3}`, EYE, 5)).join('');
    brows = line(`M${lx - 17} 220Q${lx} 208 ${lx + 16} 217`, hair, 5) + line(`M${rx - 16} 217Q${rx} 208 ${rx + 17} 220`, hair, 5);
    mouth = `<path d="M${384 + ox - 20} 282Q${384 + ox} 318 ${384 + ox + 20} 282Z" fill="#7a2f2f" stroke="${mouthCol}" stroke-width="3" stroke-linejoin="round"/><path d="M${384 + ox - 11} 297Q${384 + ox} 290 ${384 + ox + 11} 297Q${384 + ox} 306 ${384 + ox - 11} 297Z" fill="#D9737A"/>`;
  }
  const blush = `<ellipse cx="${lx - 14}" cy="276" rx="14" ry="8" fill="#E08B7A" opacity="${expr === 'happy' ? 0.5 : 0.25}"/><ellipse cx="${rx + 14}" cy="276" rx="14" ry="8" fill="#E08B7A" opacity="${expr === 'happy' ? 0.5 : 0.25}"/>`;
  const nose = line(`M${384 + ox} 258Q${389 + ox} 270 ${381 + ox} 273`, C.skinShade, 3);
  const specs = glasses
    ? `<circle cx="${lx}" cy="${ey}" r="25" fill="#ffffff" fill-opacity="0.14" stroke="#3a3340" stroke-width="3"/><circle cx="${rx}" cy="${ey}" r="25" fill="#ffffff" fill-opacity="0.14" stroke="#3a3340" stroke-width="3"/>${line(`M${lx + 25} ${ey - 3}Q${384 + ox} ${ey - 9} ${rx - 25} ${ey - 3}`, '#3a3340', 3)}${line(`M${lx - 25} ${ey - 4}L${lx - 40} ${ey - 8}`, '#3a3340', 3)}${line(`M${rx + 25} ${ey - 4}L${rx + 40} ${ey - 8}`, '#3a3340', 3)}`
    : '';
  return blush + nose + eyes + brows + mouth + specs;
}

function thoughtCloud(): string {
  return layer(
    [
      ell(588, 214, 11, 11, C.paper, { sw: 2 }),
      ell(618, 168, 17, 17, C.paper, { sw: 2 }),
      P('M600 96Q590 60 630 56Q650 30 690 52Q730 54 726 92Q744 120 706 132Q690 160 650 146Q614 160 604 130Q580 122 600 96Z', C.paper, { sw: 2.4 }),
      ell(664, 98, 12, 12, C.light, { sw: 2 }),
    ],
    'pieceFlat',
  );
}

export function nagi(expr: Expr): string {
  const tilt = expr === 'think' ? 'rotate(-4 384 340)' : expr === 'happy' ? 'rotate(2 384 340)' : '';
  const hairC = '#3A2A22';
  const out: string[] = [];
  out.push(groundShadow());

  // shoulder bag (behind body at the hip) + hanging arm
  out.push(
    layer([
      // legs & shoes
      P('M300 590L468 590L462 668L306 668Z', C.slate),
      P('M318 640L378 640L374 925L312 925Z', C.slate),
      P('M392 640L452 640L460 925L398 925Z', '#2b3841'),
      P('M300 925L376 925L384 960Q386 977 362 977L294 977Q284 972 290 950Z', '#5A4332'),
      P('M392 925L468 925L480 950Q486 972 472 977L406 977Q382 977 388 960Z', '#5A4332'),
      line('M296 962H380M396 962H478', '#8b6a4e', 3),
    ]),
  );
  // arms behind torso: hanging arm (viewer-left)
  out.push(
    layer([
      P('M292 382Q262 414 258 500L250 592Q262 602 284 598L298 520Q304 440 310 394Z', C.teal),
      P('M252 590Q262 602 284 598L286 612L254 612Z', '#EADFC8'),
      ell(268, 622, 21, 25, C.skin),
    ]),
  );
  // torso
  out.push(
    layer([
      P('M364 330H404L408 372H360Z', C.skinShade),
      P('M296 372Q340 352 384 358Q430 352 472 372Q490 420 486 520L482 620Q384 642 286 620L282 520Q278 420 296 372Z', C.teal),
      P('M440 376Q482 400 486 520L482 620Q452 630 428 628Q452 520 440 376Z', C.tealDark, { stroke: 'none', op: 0.5 }),
      P('M352 362L384 446L416 362Q384 376 352 362Z', '#EADFC8'),
      P('M338 362L352 362L384 446L376 470L330 380Z', '#2A7370'),
      P('M430 362L416 362L384 446L392 470L438 380Z', '#2A7370'),
      line('M384 446V626', '#1d5654', 3),
      rect(334, 520, 50, 46, 6, '#2A7370', { sw: 2 }),
      line('M338 530H380', '#1d5654', 2),
    ]),
  );
  // bag strap + bag
  out.push(
    layer([
      poly(
        [
          [434, 360],
          [470, 378],
          [326, 614],
          [290, 598],
        ],
        C.leather,
        { sw: 2 },
      ),
      line('M440 372L304 598', '#c58f60', 2, 'stroke-dasharray="6 6"'),
      rect(236, 572, 104, 98, 14, '#8A5A36'),
      P('M236 586Q236 572 250 572H326Q340 572 340 586V616Q288 636 236 616Z', '#7C4F2E'),
      line('M248 598Q288 612 328 598', '#c58f60', 2, 'stroke-dasharray="6 6"'),
      ell(288, 626, 8, 8, C.brassLight, { sw: 2 }),
    ]),
  );
  // notebook + hand on the right side
  out.push(
    layer([
      g(
        [rect(392, 500, 108, 134, 6, '#FBF8F0'), rect(392, 500, 18, 134, 5, '#C7B58F'), P('M470 500V548L478 540L486 548V500Z', C.light, { sw: 1.6 }), line('M416 514H492', '#e4dcc8', 2)],
        'transform="rotate(-8 450 570)"',
      ),
      P('M470 386Q504 424 502 506Q498 548 472 566L440 546Q462 502 456 436Z', C.teal),
      P('M450 540Q466 560 486 560L482 590L444 580Z', '#EADFC8', { sw: 2 }),
      ell(484, 590, 20, 22, C.skin),
    ]),
  );
  // head
  const head = [
    ell(296, 242, 14, 22, C.skin),
    ell(472, 242, 14, 22, C.skin),
    ell(384, 234, 88, 98, C.skin),
    P('M446 158Q480 190 482 246Q478 292 452 316Q462 262 446 158Z', C.skinShade, { stroke: 'none', op: 0.45 }),
    P('M290 240C282 150 330 112 392 112C456 112 494 160 480 240C474 206 458 186 436 176C408 196 350 190 322 176C304 192 294 214 290 240Z', hairC),
    P('M392 112C400 92 424 90 434 102C420 104 410 110 404 122Z', hairC),
    P('M322 152C340 128 370 119 396 119C372 126 346 142 332 168Z', '#6A4B3C', { stroke: 'none', op: 0.9 }),
  ];
  out.push(
    `<g transform="${tilt}">` + layer(head) + face(expr, hairC, '#8a4a3a') + '</g>',
  );
  if (expr === 'think') out.push(thoughtCloud());
  if (expr === 'happy') out.push(layer([sparkle(612, 150, 26), sparkle(660, 226, 16, C.paper), sparkle(150, 190, 20)], 'pieceFlat'));
  return svgDoc(W, H, '', out.join('\n'), `Nagi (${expr})`);
}

export function ritsu(expr: Expr): string {
  const tilt = expr === 'think' ? 'rotate(3 384 340)' : '';
  const hairC = '#1E1B22';
  const out: string[] = [];
  out.push(groundShadow());
  out.push(
    layer([
      P('M312 690L456 690L452 925L392 925L384 760L376 925L316 925Z', '#2f2b36'),
      P('M300 925L378 925L388 960Q390 977 364 977L292 977Q282 972 288 950Z', '#3a3036'),
      P('M390 925L468 925L482 950Q488 972 474 977L406 977Q380 977 386 960Z', '#3a3036'),
    ]),
  );
  // back hair
  out.push(layer([P('M296 252C290 150 340 108 392 108C448 108 486 150 476 252C480 304 470 342 450 354L318 354C298 342 292 304 296 252Z', hairC)]));
  // body: smock + apron
  out.push(
    layer([
      P('M364 330H404L408 372H360Z', C.skinShade),
      P('M298 376Q340 356 384 362Q430 356 470 376Q492 430 490 520L500 704Q384 722 268 704L278 520Q276 430 298 376Z', C.plum),
      P('M440 376Q484 410 490 520L500 704Q470 712 440 714Q470 560 440 376Z', '#3b3544', { stroke: 'none', op: 0.5 }),
      P('M352 366L384 420L416 366Q384 380 352 366Z', '#EADFC8'),
      P('M342 394L424 394L444 476L452 706L316 706L322 476Z', C.leather),
      P('M342 394L360 366L366 394Z M424 394L408 366L402 394Z', '#7C4F2E', { sw: 1.8 }),
      rect(350, 566, 70, 62, 7, '#7C4F2E', { sw: 2 }),
      line('M356 574H414', '#c58f60', 2, 'stroke-dasharray="6 6"'),
      ell(384, 468, 8, 8, C.brassLight, { sw: 2 }),
    ]),
  );
  // arms: folded in front
  out.push(
    layer([
      P('M302 392Q268 440 276 540Q292 584 340 570L342 524Q316 474 326 404Z', C.plum),
      P('M466 392Q500 440 492 540Q476 584 428 570L426 524Q452 474 442 404Z', C.plum),
      P('M284 556Q312 590 342 572L340 556L290 536Z', '#EADFC8', { sw: 2 }),
      P('M484 556Q456 590 426 572L428 556L478 536Z', '#EADFC8', { sw: 2 }),
      ell(360, 566, 24, 20, C.skin),
      ell(410, 566, 24, 20, C.skin),
    ]),
  );
  const head = [
    ell(300, 248, 13, 21, C.skin),
    ell(468, 248, 13, 21, C.skin),
    ell(384, 238, 84, 96, C.skin),
    P('M446 170Q476 200 478 250Q474 296 450 318Q460 268 446 170Z', C.skinShade, { stroke: 'none', op: 0.45 }),
    P('M298 238C300 158 348 118 396 120C446 122 476 170 474 242C462 202 430 172 400 174C360 176 320 192 298 238Z', hairC),
    P('M374 122C352 140 334 172 324 204C338 182 360 160 382 144Z', '#F2F0EE', { sw: 1.6 }),
    P('M326 160C344 134 372 124 398 124C374 132 350 148 336 172Z', '#4a4552', { stroke: 'none', op: 0.8 }),
  ];
  out.push(`<g transform="${tilt}">` + layer(head) + face(expr, hairC, '#8a4a3a', 0, true) + '</g>');
  if (expr === 'think') out.push(thoughtCloud());
  if (expr === 'happy') out.push(layer([sparkle(604, 170, 22), sparkle(160, 214, 16, C.paper)], 'pieceFlat'));
  return svgDoc(W, H, '', out.join('\n'), `Ritsu (${expr})`);
}

export function koto(expr: Expr): string {
  const out: string[] = [];
  const glow = expr === 'happy' ? 1 : expr === 'think' ? 0.35 : 0.65;
  const cx = 384;
  const cy = 360;
  const defs = `<radialGradient id="kglow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFE9A8" stop-opacity="${0.95 * glow}"/><stop offset="1" stop-color="#E5B85A" stop-opacity="0"/></radialGradient><linearGradient id="kbody" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D9B764"/><stop offset="1" stop-color="#A67F34"/></linearGradient>`;
  // floating shadow
  out.push(`<ellipse cx="${cx + 10}" cy="700" rx="${expr === 'happy' ? 120 : 140}" ry="22" fill="#14262c" opacity="0.22" filter="url(#blur20)"/>`);
  // glow halo
  out.push(`<circle cx="${cx}" cy="${cy - 150}" r="${130 + glow * 70}" fill="url(#kglow)"/>`);
  // paper fins (tilt with expression)
  const fl = expr === 'happy' ? -28 : expr === 'think' ? 16 : 0;
  const fr = expr === 'happy' ? 28 : expr === 'think' ? -6 : 0;
  out.push(
    layer([
      g([P('M214 380L90 330Q70 380 96 440L214 430Z', C.paper), line('M200 384L110 356M200 404L108 392', '#d8cfb8', 2.5)], `transform="rotate(${fl} 214 400)"`),
      g([P('M554 380L678 330Q698 380 672 440L554 430Z', C.paper), line('M568 384L658 356M568 404L660 392', '#d8cfb8', 2.5)], `transform="rotate(${fr} 554 400)"`),
    ]),
  );
  // body box
  out.push(
    layer([
      rect(206, 244, 356, 300, 54, 'url(#kbody)', { sw: 3 }),
      rect(232, 272, 304, 244, 38, '#F1E3BD', { sw: 2.4 }),
      // handle and lamp stem
      P('M336 244Q336 206 384 206Q432 206 432 244', 'none', { sw: 8, stroke: '#8c6a28' }),
      rect(372, 176, 24, 34, 6, '#8c6a28', { sw: 2 }),
      // brass corners + latch
      poly([[206, 300], [206, 244 + 54], [260, 244], [236, 244]], C.brassLight, { sw: 0, stroke: 'none', op: 0.0 }),
      rect(356, 506, 56, 34, 8, '#8c6a28', { sw: 2.4 }),
      ell(384, 523, 7, 7, C.brassLight, { sw: 2 }),
      ell(236, 514, 8, 8, C.brassLight, { sw: 2 }),
      ell(532, 514, 8, 8, C.brassLight, { sw: 2 }),
      ell(236, 274, 8, 8, C.brassLight, { sw: 2 }),
      ell(532, 274, 8, 8, C.brassLight, { sw: 2 }),
      // face panel
      rect(268, 322, 232, 148, 30, '#26363D', { sw: 2.6 }),
      P('M284 340Q300 330 330 330L270 400Z', '#ffffff', { stroke: 'none', op: 0.07 }),
    ]),
  );
  // lamp bulb
  out.push(`<circle cx="384" cy="160" r="${26 + glow * 14}" fill="#FFE9A8" opacity="${0.35 + glow * 0.4}" filter="url(#blur8)"/>`);
  out.push(layer([ell(384, 162, 22, 24, expr === 'think' ? '#d8bd78' : '#FFE08A', { sw: 2.4 })], 'pieceFlat'));
  // eyes
  const lx = 330;
  const rx = 438;
  const ey = 392;
  const glowC = '#FFE08A';
  let eyes = '';
  let mouth = '';
  if (expr === 'normal') {
    eyes = [lx, rx].map((x) => `<ellipse cx="${x}" cy="${ey}" rx="16" ry="20" fill="${glowC}"/><circle cx="${x - 5}" cy="${ey - 7}" r="5" fill="#fff"/>`).join('');
    mouth = line('M366 436Q384 448 402 436', glowC, 5);
  } else if (expr === 'think') {
    eyes = `<ellipse cx="${lx - 3}" cy="${ey - 4}" rx="15" ry="19" fill="${glowC}" opacity="0.9"/><circle cx="${lx - 8}" cy="${ey - 12}" r="5" fill="#fff"/>` + line(`M${rx - 18} ${ey}H${rx + 16}`, glowC, 7) + `<circle cx="${rx + 52}" cy="${ey - 36}" r="0" fill="none"/>`;
    mouth = line('M368 438Q386 432 404 440', glowC, 5);
  } else {
    eyes = [lx, rx].map((x) => line(`M${x - 18} ${ey + 8}Q${x} ${ey - 20} ${x + 18} ${ey + 8}`, glowC, 7)).join('');
    mouth = `<path d="M356 426Q384 464 412 426Z" fill="${glowC}"/>`;
  }
  out.push(eyes + mouth);
  if (expr === 'think') out.push(layer([ell(560, 150, 10, 10, C.paper, { sw: 2 }), ell(596, 112, 15, 15, C.paper, { sw: 2 }), ell(650, 70, 24, 22, C.paper, { sw: 2 })], 'pieceFlat'));
  if (expr === 'happy') out.push(layer([sparkle(176, 220, 26), sparkle(610, 190, 22), sparkle(650, 300, 14, C.paper), sparkle(120, 330, 14, C.paper)], 'pieceFlat'));
  return svgDoc(W, H, defs, out.join('\n'), `Koto (${expr})`);
}
