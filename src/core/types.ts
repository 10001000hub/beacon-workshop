// Shared data contracts (see docs/PRODUCT_SPEC.md §13).
// Content, grading, state, storage, renderer and practice all depend on this file;
// nothing here may depend on the DOM.

export type Locale = 'ja' | 'en';
export const LOCALES: readonly Locale[] = ['ja', 'en'];

/** Japanese is required for the Working MVP; English is filled in for Release Candidate. */
export interface LocalizedText {
  ja: string;
  en?: string;
}

export type QuestId = 'q01' | 'q02' | 'q03' | 'q04' | 'q05' | 'q06';
export const QUEST_IDS: readonly QuestId[] = ['q01', 'q02', 'q03', 'q04', 'q05', 'q06'];

export type ActivityType = 'prompt_builder' | 'evidence_board' | 'change_review' | 'triage_decision';
export const ACTIVITY_TYPES: readonly ActivityType[] = [
  'prompt_builder',
  'evidence_board',
  'change_review',
  'triage_decision',
];

export type PracticeStatus = 'not_started' | 'in_progress' | 'self_checked' | 'unavailable';
export type VerificationStatus = 'draft' | 'source_checked' | 'device_verified' | 'released' | 'needs_review';
export type BlockReason = 'quota' | 'environment' | 'permission' | 'other';

// ---------------------------------------------------------------- story

export type Speaker = 'nagi' | 'koto' | 'ritsu' | 'narrator' | 'resident';
export type Expression = 'normal' | 'think' | 'happy';

export interface DialogueLine {
  speaker: Speaker;
  /** Only for `resident`: the named role, e.g. 市場の配達係. */
  name?: LocalizedText;
  expression?: Expression;
  text: LocalizedText;
}

export interface Scene {
  id: string;
  backgroundAssetId?: string;
  lines: DialogueLine[];
}

// ---------------------------------------------------------------- activities

export interface OptionDef {
  id: string;
  label: LocalizedText;
  /** Why this option fits or does not fit. Every option carries one (§6.3). */
  explain: LocalizedText;
}

export interface SlotDef {
  id: string;
  label: LocalizedText;
  question: LocalizedText;
}

export type DiffOp = 'add' | 'del' | 'chg' | 'ctx';

export type Panel =
  | { kind: 'text'; title?: LocalizedText; lines: LocalizedText[] }
  | { kind: 'files'; title?: LocalizedText; entries: { path: string; status: 'added' | 'removed' | 'changed' | 'unchanged' }[] }
  | { kind: 'diff'; file: string; lines: { op: DiffOp; text: string }[] }
  | { kind: 'preview'; title?: LocalizedText; items: LocalizedText[]; empty?: LocalizedText };

export interface ReviewView {
  id: string;
  label: LocalizedText;
  panels: Panel[];
}

export interface QuestionDef {
  id: string;
  label: LocalizedText;
  options: OptionDef[];
}

export interface TriageCase {
  id: string;
  title: LocalizedText;
  evidence: LocalizedText[];
  /** Optional reason choices; when present, a reason must be picked too. Stored under `${id}:reason`. */
  reasons?: OptionDef[];
}

export interface FeedbackDef {
  /** 何が起きるか */
  what: LocalizedText;
  /** なぜこの判断か */
  why: LocalizedText;
  /** 次に直す箇所 */
  next: LocalizedText;
  /** Optional side-by-side outcomes, e.g. two different results from the same vague request. */
  examples?: { label: LocalizedText; text: LocalizedText }[];
}

export interface HintDef {
  id: string;
  text: LocalizedText;
}

interface ActivityBase {
  id: string;
  questId: QuestId;
  objectiveId: string;
  title: LocalizedText;
  prompt: LocalizedText;
  /** Optional reference material shown beside the board (a resident's words, the current version...). */
  reference?: Panel[];
  grading: GradingRule;
  feedbackByOutcome: Record<string, FeedbackDef>;
  hints: [HintDef, HintDef, HintDef];
  /** Dialogue shown after a correct answer. */
  successLines?: DialogueLine[];
  required: true;
}

export interface PromptBuilderActivity extends ActivityBase {
  type: 'prompt_builder';
  slots: SlotDef[];
  cards: OptionDef[];
}

export interface EvidenceBoardActivity extends ActivityBase {
  type: 'evidence_board';
  mode: 'select' | 'order';
  cards: OptionDef[];
}

export interface ChangeReviewActivity extends ActivityBase {
  type: 'change_review';
  views: ReviewView[];
  questions: QuestionDef[];
}

export interface TriageDecisionActivity extends ActivityBase {
  type: 'triage_decision';
  decisions: OptionDef[];
  cases: TriageCase[];
}

export type ActivityDefinition =
  | PromptBuilderActivity
  | EvidenceBoardActivity
  | ChangeReviewActivity
  | TriageDecisionActivity;

// ---------------------------------------------------------------- grading

/** Learner answer. Only IDs; no free text is ever graded. */
export interface Answer {
  /** prompt_builder: slotId -> card ids */
  placements?: Record<string, string[]>;
  /** evidence_board: selected card ids, in order */
  sequence?: string[];
  /** change_review / triage_decision: itemId -> option id */
  picks?: Record<string, string>;
}

