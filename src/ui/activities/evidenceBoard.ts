// evidence_board: select cards (checkboxes) or build an ordered list with up/down buttons (§6.2).

import { clear, h } from '../dom';
import { lt, t } from '../i18n';
import type { Answer, EvidenceBoardActivity } from '../../core/types';
import type { Board, OnChange } from './board';

export function evidenceBoard(a: EvidenceBoardActivity, initial: Answer, onChange: OnChange): Board {
  const valid = new Set(a.cards.map((c) => c.id));
  let sequence = [...new Set(initial.sequence ?? [])].filter((c) => valid.has(c));
  const root = h('div', { class: `board board-evidence mode-${a.mode}` });
  const label = (id: string) => lt(a.cards.find((c) => c.id === id)?.label);
  let focusAfter: string | null = null;

  function changed() {
    onChange({ sequence: [...sequence] });
    if (a.mode === 'order') render();
  }

  function renderSelect() {
    const fs = h(
      'fieldset',
      { class: 'choices' },
      h('legend', {}, t('eb.selectLegend')),
      ...a.cards.map((c) => {
        const id = `${a.id}-${c.id}`;
        const input = h('input', { type: 'checkbox', id, 'data-card': c.id });
        input.checked = sequence.includes(c.id);
        input.addEventListener('change', () => {
          sequence = input.checked ? [...sequence, c.id] : sequence.filter((x) => x !== c.id);
          changed();
        });
        return h('div', { class: 'choice' }, input, h('label', { for: id }, lt(c.label)));
      }),
    );
    root.append(fs);
  }

  function renderOrder() {
    const pool = a.cards.filter((c) => !sequence.includes(c.id));
    root.append(
      h(
        'section',
        { class: 'pool', 'aria-labelledby': `${a.id}-pool` },
        h('h3', { id: `${a.id}-pool` }, t('eb.pool')),
        pool.length === 0
          ? h('p', { class: 'help' }, t('eb.poolEmpty'))
          : h(
              'ul',
              { class: 'cards' },
              ...pool.map((c) =>
                h(
                  'li',
                  { class: 'pool-card' },
                  h('span', {}, lt(c.label)),
                  h(
                    'button',
                    {
                      type: 'button',
                      class: 'btn-small',
                      'data-add': c.id,
                      'aria-label': t('eb.addCard', { card: lt(c.label) }),
                      onclick: () => {
                        sequence = [...sequence, c.id];
                        focusAfter = 'pool';
                        changed();
                      },
                    },
                    t('eb.add'),
                  ),
                ),
              ),
            ),
      ),
      h(
        'section',
        { class: 'sequence', 'aria-labelledby': `${a.id}-seq` },
        h('h3', { id: `${a.id}-seq` }, t('eb.sequence')),
        sequence.length === 0
          ? h('p', { class: 'slot-empty' }, t('eb.sequenceEmpty'))
          : h(
              'ol',
              { class: 'seq-list' },
              ...sequence.map((cid, i) =>
                h(
                  'li',
                  { class: 'seq-item', 'data-seq': cid },
                  h('span', { class: 'seq-num', 'aria-hidden': 'true' }, String(i + 1)),
                  h('span', { class: 'seq-label' }, label(cid)),
                  h(
                    'span',
                    { class: 'seq-actions' },
                    h(
                      'button',
                      {
                        type: 'button',
                        class: 'btn-small',
                        'data-up': cid,
                        disabled: i === 0,
                        'aria-label': t('eb.upCard', { card: label(cid) }),
                        onclick: () => move(i, -1, `up:${cid}`),
                      },
                      t('eb.up'),
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        class: 'btn-small',
                        'data-down': cid,
                        disabled: i === sequence.length - 1,
                        'aria-label': t('eb.downCard', { card: label(cid) }),
                        onclick: () => move(i, 1, `down:${cid}`),
                      },
                      t('eb.down'),
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        class: 'btn-small',
                        'data-remove': cid,
                        'aria-label': t('eb.removeCard', { card: label(cid) }),
                        onclick: () => {
                          sequence = sequence.filter((x) => x !== cid);
                          focusAfter = `add:${cid}`;
                          changed();
                        },
                      },
                      t('eb.remove'),
                    ),
                  ),
                ),
              ),
            ),
      ),
    );
  }

  function move(i: number, delta: number, focusKey: string) {
    const j = i + delta;
    if (j < 0 || j >= sequence.length) return;
    const next = [...sequence];
    [next[i], next[j]] = [next[j]!, next[i]!];
    sequence = next;
    focusAfter = focusKey;
    changed();
  }

  function render() {
    clear(root);
    if (a.mode === 'select') renderSelect();
    else renderOrder();
    const target = focusAfter;
    focusAfter = null;
    if (!target) return;
    const [kind, id] = target.split(':');
    let el = id ? root.querySelector<HTMLButtonElement>(`[data-${kind}="${id}"]`) : null;
    if (el?.disabled) el = root.querySelector<HTMLButtonElement>(`[data-${kind === 'up' ? 'down' : 'up'}="${id}"]`);
    (el ?? root.querySelector<HTMLElement>('.pool-card button') ?? root.querySelector<HTMLElement>('.seq-item button:not([disabled])'))?.focus();
  }

  render();
  return {
    el: root,
    answer: () => ({ sequence: [...sequence] }),
    missing: () => (sequence.length === 0 ? t('eb.missing') : null),
    focus: () => root.querySelector<HTMLElement>('input, button:not([disabled])')?.focus(),
  };
}
