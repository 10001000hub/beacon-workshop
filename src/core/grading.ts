// Deterministic grading: activity rule + answer IDs -> outcome ID.
// No network, no LLM, no storage, no locale. Same input always gives the same result.

import {
  CORRECT,
  type AcceptedCombination,
  type ActivityDefinition,
  type Answer,
  type Condition,
  type GradeResult,
  type GradingRule,
  type SlotRule,
} from './types';

function placedCards(answer: Answer): string[] {
  return Object.values(answer.placements ?? {}).flat();
}

function slotCards(answer: Answer, slot: string): string[] {
  return answer.placements?.[slot] ?? [];
}

function sequenceOf(answer: Answer): string[] {
  return answer.sequence ?? [];
}

function slotMatches(cards: string[], rule: SlotRule): boolean {
  const required = rule.required ?? [];
  const any = rule.requireAny ?? [];
  const permitted = new Set([...required, ...any, ...(rule.allowed ?? [])]);
  if (!required.every((c) => cards.includes(c))) return false;
  if (any.length > 0 && !any.some((c) => cards.includes(c))) return false;
  return cards.every((c) => permitted.has(c));
}

function matchesAccepted(answer: Answer, combo: AcceptedCombination): boolean {
  switch (combo.kind) {
    case 'placements': {
      const slotIds = new Set([...Object.keys(combo.slots), ...Object.keys(answer.placements ?? {})]);
      for (const slot of slotIds) {
        const rule = combo.slots[slot] ?? {};
        if (!slotMatches(slotCards(answer, slot), rule)) return false;
      }
      return true;
    }
    case 'sequence': {
      const seq = sequenceOf(answer);
      if (new Set(seq).size !== seq.length) return false;
      if (combo.ordered) {
        return seq.length === combo.sequence.length && seq.every((id, i) => combo.sequence[i] === id);
      }
      const permitted = new Set([...combo.required, ...(combo.allowed ?? [])]);
      return combo.required.every((c) => seq.includes(c)) && seq.every((c) => permitted.has(c));
    }
    case 'picks': {
      const picks = answer.picks ?? {};
      return Object.entries(combo.picks).every(([item, options]) => {
        const picked = picks[item];
        return picked !== undefined && options.includes(picked);
      });
    }
  }
}

export function evaluateCondition(answer: Answer, cond: Condition): boolean {
  switch (cond.type) {
    case 'placed': {
      const placed = placedCards(answer);
      return cond.cards.some((c) => placed.includes(c));
    }
    case 'placedIn': {
      const cards = slotCards(answer, cond.slot);
      return cond.cards.some((c) => cards.includes(c));
    }
    case 'slotMissing': {
      const cards = slotCards(answer, cond.slot);
      return !cond.cards.some((c) => cards.includes(c));
    }
    case 'selected': {
      const seq = sequenceOf(answer);
      return cond.cards.some((c) => seq.includes(c));
    }
    case 'notSelected': {
      const seq = sequenceOf(answer);
      return cond.cards.some((c) => !seq.includes(c));
    }
    case 'orderViolated': {
      const seq = sequenceOf(answer);
      const a = seq.indexOf(cond.before);
      const b = seq.indexOf(cond.after);
      return a >= 0 && b >= 0 && a > b;
    }
    case 'pick': {
      const picked = answer.picks?.[cond.item];
      return picked !== undefined && cond.options.includes(picked);
    }
    case 'all':
      return cond.of.every((c) => evaluateCondition(answer, c));
  }
}

export function gradeRule(rule: GradingRule, answer: Answer): GradeResult {
  if (rule.accepted.some((combo) => matchesAccepted(answer, combo))) {
    return { correct: true, outcome: CORRECT };
  }
  for (const diag of rule.diagnostics) {
    if (evaluateCondition(answer, diag.when)) return { correct: false, outcome: diag.outcome };
  }
  return { correct: false, outcome: rule.fallbackOutcome };
}

export function grade(activity: ActivityDefinition, answer: Answer): GradeResult {
  return gradeRule(activity.grading, sanitizeAnswer(activity, answer));
}

/** Drop IDs that do not belong to the activity so a crafted answer cannot match by accident. */
export function sanitizeAnswer(activity: ActivityDefinition, answer: Answer): Answer {
  switch (activity.type) {
    case 'prompt_builder': {
      const cardIds = new Set(activity.cards.map((c) => c.id));
      const placements: Record<string, string[]> = {};
      const seen = new Set<string>();
      for (const slot of activity.slots) {
        placements[slot.id] = (answer.placements?.[slot.id] ?? []).filter((c) => {
          if (!cardIds.has(c) || seen.has(c)) return false;
          seen.add(c);
          return true;
        });
      }
      return { placements };
    }
    case 'evidence_board': {
      const cardIds = new Set(activity.cards.map((c) => c.id));
      return { sequence: [...new Set(answer.sequence ?? [])].filter((c) => cardIds.has(c)) };
    }
    case 'change_review': {
      const picks: Record<string, string> = {};
      for (const q of activity.questions) {
        const p = answer.picks?.[q.id];
        if (p !== undefined && q.options.some((o) => o.id === p)) picks[q.id] = p;
      }
      return { picks };
    }
    case 'triage_decision': {
      const picks: Record<string, string> = {};
      for (const c of activity.cases) {
        const d = answer.picks?.[c.id];
        if (d !== undefined && activity.decisions.some((o) => o.id === d)) picks[c.id] = d;
        const rKey = `${c.id}:reason`;
        const r = answer.picks?.[rKey];
        if (r !== undefined && c.reasons?.some((o) => o.id === r)) picks[rKey] = r;
      }
      return { picks };
    }
  }
}

/** Whether every required choice has been made, so the learner can submit. */
export function isAnswerComplete(activity: ActivityDefinition, answer: Answer): boolean {
  const a = sanitizeAnswer(activity, answer);
  switch (activity.type) {
    case 'prompt_builder':
      return Object.values(a.placements ?? {}).some((cards) => cards.length > 0);
    case 'evidence_board':
      return (a.sequence ?? []).length > 0;
    case 'change_review':
      return activity.questions.every((q) => a.picks?.[q.id] !== undefined);
    case 'triage_decision':
      return activity.cases.every(
        (c) => a.picks?.[c.id] !== undefined && (!c.reasons || a.picks?.[`${c.id}:reason`] !== undefined),
      );
  }
}

/** All outcome IDs a rule can produce; used by content validation. */
export function outcomesOf(rule: GradingRule): string[] {
  return [CORRECT, ...new Set([...rule.diagnostics.map((d) => d.outcome), rule.fallbackOutcome])];
}
