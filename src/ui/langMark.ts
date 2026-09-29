// Japanese content that is shown while the UI language is English (English learning content is
// not written yet) must be exposed as Japanese to assistive technology (WCAG 3.1.2).
// Only Japanese runs that are not already inside a Japanese-language element are marked; English UI
// text and the document language are left alone. The DOM is only changed through attributes and
// text nodes, never innerHTML.

const JP = '\\u3000-\\u303f\\u3040-\\u30ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\uff00-\\uffef';
const HAS_JP = new RegExp(`[${JP}]`);
// A run: Japanese characters, with ASCII (e.g. "v0.4", "Q01") kept inside it only when sandwiched.
const RUN = new RegExp(`[${JP}]+(?:[0-9A-Za-z.+%\\-]*[${JP}]+)*`, 'g');
const ATTRIBUTE_ONLY = new Set(['OPTION', 'OPTGROUP', 'TEXTAREA', 'TITLE', 'SCRIPT', 'STYLE']);
const HTML_NS = 'http://www.w3.org/1999/xhtml';

function isJapaneseContext(el: Element): boolean {
  const owner = el.closest('[lang]');
  return !!owner && (owner.getAttribute('lang') ?? '').toLowerCase().startsWith('ja');
}

function markTextNode(node: Text): void {
  const parent = node.parentElement;
  const text = node.data;
  if (!parent || parent.namespaceURI !== HTML_NS || !HAS_JP.test(text) || isJapaneseContext(parent)) return;
  if (ATTRIBUTE_ONLY.has(parent.tagName)) {
    parent.setAttribute('lang', 'ja');
    return;
  }
  const doc = node.ownerDocument;
  const frag = doc.createDocumentFragment();
  let last = 0;
  for (const m of text.matchAll(RUN)) {
    const start = m.index ?? 0;
    if (start > last) frag.appendChild(doc.createTextNode(text.slice(last, start)));
    const span = doc.createElement('span');
    span.setAttribute('lang', 'ja');
    span.textContent = m[0];
    frag.appendChild(span);
    last = start + m[0].length;
  }
  if (last < text.length) frag.appendChild(doc.createTextNode(text.slice(last)));
  parent.replaceChild(frag, node);
}

/** Mark every unmarked Japanese text run at or below `root`. Idempotent. */
export function markJapaneseFallback(root: Node): void {
  const doc = root.ownerDocument ?? (root as Document);
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const found: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) found.push(n as Text);
  for (const n of found) markTextNode(n);
}

/** Keep the subtree marked as the app re-renders boards, feedback and hints. */
export function watchJapaneseFallback(root: HTMLElement): () => void {
  markJapaneseFallback(root);
  const observer = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'characterData') markJapaneseFallback(r.target);
      else for (const added of r.addedNodes) markJapaneseFallback(added);
    }
  });
  observer.observe(root, { childList: true, subtree: true, characterData: true });
  return () => observer.disconnect();
}
