// Test helpers: build learner answers from accepted combinations and mutate them.
import type { AcceptedCombination, ActivityDefinition, Answer } from '../../src/core/types';

export function answerFrom(a: ActivityDefinition, combo: AcceptedCombination = a.grading.accepted[0]!): Answer {
  switch (combo.kind) {
    case 'placements': {
      const placements: Record<string, string[]> = {};
      if (a.type === 'prompt_builder') for (const s of a.slots) placements[s.id] = [];
      for (const [slot, rule] of Object.entries(combo.slots)) placements[slot] = [...(rule.required ?? []), ...(rule.requireAny?.slice(0, 1) ?? [])];
      return { placements };
    }
    case 'sequence':
      return { sequence: combo.ordered ? [...combo.sequence] : [...combo.required] };
    case 'picks': {
      const picks: Record<string, string> = {};
      for (const [k, v] of Object.entries(combo.picks)) picks[k] = v[0]!;
      return { picks };
    }
  }
}

function clone(x: Answer): Answer {
  return JSON.parse(JSON.stringify(x)) as Answer;
}

/** Single-step mutations of an answer, using only IDs that exist in the activity. */
export function mutations(a: ActivityDefinition, base: Answer): Answer[] {
  const out: Answer[] = [];
  switch (a.type) {
    case 'prompt_builder': {
      const slots = a.slots.map((s) => s.id);
      const cards = a.cards.map((c) => c.id);
      for (const card of cards) {
        // remove the card everywhere
        const removed = clone(base);
        for (const s of slots) removed.placements![s] = (removed.placements![s] ?? []).filter((c) => c !== card);
        out.push(removed);
        // place it into each slot (moving it if already placed)
        for (const s of slots) {
          const moved = clone(removed);
          moved.placements![s] = [...(moved.placements![s] ?? []), card];
          out.push(moved);
        }
      }
      return out;
    }
    case 'evidence_board': {
      const seq = base.sequence ?? [];
      for (const card of a.cards.map((c) => c.id)) {
        if (seq.includes(card)) out.push({ sequence: seq.filter((c) => c !== card) });
        else for (let i = 0; i <= seq.length; i++) out.push({ sequence: [...seq.slice(0, i), card, ...seq.slice(i)] });
      }
      for (let i = 0; i + 1 < seq.length; i++) {
        for (let j = i + 1; j < seq.length; j++) {
          const s = [...seq];
          [s[i], s[j]] = [s[j]!, s[i]!];
          out.push({ sequence: s });
        }
      }
      return out;
    }
    case 'change_review':
      for (const q of a.questions) for (const o of q.options) out.push({ picks: { ...base.picks, [q.id]: o.id } });
      return out;
    case 'triage_decision':
      for (const c of a.cases) {
        for (const d of a.decisions) out.push({ picks: { ...base.picks, [c.id]: d.id } });
        for (const r of c.reasons ?? []) out.push({ picks: { ...base.picks, [`${c.id}:reason`]: r.id } });
      }
      return out;
  }
}

/** Answers reachable in up to `depth` mutation steps from every accepted combination. */
export function neighbourhood(a: ActivityDefinition, depth = 2): Answer[] {
  let frontier = a.grading.accepted.map((c) => answerFrom(a, c));
  const all = [...frontier];
  for (let d = 0; d < depth; d++) {
    frontier = frontier.flatMap((x) => mutations(a, x));
    all.push(...frontier);
  }
  return all;
}
