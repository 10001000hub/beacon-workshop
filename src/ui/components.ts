// Shared building blocks: scenes, reference panels, progress, headings.

import { h, image, spriteIcon } from './dom';
import { lt, t } from './i18n';
import type { Ctx } from './context';
import type { DialogueLine, Panel, QuestDefinition, Scene } from '../core/types';
import {
  clearedQuestCount,
  completedActivityCount,
  level,
  maxXp,
  practiceSelfCheckedCount,
  readQuestCount,
  simulationPercent,
  totalActivities,
  xp,
} from '../core/selectors';
import type { MessageKey } from './i18n';

export const ICONS = 'assets/placeholders/ICONS01.svg';
export const BADGES = 'assets/placeholders/BADGES01.svg';

export function assetSrc(ctx: Ctx, id: string): { src: string; alt: string } | null {
  const a = ctx.content.assets.find((x) => x.id === id);
  return a ? { src: a.path, alt: lt(a.alt) } : null;
}

const PORTRAITS: Record<string, [string, string, string]> = {
  nagi: ['CH01', 'CH02', 'CH03'],
  koto: ['CH04', 'CH05', 'CH06'],
  ritsu: ['CH07', 'CH08', 'CH09'],
};

export function speakerName(ctx: Ctx, line: DialogueLine): string {
  if (line.speaker === 'resident' && line.name) return lt(line.name);
  const c = ctx.content.story.characters[line.speaker];
  return c ? lt(c.name) : line.speaker;
}

function portrait(ctx: Ctx, line: DialogueLine): HTMLElement | null {
  const set = PORTRAITS[line.speaker];
  if (!set) return null;
  const idx = line.expression === 'think' ? 1 : line.expression === 'happy' ? 2 : 0;
  const asset = assetSrc(ctx, set[idx]);
  if (!asset) return null;
  // The speaker name is printed next to the portrait, so the image itself is decorative here.
  return image(asset.src, '', 'portrait', speakerName(ctx, line).slice(0, 2));
}

export function dialogue(ctx: Ctx, lines: DialogueLine[]): HTMLElement {
  return h(
    'ol',
    { class: 'dialogue' },
    ...lines.map((line) =>
      h(
        'li',
        { class: `line line-${line.speaker}` },
        portrait(ctx, line),
        h('div', { class: 'line-body' }, h('span', { class: 'speaker' }, speakerName(ctx, line)), h('p', { class: 'line-text' }, lt(line.text))),
      ),
    ),
  );
}

export function sceneView(ctx: Ctx, scene: Scene, headingText?: string): HTMLElement {
  const bg = scene.backgroundAssetId ? assetSrc(ctx, scene.backgroundAssetId) : null;
  return h(
    'div',
    { class: 'scene', role: 'group', 'aria-label': headingText ?? t('scene.label') },
    bg ? image(bg.src, bg.alt, 'scene-bg', bg.alt) : null,
    dialogue(ctx, scene.lines),
  );
}

const FILE_STATUS: Record<string, MessageKey> = {
  added: 'diff.added',
  removed: 'diff.removed',
  changed: 'diff.changed',
  unchanged: 'diff.unchanged',
};
const DIFF_OP: Record<string, [string, MessageKey]> = {
  add: ['+', 'diff.add'],
  del: ['−', 'diff.del'],
  chg: ['~', 'diff.chg'],
  ctx: [' ', 'diff.ctx'],
};

