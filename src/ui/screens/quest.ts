// SC04 章の依頼書, SC06 章の振り返り, and reading mode (教材として読む; no XP, no clear record).

import { h } from '../dom';
import { lt, t } from '../i18n';
import { badge, linkButton, panelView, sceneView, screenHeading } from '../components';
import { allOptionExplanations, describeAccepted } from '../answers';
import {
  isActivityComplete,
  isActivityUnlocked,
  isQuestCleared,
  isQuestUnlocked,
  isStaleCompletion,
  nextActivity,
  readSectionId,
} from '../../core/selectors';
import { href } from '../../router';
import type { Ctx } from '../context';
import type { QuestDefinition } from '../../core/types';

function activityList(ctx: Ctx, quest: QuestDefinition): HTMLElement {
  const save = ctx.session.save;
  return h(
    'ol',
    { class: 'activity-list' },
    ...quest.activities.map((a) => {
      const done = isActivityComplete(save, a.id);
      const open = isActivityUnlocked(save, quest, a.id);
      const state = done ? t('quest.state.done') : open ? t('quest.state.open') : t('quest.state.locked');
      return h(
        'li',
        { class: done ? 'is-done' : open ? 'is-open' : 'is-locked', 'data-activity': a.id },
        open || done ? h('a', { href: href({ name: 'activity', questId: quest.id, activityId: a.id }) }, lt(a.title)) : h('span', {}, lt(a.title)),
        ' ',
        h('span', { class: 'tag' }, done ? '✓ ' : '', state),
        isStaleCompletion(save, quest, a.id) ? h('span', { class: 'tag tag-warn' }, t('quest.stale')) : null,
      );
    }),
  );
}

export function questBrief(ctx: Ctx, quest: QuestDefinition): HTMLElement {
  const save = ctx.session.save;
  const next = nextActivity(save, quest);
  const cleared = isQuestCleared(save, quest);
  return h(
    'div',
    { class: 'screen screen-brief', 'data-quest': quest.id },
    screenHeading(lt(quest.title), `${quest.id.toUpperCase()} · ${lt(quest.place)}`),
    sceneView(ctx, quest.briefScene, t('quest.scene')),
    h(
      'section',
      { class: 'brief-card', 'aria-labelledby': 'brief-h' },
      h('h2', { id: 'brief-h' }, t('quest.request')),
      h('p', {}, lt(quest.incident)),
      h('h3', {}, t('quest.sample')),
      h('p', {}, lt(quest.sample)),
      h('h3', {}, t('quest.notes')),
      h('p', {}, lt(quest.notesState)),
      h('h3', {}, t('quest.objectives')),
      h('ul', {}, ...quest.objectives.map((o) => h('li', {}, lt(o.text)))),
    ),
    h('section', { class: 'brief-card', 'aria-labelledby': 'acts-h' }, h('h2', { id: 'acts-h' }, t('quest.activities')), activityList(ctx, quest)),
    h(
      'div',
      { class: 'actions primary-actions' },
      next
        ? linkButton(t('quest.tryInWorkshop'), href({ name: 'activity', questId: quest.id, activityId: next.id }), 'btn btn-primary')
        : linkButton(t('quest.toClear'), href({ name: 'clear', questId: quest.id }), 'btn btn-primary'),
      cleared ? linkButton(t('quest.review'), href({ name: 'activity', questId: quest.id, activityId: quest.activities[0]!.id }), 'btn btn-secondary') : null,
      linkButton(t('nav.readMode'), href({ name: 'read', questId: quest.id }), 'btn btn-secondary'),
      linkButton(t('nav.backToMap'), href({ name: 'map' }), 'btn-link'),
    ),
  );
}

function hintSummary(level: number): string {
  if (level === 0) return t('clear.hint0');
  if (level === 3) return t('clear.hint3');
  return t('clear.hintN', { n: level });
}

export function takeawayCards(quest: QuestDefinition): HTMLElement {
  return h(
    'ul',
    { class: 'takeaways' },
    ...quest.takeawayCards.map((c) => h('li', { class: 'takeaway', 'data-card': c.id }, h('h3', {}, lt(c.title)), h('p', {}, lt(c.body)))),
  );
}

