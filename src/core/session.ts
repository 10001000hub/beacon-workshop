// Save controller: owns the in-memory save, applies events through the reducer and persists them.
// DOM-free so it can be unit-tested with a fake storage. The app wires the `storage` event to
// `externalChange()`.

import { reduce, createInitialSave, type GameEvent } from './state';
import {
  forceWrite,
  hasForeignValue,
  loadSave,
  persistSave,
  snapshotBackup,
  storedRevision,
  type LoadResult,
  type StorageLike,
} from './storage';
import type { SaveData } from './types';

export type SaveStatus =
  /** Persisted to this device. */
  | { kind: 'saved' }
  /** Storage is unavailable or a write failed: progress lives in memory only (§13.4, AC09). */
  | { kind: 'memory'; reason: 'unavailable' | 'write_failed' }
  /** A corrupt or newer save is stored. Nothing is written until the learner picks a recovery option (AC10). */
  | { kind: 'blocked'; load: Extract<LoadResult, { kind: 'corrupt' } | { kind: 'unsupported' }>; deferred: boolean }
  /** Another tab wrote a newer revision. We never overwrite it automatically (AC13). */
  | { kind: 'conflict'; storedRevision: number };

export type Listener = (save: SaveData, status: SaveStatus) => void;

export class Session {
  save: SaveData;
  status: SaveStatus;
  private knownRevision = 0;
  /** After a reset / import the pre-operation snapshot in the backup key is kept, not rotated away. */
  private holdBackup = false;
  private listeners = new Set<Listener>();

  constructor(
    private readonly storage: StorageLike | null,
    private readonly contentVersion: string,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {
    const res = loadSave(storage);
    this.save = createInitialSave(contentVersion, this.now());
    switch (res.kind) {
      case 'ok':
        this.save = res.save;
        this.knownRevision = res.save.revision;
        this.status = { kind: 'saved' };
        break;
      case 'empty':
        this.status = { kind: 'saved' };
        break;
      case 'unavailable':
        this.status = { kind: 'memory', reason: 'unavailable' };
        break;
      case 'corrupt':
      case 'unsupported':
        this.status = { kind: 'blocked', load: res, deferred: false };
        break;
    }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn(this.save, this.status);
  }

  dispatch(event: GameEvent): void {
    if (event.type === 'RESET') this.protectRecoveryPoint();
    const next = reduce(this.save, event);
    if (next === this.save) return;
    this.save = next;
    this.persist();
    this.emit();
  }

  private persist(): void {
    if (!this.storage) return;
    if (this.status.kind === 'blocked' || this.status.kind === 'conflict') return;
    if (this.status.kind === 'memory' && this.status.reason === 'unavailable') return;
    const res = persistSave(this.storage, this.save, this.knownRevision, this.holdBackup);
    if (res.ok) {
      this.knownRevision = res.revision;
      this.save = res.save;
      this.status = { kind: 'saved' };
    } else if (res.reason === 'conflict') {
      this.status = { kind: 'conflict', storedRevision: res.storedRevision };
    } else if (res.reason === 'foreign_value') {
      this.blockOnForeignValue();
    } else {
      this.status = { kind: 'memory', reason: 'write_failed' };
    }
  }

  /**
   * Another tab or build put a corrupt / unsupported value in our key. Keep it untouched, keep the
   * in-memory progress playable, and point the learner to the recovery screen (AC10).
   */
  private blockOnForeignValue(): void {
    const load = loadSave(this.storage);
    if (load.kind === 'corrupt' || load.kind === 'unsupported') {
      this.status = { kind: 'blocked', load, deferred: true };
    } else {
      this.status = { kind: 'memory', reason: 'write_failed' };
    }
  }

  /** Snapshot the last valid stored save before a destructive, learner-confirmed operation. */
  private protectRecoveryPoint(): void {
    if (!this.storage) return;
    snapshotBackup(this.storage);
    this.holdBackup = true;
  }

  /** Called when another tab changed our key. */
  externalChange(): void {
    if (!this.storage || this.status.kind === 'blocked') return;
    let rev: number | null;
    try {
      if (hasForeignValue(this.storage)) {
        this.blockOnForeignValue();
        this.emit();
        return;
      }
      rev = storedRevision(this.storage);
    } catch {
      return;
    }
    if (rev !== null && rev !== this.knownRevision) {
      this.status = { kind: 'conflict', storedRevision: rev };
      this.emit();
    }
  }

  /** Conflict resolution: adopt the newer save from storage. */
  reloadFromStorage(): boolean {
    const res = loadSave(this.storage);
    if (res.kind !== 'ok') return false;
    this.save = res.save;
    this.knownRevision = res.save.revision;
    this.holdBackup = false;
    this.status = { kind: 'saved' };
    this.emit();
    return true;
  }

  /**
   * Remember where the learner is for resume, without persisting. Navigation alone must not write
   * (it would bump the revision and make other open tabs report a conflict); the position is
   * saved together with the next real progress change.
   */
  noteResume(questId: SaveData['currentQuestId'], activityId: string | null): void {
    this.save = reduce(this.save, { type: 'SET_CURRENT', questId, activityId, at: this.save.updatedAt });
  }

  /** Retry after a failed write (e.g. storage was full). */
  retryPersist(): void {
    if (this.status.kind === 'memory' && this.status.reason === 'write_failed') {
      this.status = { kind: 'saved' };
      this.persist();
      this.emit();
    }
  }

  /** Apply a validated, learner-confirmed import. Replaces a blocked (corrupt / newer) value too. */
  importSave(imported: SaveData): void {
    this.protectRecoveryPoint();
    this.save = reduce(this.save, { type: 'REPLACE_SAVE', save: imported, at: this.now() });
    if (this.status.kind === 'blocked' && this.storage) {
      const res = forceWrite(this.storage, this.save);
      this.knownRevision = this.save.revision;
      this.status = res.ok ? { kind: 'saved' } : { kind: 'memory', reason: 'write_failed' };
    } else if (this.status.kind === 'conflict') {
      // The learner chose this data explicitly; adopt the newer stored revision as the base.
      this.knownRevision = this.status.storedRevision;
      this.save = { ...this.save, revision: Math.max(this.save.revision, this.knownRevision) };
      this.status = { kind: 'saved' };
      this.persist();
    } else {
      this.persist();
    }
    this.emit();
  }

  // ---- recovery (learner-confirmed only)

  restoreBackup(): boolean {
    if (this.status.kind !== 'blocked' || !this.status.load.backup || !this.storage) return false;
    const backup = this.status.load.backup;
    const res = forceWrite(this.storage, backup);
    this.save = backup;
    this.holdBackup = false;
    this.knownRevision = backup.revision;
    this.status = res.ok ? { kind: 'saved' } : { kind: 'memory', reason: 'write_failed' };
    this.emit();
    return res.ok;
  }

  startOver(): boolean {
    if (this.status.kind !== 'blocked' || !this.storage) return false;
    const fresh = createInitialSave(this.contentVersion, this.now(), this.save.locale);
    const res = forceWrite(this.storage, fresh);
    this.save = fresh;
    this.holdBackup = false;
    this.knownRevision = fresh.revision;
    this.status = res.ok ? { kind: 'saved' } : { kind: 'memory', reason: 'write_failed' };
    this.emit();
    return res.ok;
  }

  /** Play on without touching the stored (corrupt / newer) value. */
  deferRecovery(): void {
    if (this.status.kind === 'blocked') {
      this.status = { ...this.status, deferred: true };
      this.emit();
    }
  }
}
