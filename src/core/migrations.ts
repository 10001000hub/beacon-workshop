// Save validation by allowlist + schema migration. Never deep-merges untrusted objects,
// never copies unknown keys, never touches prototypes. Imported strings stay plain strings.

import { NOTE_MAX_PER_KEY, NOTE_MAX_TOTAL, SCHEMA_VERSION, TEXT_SCALES, emptyPractice, notesTotal } from './state';
import {
  LOCALES,
  QUEST_IDS,
  type ActivityProgress,
  type BlockReason,
  type CompletionRecord,
  type Locale,
  type PracticeRecord,
  type PracticeStatus,
  type QuestId,
  type SaveData,
} from './types';

export const SUPPORTED_SCHEMA_VERSIONS: readonly number[] = [SCHEMA_VERSION];

export type ParseResult =
  | { ok: true; save: SaveData }
  | { ok: false; reason: 'not_object' | 'unsupported_version' | 'invalid'; detail: string; version?: unknown };

const ID_RE = /^[a-z0-9][a-z0-9._:-]{0,63}$/;
const PRACTICE_STATUSES: readonly PracticeStatus[] = ['not_started', 'in_progress', 'self_checked', 'unavailable'];
const BLOCK_REASONS: readonly BlockReason[] = ['quota', 'environment', 'permission', 'other'];

class Invalid extends Error {}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

function own(obj: Record<string, unknown>, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
}

function str(v: unknown, field: string, max = 64): string {
  if (typeof v !== 'string' || v.length > max) throw new Invalid(field);
  return v;
}

function isoOrNull(v: unknown, field: string): string | null {
  if (v === null || v === undefined) return null;
  const s = str(v, field, 40);
  if (Number.isNaN(Date.parse(s))) throw new Invalid(field);
  return s;
}

function iso(v: unknown, field: string): string {
  const s = isoOrNull(v, field);
  if (s === null) throw new Invalid(field);
  return s;
}

function int(v: unknown, field: string, min: number, max: number): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) throw new Invalid(field);
  return v;
}

function hint(v: unknown, field: string): 0 | 1 | 2 | 3 {
  return int(v, field, 0, 3) as 0 | 1 | 2 | 3;
}

function safeKey(k: string, field: string): string {
  if (!ID_RE.test(k) || k === '__proto__' || k === 'constructor' || k === 'prototype') throw new Invalid(field);
  return k;
}

function record<T>(v: unknown, field: string, maxEntries: number, each: (val: unknown, key: string) => T): Record<string, T> {
  if (v === undefined) return {};
  if (!isPlainObject(v)) throw new Invalid(field);
  const keys = Object.keys(v);
  if (keys.length > maxEntries) throw new Invalid(field);
  const out: Record<string, T> = {};
  for (const k of keys) out[safeKey(k, field)] = each(v[k], `${field}.${k}`);
  return out;
}

