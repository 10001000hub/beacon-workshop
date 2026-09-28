// SC08 学習ノート, SC09 用語・出典, and the save recovery screen (§9.5, §13.4).

import { h } from '../dom';
import { lt, t, type MessageKey } from '../i18n';
import { badge, linkButton, notice, progressSummary, screenHeading } from '../components';
import { takeawayCards } from './quest';
import { exportFilename } from './settings';
import { NOTE_MAX_PER_KEY, NOTE_MAX_TOTAL, notesTotal } from '../../core/state';
import { isQuestCleared } from '../../core/selectors';
import { href } from '../../router';
import type { Ctx } from '../context';

export function notebookScreen(ctx: Ctx): HTMLElement {
  const save = ctx.session.save;
  const cleared = ctx.content.quests.filter((q) => isQuestCleared(save, q));
  const totalLine = h('p', { class: 'help', 'aria-live': 'polite', 'data-testid': 'notes-total' });
  const updateTotal = () => (totalLine.textContent = t('nb.total', { n: notesTotal(ctx.session.save.notes), max: NOTE_MAX_TOTAL }));
  updateTotal();

  const noteField = (key: string, label: string) => {
    const id = `note-${key}`;
    const area = h('textarea', { id, rows: 3, maxlength: NOTE_MAX_PER_KEY, 'data-note': key });
    area.value = ctx.session.save.notes[key] ?? '';
    const count = h('span', { class: 'help' });
    const warn = h('span', { class: 'help warn', 'aria-live': 'polite' });
    const setCount = () => (count.textContent = t('nb.count', { n: [...area.value].length, max: NOTE_MAX_PER_KEY }));
    setCount();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const commit = () => {
      clearTimeout(timer);
      const before = ctx.session.save.notes;
      ctx.session.dispatch({ type: 'SET_NOTE', key, text: area.value, at: new Date().toISOString() });
      const accepted = ctx.session.save.notes !== before || (before[key] ?? '') === area.value;
      warn.textContent = accepted ? '' : t('nb.overLimit', { max: NOTE_MAX_TOTAL });
      updateTotal();
    };
    area.addEventListener('input', () => {
      setCount();
      clearTimeout(timer);
      timer = setTimeout(commit, 400);
    });
    area.addEventListener('blur', commit);
    return h('div', { class: 'field' }, h('label', { for: id }, label), area, count, warn);
  };

  return h(
    'div',
    { class: 'screen screen-notebook' },
    screenHeading(t('nb.title')),
    progressSummary(ctx),
    h(
      'section',
      { 'aria-labelledby': 'nb-cards-h' },
      h('h2', { id: 'nb-cards-h' }, t('nb.cards', { n: cleared.length * 3, total: ctx.content.quests.length * 3 })),
      cleared.length === 0
        ? h('p', { class: 'empty', 'data-testid': 'nb-empty' }, t('nb.empty'))
        : h(
            'div',
            {},
            ...cleared.map((q) =>
              h(
                'section',
                { class: 'brief-card' },
                h('h3', {}, badge(q, true), ' ', lt(q.title)),
                takeawayCards(q),
                linkButton(t('nb.review'), href({ name: 'quest', questId: q.id }), 'btn-link'),
              ),
            ),
          ),
    ),
    h(
      'section',
      { class: 'brief-card', 'aria-labelledby': 'nb-notes-h' },
      h('h2', { id: 'nb-notes-h' }, t('nb.notes')),
      notice(t('nb.secretWarning'), 'info'),
      h('p', { class: 'help' }, t('nb.notesNote')),
      totalLine,
      ...ctx.content.quests.map((q) => noteField(q.id, `${q.id.toUpperCase()} ${lt(q.title)}`)),
    ),
    h('div', { class: 'actions' }, linkButton(t('nb.toExport'), href({ name: 'settings' }), 'btn btn-secondary'), linkButton(t('nav.backToMap'), href({ name: 'map' }), 'btn-link')),
  );
}

function back(): void {
  if (history.length > 1) history.back();
  else location.hash = '#/map';
}

