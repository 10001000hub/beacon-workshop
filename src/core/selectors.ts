// Derived values. XP, level, clears and card counts are computed from completion records only (§6.5, §13.2).

import type { ActivityDefinition, QuestDefinition, QuestId, SaveData } from './types';

export const XP_PER_ACTIVITY = 20;
export const XP_PER_QUEST = 40;
export const MAX_LEVEL = 7;

export interface Catalog {
  contentVersion: string;
  quests: QuestDefinition[];
}

export function allActivities(catalog: Catalog): ActivityDefinition[] {
  return catalog.quests.flatMap((q) => q.activities);
}

export function totalActivities(catalog: Catalog): number {
  return allActivities(catalog).length;
}

export function isActivityComplete(save: SaveData, activityId: string): boolean {
  return save.completedActivities[activityId] !== undefined;
}

export function completedActivityCount(save: SaveData, catalog: Catalog): number {
  return allActivities(catalog).filter((a) => isActivityComplete(save, a.id)).length;
}

export function questCompletedCount(save: SaveData, quest: QuestDefinition): number {
  return quest.activities.filter((a) => isActivityComplete(save, a.id)).length;
}

export function isQuestCleared(save: SaveData, quest: QuestDefinition): boolean {
  return quest.activities.every((a) => isActivityComplete(save, a.id));
}

export function clearedQuestCount(save: SaveData, catalog: Catalog): number {
  return catalog.quests.filter((q) => isQuestCleared(save, q)).length;
}

export function findQuest(catalog: Catalog, id: string): QuestDefinition | undefined {
  return catalog.quests.find((q) => q.id === id);
}

export function isQuestUnlocked(save: SaveData, catalog: Catalog, questId: QuestId): boolean {
  const quest = findQuest(catalog, questId);
  if (!quest) return false;
  if (quest.prerequisite === null) return true;
  const pre = findQuest(catalog, quest.prerequisite);
  return pre !== undefined && isQuestCleared(save, pre);
}

/** Activities inside a quest open in order: A, then B, then C. */
export function isActivityUnlocked(save: SaveData, quest: QuestDefinition, activityId: string): boolean {
  const idx = quest.activities.findIndex((a) => a.id === activityId);
  if (idx < 0) return false;
  return quest.activities.slice(0, idx).every((a) => isActivityComplete(save, a.id));
}

export function nextActivity(save: SaveData, quest: QuestDefinition): ActivityDefinition | undefined {
  return quest.activities.find((a) => !isActivityComplete(save, a.id));
}

export function xp(save: SaveData, catalog: Catalog): number {
  return completedActivityCount(save, catalog) * XP_PER_ACTIVITY + clearedQuestCount(save, catalog) * XP_PER_QUEST;
}

export function maxXp(catalog: Catalog): number {
  return totalActivities(catalog) * XP_PER_ACTIVITY + catalog.quests.length * XP_PER_QUEST;
}

export function level(xpValue: number): number {
  return Math.min(MAX_LEVEL, Math.floor(xpValue / 100) + 1);
}

export function simulationPercent(save: SaveData, catalog: Catalog): number {
  const total = totalActivities(catalog);
  return total === 0 ? 0 : Math.round((completedActivityCount(save, catalog) / total) * 100);
}

export function earnedCardIds(save: SaveData, catalog: Catalog): string[] {
  return catalog.quests.filter((q) => isQuestCleared(save, q)).flatMap((q) => q.takeawayCards.map((c) => c.id));
}

export function totalCards(catalog: Catalog): number {
  return catalog.quests.reduce((n, q) => n + q.takeawayCards.length, 0);
}

export function practiceSelfCheckedCount(save: SaveData, catalog: Catalog): number {
  return catalog.quests.filter((q) => save.practice[q.id]?.status === 'self_checked').length;
}

export function readSectionId(questId: QuestId): string {
  return `${questId}.story`;
}

export function readQuestCount(save: SaveData, catalog: Catalog): number {
  return catalog.quests.filter((q) => save.readSections[readSectionId(q.id)] !== undefined).length;
}

export function isAllComplete(save: SaveData, catalog: Catalog): boolean {
  return catalog.quests.every((q) => isQuestCleared(save, q));
}

/** Completed under an older quest revision: kept, but flagged "旧教材版で完了" (§13.5). */
export function isStaleCompletion(save: SaveData, quest: QuestDefinition, activityId: string): boolean {
  const rec = save.completedActivities[activityId];
  return rec !== undefined && rec.questRevision !== quest.revision;
}

/** Where "続きから" should go. */
export function resumeTarget(save: SaveData, catalog: Catalog): { questId: QuestId; activityId: string | null } | null {
  if (isAllComplete(save, catalog)) return null;
  const current = save.currentQuestId ? findQuest(catalog, save.currentQuestId) : undefined;
  const quest =
    current && isQuestUnlocked(save, catalog, current.id) && !isQuestCleared(save, current)
      ? current
      : catalog.quests.find((q) => isQuestUnlocked(save, catalog, q.id) && !isQuestCleared(save, q));
  if (!quest) return null;
  return { questId: quest.id, activityId: nextActivity(save, quest)?.id ?? null };
}
