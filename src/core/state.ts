// Pure state transitions. No DOM, no storage, no clock: every event carries its own time.

import {
  QUEST_IDS,
  type BlockReason,
  type Locale,
  type PracticeRecord,
  type PracticeStatus,
  type QuestId,
  type SaveData,
  type Settings,
} from './types';

export const SCHEMA_VERSION = 1 as const;
export const NOTE_MAX_PER_KEY = 500;
export const NOTE_MAX_TOTAL = 3000;
export const TEXT_SCALES = [1, 1.15, 1.3] as const;

export function emptyPractice(): Record<QuestId, PracticeRecord> {
  const out = {} as Record<QuestId, PracticeRecord>;
  for (const id of QUEST_IDS) {
    out[id] = { status: 'not_started', routeId: null, checkedAt: null, lastConfirmedStepId: null, blockReason: null };
  }
  return out;
}

export function createInitialSave(contentVersion: string, now: string, locale: Locale = 'ja'): SaveData {
  return {
    schemaVersion: SCHEMA_VERSION,
    contentVersion,
    revision: 0,
    updatedAt: now,
    locale,
    settings: { textScale: 1, reduceMotion: false, soundEnabled: false },
    currentQuestId: null,
    currentActivityId: null,
    completedActivities: {},
    practice: emptyPractice(),
    notes: {},
    readSections: {},
    activityProgress: {},
    introSeenAt: null,
  };
}

export type GameEvent =
  | { type: 'ATTEMPT_ACTIVITY'; activityId: string; questId: QuestId; questRevision: string; correct: boolean; at: string }
  | { type: 'USE_HINT'; activityId: string; level: 1 | 2 | 3; at: string }
  | { type: 'SET_CURRENT'; questId: QuestId | null; activityId: string | null; at: string }
  | { type: 'SET_LOCALE'; locale: Locale; at: string }
  | { type: 'SET_SETTINGS'; settings: Partial<Settings>; at: string }
  | { type: 'MARK_READ'; sectionId: string; at: string }
  | { type: 'MARK_INTRO_SEEN'; at: string }
  | {
      type: 'SET_PRACTICE';
      questId: QuestId;
      status: PracticeStatus;
      routeId: string | null;
      blockReason: BlockReason | null;
      at: string;
    }
  | { type: 'SET_NOTE'; key: string; text: string; at: string }
  | { type: 'REPLACE_SAVE'; save: SaveData; at: string }
  | { type: 'RESET'; contentVersion: string; at: string };

export function notesTotal(notes: Record<string, string>): number {
  return Object.values(notes).reduce((n, t) => n + [...t].length, 0);
}

function touch(save: SaveData, at: string): SaveData {
  return { ...save, updatedAt: at };
}

export function reduce(save: SaveData, event: GameEvent): SaveData {
  switch (event.type) {
    case 'ATTEMPT_ACTIVITY': {
      const prev = save.activityProgress[event.activityId] ?? { attempts: 0, maxHintLevel: 0 };
      const done = save.completedActivities[event.activityId];
      if (done) {
        // Review after completion: never re-award, never rewrite the first completion.
        return touch({ ...save, currentQuestId: event.questId, currentActivityId: event.activityId }, event.at);
      }
      const attempts = prev.attempts + 1;
      if (!event.correct) {
        return touch(
          {
            ...save,
            currentQuestId: event.questId,
            currentActivityId: event.activityId,
            activityProgress: { ...save.activityProgress, [event.activityId]: { ...prev, attempts } },
          },
          event.at,
        );
      }
      const { [event.activityId]: _dropped, ...restProgress } = save.activityProgress;
      return touch(
        {
          ...save,
          currentQuestId: event.questId,
          currentActivityId: event.activityId,
          activityProgress: restProgress,
          completedActivities: {
            ...save.completedActivities,
            [event.activityId]: {
              questRevision: event.questRevision,
              completedAt: event.at,
              attempts,
              maxHintLevel: prev.maxHintLevel,
            },
          },
        },
        event.at,
      );
    }
    case 'USE_HINT': {
      if (save.completedActivities[event.activityId]) return save; // review hints do not rewrite history
      const prev = save.activityProgress[event.activityId] ?? { attempts: 0, maxHintLevel: 0 };
      if (prev.maxHintLevel >= event.level) return save;
      return touch(
        { ...save, activityProgress: { ...save.activityProgress, [event.activityId]: { ...prev, maxHintLevel: event.level } } },
        event.at,
      );
    }
    case 'SET_CURRENT':
      if (save.currentQuestId === event.questId && save.currentActivityId === event.activityId) return save;
      return touch({ ...save, currentQuestId: event.questId, currentActivityId: event.activityId }, event.at);
    case 'SET_LOCALE':
      if (save.locale === event.locale) return save;
      return touch({ ...save, locale: event.locale }, event.at);
    case 'SET_SETTINGS': {
      const next: Settings = { ...save.settings, ...event.settings };
      if (!TEXT_SCALES.includes(next.textScale as (typeof TEXT_SCALES)[number])) next.textScale = 1;
      next.soundEnabled = false; // no sound in the first version
      return touch({ ...save, settings: next }, event.at);
    }
    case 'MARK_READ':
      if (save.readSections[event.sectionId]) return save;
      return touch({ ...save, readSections: { ...save.readSections, [event.sectionId]: event.at } }, event.at);
    case 'MARK_INTRO_SEEN':
      if (save.introSeenAt) return save;
      return touch({ ...save, introSeenAt: event.at }, event.at);
    case 'SET_PRACTICE': {
      const record: PracticeRecord = {
        status: event.status,
        routeId: event.routeId,
        checkedAt: event.status === 'self_checked' ? event.at : null,
        lastConfirmedStepId: save.practice[event.questId]?.lastConfirmedStepId ?? null,
        blockReason: event.status === 'unavailable' ? (event.blockReason ?? 'other') : null,
      };
      return touch({ ...save, practice: { ...save.practice, [event.questId]: record } }, event.at);
    }
    case 'SET_NOTE': {
      const text = [...event.text].slice(0, NOTE_MAX_PER_KEY).join('');
      const notes = { ...save.notes };
      if (text.length === 0) delete notes[event.key];
      else notes[event.key] = text;
      if (notesTotal(notes) > NOTE_MAX_TOTAL) return save; // rejected; UI shows the limit
      return touch({ ...save, notes }, event.at);
    }
    case 'REPLACE_SAVE':
      // Keep our revision counter monotonic so the next write is not mistaken for a stale tab.
      return { ...event.save, revision: Math.max(save.revision, event.save.revision), updatedAt: event.at };
    case 'RESET':
      return { ...createInitialSave(event.contentVersion, event.at, save.locale), revision: save.revision };
  }
}
