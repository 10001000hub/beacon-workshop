// App shell: header, the permanent simulation banner, save-status banners, and route dispatch.

import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';

import { loadContent } from './content/index';
import { Session } from './core/session';
import { getBrowserStorage, SAVE_KEY } from './core/storage';
import { completedActivityCount, findQuest, isActivityUnlocked, isQuestCleared, isQuestUnlocked, totalActivities } from './core/selectors';
import { parseHash, type Route } from './router';
import { clear, h } from './ui/dom';
import { lt, setLocale, t } from './ui/i18n';
import { notice } from './ui/components';
import type { Ctx } from './ui/context';
import { activityScreen } from './ui/screens/activity';
import { questBrief, questClear, readIndex, readQuest } from './ui/screens/quest';
import { endingScreen, mapScreen, prologueScreen, startScreen, titleScreen } from './ui/screens/story';
import { settingsScreen } from './ui/screens/settings';
import { practiceCard, practiceIndex } from './ui/screens/practice';
import { glossaryScreen, notebookScreen, recoverScreen } from './ui/screens/library';

const content = loadContent();
const session = new Session(getBrowserStorage(), content.catalog.contentVersion);
let pendingFlash: string[] = [];

const ctx: Ctx = {
  content,
  session,
  drafts: new Map(),
  flash: (m) => pendingFlash.push(m),
  rerender: () => render(),
};

const root = document.getElementById('app')!;
const header = h('header', { class: 'app-header' });
const banners = h('div', { class: 'banners' });
const main = h('main', { id: 'main', class: 'app-main', tabindex: -1 });
const live = h('div', { class: 'visually-hidden', 'aria-live': 'polite', 'data-testid': 'route-announcer' });
root.append(h('a', { class: 'skip-link', href: '#main', onclick: (e: Event) => { e.preventDefault(); main.focus(); } }, ''), header, banners, main, live);

function applySettings(): void {
  const s = session.save;
  setLocale(s.locale);
  const el = document.documentElement;
  el.style.setProperty('--text-scale', String(s.settings.textScale));
  el.toggleAttribute('data-reduce-motion', s.settings.reduceMotion);
}

function renderHeader(): void {
  const cat = content.catalog;
  clear(header);
  header.append(
    h(
      'div',
      { class: 'header-inner' },
      h('a', { class: 'brand', href: '#/' }, t('app.name')),
      h('p', { class: 'header-progress', 'data-testid': 'header-progress' }, t('header.progress', { done: completedActivityCount(session.save, cat), total: totalActivities(cat) })),
      h(
        'nav',
        { 'aria-label': t('nav.label') },
        h(
          'ul',
          {},
          h('li', {}, h('a', { href: '#/map' }, t('nav.map'))),
          h('li', {}, h('a', { href: '#/practice' }, t('nav.practice'))),
          h('li', {}, h('a', { href: '#/notebook' }, t('nav.notebook'))),
          h('li', {}, h('a', { href: '#/glossary' }, t('nav.glossary'))),
          h('li', {}, h('a', { href: '#/settings' }, t('nav.settings'))),
        ),
      ),
    ),
  );
  (root.querySelector('.skip-link') as HTMLElement).textContent = t('nav.skip');
}

function renderBanners(): void {
  clear(banners);
  // Always visible (§7.1).
  banners.append(h('p', { class: 'sim-banner', 'data-testid': 'sim-banner' }, t('banner.simulation')));
  const st = session.status;
  if (st.kind === 'memory') {
    banners.append(
      h(
        'div',
        { class: 'status-banner warn', role: 'alert', 'data-testid': 'memory-banner' },
        h('p', {}, t(st.reason === 'unavailable' ? 'banner.memory' : 'banner.writeFailed')),
        h('a', { href: '#/settings', class: 'btn-link' }, t('banner.toExport')),
        st.reason === 'write_failed' ? h('button', { type: 'button', class: 'btn-small', onclick: () => session.retryPersist() }, t('banner.retry')) : null,
      ),
    );
  } else if (st.kind === 'conflict') {
    banners.append(
      h(
        'div',
        { class: 'status-banner warn', role: 'alert', 'data-testid': 'conflict-banner' },
        h('p', {}, t('banner.conflict')),
        h(
          'button',
          {
            type: 'button',
            class: 'btn-small',
            'data-testid': 'conflict-reload',
            onclick: () => {
              if (session.reloadFromStorage()) {
                ctx.drafts.clear();
                pendingFlash.push(t('banner.reloaded'));
                render();
              }
            },
          },
          t('banner.reload'),
        ),
      ),
    );
  } else if (st.kind === 'blocked' && st.deferred) {
    banners.append(
      h(
        'div',
        { class: 'status-banner warn', role: 'alert', 'data-testid': 'blocked-banner' },
        h('p', {}, t('banner.blocked')),
        h('a', { href: '#/recover', class: 'btn-link' }, t('banner.toRecover')),
      ),
    );
  }
}

