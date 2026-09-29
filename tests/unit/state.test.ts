import { describe, expect, it } from 'vitest';
import { loadContent } from '../../src/content/index';
const RAW_CONTENT = loadContent();
import { createInitialSave, NOTE_MAX_PER_KEY, NOTE_MAX_TOTAL, reduce, type GameEvent } from '../../src/core/state';
import {
  clearedQuestCount,
  completedActivityCount,
  earnedCardIds,
  isActivityUnlocked,
  isAllComplete,
  isQuestUnlocked,
  isStaleCompletion,
  level,
  maxXp,
  practiceSelfCheckedCount,
  readQuestCount,
  readSectionId,
  resumeTarget,
  simulationPercent,
  xp,
} from '../../src/core/selectors';
import type { Catalog } from '../../src/core/selectors';
import type { QuestId, SaveData } from '../../src/core/types';

const quests = RAW_CONTENT.quests;
const cat: Catalog = { contentVersion: '0.1.0', quests } as unknown as Catalog;
const T = '2026-09-29T00:00:00.000Z';

function attempt(save: SaveData, activityId: string, correct: boolean): SaveData {
  const q = quests.find((x) => x.activities.some((a) => a.id === activityId))!;
  return reduce(save, { type: 'ATTEMPT_ACTIVITY', activityId, questId: q.id, questRevision: q.revision, correct, at: T });
}
function completeAll(save: SaveData, upToQuest = 6): SaveData {
  for (const q of quests.slice(0, upToQuest)) for (const a of q.activities) save = attempt(save, a.id, true);
  return save;
}

describe('catalog', () => {
  it('has the expected shape', () => {
    expect(cat.quests).toHaveLength(6);
    expect(maxXp(cat)).toBe(600);
  });
});

describe('XP and level', () => {
  it('derives XP from completion records (20 per activity, 40 per quest)', () => {
    let s = createInitialSave('0.1.0', T);
    expect(xp(s, cat)).toBe(0);
    s = attempt(s, 'q01-a', true);
    expect(xp(s, cat)).toBe(20);
    s = attempt(s, 'q01-b', true);
    s = attempt(s, 'q01-c', true);
    expect(xp(s, cat)).toBe(100);
    expect(completeAll(s)).toSatisfy((x: SaveData) => xp(x, cat) === 600);
  });
  it('never awards twice for the same activity', () => {
    let s = createInitialSave('0.1.0', T);
    s = attempt(s, 'q01-a', true);
    const first = s.completedActivities['q01-a'];
    s = attempt(s, 'q01-a', true);
    s = attempt(s, 'q01-a', false);
    expect(xp(s, cat)).toBe(20);
    expect(s.completedActivities['q01-a']).toEqual(first);
  });
  it('wrong answers cost nothing and count attempts', () => {
    let s = createInitialSave('0.1.0', T);
    s = attempt(s, 'q01-a', false);
    s = attempt(s, 'q01-a', false);
    expect(xp(s, cat)).toBe(0);
    s = attempt(s, 'q01-a', true);
    expect(s.completedActivities['q01-a']!.attempts).toBe(3);
    expect(s.activityProgress['q01-a']).toBeUndefined();
  });
  it('level = min(7, floor(XP/100)+1)', () => {
    expect([0, 99, 100, 199, 200, 599, 600, 700, 10_000].map(level)).toEqual([1, 1, 2, 2, 3, 6, 7, 7, 7]);
  });
});

describe('hints', () => {
  it('record the highest level without reducing XP', () => {
    let s = createInitialSave('0.1.0', T);
    s = reduce(s, { type: 'USE_HINT', activityId: 'q01-a', level: 2, at: T });
    s = reduce(s, { type: 'USE_HINT', activityId: 'q01-a', level: 1, at: T });
    expect(s.activityProgress['q01-a']!.maxHintLevel).toBe(2);
    s = reduce(s, { type: 'USE_HINT', activityId: 'q01-a', level: 3, at: T });
    s = attempt(s, 'q01-a', true);
    expect(s.completedActivities['q01-a']!.maxHintLevel).toBe(3);
    expect(xp(s, cat)).toBe(20);
  });
  it('completing after level 3 keeps maxHintLevel, and repeating the activity never adds XP', () => {
    let s = reduce(createInitialSave('0.1.0', T), { type: 'USE_HINT', activityId: 'q01-a', level: 3, at: T });
    s = attempt(s, 'q01-a', true);
    expect(xp(s, cat)).toBe(20);
    for (let i = 0; i < 3; i++) s = attempt(s, 'q01-a', true);
    s = attempt(s, 'q01-a', false);
    expect(xp(s, cat)).toBe(20);
    expect(s.completedActivities['q01-a']!.maxHintLevel).toBe(3);
    expect(s.completedActivities['q01-a']!.attempts).toBe(1);
  });
  it('seeing the level-3 example does not complete the activity', () => {
    const s = reduce(createInitialSave('0.1.0', T), { type: 'USE_HINT', activityId: 'q01-a', level: 3, at: T });
    expect(completedActivityCount(s, cat)).toBe(0);
  });
  it('hints during review do not rewrite the completion', () => {
    let s = attempt(createInitialSave('0.1.0', T), 'q01-a', true);
    const before = s;
    s = reduce(s, { type: 'USE_HINT', activityId: 'q01-a', level: 3, at: T });
    expect(s).toBe(before);
  });
});

