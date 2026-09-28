// `npm run validate:content` — checks all bundled content against the §8.2 / §6.3 rules.
// Offline only. Source reachability is a separate, manual command (not part of CI).

import { RAW_CONTENT } from '../src/content/index';
import { totalRequiredActivities, validateContent } from '../src/content/validate';
import type { QuestDefinition } from '../src/core/types';

const errors = validateContent(RAW_CONTENT);
const quests = RAW_CONTENT.quests as QuestDefinition[];
if (errors.length > 0) {
  console.error(`content validation failed (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`content OK: ${quests.length} quests, ${totalRequiredActivities(quests)} required activities`);