function screenFor(route: Route): HTMLElement {
  const save = session.save;
  const cat = content.catalog;
  const st = session.status;
  if (st.kind === 'blocked' && !st.deferred && route.name !== 'recover') {
    return recoverScreen(ctx);
  }
  switch (route.name) {
    case 'title':
      return titleScreen(ctx);
    case 'start':
      return startScreen(ctx);
    case 'prologue':
      return prologueScreen(ctx);
    case 'map':
      return mapScreen(ctx);
    case 'quest':
    case 'activity':
    case 'clear': {
      const quest = findQuest(cat, route.questId)!;
      if (!isQuestUnlocked(save, cat, quest.id)) {
        pendingFlash.push(t('guard.questLocked', { title: lt(quest.title) }));
        return mapScreen(ctx);
      }
      if (route.name === 'quest') {
        session.dispatch({ type: 'SET_CURRENT', questId: quest.id, activityId: save.currentQuestId === quest.id ? save.currentActivityId : null, at: new Date().toISOString() });
        return questBrief(ctx, quest);
      }
      if (route.name === 'clear') {
        if (!isQuestCleared(save, quest)) {
          pendingFlash.push(t('guard.notCleared'));
          return questBrief(ctx, quest);
        }
        return questClear(ctx, quest);
      }
      const activity = quest.activities.find((a) => a.id === route.activityId);
      if (!activity) {
        pendingFlash.push(t('guard.notFound'));
        return questBrief(ctx, quest);
      }
      if (!isActivityUnlocked(save, quest, activity.id)) {
        pendingFlash.push(t('guard.activityLocked'));
        return questBrief(ctx, quest);
      }
      session.dispatch({ type: 'SET_CURRENT', questId: quest.id, activityId: activity.id, at: new Date().toISOString() });
      return activityScreen(ctx, quest, activity);
    }
    case 'read':
      return route.questId ? readQuest(ctx, findQuest(cat, route.questId)!) : readIndex(ctx);
    case 'practice':
      return route.questId ? practiceCard(ctx, route.questId) : practiceIndex(ctx);
    case 'notebook':
      return notebookScreen(ctx);
    case 'glossary':
      return glossaryScreen(ctx);
    case 'ending':
      return endingScreen(ctx);
    case 'settings':
      return settingsScreen(ctx);
    case 'recover':
      return recoverScreen(ctx);
    case 'notfound':
      pendingFlash.push(t('guard.unknownUrl'));
      history.replaceState(null, '', '#/map');
      return mapScreen(ctx);
  }
}

function render(): void {
  applySettings();
  const route = parseHash(location.hash);
  const screen = screenFor(route);
  renderHeader();
  renderBanners();
  clear(main);
  const flashes = pendingFlash;
  pendingFlash = [];
  for (const f of flashes) main.append(notice(f, 'info', 'flash'));
  main.append(screen);
  const title = screen.querySelector('h1');
  document.title = title?.textContent ? `${title.textContent} | ${t('app.name')}` : t('app.name');
  live.textContent = title?.textContent ?? '';
  // Move focus to the new screen's heading so keyboard and screen-reader users land in context.
  (title as HTMLElement | null)?.focus({ preventScroll: false });
  window.scrollTo(0, 0);
}

session.subscribe(() => {
  applySettings();
  renderHeader();
  renderBanners();
});

window.addEventListener('hashchange', render);
window.addEventListener('storage', (e) => {
  if (e.key === SAVE_KEY || e.key === null) session.externalChange();
});

render();