describe('unlocking', () => {
  it('quests unlock in order and activities A → B → C', () => {
    let s = createInitialSave('0.1.0', T);
    const q1 = quests[0]!;
    expect(isQuestUnlocked(s, cat, 'q01')).toBe(true);
    expect(isQuestUnlocked(s, cat, 'q02')).toBe(false);
    expect(isActivityUnlocked(s, q1, 'q01-a')).toBe(true);
    expect(isActivityUnlocked(s, q1, 'q01-b')).toBe(false);
    s = attempt(s, 'q01-a', true);
    expect(isActivityUnlocked(s, q1, 'q01-b')).toBe(true);
    expect(isActivityUnlocked(s, q1, 'q01-c')).toBe(false);
    s = completeAll(s, 1);
    expect(isQuestUnlocked(s, cat, 'q02')).toBe(true);
    expect(clearedQuestCount(s, cat)).toBe(1);
    expect(earnedCardIds(s, cat)).toHaveLength(3);
  });
  it('resume target points at the next unfinished activity; null when all done', () => {
    let s = createInitialSave('0.1.0', T);
    expect(resumeTarget(s, cat)?.questId).toBe('q01');
    s = completeAll(s, 2);
    expect(resumeTarget(s, cat)?.questId).toBe('q03');
    s = completeAll(s);
    expect(resumeTarget(s, cat)).toBeNull();
    expect(isAllComplete(s, cat)).toBe(true);
    expect(simulationPercent(s, cat)).toBe(100);
  });
  it('a completion from an older quest revision is kept but marked stale', () => {
    let s = attempt(createInitialSave('0.1.0', T), 'q01-a', true);
    s = { ...s, completedActivities: { ...s.completedActivities, 'q01-a': { ...s.completedActivities['q01-a']!, questRevision: 'old' } } };
    expect(isStaleCompletion(s, quests[0]!, 'q01-a')).toBe(true);
    expect(xp(s, cat)).toBe(20);
  });
});

describe('progress kinds stay separate', () => {
  it('reading and practice never change simulation progress or XP', () => {
    let s = createInitialSave('0.1.0', T);
    for (const q of quests) {
      s = reduce(s, { type: 'MARK_READ', sectionId: readSectionId(q.id), at: T });
      s = reduce(s, { type: 'SET_PRACTICE', questId: q.id as QuestId, status: 'self_checked', routeId: 'desktop_windows_codex', blockReason: null, at: T });
    }
    expect(readQuestCount(s, cat)).toBe(6);
    expect(practiceSelfCheckedCount(s, cat)).toBe(6);
    expect(completedActivityCount(s, cat)).toBe(0);
    expect(xp(s, cat)).toBe(0);
    expect(isQuestUnlocked(s, cat, 'q02')).toBe(false);
  });
  it('unavailable practice records a reason and no checkedAt', () => {
    const s = reduce(createInitialSave('0.1.0', T), { type: 'SET_PRACTICE', questId: 'q02', status: 'unavailable', routeId: null, blockReason: 'quota', at: T });
    expect(s.practice.q02).toMatchObject({ status: 'unavailable', blockReason: 'quota', checkedAt: null });
  });
});

describe('settings, locale, notes', () => {
  it('locale changes never change progress', () => {
    const s = completeAll(createInitialSave('0.1.0', T), 2);
    const en = reduce(s, { type: 'SET_LOCALE', locale: 'en', at: T });
    expect(en.completedActivities).toEqual(s.completedActivities);
    expect(xp(en, cat)).toBe(xp(s, cat));
  });
  it('settings are clamped; sound stays off', () => {
    const s = reduce(createInitialSave('0.1.0', T), { type: 'SET_SETTINGS', settings: { textScale: 9, soundEnabled: true, reduceMotion: true }, at: T });
    expect(s.settings).toEqual({ textScale: 1, soundEnabled: false, reduceMotion: true });
  });
  it('notes are limited per key and in total', () => {
    let s = createInitialSave('0.1.0', T);
    s = reduce(s, { type: 'SET_NOTE', key: 'q01', text: 'あ'.repeat(NOTE_MAX_PER_KEY + 50), at: T });
    expect([...s.notes.q01!].length).toBe(NOTE_MAX_PER_KEY);
    for (const k of ['q02', 'q03', 'q04', 'q05', 'q06']) s = reduce(s, { type: 'SET_NOTE', key: k, text: 'x'.repeat(NOTE_MAX_PER_KEY), at: T });
    expect(Object.values(s.notes).join('').length).toBe(NOTE_MAX_TOTAL);
    const before = s;
    s = reduce(s, { type: 'SET_NOTE', key: 'extra', text: 'y', at: T });
    expect(s).toBe(before);
    s = reduce(s, { type: 'SET_NOTE', key: 'q01', text: '', at: T });
    expect(s.notes.q01).toBeUndefined();
  });
  it('reset keeps locale and revision counter', () => {
    let s = completeAll(createInitialSave('0.1.0', T, 'en'), 1);
    s = { ...s, revision: 7 };
    const r = reduce(s, { type: 'RESET', contentVersion: '0.1.0', at: T } as GameEvent);
    expect(r.locale).toBe('en');
    expect(r.revision).toBe(7);
    expect(Object.keys(r.completedActivities)).toHaveLength(0);
  });
});
