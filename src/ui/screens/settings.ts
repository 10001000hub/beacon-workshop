// SC11 設定・作品情報, including save export / import / reset (§13.3–13.4).

import { h } from '../dom';
import { t, type MessageKey } from '../i18n';
import { linkButton, notice, screenHeading } from '../components';
import { TEXT_SCALES } from '../../core/state';
import { checkImport, exportSave, IMPORT_MAX_BYTES } from '../../core/storage';
import { completedActivityCount, practiceSelfCheckedCount, totalActivities } from '../../core/selectors';
import { href } from '../../router';
import type { Ctx } from '../context';
import type { Locale, SaveData } from '../../core/types';
import { radioGroup } from '../activities/changeReview';

const now = () => new Date().toISOString();

export function settingsControls(ctx: Ctx): HTMLElement {
  const s = ctx.session.save;
  const locale = h(
    'select',
    {
      id: 'set-locale',
      onchange: (e: Event) => {
        ctx.session.dispatch({ type: 'SET_LOCALE', locale: (e.target as HTMLSelectElement).value as Locale, at: now() });
        ctx.rerender();
      },
    },
    h('option', { value: 'ja' }, '日本語'),
    h('option', { value: 'en' }, 'English (preview)'),
  );
  locale.value = s.locale;

  const motion = h('input', { type: 'checkbox', id: 'set-motion' });
  motion.checked = s.settings.reduceMotion;
  motion.addEventListener('change', () => ctx.session.dispatch({ type: 'SET_SETTINGS', settings: { reduceMotion: motion.checked }, at: now() }));

  return h(
    'div',
    { class: 'settings-controls' },
    h('div', { class: 'field' }, h('label', { for: 'set-locale' }, t('set.locale')), locale, h('p', { class: 'help' }, t('set.localeNote'))),
    radioGroup(
      'set-scale',
      t('set.textScale'),
      TEXT_SCALES.map((v, i) => ({ id: String(v), label: t(`set.scale${i}` as MessageKey) })),
      String(s.settings.textScale),
      (id) => ctx.session.dispatch({ type: 'SET_SETTINGS', settings: { textScale: Number(id) }, at: now() }),
      'choices choices-row',
    ),
    h('div', { class: 'choice' }, motion, h('label', { for: 'set-motion' }, t('set.reduceMotion'))),
    h('p', { class: 'help' }, t('set.sound')),
  );
}

