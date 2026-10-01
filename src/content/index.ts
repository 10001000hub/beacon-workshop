// Content loader: bundled JSON -> typed, validated catalog. No runtime fetch; nothing is executed.

import q01 from './quests/q01.json';
import q02 from './quests/q02.json';
import q03 from './quests/q03.json';
import q04 from './quests/q04.json';
import q05 from './quests/q05.json';
import q06 from './quests/q06.json';
import glossaryJson from './glossary.json';
import sourcesJson from './sources.json';
import routesJson from './routes.json';
import practiceJson from './practice.json';
import assetsJson from './asset-manifest.json';
import storyJson from './story.json';
import { validateContent, type RawContent } from './validate';
import type {
  GlossaryEntry,
  LocalizedText,
  PracticeCard,
  PracticeRoute,
  QuestDefinition,
  QuestId,
  Scene,
  SourceRecord,
} from '../core/types';
import type { Catalog } from '../core/selectors';

/** Bumped whenever quest content changes; quest.revision tracks grading-relevant changes. */
export const CONTENT_VERSION = '0.1.0';

export interface AssetEntry {
  id: string;
  kind: string;
  path: string;
  alt: LocalizedText;
  finalSpec: string;
  /** `candidate` = original code-drawn art, owner visual review pending (never "final" without sign-off). */
  status: 'candidate';
}

export interface Story {
  prologue: Scene;
  ending: Scene;
  characters: Record<string, { name: LocalizedText; role: LocalizedText }>;
  regions: { id: string; questId: QuestId; label: LocalizedText }[];
  futureTopics: LocalizedText[];
}

export interface Content {
  catalog: Catalog;
  quests: QuestDefinition[];
  glossary: GlossaryEntry[];
  sources: SourceRecord[];
  routes: PracticeRoute[];
  practice: PracticeCard[];
  assets: AssetEntry[];
  story: Story;
}

export const RAW_CONTENT: RawContent = {
  quests: [q01, q02, q03, q04, q05, q06],
  glossary: glossaryJson,
  sources: sourcesJson,
  routes: routesJson,
  practice: practiceJson,
  assets: assetsJson,
};

export function loadContent(): Content {
  const errors = validateContent(RAW_CONTENT);
  if (errors.length > 0) throw new Error(`Invalid content:\n${errors.join('\n')}`);
  const quests = RAW_CONTENT.quests as QuestDefinition[];
  return {
    catalog: { contentVersion: CONTENT_VERSION, quests },
    quests,
    glossary: glossaryJson as GlossaryEntry[],
    sources: sourcesJson as SourceRecord[],
    routes: routesJson as PracticeRoute[],
    practice: practiceJson as PracticeCard[],
    assets: assetsJson as AssetEntry[],
    story: storyJson as Story,
  };
}
