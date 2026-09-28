// Content validation (§8.2, §6.3, §13.1). Pure: raw JSON in, list of problems out.
// Used by the loader, `npm run validate:content`, and the content tests.

import { outcomesOf } from '../core/grading';
import {
  ACTIVITY_TYPES,
  CORRECT,
  QUEST_IDS,
  type AcceptedCombination,
  type ActivityDefinition,
  type Condition,
  type GlossaryEntry,
  type PracticeCard,
  type PracticeRoute,
  type QuestDefinition,
  type SourceRecord,
} from '../core/types';

export interface RawContent {
  quests: unknown[];
  glossary: unknown;
  sources: unknown;
  routes: unknown;
  practice: unknown;
  assets: unknown;
}

export const REQUIRED_ASSET_IDS = [
  'MAP01', 'BG01', 'BG02', 'BG03', 'BG04', 'BG05', 'BG06',
  'CH01', 'CH02', 'CH03', 'CH04', 'CH05', 'CH06', 'CH07', 'CH08', 'CH09',
  'FX01', 'LOGO01', 'ICONS01', 'BADGES01',
] as const;

const PRACTICE_VERIFICATION = ['draft', 'source_checked', 'device_verified', 'released', 'needs_review'];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

function hasJa(v: unknown): boolean {
  return isObj(v) && typeof v.ja === 'string' && v.ja.trim().length > 0;
}

/** Text that would be dangerous if someone later rendered it as HTML. Content must be plain text. */
const MARKUP_RE = /<\s*\/?\s*[a-z!]/i;

function walkStrings(v: unknown, path: string, out: string[]): void {
  if (typeof v === 'string') {
    if (MARKUP_RE.test(v) && !path.includes('.lines[') && !path.includes('.panels')) out.push(`${path}: looks like markup`);
    return;
  }
  if (Array.isArray(v)) v.forEach((x, i) => walkStrings(x, `${path}[${i}]`, out));
  else if (isObj(v)) for (const [k, x] of Object.entries(v)) walkStrings(x, `${path}.${k}`, out);
}

function conditionIds(c: Condition): { cards: string[]; slots: string[]; items: string[]; options: string[] } {
  switch (c.type) {
    case 'placed':
    case 'selected':
    case 'notSelected':
      return { cards: c.cards, slots: [], items: [], options: [] };
    case 'placedIn':
    case 'slotMissing':
      return { cards: c.cards, slots: [c.slot], items: [], options: [] };
    case 'orderViolated':
      return { cards: [c.before, c.after], slots: [], items: [], options: [] };
    case 'pick':
      return { cards: [], slots: [], items: [c.item], options: c.options.map((o) => `${c.item}=${o}`) };
    case 'all': {
      const parts = c.of.map(conditionIds);
      return {
        cards: parts.flatMap((p) => p.cards),
        slots: parts.flatMap((p) => p.slots),
        items: parts.flatMap((p) => p.items),
        options: parts.flatMap((p) => p.options),
      };
    }
  }
}

function comboIds(c: AcceptedCombination): { cards: string[]; slots: string[]; items: string[]; options: string[] } {
  switch (c.kind) {
    case 'placements':
      return {
        cards: Object.values(c.slots).flatMap((r) => [...(r.required ?? []), ...(r.requireAny ?? []), ...(r.allowed ?? [])]),
        slots: Object.keys(c.slots),
        items: [],
        options: [],
      };
    case 'sequence':
      return { cards: c.ordered ? c.sequence : [...c.required, ...(c.allowed ?? [])], slots: [], items: [], options: [] };
    case 'picks':
      return {
        cards: [],
        slots: [],
        items: Object.keys(c.picks),
        options: Object.entries(c.picks).flatMap(([item, opts]) => opts.map((o) => `${item}=${o}`)),
      };
  }
}

