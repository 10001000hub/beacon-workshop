import { describe, expect, it } from 'vitest';
import { createInitialSave, reduce } from '../../src/core/state';
import { parseSave } from '../../src/core/migrations';
import {
  BACKUP_KEY,
  byteLength,
  checkImport,
  exportSave,
  forceWrite,
  IMPORT_MAX_BYTES,
  loadSave,
  persistSave,
  SAVE_KEY,
  storedRevision,
} from '../../src/core/storage';
import { Session } from '../../src/core/session';
import { MemoryStorage } from './memoryStorage';

const T = '2026-09-29T00:00:00.000Z';
const fresh = () => createInitialSave('0.1.0', T);
const complete = (s = fresh()) => reduce(s, { type: 'ATTEMPT_ACTIVITY', activityId: 'q01-a', questId: 'q01', questRevision: 'r1', correct: true, at: T });

describe('storage keys and isolation', () => {
  it('uses only the two documented keys and never touches others', () => {
    const st = new MemoryStorage();
    st.setItem('other-app', 'keep me');
    let r = persistSave(st, fresh(), 0);
    expect(r.ok).toBe(true);
    r = persistSave(st, complete(), 1);
    expect(r.ok).toBe(true);
    expect([...st.map.keys()].sort()).toEqual([BACKUP_KEY, 'other-app', SAVE_KEY].sort());
    expect(st.getItem('other-app')).toBe('keep me');
    expect(SAVE_KEY).toBe('beacon-workshop.save.v1');
    expect(BACKUP_KEY).toBe('beacon-workshop.backup.v1');
  });
  it('source never calls localStorage.clear()', async () => {
    const { readFileSync, readdirSync } = await import('node:fs');
    const walk = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]));
    for (const f of walk('src').filter((f) => f.endsWith('.ts'))) expect(readFileSync(f, 'utf8').replace(/\/\/.*$/gm, ''), f).not.toMatch(/(localStorage|sessionStorage|storage)\.clear\(/i);
  });
});

describe('loadSave', () => {
  it('empty, ok, corrupt, unsupported, unavailable', () => {
    const st = new MemoryStorage();
    expect(loadSave(st).kind).toBe('empty');
    persistSave(st, complete(), 0);
    expect(loadSave(st)).toMatchObject({ kind: 'ok' });
    st.setItem(SAVE_KEY, '{not json');
    expect(loadSave(st)).toMatchObject({ kind: 'corrupt', raw: '{not json' });
    st.setItem(SAVE_KEY, JSON.stringify({ ...fresh(), schemaVersion: 99 }));
    expect(loadSave(st)).toMatchObject({ kind: 'unsupported', version: 99 });
    st.failReads = true;
    expect(loadSave(st).kind).toBe('unavailable');
    expect(loadSave(null).kind).toBe('unavailable');
  });
  it('a corrupt save exposes the last valid backup', () => {
    const st = new MemoryStorage();
    persistSave(st, fresh(), 0);
    persistSave(st, complete(), 1);
    st.setItem(SAVE_KEY, '[]garbage');
    const res = loadSave(st);
    expect(res.kind).toBe('corrupt');
    if (res.kind === 'corrupt') expect(res.backup?.revision).toBe(1);
  });
});

describe('persistSave', () => {
  it('increments revision and backs up the previous save', () => {
    const st = new MemoryStorage();
    const a = persistSave(st, fresh(), 0);
    expect(a).toMatchObject({ ok: true, revision: 1 });
    const b = persistSave(st, complete(), 1);
    expect(b).toMatchObject({ ok: true, revision: 2 });
    expect(JSON.parse(st.getItem(BACKUP_KEY)!).revision).toBe(1);
  });
  it('detects a newer revision written by another tab', () => {
    const st = new MemoryStorage();
    persistSave(st, fresh(), 0);
    persistSave(st, fresh(), 1); // other tab
    expect(persistSave(st, complete(), 1)).toEqual({ ok: false, reason: 'conflict', storedRevision: 2 });
    expect(storedRevision(st)).toBe(2);
  });
  it('reports write failures instead of throwing', () => {
    const st = new MemoryStorage();
    st.failWrites = true;
    expect(persistSave(st, fresh(), 0)).toMatchObject({ ok: false, reason: 'write_failed' });
    expect(forceWrite(st, fresh())).toMatchObject({ ok: false, reason: 'write_failed' });
  });
});

