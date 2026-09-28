// SC05 工房ワークベンチ: brief (left) → board (center) → hints (right). One primary action.

import { h, replace } from '../dom';
import { lt, t, type MessageKey } from '../i18n';
import { dialogue, panelView, screenHeading } from '../components';
import { chosenExplanations } from '../answers';
import { grade } from '../../core/grading';
import { completedActivityCount, isActivityComplete, isQuestCleared, totalActivities } from '../../core/selectors';
import { promptBuilder } from '../activities/promptBuilder';
import { evidenceBoard } from '../activities/evidenceBoard';
import { changeReview } from '../activities/changeReview';
import { triageDecision } from '../activities/triageDecision';
import type { Board } from '../activities/board';
import type { Ctx } from '../context';
import type { ActivityDefinition, Answer, QuestDefinition } from '../../core/types';
import { href } from '../../router';

const SUBMIT_LABEL: Record<ActivityDefinition['type'], MessageKey> = {
  prompt_builder: 'act.submit.prompt',
  evidence_board: 'act.submit.evidence',
  change_review: 'act.submit.review',
  triage_decision: 'act.submit.triage',
};

/** Hints revealed in this tab, including on review of completed activities (which are not recorded). */
const revealedHints = new Map<string, number>();

function makeBoard(a: ActivityDefinition, initial: Answer, onChange: (ans: Answer) => void): Board {
  switch (a.type) {
    case 'prompt_builder':
      return promptBuilder(a, initial, onChange);
    case 'evidence_board':
      return evidenceBoard(a, initial, onChange);
    case 'change_review':
      return changeReview(a, initial, onChange);
    case 'triage_decision':
      return triageDecision(a, initial, onChange);
  }
}

function hintPanel(ctx: Ctx, a: ActivityDefinition): HTMLElement {
  const box = h('section', { class: 'hints', 'aria-labelledby': `${a.id}-hints` });
  function level(): number {
    const saved = ctx.session.save.activityProgress[a.id]?.maxHintLevel ?? 0;
    return Math.max(saved, revealedHints.get(a.id) ?? 0);
  }
  function render(focusLast: boolean) {
    const lv = level();
    replace(box, 
      h('h2', { id: `${a.id}-hints` }, t('hint.title')),
      h('p', { class: 'help' }, t('hint.note')),
      lv > 0
        ? h(
            'ol',
            { class: 'hint-list' },
            ...a.hints.slice(0, lv).map((hint, i) =>
              h(
                'li',
                { class: 'hint', tabindex: -1, 'data-hint-level': i + 1 },
                h('strong', {}, t(`hint.level${i + 1}` as MessageKey)),
                h('p', {}, lt(hint.text)),
              ),
            ),
          )
        : null,
      lv < 3
        ? h(
            'button',
            {
              type: 'button',
              class: 'btn btn-secondary',
              'data-testid': 'hint-button',
              onclick: () => {
                const next = (lv + 1) as 1 | 2 | 3;
                revealedHints.set(a.id, next);
                ctx.session.dispatch({ type: 'USE_HINT', activityId: a.id, level: next, at: new Date().toISOString() });
                render(true);
              },
            },
            t('hint.show', { n: lv + 1, label: t(`hint.level${lv + 1}` as MessageKey) }),
          )
        : h('p', { class: 'help' }, t('hint.allShown')),
    );
    if (focusLast) box.querySelector<HTMLElement>('.hint:last-child')?.focus();
  }
  render(false);
  return box;
}

function nextTarget(ctx: Ctx, quest: QuestDefinition, a: ActivityDefinition): { label: string; hash: string } {
  const idx = quest.activities.findIndex((x) => x.id === a.id);
  const next = quest.activities[idx + 1];
  if (next) return { label: t('act.next'), hash: href({ name: 'activity', questId: quest.id, activityId: next.id }) };
  if (isQuestCleared(ctx.session.save, quest)) return { label: t('act.toClear'), hash: href({ name: 'clear', questId: quest.id }) };
  const firstOpen = quest.activities.find((x) => !isActivityComplete(ctx.session.save, x.id));
  return firstOpen
    ? { label: t('act.next'), hash: href({ name: 'activity', questId: quest.id, activityId: firstOpen.id }) }
    : { label: t('act.toClear'), hash: href({ name: 'clear', questId: quest.id }) };
}

