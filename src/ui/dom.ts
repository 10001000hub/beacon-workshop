// Tiny DOM helpers. Text is only ever set through textContent / attributes — never innerHTML —
// so content, notes and imported values are always inert (§14.2, AC24).

type Child = Node | string | null | undefined | false;
type Attrs = Record<string, string | number | boolean | null | undefined | ((e: Event) => void)>;

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (typeof v === 'function') {
      el.addEventListener(k.replace(/^on/, '').toLowerCase(), v as EventListener);
    } else if (k === 'class') {
      el.className = String(v);
    } else if (v === true) {
      el.setAttribute(k, '');
    } else {
      el.setAttribute(k, String(v));
    }
  }
  append(el, ...children);
  return el;
}

export function append(el: Node, ...children: Child[]): void {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
}

export function replace(el: Element, ...children: Child[]): void {
  clear(el);
  append(el, ...children);
}

export function clear(el: Element): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Reference a symbol in one of the SVG sprites (ICONS01 / BADGES01). Decorative unless `label` is given. */
export function spriteIcon(spritePath: string, symbolId: string, label?: string, cls = 'icon'): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', cls);
  if (label) {
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', label);
  } else {
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
  }
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `${spritePath}#${symbolId}`);
  svg.appendChild(use);
  return svg;
}

/** Image with a readable fallback frame if the file fails to load (§9.5). */
export function image(src: string, alt: string, cls: string, fallbackText?: string): HTMLElement {
  const img = h('img', { src, alt, class: cls, loading: 'lazy', decoding: 'async' });
  img.addEventListener('error', () => {
    const frame = h('div', { class: `${cls} img-fallback`, role: alt ? 'img' : null, 'aria-label': alt || null }, fallbackText ?? alt);
    if (!alt) frame.setAttribute('aria-hidden', 'true');
    img.replaceWith(frame);
  });
  return img;
}

let idCounter = 0;
export function uid(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}
