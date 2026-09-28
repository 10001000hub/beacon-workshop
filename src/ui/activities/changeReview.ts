// change_review: switch between before/after/diff/preview views (tabs, arrow keys), then answer
// each question with native radio buttons (§6.2).

import { h } from '../dom';
import { lt, t } from '../i18n';
import { panelView } from '../components';
import type { Answer, ChangeReviewActivity } from '../../core/types';
import type { Board, OnChange } from './board';

export function tabs(idBase: string, views: { id: string; label: string; body: () => HTMLElement[] }[]): HTMLElement {
  const list = h('div', { class: 'tablist', role: 'tablist', 'aria-label': t('cr.views') });
  const panel = h('div', { class: 'tabpanel', role: 'tabpanel', tabindex: 0 });
  const buttons: HTMLButtonElement[] = [];
  function select(i: number, focus: boolean) {
    const v = views[i];
    if (!v) return;
    buttons.forEach((b, j) => {
      b.setAttribute('aria-selected', j === i ? 'true' : 'false');
      b.tabIndex = j === i ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', `${idBase}-tab-${v.id}`);
    panel.replaceChildren(...v.body());
    if (focus) buttons[i]?.focus();
  }
  views.forEach((v, i) => {
    const b = h(
      'button',
      { type: 'button', role: 'tab', id: `${idBase}-tab-${v.id}`, 'data-view': v.id, class: 'tab', onclick: () => select(i, false) },
      v.label,
    );
    b.addEventListener('keydown', (e) => {
      const n = views.length;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') select((i + 1) % n, true);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') select((i - 1 + n) % n, true);
      else if (e.key === 'Home') select(0, true);
      else if (e.key === 'End') select(n - 1, true);
      else return;
      e.preventDefault();
    });
    buttons.push(b);
    list.append(b);
  });
  select(0, false);
  return h('div', { class: 'tabs' }, list, panel);
}

export function radioGroup(
  name: string,
  legend: string,
  options: { id: string; label: string }[],
  selected: string | undefined,
  onPick: (id: string) => void,
  cls = 'choices',
): HTMLFieldSetElement {
  return h(
    'fieldset',
    { class: cls, 'data-item': name },
    h('legend', {}, legend),
    ...options.map((o) => {
      const id = `${name}-${o.id}`.replace(/[^a-zA-Z0-9_-]/g, '_');
      const input = h('input', { type: 'radio', name, id, value: o.id, 'data-option': o.id });
      input.checked = selected === o.id;
      input.addEventListener('change', () => input.checked && onPick(o.id));
      return h('div', { class: 'choice' }, input, h('label', { for: id }, o.label));
    }),
  );
}

export function changeReview(a: ChangeReviewActivity, initial: Answer, onChange: OnChange): Board {
  const picks: Record<string, string> = { ...(initial.picks ?? {}) };
  const root = h('div', { class: 'board board-review' });
  root.append(
    tabs(
      a.id,
      a.views.map((v) => ({ id: v.id, label: lt(v.label), body: () => v.panels.map(panelView) })),
    ),
    h(
      'div',
      { class: 'questions' },
      ...a.questions.map((q) =>
        radioGroup(
          `${a.id}:${q.id}`,
          lt(q.label),
          q.options.map((o) => ({ id: o.id, label: lt(o.label) })),
          picks[q.id],
          (id) => {
            picks[q.id] = id;
            onChange({ picks: { ...picks } });
          },
        ),
      ),
    ),
  );
  return {
    el: root,
    answer: () => ({ picks: { ...picks } }),
    missing: () => {
      const left = a.questions.filter((q) => !picks[q.id]).map((q) => lt(q.label));
      return left.length ? t('cr.missing', { items: left.join('、') }) : null;
    },
    focus: () => root.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus(),
  };
}
