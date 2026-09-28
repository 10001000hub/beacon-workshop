// prompt_builder: pick a card, then pick the slot to place it in. No dragging (§6.2).

import { clear, h, spriteIcon } from '../dom';
import { lt, t } from '../i18n';
import { ICONS } from '../components';
import type { Answer, PromptBuilderActivity } from '../../core/types';
import type { Board, OnChange } from './board';

const SLOT_ICONS: Record<string, string> = {
  purpose: 'icon-purpose',
  context: 'icon-material',
  constraints: 'icon-constraint',
  done: 'icon-done',
};

export function promptBuilder(a: PromptBuilderActivity, initial: Answer, onChange: OnChange): Board {
  const placements: Record<string, string[]> = {};
  for (const s of a.slots) placements[s.id] = [...(initial.placements?.[s.id] ?? [])].filter((c) => a.cards.some((x) => x.id === c));
  let selected: string | null = null;
  let focusAfter: string | null = null;

  const root = h('div', { class: 'board board-prompt' });
  const label = (id: string) => lt(a.cards.find((c) => c.id === id)?.label);
  const placedIds = () => new Set(Object.values(placements).flat());

  function changed() {
    onChange({ placements: structuredClone(placements) });
    render();
  }

  function render() {
    clear(root);
    const placed = placedIds();
    const tray = a.cards.filter((c) => !placed.has(c.id));
    const trayEl = h(
      'div',
      { class: 'tray', role: 'group', 'aria-labelledby': `${a.id}-tray` },
      h('h3', { id: `${a.id}-tray` }, t('pb.tray')),
      h('p', { class: 'help' }, selected ? t('pb.nowSelected', { card: label(selected) }) : t('pb.howTo')),
      tray.length === 0
        ? h('p', { class: 'help' }, t('pb.trayEmpty'))
        : h(
            'ul',
            { class: 'cards' },
            ...tray.map((c) =>
              h(
                'li',
                {},
                h(
                  'button',
                  {
                    type: 'button',
                    class: selected === c.id ? 'card selected' : 'card',
                    'aria-pressed': selected === c.id ? 'true' : 'false',
                    'data-card': c.id,
                    onclick: () => {
                      selected = selected === c.id ? null : c.id;
                      focusAfter = selected ? `slot:${a.slots[0]?.id}` : `card:${c.id}`;
                      render();
                    },
                  },
                  lt(c.label),
                ),
              ),
            ),
          ),
    );

    const slotsEl = h(
      'div',
      { class: 'slots' },
      ...a.slots.map((s) =>
        h(
          'section',
          { class: 'slot', 'data-slot': s.id, 'aria-labelledby': `${a.id}-slot-${s.id}` },
          h(
            'h3',
            { id: `${a.id}-slot-${s.id}` },
            spriteIcon(ICONS, SLOT_ICONS[s.id] ?? 'icon-purpose'),
            ' ',
            lt(s.label),
          ),
          h('p', { class: 'slot-q' }, lt(s.question)),
          (placements[s.id] ?? []).length === 0
            ? h('p', { class: 'slot-empty' }, t('pb.slotEmpty'))
            : h(
                'ul',
                { class: 'placed' },
                ...(placements[s.id] ?? []).map((cid) =>
                  h(
                    'li',
                    { class: 'placed-card', 'data-placed': cid },
                    h('span', {}, label(cid)),
                    h(
                      'button',
                      {
                        type: 'button',
                        class: 'btn-small',
                        'aria-label': t('pb.returnCard', { card: label(cid) }),
                        onclick: () => {
                          placements[s.id] = (placements[s.id] ?? []).filter((x) => x !== cid);
                          focusAfter = `card:${cid}`;
                          changed();
                        },
                      },
                      t('pb.return'),
                    ),
                  ),
                ),
              ),
          selected
            ? h(
                'button',
                {
                  type: 'button',
                  class: 'btn place-btn',
                  'data-place': s.id,
                  onclick: () => {
                    if (!selected) return;
                    placements[s.id] = [...(placements[s.id] ?? []), selected];
                    selected = null;
                    focusAfter = 'tray';
                    changed();
                  },
                },
                t('pb.placeHere', { card: label(selected), slot: lt(s.label) }),
              )
            : null,
        ),
      ),
    );

    root.append(trayEl, slotsEl);
    if (placed.size > 0) {
      root.append(
        h(
          'button',
          {
            type: 'button',
            class: 'btn-link',
            'data-testid': 'reset-board',
            onclick: () => {
              for (const s of a.slots) placements[s.id] = [];
              selected = null;
              focusAfter = 'tray';
              changed();
            },
          },
          t('pb.resetAll'),
        ),
      );
    }
    restoreFocus();
  }

  function restoreFocus() {
    const target = focusAfter;
    focusAfter = null;
    if (!target) return;
    let el: HTMLElement | null = null;
    if (target.startsWith('card:')) el = root.querySelector(`[data-card="${target.slice(5)}"]`);
    else if (target.startsWith('slot:')) el = root.querySelector(`[data-place="${target.slice(5)}"]`);
    if (!el) el = root.querySelector('.tray .card') ?? root.querySelector('.place-btn') ?? root.querySelector('.placed-card button');
    el?.focus();
  }

  render();
  return {
    el: root,
    answer: () => ({ placements: structuredClone(placements) }),
    missing: () => (placedIds().size === 0 ? t('pb.missing') : null),
    focus: () => (root.querySelector<HTMLElement>('.tray .card') ?? root.querySelector<HTMLElement>('button'))?.focus(),
  };
}