function parseV1(obj: Record<string, unknown>): SaveData {
  const locale = own(obj, 'locale');
  if (!LOCALES.includes(locale as Locale)) throw new Invalid('locale');

  const settingsRaw = own(obj, 'settings');
  if (!isPlainObject(settingsRaw)) throw new Invalid('settings');
  const textScale = own(settingsRaw, 'textScale');
  if (!TEXT_SCALES.includes(textScale as (typeof TEXT_SCALES)[number])) throw new Invalid('settings.textScale');
  const reduceMotion = own(settingsRaw, 'reduceMotion');
  if (typeof reduceMotion !== 'boolean') throw new Invalid('settings.reduceMotion');

  const currentQuestId = own(obj, 'currentQuestId');
  if (currentQuestId !== null && !QUEST_IDS.includes(currentQuestId as QuestId)) throw new Invalid('currentQuestId');
  const currentActivityRaw = own(obj, 'currentActivityId');
  const currentActivityId = currentActivityRaw === null ? null : safeKey(str(currentActivityRaw, 'currentActivityId'), 'currentActivityId');

  const completedActivities = record<CompletionRecord>(own(obj, 'completedActivities'), 'completedActivities', 64, (val, f) => {
    if (!isPlainObject(val)) throw new Invalid(f);
    return {
      questRevision: str(own(val, 'questRevision'), `${f}.questRevision`, 32),
      completedAt: iso(own(val, 'completedAt'), `${f}.completedAt`),
      attempts: int(own(val, 'attempts'), `${f}.attempts`, 1, 100000),
      maxHintLevel: hint(own(val, 'maxHintLevel'), `${f}.maxHintLevel`),
    };
  });

  const activityProgress = record<ActivityProgress>(own(obj, 'activityProgress'), 'activityProgress', 64, (val, f) => {
    if (!isPlainObject(val)) throw new Invalid(f);
    return {
      attempts: int(own(val, 'attempts'), `${f}.attempts`, 0, 100000),
      maxHintLevel: hint(own(val, 'maxHintLevel'), `${f}.maxHintLevel`),
    };
  });

  const practiceRaw = own(obj, 'practice');
  if (!isPlainObject(practiceRaw)) throw new Invalid('practice');
  const practice = emptyPractice();
  for (const k of Object.keys(practiceRaw)) {
    if (!QUEST_IDS.includes(k as QuestId)) throw new Invalid('practice');
    const val = practiceRaw[k];
    const f = `practice.${k}`;
    if (!isPlainObject(val)) throw new Invalid(f);
    const status = own(val, 'status');
    if (!PRACTICE_STATUSES.includes(status as PracticeStatus)) throw new Invalid(`${f}.status`);
    const blockReason = own(val, 'blockReason');
    if (blockReason !== null && blockReason !== undefined && !BLOCK_REASONS.includes(blockReason as BlockReason)) {
      throw new Invalid(`${f}.blockReason`);
    }
    const routeId = own(val, 'routeId');
    const step = own(val, 'lastConfirmedStepId');
    const rec: PracticeRecord = {
      status: status as PracticeStatus,
      routeId: routeId === null || routeId === undefined ? null : safeKey(str(routeId, `${f}.routeId`), `${f}.routeId`),
      checkedAt: isoOrNull(own(val, 'checkedAt'), `${f}.checkedAt`),
      lastConfirmedStepId: step === null || step === undefined ? null : safeKey(str(step, `${f}.step`), `${f}.step`),
      blockReason: (blockReason ?? null) as BlockReason | null,
    };
    practice[k as QuestId] = rec;
  }

  const notes = record<string>(own(obj, 'notes'), 'notes', 16, (val, f) => {
    const s = str(val, f, NOTE_MAX_PER_KEY * 2);
    if ([...s].length > NOTE_MAX_PER_KEY) throw new Invalid(f);
    return s;
  });
  if (notesTotal(notes) > NOTE_MAX_TOTAL) throw new Invalid('notes');

  const readSections = record<string>(own(obj, 'readSections'), 'readSections', 64, (val, f) => iso(val, f));

  return {
    schemaVersion: SCHEMA_VERSION,
    contentVersion: str(own(obj, 'contentVersion'), 'contentVersion', 32),
    revision: int(own(obj, 'revision'), 'revision', 0, Number.MAX_SAFE_INTEGER),
    updatedAt: iso(own(obj, 'updatedAt'), 'updatedAt'),
    locale: locale as Locale,
    settings: { textScale: textScale as number, reduceMotion, soundEnabled: false },
    currentQuestId: currentQuestId as QuestId | null,
    currentActivityId,
    completedActivities,
    practice,
    notes,
    readSections,
    activityProgress,
    introSeenAt: isoOrNull(own(obj, 'introSeenAt'), 'introSeenAt'),
  };
}

/** Validate an already-parsed JSON value and migrate it to the current schema. */
export function parseSave(value: unknown): ParseResult {
  if (!isPlainObject(value)) return { ok: false, reason: 'not_object', detail: 'root' };
  const version = own(value, 'schemaVersion');
  if (!SUPPORTED_SCHEMA_VERSIONS.includes(version as number)) {
    return { ok: false, reason: 'unsupported_version', detail: 'schemaVersion', version };
  }
  try {
    return { ok: true, save: parseV1(value) };
  } catch (e) {
    return { ok: false, reason: 'invalid', detail: e instanceof Invalid ? e.message : 'unknown' };
  }
}