/** Reference material. Diff lines carry a text label as well as color (§6.2). */
export function panelView(panel: Panel): HTMLElement {
  switch (panel.kind) {
    case 'text':
      return h(
        'div',
        { class: 'panel panel-text' },
        panel.title ? h('h3', {}, lt(panel.title)) : null,
        h('ul', {}, ...panel.lines.map((l) => h('li', {}, lt(l)))),
      );
    case 'files':
      return h(
        'div',
        { class: 'panel panel-files' },
        panel.title ? h('h3', {}, lt(panel.title)) : null,
        h(
          'ul',
          {},
          ...panel.entries.map((e) =>
            h('li', { class: `file file-${e.status}` }, h('code', {}, e.path), ' ', h('span', { class: 'tag' }, t(FILE_STATUS[e.status] ?? 'diff.unchanged'))),
          ),
        ),
      );
    case 'diff':
      return h(
        'div',
        { class: 'panel panel-diff' },
        h('h3', {}, h('code', {}, panel.file)),
        h(
          'div',
          { class: 'diff-scroll', tabindex: 0, role: 'region', 'aria-label': t('diff.region', { file: panel.file }) },
          h(
            'ul',
            { class: 'diff' },
            ...panel.lines.map((l) => {
              const [sym, key] = DIFF_OP[l.op] ?? DIFF_OP.ctx!;
              return h(
                'li',
                { class: `diff-line op-${l.op}` },
                h('span', { class: 'diff-op' }, h('span', { 'aria-hidden': 'true' }, sym), h('span', { class: 'diff-op-label' }, t(key))),
                h('code', {}, l.text),
              );
            }),
          ),
        ),
      );
    case 'preview':
      return h(
        'div',
        { class: 'panel panel-preview' },
        h('h3', {}, panel.title ? lt(panel.title) : t('panel.preview')),
        h('p', { class: 'sim-note' }, t('panel.previewNote')),
        panel.items.length > 0
          ? h('ul', { class: 'preview-list' }, ...panel.items.map((i) => h('li', {}, lt(i))))
          : h('p', { class: 'preview-empty' }, panel.empty ? lt(panel.empty) : t('panel.previewEmpty')),
      );
  }
}

export function screenHeading(text: string, sub?: string): HTMLElement {
  return h(
    'header',
    { class: 'screen-head' },
    h('h1', { tabindex: -1, class: 'screen-title' }, text),
    sub ? h('p', { class: 'screen-sub' }, sub) : null,
  );
}

export function levelTitle(lv: number): string {
  return t(`level.${Math.max(1, Math.min(7, lv))}` as MessageKey);
}

/** The three progress kinds are always shown apart (§6.5, AC14). */
export function progressSummary(ctx: Ctx, compact = false): HTMLElement {
  const { save } = ctx.session;
  const cat = ctx.content.catalog;
  const done = completedActivityCount(save, cat);
  const total = totalActivities(cat);
  const xpValue = xp(save, cat);
  const lv = level(xpValue);
  const items: [string, string, string][] = [
    ['sim', t('progress.simulation'), t('progress.simulationValue', { done, total, pct: simulationPercent(save, cat) })],
    ['town', t('progress.town'), t('progress.townValue', { n: clearedQuestCount(save, cat), total: cat.quests.length })],
    ['read', t('progress.reading'), t('progress.readingValue', { n: readQuestCount(save, cat), total: cat.quests.length })],
    ['practice', t('progress.practice'), t('progress.practiceValue', { n: practiceSelfCheckedCount(save, cat), total: cat.quests.length })],
    ['xp', t('progress.xp'), t('progress.xpValue', { xp: xpValue, max: maxXp(cat), lv, title: levelTitle(lv) })],
  ];
  return h(
    'dl',
    { class: compact ? 'progress progress-compact' : 'progress', 'data-testid': 'progress' },
    ...items.flatMap(([id, label, value]) => [h('dt', {}, label), h('dd', { 'data-progress': id }, value)]),
  );
}

export function badge(quest: QuestDefinition, lit: boolean): SVGSVGElement {
  return spriteIcon(BADGES, `badge-${quest.id}`, undefined, lit ? 'badge lit' : 'badge');
}

export function linkButton(label: string, hash: string, cls = 'btn'): HTMLAnchorElement {
  return h('a', { class: cls, href: hash }, label);
}

export function notice(text: string, kind: 'info' | 'warn' | 'ok' = 'info', testid?: string): HTMLElement {
  return h('p', { class: `notice notice-${kind}`, role: kind === 'warn' ? 'alert' : 'status', 'data-testid': testid ?? null }, text);
}
