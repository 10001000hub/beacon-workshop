// SC01 タイトル, SC02 最初の案内, prologue, SC03 町のマップ, SC10 終幕.

import { h, image } from '../dom';
import { lt, t } from '../i18n';
import { assetSrc, badge, linkButton, progressSummary, sceneView, screenHeading } from '../components';
import {
  completedActivityCount,
  isAllComplete,
  isQuestCleared,
  isQuestUnlocked,
  practiceSelfCheckedCount,
  questCompletedCount,
  resumeTarget,
  totalActivities,
} from '../../core/selectors';
import { href } from '../../router';
import type { Ctx } from '../context';
import { settingsControls } from './settings';

export function titleScreen(ctx: Ctx): HTMLElement {
  const save = ctx.session.save;
  const hasProgress = completedActivityCount(save, ctx.content.catalog) > 0 || save.introSeenAt !== null;
  const logo = assetSrc(ctx, 'LOGO01');
  return h(
    'div',
    { class: 'screen screen-title' },
    logo ? image(logo.src, '', 'logo', '') : null,
    screenHeading(t('app.name'), t('app.subtitle')),
    h('p', { class: 'lead' }, t('title.lead')),
    h(
      'ul',
      { class: 'facts' },
      h('li', {}, t('title.unofficial')),
      h('li', {}, t('title.simulation')),
      h('li', {}, t('title.free')),
      h('li', {}, t('title.local')),
    ),
    h(
      'div',
      { class: 'actions primary-actions' },
      hasProgress
        ? linkButton(t('title.continue'), href({ name: 'map' }), 'btn btn-primary')
        : linkButton(t('title.begin'), href({ name: 'start' }), 'btn btn-primary'),
      hasProgress ? linkButton(t('title.guide'), href({ name: 'start' }), 'btn btn-secondary') : null,
      linkButton(t('nav.readMode'), href({ name: 'read', questId: null }), 'btn btn-secondary'),
    ),
  );
}

export function startScreen(ctx: Ctx): HTMLElement {
  return h(
    'div',
    { class: 'screen screen-start' },
    screenHeading(t('start.title')),
    h(
      'section',
      { class: 'brief-card', 'aria-labelledby': 'modes-h' },
      h('h2', { id: 'modes-h' }, t('start.modes')),
      h(
        'dl',
        { class: 'modes' },
        h('dt', {}, t('start.simTitle')),
        h('dd', {}, t('start.simBody')),
        h('dt', {}, t('start.practiceTitle')),
        h('dd', {}, t('start.practiceBody')),
      ),
    ),
    h(
      'section',
      { class: 'brief-card', 'aria-labelledby': 'save-h' },
      h('h2', { id: 'save-h' }, t('start.saveTitle')),
      h('p', {}, t('start.saveBody')),
    ),
    h('section', { class: 'brief-card', 'aria-labelledby': 'disp-h' }, h('h2', { id: 'disp-h' }, t('start.display')), settingsControls(ctx)),
    h(
      'div',
      { class: 'actions primary-actions' },
      h(
        'a',
        {
          class: 'btn btn-primary',
          href: href({ name: 'prologue' }),
          'data-testid': 'start-practice',
          onclick: () => ctx.session.dispatch({ type: 'MARK_INTRO_SEEN', at: new Date().toISOString() }),
        },
        t('start.go'),
      ),
    ),
  );
}

export function prologueScreen(ctx: Ctx): HTMLElement {
  return h(
    'div',
    { class: 'screen screen-prologue' },
    screenHeading(t('prologue.title')),
    sceneView(ctx, ctx.content.story.prologue, t('prologue.title')),
    h('div', { class: 'actions primary-actions' }, linkButton(t('prologue.toMap'), href({ name: 'map' }), 'btn btn-primary')),
  );
}

const PIN_POS: [number, number][] = [
  [12.7, 76.8],
  [30.3, 65.8],
  [47.9, 58.6],
  [63.5, 46.9],
  [77.1, 33.9],
  [87.9, 19.5],
];