export interface SlotRule {
  required?: string[];
  /** At least one of these must be in the slot. */
  requireAny?: string[];
  /** May also be in the slot without making it wrong. */
  allowed?: string[];
}

export type AcceptedCombination =
  | { kind: 'placements'; slots: Record<string, SlotRule> }
  | { kind: 'sequence'; ordered: true; sequence: string[] }
  | { kind: 'sequence'; ordered: false; required: string[]; allowed?: string[] }
  | { kind: 'picks'; picks: Record<string, string[]> };

export type Condition =
  | { type: 'placed'; cards: string[] }
  | { type: 'placedIn'; slot: string; cards: string[] }
  | { type: 'slotMissing'; slot: string; cards: string[] }
  | { type: 'selected'; cards: string[] }
  | { type: 'notSelected'; cards: string[] }
  | { type: 'orderViolated'; before: string; after: string }
  | { type: 'pick'; item: string; options: string[] }
  | { type: 'all'; of: Condition[] };

export interface Diagnostic {
  when: Condition;
  outcome: string;
}

export interface GradingRule {
  id: string;
  /** Any one match is correct. Multiple entries encode equally valid answers. */
  accepted: AcceptedCombination[];
  /** Checked in order when no accepted combination matches. */
  diagnostics: Diagnostic[];
  fallbackOutcome: string;
}

export const CORRECT = 'correct';

export interface GradeResult {
  correct: boolean;
  outcome: string;
}

// ---------------------------------------------------------------- quests

export interface Objective {
  id: string;
  text: LocalizedText;
}

export interface TakeawayCard {
  id: string;
  questId: QuestId;
  title: LocalizedText;
  body: LocalizedText;
}

export interface QuestDefinition {
  id: QuestId;
  revision: string;
  prerequisite: QuestId | null;
  title: LocalizedText;
  place: LocalizedText;
  incident: LocalizedText;
  notesState: LocalizedText;
  sample: LocalizedText;
  objectives: Objective[];
  briefScene: Scene;
  clearScene: Scene;
  activities: ActivityDefinition[];
  takeawayCards: TakeawayCard[];
  takeawayTemplate: { title: LocalizedText; text: LocalizedText };
  practiceCardId: string;
  sourceIds: string[];
  mapRegionId: string;
  badgeId: string;
  glossaryIds: string[];
}

// ---------------------------------------------------------------- practice / sources / glossary

export interface PracticeRoute {
  id: 'desktop_windows_codex';
  displayName: LocalizedText;
  supportedOs: 'windows';
  testedProductVersion: string | null;
  testedAt: string | null;
  status: VerificationStatus;
  sourceIds: string[];
  screenshotIds: string[];
  note: LocalizedText;
}

export interface PracticeCard {
  id: string;
  questId: QuestId;
  routeId: PracticeRoute['id'];
  objective: LocalizedText;
  requiredState: LocalizedText[];
  whereToAct: LocalizedText;
  instruction: LocalizedText;
  expectedResult: LocalizedText;
  successExample: LocalizedText;
  failureRecovery: { situation: LocalizedText; action: LocalizedText; instruction?: LocalizedText }[];
  status: VerificationStatus;
  verification: {
    verifiedAt: string | null;
    testedProductVersion: string | null;
    contentVersion: string;
    note: LocalizedText;
  };
  sourceIds: string[];
}

export interface SourceRecord {
  id: string;
  title: string;
  originalUrl: string | null;
  resolvedUrl: string;
  supportsClaimIds: string[];
  checkedAt: string | null;
  status: 'unchecked' | 'reachable' | 'changed' | 'unreachable';
  note: LocalizedText;
}

export interface GlossaryEntry {
  id: string;
  term: LocalizedText;
  short: LocalizedText;
  questIds: QuestId[];
}

// ---------------------------------------------------------------- save (§13.2)

export interface CompletionRecord {
  questRevision: string;
  completedAt: string;
  attempts: number;
  maxHintLevel: 0 | 1 | 2 | 3;
}

export interface PracticeRecord {
  status: PracticeStatus;
  routeId: string | null;
  checkedAt: string | null;
  lastConfirmedStepId: string | null;
  blockReason: BlockReason | null;
}

export interface ActivityProgress {
  attempts: number;
  maxHintLevel: 0 | 1 | 2 | 3;
}

export interface Settings {
  textScale: number;
  reduceMotion: boolean;
  soundEnabled: boolean;
}

export interface SaveDataV1 {
  schemaVersion: 1;
  contentVersion: string;
  revision: number;
  updatedAt: string;
  locale: Locale;
  settings: Settings;
  currentQuestId: QuestId | null;
  currentActivityId: string | null;
  completedActivities: Record<string, CompletionRecord>;
  practice: Record<QuestId, PracticeRecord>;
  notes: Record<string, string>;
  // --- Implementation additions (documented in docs/HANDOFF.md) ---
  /** Reading progress, kept separate from simulation completion. sectionId -> ISO time. */
  readSections: Record<string, string>;
  /** Attempts / hints for activities not yet completed (merged into the completion record). */
  activityProgress: Record<string, ActivityProgress>;
  introSeenAt: string | null;
}

export type SaveData = SaveDataV1;
