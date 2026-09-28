// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import ja from '../../src/content/locales/ja.json';
import en from '../../src/content/locales/en.json';
import { getLocale, lt, setLocale, t } from '../../src/ui/i18n';
import { loadContent } from '../../src/content/index';
const RAW_CONTENT = loadContent();
import { grade } from '../../src/core/grading';
import { answerFrom } from './answers';

describe('locale architecture', () => {
  it('ja and en dictionaries have identical keys and matching placeholders', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ja).sort());
    const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    for (const k of Object.keys(ja) as (keyof typeof ja)[]) expect(ph(en[k]), k).toEqual(ph(ja[k]));
  });
  it('switching locale changes strings and html lang', () => {
    setLocale('en');
    expect(getLocale()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(t('nav.map')).toBe('Map');
    setLocale('ja');
    expect(t('nav.map')).toBe('マップ');
  });
  it('interpolates variables', () => {
    setLocale('ja');
    expect(t('header.progress', { done: 3, total: 18 })).toContain('3/18');
  });
  it('content falls back to Japanese when English is not yet written', () => {
    setLocale('en');
    expect(lt({ ja: 'やあ' })).toBe('やあ');
    expect(lt({ ja: 'やあ', en: 'hi' })).toBe('hi');
    setLocale('ja');
  });
  it('grading does not depend on the display locale', () => {
    const a = RAW_CONTENT.quests[0]!.activities[0]!;
    setLocale('ja');
    const r1 = grade(a, answerFrom(a));
    setLocale('en');
    const r2 = grade(a, answerFrom(a));
    setLocale('ja');
    expect(r1).toEqual(r2);
  });
});