export function glossaryScreen(ctx: Ctx): HTMLElement {
  return h(
    'div',
    { class: 'screen screen-glossary' },
    screenHeading(t('gl.title'), t('gl.sub', { n: ctx.content.glossary.length })),
    h(
      'dl',
      { class: 'glossary', 'data-testid': 'glossary' },
      ...ctx.content.glossary.flatMap((g) => [
        h('dt', { id: `term-${g.id}` }, lt(g.term), g.term.en && g.term.en !== g.term.ja ? h('span', { class: 'term-en', lang: 'en' }, ` ${g.term.en}`) : null),
        h(
          'dd',
          {},
          h('p', {}, lt(g.short)),
          g.questIds.length
            ? h('p', { class: 'help' }, t('gl.quests'), ' ', ...g.questIds.flatMap((q, i) => [i ? '、' : '', h('a', { href: href({ name: 'read', questId: q }) }, q.toUpperCase())]))
            : h('p', { class: 'help' }, t('gl.future')),
        ),
      ]),
    ),
    h(
      'section',
      { 'aria-labelledby': 'src-h' },
      h('h2', { id: 'src-h' }, t('src.title')),
      h('p', { class: 'help' }, t('src.note')),
      h(
        'ul',
        { class: 'sources' },
        ...ctx.content.sources.map((s) =>
          h(
            'li',
            { 'data-source': s.id },
            h('strong', {}, `[${s.id}] ${s.title}`),
            h(
              'p',
              {},
              h('a', { href: s.resolvedUrl, target: '_blank', rel: 'noopener noreferrer' }, s.resolvedUrl),
              ' ',
              h('span', { class: 'tag' }, t('src.external')),
            ),
            h('p', { class: 'help' }, t('src.status', { status: t(`src.status.${s.status}` as MessageKey), at: s.checkedAt ?? t('pr.notRecorded') })),
            h('p', { class: 'help' }, lt(s.note)),
          ),
        ),
      ),
    ),
    h('div', { class: 'actions' }, h('button', { type: 'button', class: 'btn btn-secondary', onclick: back }, t('gl.back'))),
  );
}

export function recoverScreen(ctx: Ctx): HTMLElement {
  const st = ctx.session.status;
  if (st.kind !== 'blocked') {
    return h('div', { class: 'screen' }, screenHeading(t('rc.title')), h('p', {}, t('rc.nothing')), linkButton(t('nav.backToMap'), href({ name: 'map' }), 'btn btn-primary'));
  }
  const { load } = st;
  const area = h('div', { class: 'reset-area' });
  const confirmReset = () =>
    area.replaceChildren(
      h(
        'div',
        { role: 'alertdialog', 'aria-labelledby': 'rc-q', class: 'confirm' },
        h('p', { id: 'rc-q' }, t('rc.startOverConfirm')),
        h(
          'button',
          {
            type: 'button',
            class: 'btn btn-danger',
            'data-testid': 'recover-startover-confirm',
            onclick: () => {
              ctx.session.startOver();
              ctx.flash(t('rc.startedOver'));
              ctx.navigate('#/start');
            },
          },
          t('rc.startOverYes'),
        ),
        h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => area.replaceChildren() }, t('common.cancel')),
      ),
    );
  return h(
    'div',
    { class: 'screen screen-recover', 'data-testid': 'recover' },
    screenHeading(t('rc.title')),
    notice(load.kind === 'unsupported' ? t('rc.unsupported', { v: String(load.version) }) : t('rc.corrupt'), 'warn'),
    h('p', {}, t('rc.kept')),
    h(
      'div',
      { class: 'actions recover-actions' },
      h(
        'button',
        {
          type: 'button',
          class: 'btn btn-secondary',
          'data-testid': 'recover-export',
          onclick: () => {
            const url = URL.createObjectURL(new Blob([load.raw], { type: 'application/json' }));
            const a = h('a', { href: url, download: `unreadable-${exportFilename()}`, hidden: true });
            document.body.append(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          },
        },
        t('rc.export'),
      ),
      load.backup
        ? h(
            'button',
            {
              type: 'button',
              class: 'btn btn-primary',
              'data-testid': 'recover-backup',
              onclick: () => {
                ctx.session.restoreBackup();
                ctx.flash(t('rc.restored'));
                ctx.navigate('#/map');
              },
            },
            t('rc.restore', { at: load.backup.updatedAt }),
          )
        : h('p', { class: 'help' }, t('rc.noBackup')),
      h(
        'button',
        {
          type: 'button',
          class: 'btn btn-secondary',
          'data-testid': 'recover-defer',
          onclick: () => {
            ctx.session.deferRecovery();
            ctx.navigate('#/map');
          },
        },
        t('rc.defer'),
      ),
      h('button', { type: 'button', class: 'btn btn-secondary', 'data-testid': 'recover-startover', onclick: confirmReset }, t('rc.startOver')),
    ),
    area,
  );
}