export function questClear(ctx: Ctx, quest: QuestDefinition): HTMLElement {
  const save = ctx.session.save;
  const lastQuest = ctx.content.quests[ctx.content.quests.length - 1];
  const nextQuest = ctx.content.quests[ctx.content.quests.findIndex((q) => q.id === quest.id) + 1];
  return h(
    'div',
    { class: 'screen screen-clear', 'data-quest': quest.id },
    screenHeading(t('clear.title', { title: lt(quest.title) })),
    h('p', { class: 'clear-badge' }, badge(quest, true), ' ', t('clear.lit')),
    sceneView(ctx, quest.clearScene, t('quest.scene')),
    h(
      'section',
      { class: 'brief-card', 'aria-labelledby': 'did-h' },
      h('h2', { id: 'did-h' }, t('clear.did')),
      h(
        'ul',
        {},
        ...quest.activities.map((a) => {
          const rec = save.completedActivities[a.id];
          const obj = quest.objectives.find((o) => o.id === a.objectiveId);
          return h(
            'li',
            {},
            h('strong', {}, lt(obj?.text)),
            rec ? h('p', { class: 'help' }, t('clear.attempts', { n: rec.attempts }), ' · ', hintSummary(rec.maxHintLevel)) : null,
          );
        }),
      ),
    ),
    h(
      'section',
      { class: 'brief-card', 'aria-labelledby': 'cards-h' },
      h('h2', { id: 'cards-h' }, t('clear.cards')),
      takeawayCards(quest),
      h('h3', {}, lt(quest.takeawayTemplate.title)),
      h('p', { class: 'template' }, lt(quest.takeawayTemplate.text)),
    ),
    h(
      'div',
      { class: 'actions primary-actions' },
      quest.id === lastQuest?.id
        ? linkButton(t('clear.toEnding'), href({ name: 'ending' }), 'btn btn-primary')
        : linkButton(t('clear.toMap'), href({ name: 'map' }), 'btn btn-primary'),
      linkButton(t('clear.toPractice'), href({ name: 'practice', questId: quest.id }), 'btn btn-secondary'),
      nextQuest && isQuestUnlocked(save, ctx.content.catalog, nextQuest.id)
        ? linkButton(t('clear.nextQuest', { title: lt(nextQuest.title) }), href({ name: 'quest', questId: nextQuest.id }), 'btn-link')
        : null,
    ),
  );
}

export function readIndex(ctx: Ctx): HTMLElement {
  return h(
    'div',
    { class: 'screen screen-read' },
    screenHeading(t('read.title'), t('read.note')),
    h(
      'ul',
      { class: 'quest-links' },
      ...ctx.content.quests.map((q) =>
        h(
          'li',
          {},
          h('a', { href: href({ name: 'read', questId: q.id }) }, `${q.id.toUpperCase()} ${lt(q.title)}`),
          ctx.session.save.readSections[readSectionId(q.id)] ? h('span', { class: 'tag' }, t('read.done')) : null,
        ),
      ),
    ),
    linkButton(t('nav.backToMap'), href({ name: 'map' }), 'btn-link'),
  );
}

/** Reading mode shows every explanation and the accepted answers, but records only "read". */
export function readQuest(ctx: Ctx, quest: QuestDefinition): HTMLElement {
  ctx.session.dispatch({ type: 'MARK_READ', sectionId: readSectionId(quest.id), at: new Date().toISOString() });
  return h(
    'div',
    { class: 'screen screen-read', 'data-quest': quest.id },
    screenHeading(t('read.questTitle', { title: lt(quest.title) }), t('read.note')),
    sceneView(ctx, quest.briefScene, t('quest.scene')),
    h('section', { class: 'brief-card' }, h('h2', {}, t('quest.request')), h('p', {}, lt(quest.incident)), h('h3', {}, t('quest.sample')), h('p', {}, lt(quest.sample))),
    ...quest.activities.map((a) =>
      h(
        'section',
        { class: 'brief-card read-activity', 'data-activity': a.id },
        h('h2', {}, lt(a.title)),
        h('p', {}, lt(a.prompt)),
        ...(a.reference ?? []).map(panelView),
        h('h3', {}, t('read.accepted')),
        ...a.grading.accepted.map((combo, i) =>
          h(
            'div',
            { class: 'accepted' },
            a.grading.accepted.length > 1 ? h('h4', {}, t('read.alt', { n: i + 1 })) : null,
            h('ul', {}, ...describeAccepted(a, combo).map((l) => h('li', {}, l))),
          ),
        ),
        a.feedbackByOutcome.correct ? h('p', {}, lt(a.feedbackByOutcome.correct.why)) : null,
        h(
          'details',
          {},
          h('summary', {}, t('read.explains')),
          h('ul', {}, ...allOptionExplanations(a).map((e) => h('li', {}, e.context ? `${e.context}：` : '', h('strong', {}, e.label), h('p', {}, e.explain)))),
        ),
      ),
    ),
    h('section', { class: 'brief-card' }, h('h2', {}, t('clear.cards')), takeawayCards(quest)),
    sceneView(ctx, quest.clearScene, t('quest.scene')),
    h(
      'div',
      { class: 'actions' },
      linkButton(t('read.toSimulation'), href({ name: 'quest', questId: quest.id }), 'btn btn-primary'),
      linkButton(t('read.index'), href({ name: 'read', questId: null }), 'btn-link'),
    ),
  );
}
