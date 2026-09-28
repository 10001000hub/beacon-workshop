// Hash routes. Works under any static sub-path and survives reloads.

import { QUEST_IDS, type QuestId } from './core/types';

export type Route =
  | { name: 'title' }
  | { name: 'start' }
  | { name: 'prologue' }
  | { name: 'map' }
  | { name: 'quest'; questId: QuestId }
  | { name: 'activity'; questId: QuestId; activityId: string }
  | { name: 'clear'; questId: QuestId }
  | { name: 'read'; questId: QuestId | null }
  | { name: 'practice'; questId: QuestId | null }
  | { name: 'notebook' }
  | { name: 'glossary' }
  | { name: 'ending' }
  | { name: 'settings' }
  | { name: 'recover' }
  | { name: 'notfound'; raw: string };

const isQuestId = (s: string | undefined): s is QuestId => s !== undefined && (QUEST_IDS as readonly string[]).includes(s);
const ACTIVITY_RE = /^q0[1-6]-[a-c]$/;

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '');
  const parts = raw.replace(/^\/+/, '').split('/').filter((p) => p.length > 0);
  const [a, b, c, d] = parts;
  if (parts.length === 0) return { name: 'title' };
  switch (a) {
    case 'start':
    case 'prologue':
    case 'map':
    case 'notebook':
    case 'glossary':
    case 'ending':
    case 'settings':
    case 'recover':
      if (parts.length === 1) return { name: a };
      break;
    case 'quest':
      if (isQuestId(b)) {
        if (parts.length === 2) return { name: 'quest', questId: b };
        if (parts.length === 3 && c === 'clear') return { name: 'clear', questId: b };
        if (parts.length === 4 && c === 'a' && d !== undefined && ACTIVITY_RE.test(d) && d.startsWith(b)) {
          return { name: 'activity', questId: b, activityId: d };
        }
      }
      break;
    case 'read':
    case 'practice':
      if (parts.length === 1) return { name: a, questId: null };
      if (parts.length === 2 && isQuestId(b)) return { name: a, questId: b };
      break;
  }
  return { name: 'notfound', raw };
}

export function href(route: Route): string {
  switch (route.name) {
    case 'title':
      return '#/';
    case 'quest':
      return `#/quest/${route.questId}`;
    case 'activity':
      return `#/quest/${route.questId}/a/${route.activityId}`;
    case 'clear':
      return `#/quest/${route.questId}/clear`;
    case 'read':
    case 'practice':
      return route.questId ? `#/${route.name}/${route.questId}` : `#/${route.name}`;
    case 'notfound':
      return '#/map';
    default:
      return `#/${route.name}`;
  }
}

export function go(route: Route): void {
  const next = href(route);
  if (location.hash === next) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = next;
}
