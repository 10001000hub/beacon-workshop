// localStorage adapter. Only ever touches the two Beacon Workshop keys (§13.3).
// Never calls localStorage.clear(), never silently discards a corrupt or newer save.

import { parseSave, type ParseResult } from './migrations';
import type { SaveData } from './types';

export const SAVE_KEY = 'beacon-workshop.save.v1';
export const BACKUP_KEY = 'beacon-workshop.backup.v1';
export const IMPORT_MAX_BYTES = 65536;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type LoadResult =
  | { kind: 'empty' }
  | { kind: 'ok'; save: SaveData }
  | { kind: 'corrupt'; raw: string; detail: string; backup: SaveData | null }
  | { kind: 'unsupported'; raw: string; version: unknown; backup: SaveData | null }
  | { kind: 'unavailable'; error: string };

export type PersistResult =
  | { ok: true; revision: number; save: SaveData }
  | { ok: false; reason: 'conflict'; storedRevision: number }
  /** The stored value is corrupt or from an unsupported version. It is left exactly as it is. */
  | { ok: false; reason: 'foreign_value' }
  | { ok: false; reason: 'write_failed'; error: string };

/** Returns the browser's localStorage, or null if access itself throws (privacy modes, blocked storage). */
export function getBrowserStorage(): StorageLike | null {
  try {
    const s = globalThis.localStorage;
    return s ?? null;
  } catch {
    return null;
  }
}

function parseText(text: string): ParseResult | { ok: false; reason: 'bad_json'; detail: string } {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'bad_json', detail: 'json' };
  }
  return parseSave(value);
}

function readBackup(storage: StorageLike): SaveData | null {
  try {
    const raw = storage.getItem(BACKUP_KEY);
    if (raw === null) return null;
    const res = parseText(raw);
    return res.ok ? res.save : null;
  } catch {
    return null;
  }
}

export function loadSave(storage: StorageLike | null): LoadResult {
  if (!storage) return { kind: 'unavailable', error: 'no_storage' };
  let raw: string | null;
  try {
    raw = storage.getItem(SAVE_KEY);
  } catch (e) {
    return { kind: 'unavailable', error: String(e) };
  }
  if (raw === null) return { kind: 'empty' };
  const res = parseText(raw);
  if (res.ok) return { kind: 'ok', save: res.save };
  if (res.reason === 'unsupported_version') {
    return { kind: 'unsupported', raw, version: res.version, backup: readBackup(storage) };
  }
  return { kind: 'corrupt', raw, detail: res.detail, backup: readBackup(storage) };
}

/** Revision currently stored, or null if nothing valid is stored. */
export function storedRevision(storage: StorageLike): number | null {
  const raw = storage.getItem(SAVE_KEY);
  if (raw === null) return null;
  const res = parseText(raw);
  return res.ok ? res.save.revision : null;
}

/** True when the save key holds something that is not a valid, supported save (corrupt or newer). */
export function hasForeignValue(storage: StorageLike): boolean {
  const raw = storage.getItem(SAVE_KEY);
  return raw !== null && !parseText(raw).ok;
}

/**
 * Copy the currently stored save to the backup key, but only if it is valid.
 * Used right before a learner-confirmed destructive operation (reset / import).
 */
export function snapshotBackup(storage: StorageLike): boolean {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (raw === null || !parseText(raw).ok) return false;
    storage.setItem(BACKUP_KEY, raw);
    return true;
  } catch {
    return false;
  }
}

/**
 * Write the save if nobody else has written since `knownRevision`.
 * The previous valid save is copied to the backup key first, unless `keepBackup` is set
 * (a snapshot taken before a reset / import must survive the writes that follow).
 * A corrupt or unsupported stored value is never overwritten: the caller must let the learner decide.
 */
export function persistSave(storage: StorageLike, save: SaveData, knownRevision: number, keepBackup = false): PersistResult {
  try {
    const prevRaw = storage.getItem(SAVE_KEY);
    if (prevRaw !== null) {
      const prev = parseText(prevRaw);
      if (!prev.ok) return { ok: false, reason: 'foreign_value' };
      if (prev.save.revision !== knownRevision) {
        return { ok: false, reason: 'conflict', storedRevision: prev.save.revision };
      }
      if (!keepBackup) storage.setItem(BACKUP_KEY, prevRaw);
    }
    const next: SaveData = { ...save, revision: knownRevision + 1 };
    storage.setItem(SAVE_KEY, JSON.stringify(next));
    return { ok: true, revision: next.revision, save: next };
  } catch (e) {
    return { ok: false, reason: 'write_failed', error: String(e) };
  }
}

/** Explicit, learner-confirmed overwrite used by recovery actions (restore backup / start over). */
export function forceWrite(storage: StorageLike, save: SaveData): PersistResult {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(save));
    return { ok: true, revision: save.revision, save };
  } catch (e) {
    return { ok: false, reason: 'write_failed', error: String(e) };
  }
}

export function exportSave(save: SaveData): string {
  return JSON.stringify(save, null, 2);
}

export type ImportCheck =
  | { ok: true; save: SaveData }
  | { ok: false; reason: 'too_large' | 'bad_json' | 'unsupported_version' | 'invalid' | 'not_object' };

export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

/** Validate an import candidate. Nothing is applied until the learner confirms. */
export function checkImport(text: string): ImportCheck {
  if (byteLength(text) > IMPORT_MAX_BYTES) return { ok: false, reason: 'too_large' };
  const res = parseText(text);
  if (res.ok) return { ok: true, save: res.save };
  return { ok: false, reason: res.reason };
}