function validateActivity(a: ActivityDefinition, q: QuestDefinition, errs: string[]): void {
  const p = `${q.id}/${a.id}`;
  if (!ACTIVITY_TYPES.includes(a.type)) errs.push(`${p}: unknown type ${String(a.type)}`);
  if (a.questId !== q.id) errs.push(`${p}: questId mismatch`);
  if (a.required !== true) errs.push(`${p}: required must be true`);
  if (!q.objectives.some((o) => o.id === a.objectiveId)) errs.push(`${p}: objectiveId not in quest`);
  if (!hasJa(a.title) || !hasJa(a.prompt)) errs.push(`${p}: title/prompt need ja`);
  if (!Array.isArray(a.hints) || a.hints.length !== 3 || !a.hints.every((h) => hasJa(h.text))) errs.push(`${p}: needs exactly 3 hints`);

  // Known IDs for this activity.
  const cards = new Set<string>();
  const slots = new Set<string>();
  const items = new Set<string>();
  const options = new Set<string>();
  const optionDefs: { id: string; label: unknown; explain: unknown }[] = [];
  switch (a.type) {
    case 'prompt_builder':
      a.slots.forEach((s) => slots.add(s.id));
      a.cards.forEach((c) => cards.add(c.id));
      optionDefs.push(...a.cards);
      if (a.slots.length < 2) errs.push(`${p}: prompt_builder needs slots`);
      break;
    case 'evidence_board':
      a.cards.forEach((c) => cards.add(c.id));
      optionDefs.push(...a.cards);
      if (a.mode !== 'select' && a.mode !== 'order') errs.push(`${p}: bad mode`);
      break;
    case 'change_review':
      if (a.views.length < 1) errs.push(`${p}: change_review needs views`);
      for (const qu of a.questions) {
        items.add(qu.id);
        qu.options.forEach((o) => options.add(`${qu.id}=${o.id}`));
        optionDefs.push(...qu.options);
      }
      break;
    case 'triage_decision':
      optionDefs.push(...a.decisions);
      for (const c of a.cases) {
        items.add(c.id);
        a.decisions.forEach((d) => options.add(`${c.id}=${d.id}`));
        if (!hasJa(c.title) || c.evidence.length === 0) errs.push(`${p}/${c.id}: case needs title and evidence`);
        if (c.reasons) {
          items.add(`${c.id}:reason`);
          c.reasons.forEach((r) => options.add(`${c.id}:reason=${r.id}`));
          optionDefs.push(...c.reasons);
        }
      }
      break;
  }

  // Every option explains itself (§6.3).
  for (const o of optionDefs) {
    if (!hasJa(o.label)) errs.push(`${p}/${o.id}: option label needs ja`);
    if (!hasJa(o.explain)) errs.push(`${p}/${o.id}: option needs explain`);
  }
  if (a.type === 'prompt_builder' || a.type === 'evidence_board') {
    const ids = a.cards.map((c) => c.id);
    if (new Set(ids).size !== ids.length) errs.push(`${p}: duplicate card ids`);
  }

  // Grading rule references only known IDs.
  const r = a.grading;
  if (!r || !Array.isArray(r.accepted) || r.accepted.length === 0) {
    errs.push(`${p}: needs at least one accepted combination`);
    return;
  }
  const check = (ids: ReturnType<typeof comboIds>, where: string) => {
    ids.cards.forEach((c) => cards.has(c) || errs.push(`${p}: ${where} unknown card ${c}`));
    ids.slots.forEach((s) => slots.has(s) || errs.push(`${p}: ${where} unknown slot ${s}`));
    ids.items.forEach((i) => items.has(i) || errs.push(`${p}: ${where} unknown item ${i}`));
    ids.options.forEach((o) => options.has(o) || errs.push(`${p}: ${where} unknown option ${o}`));
  };
  r.accepted.forEach((c, i) => check(comboIds(c), `accepted[${i}]`));
  r.diagnostics.forEach((d, i) => check(conditionIds(d.when), `diagnostics[${i}]`));
  if (a.type === 'triage_decision') {
    // Every case (and reason) must be constrained by each accepted combination.
    for (const c of r.accepted) {
      if (c.kind !== 'picks') errs.push(`${p}: triage must use picks`);
      else for (const item of items) if (!(item in c.picks)) errs.push(`${p}: accepted picks missing ${item}`);
    }
  }
  if (a.type === 'change_review') {
    for (const c of r.accepted) {
      if (c.kind !== 'picks') errs.push(`${p}: change_review must use picks`);
      else for (const item of items) if (!(item in c.picks)) errs.push(`${p}: accepted picks missing ${item}`);
    }
  }

  // Feedback exists for every outcome the rule can produce, and each has what / why / next.
  for (const outcome of outcomesOf(r)) {
    const fb = a.feedbackByOutcome[outcome];
    if (!fb) errs.push(`${p}: missing feedback for outcome ${outcome}`);
    else if (!hasJa(fb.what) || !hasJa(fb.why) || !hasJa(fb.next)) errs.push(`${p}: feedback ${outcome} needs what/why/next`);
  }
  if (!a.feedbackByOutcome[CORRECT]) errs.push(`${p}: missing correct feedback`);
  for (const k of Object.keys(a.feedbackByOutcome)) {
    if (!outcomesOf(r).includes(k)) errs.push(`${p}: feedback ${k} is unreachable`);
  }
}

