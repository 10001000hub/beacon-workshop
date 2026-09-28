// UI strings and localized content. Grading never depends on these (AC19): only IDs are graded.

import ja from '../content/locales/ja.json';
import en from '../content/locales/en.json';
import type { Locale, LocalizedText } from '../core/types';

export type MessageKey = keyof typeof ja;
const DICTS: Record<Locale, Partial<Record<MessageKey, string>>> = { ja, en };

let current: Locale = 'ja';

export function setLocale(locale: Locale): void {
  current = locale;
  document.documentElement.lang = locale;
}

export function getLocale(): Locale {
  return current;
}

/** UI string, with `{name}` placeholders. Falls back to Japanese, never to the raw key. */
export function t(key: MessageKey, vars: Record<string, string | number> = {}): string {
  const template = DICTS[current][key] ?? ja[key];
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** Localized content text. English is filled in for Release Candidate; until then Japanese is shown. */
export function lt(text: LocalizedText | undefined): string {
  if (!text) return '';
  if (current === 'en' && text.en) return text.en;
  return text.ja;
}