function download(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = h('a', { href: url, download: filename, hidden: true });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportFilename(): string {
  return `beacon-workshop-save-${new Date().toISOString().slice(0, 10)}.json`;
}

function saveSummary(ctx: Ctx, save: SaveData): HTMLElement {
  const cat = ctx.content.catalog;
  return h(
    'dl',
    { class: 'summary', 'data-testid': 'import-summary' },
    h('dt', {}, t('save.sumSim')),
    h('dd', {}, `${completedActivityCount(save, cat)}/${totalActivities(cat)}`),
    h('dt', {}, t('save.sumPractice')),
    h('dd', {}, `${practiceSelfCheckedCount(save, cat)}/${cat.quests.length}`),
    h('dt', {}, t('save.sumNotes')),
    h('dd', {}, String(Object.keys(save.notes).length)),
    h('dt', {}, t('save.sumUpdated')),
    h('dd', {}, save.updatedAt),
    h('dt', {}, t('save.sumContent')),
    h('dd', {}, save.contentVersion),
  );
}

export function saveManagement(ctx: Ctx): HTMLElement {
  const box = h('section', { class: 'brief-card', 'aria-labelledby': 'save-mgmt-h' });
  const result = h('div', { class: 'import-result', 'aria-live': 'polite' });
  const exportText = h('textarea', { class: 'export-text', readonly: true, rows: 6, 'aria-label': t('save.exportText'), hidden: true });

  function importFromText(text: string) {
    const res = checkImport(text);
    if (!res.ok) {
      result.replaceChildren(notice(t(`save.importError.${res.reason}` as MessageKey), 'warn', 'import-error'));
      return;
    }
    result.replaceChildren(
      h('p', {}, t('save.importConfirm')),
      saveSummary(ctx, res.save),
      h(
        'div',
        { class: 'actions' },
        h(
          'button',
          {
            type: 'button',
            class: 'btn btn-primary',
            'data-testid': 'import-apply',
            onclick: () => {
              ctx.session.importSave(res.save);
              ctx.flash(t('save.imported'));
              ctx.rerender();
            },
          },
          t('save.importApply'),
        ),
        h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => result.replaceChildren() }, t('common.cancel')),
      ),
    );
  }

  const paste = h('textarea', { id: 'import-text', rows: 4, 'data-testid': 'import-text' });
  const file = h('input', { type: 'file', id: 'import-file', accept: 'application/json,.json' });
  file.addEventListener('change', () => {
    const f = file.files?.[0];
    if (!f) return;
    if (f.size > IMPORT_MAX_BYTES) {
      result.replaceChildren(notice(t('save.importError.too_large'), 'warn', 'import-error'));
      return;
    }
    void f.text().then(importFromText);
  });

  const resetArea = h('div', { class: 'reset-area' });
  function renderReset(confirming: boolean, restoreFocus = false) {
    resetArea.replaceChildren(
      confirming
        ? h(
            'div',
            { role: 'alertdialog', 'aria-labelledby': 'reset-q', class: 'confirm' },
            h('p', { id: 'reset-q' }, t('save.resetConfirm')),
            h(
              'button',
              {
                type: 'button',
                class: 'btn btn-danger',
                'data-testid': 'reset-confirm',
                onclick: () => {
                  ctx.session.dispatch({ type: 'RESET', contentVersion: ctx.content.catalog.contentVersion, at: now() });
                  ctx.drafts.clear();
                  ctx.flash(t('save.resetDone'));
                  ctx.rerender();
                },
              },
              t('save.resetYes'),
            ),
            h('button', { type: 'button', class: 'btn btn-secondary', 'data-testid': 'reset-cancel', onclick: () => renderReset(false, true) }, t('common.cancel')),
          )
        : h('button', { type: 'button', class: 'btn btn-secondary', 'data-testid': 'reset', onclick: () => renderReset(true) }, t('save.reset')),
    );
    // Land on the safe choice (Cancel) when confirming; after cancelling, return to the trigger.
    if (confirming) resetArea.querySelector<HTMLElement>('[data-testid="reset-cancel"]')?.focus();
    else if (restoreFocus) resetArea.querySelector<HTMLElement>('[data-testid="reset"]')?.focus();
  }
  renderReset(false);

  box.append(
    h('h2', { id: 'save-mgmt-h' }, t('save.title')),
    h('p', {}, t('save.where')),
    h('h3', {}, t('save.export')),
    h(
      'div',
      { class: 'actions' },
      h(
        'button',
        {
          type: 'button',
          class: 'btn btn-secondary',
          'data-testid': 'export',
          onclick: () => {
            const text = exportSave(ctx.session.save);
            exportText.value = text;
            exportText.hidden = false;
            download(exportFilename(), text);
          },
        },
        t('save.exportButton'),
      ),
    ),
    exportText,
    h('h3', {}, t('save.import')),
    h('p', { class: 'help' }, t('save.importNote')),
    h('div', { class: 'field' }, h('label', { for: 'import-file' }, t('save.importFile')), file),
    h('div', { class: 'field' }, h('label', { for: 'import-text' }, t('save.importPaste')), paste),
    h('div', { class: 'actions' }, h('button', { type: 'button', class: 'btn btn-secondary', 'data-testid': 'import-check', onclick: () => importFromText(paste.value) }, t('save.importCheck'))),
    result,
    h('h3', {}, t('save.resetTitle')),
    h('p', { class: 'help' }, t('save.resetNote')),
    resetArea,
  );
  return box;
}

export function settingsScreen(ctx: Ctx): HTMLElement {
  return h(
    'div',
    { class: 'screen screen-settings' },
    screenHeading(t('set.title')),
    h('section', { class: 'brief-card', 'aria-labelledby': 'disp-h' }, h('h2', { id: 'disp-h' }, t('start.display')), settingsControls(ctx)),
    saveManagement(ctx),
    h(
      'section',
      { class: 'brief-card', 'aria-labelledby': 'about-h' },
      h('h2', { id: 'about-h' }, t('about.title')),
      h('ul', {}, h('li', {}, t('title.unofficial')), h('li', {}, t('title.simulation')), h('li', {}, t('about.noNetwork')), h('li', {}, t('about.art')), h('li', {}, t('about.license')), h('li', {}, t('about.version', { v: ctx.content.catalog.contentVersion }))),
    ),
    linkButton(t('nav.backToMap'), href({ name: 'map' }), 'btn-link'),
  );
}