describe('import / export', () => {
  it('round-trips an exported save', () => {
    const s = complete();
    const res = checkImport(exportSave(s));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.save.completedActivities).toEqual(s.completedActivities);
  });
  it('rejects oversize, bad JSON, non-objects, newer and invalid saves', () => {
    expect(checkImport(' '.repeat(IMPORT_MAX_BYTES + 1))).toEqual({ ok: false, reason: 'too_large' });
    expect(byteLength('あ')).toBe(3);
    expect(checkImport('{')).toMatchObject({ ok: false, reason: 'bad_json' });
    expect(checkImport('"x"')).toMatchObject({ ok: false, reason: 'not_object' });
    expect(checkImport(JSON.stringify({ ...fresh(), schemaVersion: 2 }))).toMatchObject({ ok: false, reason: 'unsupported_version' });
    expect(checkImport(JSON.stringify({ ...fresh(), locale: 'xx' }))).toMatchObject({ ok: false, reason: 'invalid' });
    expect(checkImport(JSON.stringify({ ...fresh(), revision: -1 }))).toMatchObject({ ok: false, reason: 'invalid' });
  });
  it('keeps only allowlisted fields and treats strings as inert text', () => {
    const evil = {
      ...complete(),
      extra: '<script>alert(1)</script>',
      notes: { q01: '<img src=x onerror=alert(1)>' },
      settings: { textScale: 1, reduceMotion: false, soundEnabled: false, evil: true },
    };
    const raw = JSON.stringify(evil).replace('"extra"', '"__proto__":{"polluted":true},"extra"');
    const res = checkImport(raw);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(Object.keys(res.save)).not.toContain('extra');
    expect(Object.keys(res.save.settings)).not.toContain('evil');
    expect(res.save.notes.q01).toBe('<img src=x onerror=alert(1)>'); // stored verbatim, rendered via textContent
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
  it('parseSave rejects unknown activity IDs shapes and oversize notes', () => {
    expect(parseSave({ ...fresh(), completedActivities: { 'BAD ID!': {} } }).ok).toBe(false);
    expect(parseSave({ ...fresh(), notes: { q01: 'x'.repeat(5000) } }).ok).toBe(false);
  });
});

describe('Session', () => {
  it('persists each change and reloads it', () => {
    const st = new MemoryStorage();
    const s1 = new Session(st, '0.1.0', () => T);
    s1.dispatch({ type: 'MARK_INTRO_SEEN', at: T });
    expect(s1.status.kind).toBe('saved');
    const s2 = new Session(st, '0.1.0', () => T);
    expect(s2.save.introSeenAt).toBe(T);
  });
  it('falls back to memory when storage is unavailable, with a warning status', () => {
    const s = new Session(null, '0.1.0', () => T);
    expect(s.status).toEqual({ kind: 'memory', reason: 'unavailable' });
    s.dispatch({ type: 'MARK_INTRO_SEEN', at: T });
    expect(s.save.introSeenAt).toBe(T);
  });
  it('goes to memory mode on write failure and can retry', () => {
    const st = new MemoryStorage();
    const s = new Session(st, '0.1.0', () => T);
    st.failWrites = true;
    s.dispatch({ type: 'MARK_INTRO_SEEN', at: T });
    expect(s.status).toEqual({ kind: 'memory', reason: 'write_failed' });
    st.failWrites = false;
    s.retryPersist();
    expect(s.status.kind).toBe('saved');
    expect(new Session(st, '0.1.0').save.introSeenAt).toBe(T);
  });
  it('blocks writes over a corrupt save until the learner decides', () => {
    const st = new MemoryStorage();
    st.setItem(SAVE_KEY, 'corrupt!');
    const s = new Session(st, '0.1.0', () => T);
    expect(s.status.kind).toBe('blocked');
    s.deferRecovery();
    s.dispatch({ type: 'MARK_INTRO_SEEN', at: T });
    expect(st.getItem(SAVE_KEY)).toBe('corrupt!');
    expect(s.startOver()).toBe(true);
    expect(loadSave(st).kind).toBe('ok');
  });
  it('protects a newer-version save and can restore the backup', () => {
    const st = new MemoryStorage();
    persistSave(st, complete(), 0);
    persistSave(st, complete(), 1);
    const newer = JSON.stringify({ schemaVersion: 5, whatever: true });
    st.setItem(SAVE_KEY, newer);
    const s = new Session(st, '0.1.0', () => T);
    expect(s.status.kind).toBe('blocked');
    s.dispatch({ type: 'MARK_INTRO_SEEN', at: T });
    expect(st.getItem(SAVE_KEY)).toBe(newer);
    expect(s.restoreBackup()).toBe(true);
    expect(s.save.completedActivities['q01-a']).toBeDefined();
  });
  it('detects multi-tab conflicts and never overwrites the newer save', () => {
    const st = new MemoryStorage();
    const a = new Session(st, '0.1.0', () => T);
    a.dispatch({ type: 'MARK_INTRO_SEEN', at: T });
    const b = new Session(st, '0.1.0', () => T);
    b.dispatch({ type: 'SET_LOCALE', locale: 'en', at: T });
    a.externalChange();
    expect(a.status.kind).toBe('conflict');
    a.dispatch({ type: 'MARK_READ', sectionId: 'q01.story', at: T });
    expect(JSON.parse(st.getItem(SAVE_KEY)!).locale).toBe('en');
    expect(JSON.parse(st.getItem(SAVE_KEY)!).readSections).toEqual({});
    expect(a.reloadFromStorage()).toBe(true);
    expect(a.save.locale).toBe('en');
    a.dispatch({ type: 'MARK_READ', sectionId: 'q01.story', at: T });
    expect(a.status.kind).toBe('saved');
  });
  it('import replaces progress and persists it', () => {
    const st = new MemoryStorage();
    const s = new Session(st, '0.1.0', () => T);
    s.importSave(complete());
    expect(s.status.kind).toBe('saved');
    expect(new Session(st, '0.1.0').save.completedActivities['q01-a']).toBeDefined();
  });
});

describe('B1: a corrupt or unsupported value that appears while the app is open', () => {
  const foreign: Array<[string, string]> = [
    ['unsupported schema', JSON.stringify({ schemaVersion: 2, future: { shape: true } })],
    ['corrupt JSON', '{"schemaVersion":1,"trunc'],
  ];
  for (const [name, raw] of foreign) {
    it(`persistSave never overwrites ${name}`, () => {
      const st = new MemoryStorage();
      st.setItem(SAVE_KEY, raw);
      const r = persistSave(st, complete(), 0);
      expect(r).toEqual({ ok: false, reason: 'foreign_value' });
      expect(st.getItem(SAVE_KEY)).toBe(raw);
      expect(st.getItem(BACKUP_KEY)).toBeNull();
    });
    it(`Session keeps ${name} byte-for-byte, warns, and recovery stays explicit`, () => {
      const st = new MemoryStorage();
      const s = new Session(st, '0.1.0', () => T);
      s.dispatch({ type: 'MARK_INTRO_SEEN', at: T });
      const validRaw = st.getItem(SAVE_KEY)!;
      // "tab B / newer build" writes something this build cannot read.
      st.setItem(SAVE_KEY, raw);
      s.externalChange();
      expect(s.status).toMatchObject({ kind: 'blocked', deferred: true });
      s.dispatch({ type: 'MARK_READ', sectionId: 'q01.story', at: T });
      expect(st.getItem(SAVE_KEY)).toBe(raw);
      expect(s.save.readSections['q01.story']).toBeDefined(); // still playable in memory
      // The last valid save is still the recovery point, and only an explicit action replaces the value.
      expect(st.getItem(BACKUP_KEY) === null || st.getItem(BACKUP_KEY) === validRaw).toBe(true);
      expect(st.getItem(SAVE_KEY)).toBe(raw);
      expect(s.startOver()).toBe(true);
      expect(loadSave(st).kind).toBe('ok');
    });
    it(`Session detects ${name} on its next write even without a storage event`, () => {
      const st = new MemoryStorage();
      const s = new Session(st, '0.1.0', () => T);
      s.dispatch({ type: 'MARK_INTRO_SEEN', at: T });
      st.setItem(SAVE_KEY, raw);
      s.dispatch({ type: 'SET_LOCALE', locale: 'en', at: T });
      expect(st.getItem(SAVE_KEY)).toBe(raw);
      expect(s.status).toMatchObject({ kind: 'blocked', deferred: true });
    });
  }
});

describe('I1: reset / import keep a recovery point', () => {
  const done = (ids: string[]) => {
    let s = fresh();
    for (const id of ids) s = reduce(s, { type: 'ATTEMPT_ACTIVITY', activityId: id, questId: 'q01', questRevision: 'r1', correct: true, at: T });
    return s;
  };
  const backupCount = (st: MemoryStorage) => Object.keys(JSON.parse(st.getItem(BACKUP_KEY)!).completedActivities).length;

  it('the pre-reset save survives later ordinary writes and can be restored', () => {
    const st = new MemoryStorage();
    const s = new Session(st, '0.1.0', () => T);
    s.importSave(done(['q01-a', 'q01-b', 'q01-c']));
    s.dispatch({ type: 'MARK_INTRO_SEEN', at: T });
    s.dispatch({ type: 'RESET', contentVersion: '0.1.0', at: T });
    expect(Object.keys(s.save.completedActivities)).toHaveLength(0);
    for (const sec of ['a', 'b', 'c']) s.dispatch({ type: 'MARK_READ', sectionId: `q01.${sec}`, at: T });
    s.dispatch({ type: 'SET_LOCALE', locale: 'en', at: T });
    expect(backupCount(st)).toBe(3);
    // Restoring goes through the explicit recovery flow.
    st.setItem(SAVE_KEY, '{broken');
    const after = new Session(st, '0.1.0', () => T);
    expect(after.status.kind).toBe('blocked');
    expect(after.restoreBackup()).toBe(true);
    expect(Object.keys(after.save.completedActivities)).toHaveLength(3);
  });
  it('an import replacement keeps the pre-import save recoverable', () => {
    const st = new MemoryStorage();
    const s = new Session(st, '0.1.0', () => T);
    s.importSave(done(['q01-a', 'q01-b']));
    s.dispatch({ type: 'MARK_INTRO_SEEN', at: T });
    s.importSave(done(['q01-a']));
    s.dispatch({ type: 'MARK_READ', sectionId: 'q01.a', at: T });
    s.dispatch({ type: 'SET_LOCALE', locale: 'en', at: T });
    expect(backupCount(st)).toBe(2);
  });
  it('ordinary writes still rotate the backup when no reset / import happened', () => {
    const st = new MemoryStorage();
    const s = new Session(st, '0.1.0', () => T);
    s.dispatch({ type: 'MARK_INTRO_SEEN', at: T });
    s.dispatch({ type: 'SET_LOCALE', locale: 'en', at: T });
    expect(JSON.parse(st.getItem(BACKUP_KEY)!).locale).toBe('ja');
  });
});

describe('I8: navigation alone does not write', () => {
  it('noteResume changes the in-memory position but not the stored revision', () => {
    const st = new MemoryStorage();
    const s = new Session(st, '0.1.0', () => T);
    s.dispatch({ type: 'MARK_INTRO_SEEN', at: T });
    const before = st.getItem(SAVE_KEY);
    s.noteResume('q02', 'q02-a');
    expect(st.getItem(SAVE_KEY)).toBe(before);
    expect(s.save.currentQuestId).toBe('q02');
    // The position is saved together with the next real change.
    s.dispatch({ type: 'MARK_READ', sectionId: 'q02.story', at: T });
    expect(JSON.parse(st.getItem(SAVE_KEY)!).currentActivityId).toBe('q02-a');
  });
  it('a second session does not see a conflict after the first only navigates', () => {
    const st = new MemoryStorage();
    const a = new Session(st, '0.1.0', () => T);
    a.dispatch({ type: 'MARK_INTRO_SEEN', at: T });
    const b = new Session(st, '0.1.0', () => T);
    a.noteResume('q01', 'q01-a');
    a.noteResume('q01', null);
    b.externalChange();
    expect(b.status.kind).toBe('saved');
  });
});