export function validateContent(raw: RawContent): string[] {
  const errs: string[] = [];
  const quests = raw.quests as QuestDefinition[];

  if (quests.length !== 6) errs.push(`expected 6 quests, got ${quests.length}`);
  const seenActivity = new Set<string>();
  const seenCard = new Set<string>();

  const glossary = (Array.isArray(raw.glossary) ? raw.glossary : []) as GlossaryEntry[];
  const sources = (Array.isArray(raw.sources) ? raw.sources : []) as SourceRecord[];
  const routes = (Array.isArray(raw.routes) ? raw.routes : []) as PracticeRoute[];
  const practice = (Array.isArray(raw.practice) ? raw.practice : []) as PracticeCard[];
  const assets = (Array.isArray(raw.assets) ? raw.assets : []) as { id: string; path: string; status: string; alt?: unknown }[];

  const glossaryIds = new Set(glossary.map((g) => g.id));
  const sourceIds = new Set(sources.map((s) => s.id));
  const assetIds = new Set(assets.map((s) => s.id));

  quests.forEach((q, i) => {
    const expectedId = QUEST_IDS[i];
    if (q.id !== expectedId) errs.push(`quest[${i}] id ${q.id} expected ${String(expectedId)}`);
    const expectedPrereq = i === 0 ? null : QUEST_IDS[i - 1];
    if (q.prerequisite !== expectedPrereq) errs.push(`${q.id}: prerequisite should be ${String(expectedPrereq)}`);
    if (typeof q.revision !== 'string' || q.revision.length === 0) errs.push(`${q.id}: revision required`);
    for (const f of ['title', 'place', 'incident', 'notesState', 'sample'] as const) if (!hasJa(q[f])) errs.push(`${q.id}: ${f} needs ja`);
    if (q.objectives.length !== 3) errs.push(`${q.id}: needs 3 objectives`);
    if (q.activities.length !== 3) errs.push(`${q.id}: needs 3 activities`);
    if (q.takeawayCards.length !== 3) errs.push(`${q.id}: needs 3 takeaway cards`);
    if (!hasJa(q.takeawayTemplate?.title) || !hasJa(q.takeawayTemplate?.text)) errs.push(`${q.id}: takeawayTemplate needs ja`);
    if (q.briefScene.lines.length === 0 || q.clearScene.lines.length === 0) errs.push(`${q.id}: scenes need lines`);
    for (const scene of [q.briefScene, q.clearScene]) {
      if (scene.backgroundAssetId && !assetIds.has(scene.backgroundAssetId)) errs.push(`${q.id}: unknown asset ${scene.backgroundAssetId}`);
      for (const l of scene.lines) {
        if (!['nagi', 'koto', 'ritsu', 'narrator', 'resident'].includes(l.speaker)) errs.push(`${q.id}: unknown speaker ${l.speaker}`);
        if (l.speaker === 'resident' && !hasJa(l.name)) errs.push(`${q.id}: resident line needs a name`);
        if (!hasJa(l.text)) errs.push(`${q.id}: line needs ja`);
      }
    }
    // Objectives each covered by exactly one activity.
    const objIds = q.objectives.map((o) => o.id);
    for (const o of objIds) if (!q.activities.some((a) => a.objectiveId === o)) errs.push(`${q.id}: objective ${o} has no activity`);
    for (const a of q.activities) {
      if (seenActivity.has(a.id)) errs.push(`duplicate activity id ${a.id}`);
      seenActivity.add(a.id);
      validateActivity(a, q, errs);
    }
    for (const c of q.takeawayCards) {
      if (seenCard.has(c.id)) errs.push(`duplicate card id ${c.id}`);
      seenCard.add(c.id);
      if (c.questId !== q.id || !hasJa(c.title) || !hasJa(c.body)) errs.push(`${q.id}/${c.id}: bad takeaway card`);
    }
    for (const s of q.sourceIds) if (!sourceIds.has(s)) errs.push(`${q.id}: unknown source ${s}`);
    for (const g of q.glossaryIds) if (!glossaryIds.has(g)) errs.push(`${q.id}: unknown glossary ${g}`);
    if (!practice.some((pc) => pc.id === q.practiceCardId && pc.questId === q.id)) errs.push(`${q.id}: practice card ${q.practiceCardId} missing`);
    walkStrings(q, q.id, errs);
  });

  // Q05-C and Q06-C must include a case where continuing is correct (§6.3, AC04).
  for (const id of ['q05-c', 'q06-c']) {
    const a = quests.flatMap((q) => q.activities).find((x) => x.id === id);
    if (!a || a.type !== 'triage_decision') errs.push(`${id}: must be triage_decision`);
    else {
      const proceeds = a.grading.accepted.some((c) => c.kind === 'picks' && Object.entries(c.picks).some(([k, v]) => !k.includes(':') && v.includes('proceed')));
      if (!proceeds) errs.push(`${id}: needs a case where proceed is accepted`);
    }
  }

  if (glossary.length !== 24) errs.push(`glossary: expected 24 terms, got ${glossary.length}`);
  for (const g of glossary) if (!hasJa(g.term) || !hasJa(g.short)) errs.push(`glossary ${g.id}: needs ja`);
  if (new Set(glossary.map((g) => g.id)).size !== glossary.length) errs.push('glossary: duplicate ids');

  for (const s of sources) {
    if (!/^https:\/\//.test(s.resolvedUrl)) errs.push(`source ${s.id}: resolvedUrl must be https`);
    if (!['unchecked', 'reachable', 'changed', 'unreachable'].includes(s.status)) errs.push(`source ${s.id}: bad status`);
    if (s.status !== 'unchecked' && !s.checkedAt) errs.push(`source ${s.id}: checked status needs checkedAt`);
  }
  if (!['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].every((id) => sourceIds.has(id))) errs.push('sources: S1–S6 required');

  if (routes.length !== 1 || routes[0]?.id !== 'desktop_windows_codex') errs.push('routes: expected desktop_windows_codex');
  for (const r of routes) {
    if (r.status === 'device_verified' || r.status === 'released') {
      if (!r.testedAt || !r.testedProductVersion) errs.push(`route ${r.id}: verified status needs testedAt and version`);
    }
    for (const s of r.sourceIds) if (!sourceIds.has(s)) errs.push(`route ${r.id}: unknown source ${s}`);
  }

  if (practice.length !== 6) errs.push(`practice: expected 6 cards, got ${practice.length}`);
  for (const pc of practice) {
    if (!PRACTICE_VERIFICATION.includes(pc.status)) errs.push(`practice ${pc.id}: bad status`);
    if ((pc.status === 'device_verified' || pc.status === 'released') && (!pc.verification.verifiedAt || !pc.verification.testedProductVersion)) {
      errs.push(`practice ${pc.id}: device_verified requires verifiedAt and testedProductVersion`);
    }
    for (const f of ['objective', 'whereToAct', 'instruction', 'expectedResult', 'successExample'] as const) if (!hasJa(pc[f])) errs.push(`practice ${pc.id}: ${f} needs ja`);
    if (pc.requiredState.length === 0 || pc.failureRecovery.length === 0) errs.push(`practice ${pc.id}: requiredState/failureRecovery required`);
    if (!routes.some((r) => r.id === pc.routeId)) errs.push(`practice ${pc.id}: unknown route`);
    for (const s of pc.sourceIds) if (!sourceIds.has(s)) errs.push(`practice ${pc.id}: unknown source ${s}`);
  }

  for (const id of REQUIRED_ASSET_IDS) if (!assetIds.has(id)) errs.push(`assets: missing ${id}`);
  if (assets.length !== REQUIRED_ASSET_IDS.length) errs.push(`assets: expected ${REQUIRED_ASSET_IDS.length}, got ${assets.length}`);
  for (const a of assets) {
    if (!/^assets\/[a-z]+\/[A-Z0-9]+\.svg$/.test(a.path)) errs.push(`asset ${a.id}: unexpected path ${a.path}`);
    if (!isObj(a.alt) || !hasJa(a.alt)) errs.push(`asset ${a.id}: alt needs ja`);
  }

  return errs;
}

export function totalRequiredActivities(quests: QuestDefinition[]): number {
  return quests.reduce((n, q) => n + q.activities.filter((a) => a.required).length, 0);
}
