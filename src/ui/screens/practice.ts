// SC07 実機実習カード. The learner acts in the real product themselves; we only show the card,
// copy the request text and keep a self-reported record (§7, AC20, AC23).

import { h, replace } from '../dom';
import { lt, t, type MessageKey } from '../i18n';
import { linkButton, notice, screenHeading } from '../components';
import { href } from '../../router';
import type { Ctx } from '../context';
import type { BlockReason, PracticeCard, PracticeStatus, QuestId } from '../../core/types';
import { radioGroup } from '../activities/changeReview';

const STATUSES: PracticeStatus[] = ['not_started', 'in_progress', 'self_checked', 'unavailable'];
const REASONS: BlockReason[] = ['quota', 'environment', 'permission', 'other'];

export function verificationLabel(status: string): string {
  return t(`verify.${status}` as MessageKey);
}

function routeBox(ctx: Ctx): HTMLElement {
  const r = ctx.content.routes[0]!;
  return h(
    'section',
    { class: 'brief-card route', 'aria-labelledby': 'route-h' },
    h('h2', { id: 'route-h' }, t('pr.route')),
    h(
      'dl',
      {},
      h('dt', {}, t('pr.routeName')),
      h('dd', {}, lt(r.displayName)),
      h('dt', {}, t('pr.routeStatus')),
      h('dd', { 'data-testid': 'route-status' }, verificationLabel(r.status)),
      h('dt', {}, t('pr.testedAt')),
      h('dd', {}, r.testedAt ?? t('pr.notRecorded')),
      h('dt', {}, t('pr.testedVersion')),
      h('dd', {}, r.testedProductVersion ?? t('pr.notRecorded')),
    ),
    h('p', { class: 'help' }, lt(r.note)),
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function practiceIndex(ctx: Ctx): HTMLElement {
  return h(
    'div',
    { class: 'screen screen-practice' },
    screenHeading(t('pr.indexTitle'), t('pr.indexSub')),
    notice(t('pr.separate'), 'info'),
    routeBox(ctx),
    h(
      'ol',
      { class: 'quest-links' },
      ...ctx.content.practice.map((pc) => {
        const q = ctx.content.quests.find((x) => x.id === pc.questId);
        const rec = ctx.session.save.practice[pc.questId];
        return h(
          'li',
          { 'data-practice': pc.id },
          h('a', { href: href({ name: 'practice', questId: pc.questId }) }, `${pc.questId.toUpperCase()} ${lt(q?.title)}`),
          ' ',
          h('span', { class: 'tag' }, t(`pr.status.${rec?.status ?? 'not_started'}` as MessageKey)),
          ' ',
          h('span', { class: 'tag tag-muted' }, verificationLabel(pc.status)),
        );
      }),
    ),
    linkButton(t('nav.backToMap'), href({ name: 'map' }), 'btn-link'),
  );
}

export function practiceCard(ctx: Ctx, questId: QuestId): HTMLElement {
  const pc = ctx.content.practice.find((p) => p.questId === questId) as PracticeCard;
  const quest = ctx.content.quests.find((q) => q.id === questId)!;
  const instruction = lt(pc.instruction);
  const copyStatus = h('div', { class: 'copy-status', 'aria-live': 'polite' });
  const manual = h('textarea', { class: 'copy-manual', readonly: true, rows: 6, 'aria-label': t('pr.manualCopy'), hidden: true });
  manual.value = instruction;

  const recordBox = h('div', { class: 'record' });
  function renderRecord() {
    const rec = ctx.session.save.practice[questId];
    const status = rec?.status ?? 'not_started';
    replace(recordBox, 
      radioGroup(
        `practice-${questId}`,
        t('pr.record'),
        STATUSES.map((s) => ({ id: s, label: t(`pr.status.${s}` as MessageKey) })),
        status,
        (id) => {
          ctx.session.dispatch({
            type: 'SET_PRACTICE',
            questId,
            status: id as PracticeStatus,
            routeId: ctx.content.routes[0]!.id,
            blockReason: id === 'unavailable' ? (rec?.blockReason ?? 'other') : null,
            at: new Date().toISOString(),
          });
          renderRecord();
          recordBox.querySelector<HTMLInputElement>(`input[value="${id}"]`)?.focus();
        },
      ),
      status === 'unavailable'
        ? radioGroup(
            `practice-${questId}-reason`,
            t('pr.blockReason'),
            REASONS.map((r) => ({ id: r, label: t(`pr.reason.${r}` as MessageKey) })),
            rec?.blockReason ?? 'other',
            (id) => {
              ctx.session.dispatch({ type: 'SET_PRACTICE', questId, status: 'unavailable', routeId: ctx.content.routes[0]!.id, blockReason: id as BlockReason, at: new Date().toISOString() });
              renderRecord();
              recordBox.querySelector<HTMLInputElement>(`input[value="${id}"]`)?.focus();
            },
          )
        : null,
      status === 'unavailable' ? h('p', { class: 'help' }, t('pr.unavailableNote')) : null,
      h('p', { class: 'help' }, t('pr.selfReport')),
      rec?.checkedAt ? h('p', { class: 'help' }, t('pr.checkedAt', { at: rec.checkedAt })) : null,
    );
  }
  renderRecord();

  return h(
    'div',
    { class: 'screen screen-practice-card', 'data-practice': pc.id },
    screenHeading(t('pr.cardTitle', { title: lt(quest.title) }), t('pr.cardSub')),
    notice(t('pr.separate'), 'info'),
    h(
      'section',
      { class: 'brief-card' },
      h('h2', {}, t('pr.objective')),
      h('p', {}, lt(pc.objective)),
      h('h3', {}, t('pr.requiredState')),
      h('ul', {}, ...pc.requiredState.map((s) => h('li', {}, lt(s)))),
      h('h3', {}, t('pr.whereToAct')),
      h('p', {}, lt(pc.whereToAct)),
    ),
    h(
      'section',
      { class: 'brief-card', 'aria-labelledby': 'instr-h' },
      h('h2', { id: 'instr-h' }, t('pr.instruction')),
      h('pre', { class: 'instruction', 'data-testid': 'instruction' }, instruction),
      h(
        'div',
        { class: 'actions' },
        h(
          'button',
          {
            type: 'button',
            class: 'btn btn-primary',
            'data-testid': 'copy',
            onclick: async () => {
              const ok = await copyText(instruction);
              if (ok) {
                manual.hidden = true;
                copyStatus.replaceChildren(notice(t('pr.copied'), 'ok'));
              } else {
                manual.hidden = false;
                copyStatus.replaceChildren(notice(t('pr.copyFailed'), 'warn', 'copy-failed'));
                manual.focus();
                manual.select();
              }
            },
          },
          t('pr.copy'),
        ),
      ),
      copyStatus,
      manual,
      h('h3', {}, t('pr.expected')),
      h('p', {}, lt(pc.expectedResult)),
      h('h3', {}, t('pr.success')),
      h('p', {}, lt(pc.successExample)),
    ),
    h(
      'section',
      { class: 'brief-card' },
      h('h2', {}, t('pr.failure')),
      h(
        'ul',
        {},
        ...pc.failureRecovery.map((f) =>
          h('li', {}, h('strong', {}, lt(f.situation)), h('p', {}, lt(f.action)), f.instruction ? h('pre', { class: 'instruction' }, lt(f.instruction)) : null),
        ),
      ),
    ),
    h('section', { class: 'brief-card', 'aria-labelledby': 'rec-h' }, h('h2', { id: 'rec-h' }, t('pr.recordTitle')), recordBox),
    h(
      'section',
      { class: 'brief-card' },
      h('h2', {}, t('pr.verification')),
      h(
        'dl',
        {},
        h('dt', {}, t('pr.cardStatus')),
        h('dd', { 'data-testid': 'card-status' }, verificationLabel(pc.status)),
        h('dt', {}, t('pr.testedAt')),
        h('dd', {}, pc.verification.verifiedAt ?? t('pr.notRecorded')),
        h('dt', {}, t('pr.testedVersion')),
        h('dd', {}, pc.verification.testedProductVersion ?? t('pr.notRecorded')),
        h('dt', {}, t('pr.contentVersion')),
        h('dd', {}, pc.verification.contentVersion),
      ),
      h('p', { class: 'help' }, lt(pc.verification.note)),
    ),
    routeBox(ctx),
    h(
      'div',
      { class: 'actions' },
      linkButton(t('pr.index'), href({ name: 'practice', questId: null }), 'btn btn-secondary'),
      linkButton(t('nav.backToMap'), href({ name: 'map' }), 'btn-link'),
    ),
  );
}
