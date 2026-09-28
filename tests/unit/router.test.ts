import { describe, expect, it } from 'vitest';
import { href, parseHash, type Route } from '../../src/router';

describe('router', () => {
  it('parses every known route and round-trips through href', () => {
    const routes: Route[] = [
      { name: 'title' },
      { name: 'start' },
      { name: 'prologue' },
      { name: 'map' },
      { name: 'quest', questId: 'q03' },
      { name: 'activity', questId: 'q03', activityId: 'q03-b' },
      { name: 'clear', questId: 'q06' },
      { name: 'read', questId: null },
      { name: 'read', questId: 'q02' },
      { name: 'practice', questId: null },
      { name: 'practice', questId: 'q05' },
      { name: 'notebook' },
      { name: 'glossary' },
      { name: 'ending' },
      { name: 'settings' },
      { name: 'recover' },
    ];
    for (const r of routes) expect(parseHash(href(r))).toEqual(r);
  });
  it('treats unknown or malformed hashes as notfound', () => {
    for (const h of ['#/nope', '#/quest/q07', '#/quest/q01/a/q02-a', '#/quest/q01/a/<script>', '#/map/extra', '#/read/q9', '#/quest/q01/clear/x']) {
      expect(parseHash(h).name, h).toBe('notfound');
    }
    expect(href({ name: 'notfound', raw: 'x' })).toBe('#/map');
    expect(parseHash('').name).toBe('title');
    expect(parseHash('#').name).toBe('title');
  });
});