export function mapScreen(ctx: Ctx): HTMLElement {
  const save = ctx.session.save;
  const cat = ctx.content.catalog;
  const resume = resumeTarget(save, cat);
  const map = assetSrc(ctx, 'MAP01');
  const regions = ctx.content.story.regions;

  const pins = h(
    'div',
    { class: 'map-pins', 'aria-hidden': 'true' },
    ...ctx.content.quests.map((q, i) => {
      const [x, y] = PIN_POS[i] ?? [50, 50];
      const lit = isQuestCleared(save, q);
      const open = isQuestUnlocked(save, cat, q.id);
      const label = lt(regions.find((r) => r.questId === q.id)?.label) || lt(q.place);
      const cls = `pin ${lit ? 'lit' : open ? 'open' : 'locked'}`;
      const style = `left:${x}%;top:${y}%`;
      return open
        ? h('a', { class: cls, style, href: href({ name: 'quest', questId: q.id }), tabindex: -1 }, h('span', {}, label))
        : h('span', { class: cls, style }, h('span', {}, label));
    }),
  );

  // Decorative mist (FX01) over places that are still locked; static, hidden from assistive tech.
  const fx = assetSrc(ctx, 'FX01');
  const mist = h(
    'div',
    { class: 'map-mist', 'aria-hidden': 'true' },
    ...(fx
      ? ctx.content.quests.flatMap((q, i) => {
          if (isQuestUnlocked(save, cat, q.id)) return [];
          const [x, y] = PIN_POS[i] ?? [50, 50];
          return [h('img', { class: 'mist', src: fx.src, alt: '', style: `left:${x}%;top:${y}%`, loading: 'lazy' })];
        })
      : []),
  );

  const primary = resume
    ? linkButton(
        t('map.next'),
        resume.activityId && questCompletedCount(save, ctx.content.quests.find((q) => q.id === resume.questId)!) > 0
          ? href({ name: 'activity', questId: resume.questId, activityId: resume.activityId })
          : href({ name: 'quest', questId: resume.questId }),
        'btn btn-primary',
      )
    : linkButton(t('map.toEnding'), href({ name: 'ending' }), 'btn btn-primary');
  primary.setAttribute('data-testid', 'map-next');

  return h(
    'div',
    { class: 'screen screen-map' },
    screenHeading(t('map.title'), t('map.sub')),
    progressSummary(ctx),
    h('div', { class: 'actions primary-actions' }, primary),
    h('div', { class: 'map-frame' }, map ? image(map.src, map.alt, 'map-img', map.alt) : null, mist, pins),
    h(
      'section',
      { 'aria-labelledby': 'quests-h' },
      h('h2', { id: 'quests-h' }, t('map.list')),
      h(
        'ol',
        { class: 'quest-list' },
        ...ctx.content.quests.map((q) => {
          const lit = isQuestCleared(save, q);
          const open = isQuestUnlocked(save, cat, q.id);
          const n = questCompletedCount(save, q);
          const state = lit ? t('map.state.lit') : open ? t('map.state.open', { n, total: q.activities.length }) : t('map.state.locked');
          return h(
            'li',
            { class: `quest-item ${lit ? 'is-lit' : open ? 'is-open' : 'is-locked'}`, 'data-quest': q.id },
            badge(q, lit),
            h(
              'div',
              {},
              open ? h('a', { href: href({ name: 'quest', questId: q.id }) }, `${q.id.toUpperCase()} ${lt(q.title)}`) : h('span', {}, `${q.id.toUpperCase()} ${lt(q.title)}`),
              h('p', { class: 'help' }, lt(q.place), ' · ', state),
            ),
          );
        }),
      ),
    ),
  );
}

export function endingScreen(ctx: Ctx): HTMLElement {
  const save = ctx.session.save;
  const cat = ctx.content.catalog;
  if (!isAllComplete(save, cat)) {
    return h(
      'div',
      { class: 'screen screen-ending' },
      screenHeading(t('ending.title')),
      h('p', {}, t('ending.notYet', { done: completedActivityCount(save, cat), total: totalActivities(cat) })),
      linkButton(t('nav.backToMap'), href({ name: 'map' }), 'btn btn-primary'),
    );
  }
  return h(
    'div',
    { class: 'screen screen-ending', 'data-testid': 'ending' },
    screenHeading(t('ending.title')),
    sceneView(ctx, ctx.content.story.ending, t('ending.title')),
    h(
      'section',
      { class: 'brief-card' },
      h('h2', {}, t('ending.record')),
      h('p', {}, t('ending.simDone', { done: completedActivityCount(save, cat), total: totalActivities(cat) })),
      h('p', {}, t('ending.practice', { n: practiceSelfCheckedCount(save, cat), total: cat.quests.length })),
      h('p', { class: 'help' }, t('ending.honest')),
      progressSummary(ctx, true),
    ),
    h(
      'section',
      { class: 'brief-card' },
      h('h2', {}, t('ending.future')),
      h('p', { class: 'help' }, t('ending.futureNote')),
      h('ul', {}, ...ctx.content.story.futureTopics.map((f) => h('li', {}, lt(f)))),
    ),
    h(
      'div',
      { class: 'actions primary-actions' },
      linkButton(t('ending.continue'), href({ name: 'practice', questId: null }), 'btn btn-primary'),
      linkButton(t('nav.notebook'), href({ name: 'notebook' }), 'btn btn-secondary'),
      linkButton(t('nav.backToMap'), href({ name: 'map' }), 'btn-link'),
    ),
  );
}
