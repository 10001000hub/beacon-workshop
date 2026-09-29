// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { markJapaneseFallback } from '../../src/ui/langMark';

function build(html: string): HTMLElement {
  const root = document.createElement('div');
  // Test fixture only; the app itself never uses innerHTML.
  root.innerHTML = html;
  return root;
}

describe('markJapaneseFallback', () => {
  it('wraps Japanese runs in lang="ja" and leaves English UI text alone', () => {
    const root = build('<p>Map: 港町ルーメンへようこそ</p>');
    markJapaneseFallback(root);
    const spans = root.querySelectorAll('span[lang="ja"]');
    expect(spans).toHaveLength(1);
    expect(spans[0]!.textContent).toBe('港町ルーメンへようこそ');
    expect(root.textContent).toBe('Map: 港町ルーメンへようこそ');
  });
  it('does not double-mark content already inside a Japanese element and is idempotent', () => {
    const root = build('<p lang="ja">日本語</p><p>もう一つ</p>');
    markJapaneseFallback(root);
    markJapaneseFallback(root);
    expect(root.querySelectorAll('p[lang="ja"] span')).toHaveLength(0);
    expect(root.querySelectorAll('span[lang="ja"]')).toHaveLength(1);
  });
  it('marks the element itself for options and textareas, and keeps ASCII inside a run', () => {
    const root = build('<select><option>選択肢</option></select><p>版v0.4を確認</p>');
    markJapaneseFallback(root);
    expect(root.querySelector('option')!.getAttribute('lang')).toBe('ja');
    expect(root.querySelector('p span[lang="ja"]')!.textContent).toBe('版v0.4を確認');
  });
  it('leaves purely English text untouched', () => {
    const root = build('<p>Start over</p>');
    markJapaneseFallback(root);
    expect(root.querySelector('[lang]')).toBeNull();
  });
});