export function activityScreen(ctx: Ctx, quest: QuestDefinition, a: ActivityDefinition): HTMLElement {
  const idx = quest.activities.findIndex((x) => x.id === a.id);
  const objective = quest.objectives.find((o) => o.id === a.objectiveId);
  const cat = ctx.content.catalog;
  const wasComplete = isActivityComplete(ctx.session.save, a.id);

  const status = h('p', { class: 'sr-status', role: 'status', 'aria-live': 'polite', 'data-testid': 'act-status' });
  const feedback = h('section', { class: 'feedback', 'data-testid': 'feedback', hidden: true });
  const board = makeBoard(a, ctx.drafts.get(a.id) ?? {}, (ans) => ctx.drafts.set(a.id, ans));

  function showFeedback(answer: Answer, correct: boolean, outcome: string) {
    const fb = a.feedbackByOutcome[outcome] ?? a.feedbackByOutcome.correct;
    const explains = chosenExplanations(a, answer);
    const next = nextTarget(ctx, quest, a);
    feedback.hidden = false;
    feedback.className = `feedback ${correct ? 'is-correct' : 'is-retry'}`;
    feedback.setAttribute('data-outcome', outcome);
    replace(feedback, 
      h(
        'h2',
        { tabindex: -1, class: 'feedback-title' },
        h('span', { class: 'mark', 'aria-hidden': 'true' }, correct ? '✓' : '↺'),
        ' ',
        correct ? t('fb.correct') : t('fb.retry'),
      ),
      fb
        ? h(
            'dl',
            { class: 'fb-body' },
            h('dt', {}, t('fb.what')),
            h('dd', {}, lt(fb.what)),
            h('dt', {}, t('fb.why')),
            h('dd', {}, lt(fb.why)),
            h('dt', {}, t('fb.next')),
            h('dd', {}, lt(fb.next)),
          )
        : null,
      fb?.examples?.length
        ? h('div', { class: 'fb-examples' }, ...fb.examples.map((ex) => h('div', { class: 'fb-example' }, h('strong', {}, lt(ex.label)), h('p', {}, lt(ex.text)))))
        : null,
      explains.length
        ? h(
            'details',
            { class: 'explains', open: !correct },
            h('summary', {}, t('fb.explains')),
            h(
              'ul',
              {},
              ...explains.map((e) => h('li', {}, e.context ? h('span', { class: 'ctx' }, `${e.context}：`) : null, h('strong', {}, e.label), h('p', {}, e.explain))),
            ),
          )
        : null,
      correct && a.successLines?.length ? dialogue(ctx, a.successLines) : null,
      wasComplete ? h('p', { class: 'help' }, t('fb.reviewNote')) : null,
      h(
        'div',
        { class: 'actions' },
        correct
          ? h('a', { class: 'btn btn-primary', href: next.hash, 'data-testid': 'next' }, next.label)
          : h('button', { type: 'button', class: 'btn btn-primary', 'data-testid': 'retry', onclick: () => board.focus() }, t('fb.backToBoard')),
      ),
    );
    feedback.querySelector<HTMLElement>('.feedback-title')?.focus();
  }

  function submit() {
    const missing = board.missing();
    if (missing) {
      status.textContent = missing;
      return;
    }
    const answer = board.answer();
    const result = grade(a, answer);
    ctx.session.dispatch({
      type: 'ATTEMPT_ACTIVITY',
      activityId: a.id,
      questId: quest.id,
      questRevision: quest.revision,
      correct: result.correct,
      at: new Date().toISOString(),
    });
    if (result.correct) ctx.drafts.delete(a.id);
    status.textContent = result.correct ? t('fb.correct') : t('fb.retry');
    progressLine.textContent = t('act.progress', { done: completedActivityCount(ctx.session.save, cat), total: totalActivities(cat) });
    showFeedback(answer, result.correct, result.outcome);
  }

  const progressLine = h('p', { class: 'screen-sub' }, t('act.progress', { done: completedActivityCount(ctx.session.save, cat), total: totalActivities(cat) }));
  const head = screenHeading(`${lt(quest.title)} — ${lt(a.title)}`);
  head.append(
    h('p', { class: 'screen-sub' }, t('act.position', { n: idx + 1, total: quest.activities.length })),
    progressLine,
  );

  return h(
    'div',
    { class: 'screen screen-activity', 'data-activity': a.id, 'data-type': a.type },
    head,
    h(
      'div',
      { class: 'workbench' },
      h(
        'aside',
        { class: 'wb-brief', 'aria-labelledby': `${a.id}-brief` },
        h('h2', { id: `${a.id}-brief` }, t('act.brief')),
        objective ? h('p', { class: 'objective' }, h('strong', {}, t('act.objective')), ' ', lt(objective.text)) : null,
        h('p', { class: 'prompt' }, lt(a.prompt)),
        ...(a.reference ?? []).map(panelView),
      ),
      h(
        'section',
        { class: 'wb-work', 'aria-labelledby': `${a.id}-work` },
        h('h2', { id: `${a.id}-work`, class: 'visually-hidden' }, t('act.board')),
        wasComplete ? h('p', { class: 'notice notice-ok' }, t('act.reviewing')) : null,
        board.el,
        h(
          'div',
          { class: 'actions primary-actions' },
          h('button', { type: 'button', class: 'btn btn-primary', 'data-testid': 'submit', onclick: submit }, t(SUBMIT_LABEL[a.type])),
        ),
        status,
        feedback,
      ),
      h(
        'aside',
        { class: 'wb-help' },
        hintPanel(ctx, a),
        h('p', { class: 'help draft-note' }, t('act.draftNote')),
        h('a', { class: 'btn-link', href: href({ name: 'quest', questId: quest.id }) }, t('act.backToBrief')),
      ),
    ),
  );
}
