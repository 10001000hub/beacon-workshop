// triage_decision: for each case, pick 進める／今直す／確認する／後で改善 (and a reason when asked).

import { h } from '../dom';
import { lt, t } from '../i18n';
import { radioGroup } from './changeReview';
import type { Answer, TriageDecisionActivity } from '../../core/types';
import type { Board, OnChange } from './board';

export function triageDecision(a: TriageDecisionActivity, initial: Answer, onChange: OnChange): Board {
  const picks: Record<string, string> = { ...(initial.picks ?? {}) };
  const set = (key: string, id: string) => {
    picks[key] = id;
    onChange({ picks: { ...picks } });
  };
  const root = h(
    'div',
    { class: 'board board-triage' },
    ...a.cases.map((c, i) =>
      h(
        'section',
        { class: 'case', 'data-case': c.id, 'aria-labelledby': `${a.id}-${c.id}-title` },
        h('h3', { id: `${a.id}-${c.id}-title` }, t('tr.case', { n: i + 1 }), ' ', lt(c.title)),
        h('ul', { class: 'evidence' }, ...c.evidence.map((e) => h('li', {}, lt(e)))),
        radioGroup(
          `${a.id}:${c.id}`,
          t('tr.decision'),
          a.decisions.map((d) => ({ id: d.id, label: lt(d.label) })),
          picks[c.id],
          (id) => set(c.id, id),
          'choices choices-row',
        ),
        c.reasons
          ? radioGroup(
              `${a.id}:${c.id}:reason`,
              t('tr.reason'),
              c.reasons.map((r) => ({ id: r.id, label: lt(r.label) })),
              picks[`${c.id}:reason`],
              (id) => set(`${c.id}:reason`, id),
            )
          : null,
      ),
    ),
  );
  return {
    el: root,
    answer: () => ({ picks: { ...picks } }),
    missing: () => {
      const left = a.cases
        .map((c, i) => ({ c, i }))
        .filter(({ c }) => !picks[c.id] || (c.reasons && !picks[`${c.id}:reason`]))
        .map(({ i }) => t('tr.case', { n: i + 1 }));
      return left.length ? t('tr.missing', { items: left.join('、') }) : null;
    },
    focus: () => root.querySelector<HTMLElement>('input')?.focus(),
  };
}
