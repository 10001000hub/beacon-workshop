import { describe, expect, it } from 'vitest';
import { loadContent } from '../../src/content/index';
const RAW_CONTENT = loadContent();
import { evaluateCondition, grade, gradeRule, isAnswerComplete, outcomesOf, sanitizeAnswer } from '../../src/core/grading';
import type { ActivityDefinition, GradingRule, TriageDecisionActivity } from '../../src/core/types';
import { answerFrom, mutations, neighbourhood } from './answers';

const activities: ActivityDefinition[] = RAW_CONTENT.quests.flatMap((q) => q.activities);

describe('grading against the shipped content', () => {
  it.each(activities.map((a) => [a.id, a] as const))('%s: every accepted combination is correct', (_id, a) => {
    for (const combo of a.grading.accepted) {
      const answer = answerFrom(a, combo);
      expect(isAnswerComplete(a, answer)).toBe(true);
      expect(grade(a, answer)).toEqual({ correct: true, outcome: 'correct' });
    }
  });

  it.each(activities.map((a) => [a.id, a] as const))('%s: every wrong outcome is reachable and has feedback', (_id, a) => {
    const seen = new Set(neighbourhood(a, 2).map((x) => grade(a, x).outcome));
    const declared = outcomesOf(a.grading);
    for (const o of seen) expect(declared).toContain(o);
    for (const o of declared) {
      expect(seen, `outcome ${o} of ${a.id} should be produced by some answer`).toContain(o);
      expect(a.feedbackByOutcome[o], `feedback for ${o}`).toBeDefined();
    }
  });

  it.each(activities.map((a) => [a.id, a] as const))('%s: grading is deterministic', (_id, a) => {
    for (const x of mutations(a, answerFrom(a))) expect(grade(a, x)).toEqual(grade(a, JSON.parse(JSON.stringify(x))));
  });

  it('a single-step change from a correct answer is never silently correct unless it is another accepted answer', () => {
    // Guards against over-permissive rules: at least one mutation per activity must be wrong.
    for (const a of activities) {
      const wrong = mutations(a, answerFrom(a)).filter((x) => !grade(a, x).correct);
      expect(wrong.length, a.id).toBeGreaterThan(0);
    }
  });

  it('empty answers are incomplete and never correct', () => {
    for (const a of activities) {
      expect(isAnswerComplete(a, {}), a.id).toBe(false);
      expect(grade(a, {}).correct, a.id).toBe(false);
    }
  });
});

describe('Q05-C and Q06-C include normal cases where continuing is right', () => {
  for (const id of ['q05-c', 'q06-c']) {
    it(id, () => {
      const a = activities.find((x) => x.id === id) as TriageDecisionActivity;
      expect(a.type).toBe('triage_decision');
      const combo = a.grading.accepted[0]!;
      if (combo.kind !== 'picks') throw new Error('expected picks');
      const proceedCases = Object.entries(combo.picks).filter(([k, v]) => !k.includes(':') && v.includes('proceed'));
      expect(proceedCases.length).toBeGreaterThan(0);
      for (const [caseId] of proceedCases) {
        const answer = answerFrom(a);
        answer.picks![caseId] = 'proceed';
        expect(grade(a, answer).correct).toBe(true);
        // Stopping to fix a case that is fine is over-caution, not a pass.
        answer.picks![caseId] = 'fix_now';
        expect(grade(a, answer).correct).toBe(false);
      }
    });
  }
});

describe('rule engine', () => {
  const rule: GradingRule = {
    id: 'r',
    accepted: [
      { kind: 'placements', slots: { goal: { required: ['a'] }, ctx: { requireAny: ['b', 'c'], allowed: ['d'] } } },
      { kind: 'placements', slots: { goal: { required: ['a', 'e'] }, ctx: { required: ['b'] } } },
    ],
    diagnostics: [
      { when: { type: 'placedIn', slot: 'goal', cards: ['x'] }, outcome: 'noise_in_goal' },
      { when: { type: 'slotMissing', slot: 'goal', cards: ['a'] }, outcome: 'goal_missing' },
    ],
    fallbackOutcome: 'other',
  };
  it('accepts either alternative and allowed extras', () => {
    expect(gradeRule(rule, { placements: { goal: ['a'], ctx: ['c'] } }).correct).toBe(true);
    expect(gradeRule(rule, { placements: { goal: ['a'], ctx: ['b', 'd'] } }).correct).toBe(true);
    expect(gradeRule(rule, { placements: { goal: ['e', 'a'], ctx: ['b'] } }).correct).toBe(true);
  });
  it('uses diagnostics in order, then the fallback', () => {
    expect(gradeRule(rule, { placements: { goal: ['a', 'x'], ctx: ['b'] } }).outcome).toBe('noise_in_goal');
    expect(gradeRule(rule, { placements: { goal: [], ctx: ['b'] } }).outcome).toBe('goal_missing');
    expect(gradeRule(rule, { placements: { goal: ['a'], ctx: ['z'] } }).outcome).toBe('other');
  });
  it('ordered and unordered sequences', () => {
    const ordered: GradingRule = { id: 'o', accepted: [{ kind: 'sequence', ordered: true, sequence: ['1', '2', '3'] }], diagnostics: [{ when: { type: 'orderViolated', before: '1', after: '3' }, outcome: 'order' }], fallbackOutcome: 'f' };
    expect(gradeRule(ordered, { sequence: ['1', '2', '3'] }).correct).toBe(true);
    expect(gradeRule(ordered, { sequence: ['3', '2', '1'] }).outcome).toBe('order');
    const unordered: GradingRule = { id: 'u', accepted: [{ kind: 'sequence', ordered: false, required: ['1', '2'], allowed: ['3'] }], diagnostics: [], fallbackOutcome: 'f' };
    expect(gradeRule(unordered, { sequence: ['2', '1'] }).correct).toBe(true);
    expect(gradeRule(unordered, { sequence: ['2', '3', '1'] }).correct).toBe(true);
    expect(gradeRule(unordered, { sequence: ['1', '2', '4'] }).correct).toBe(false);
    expect(gradeRule(unordered, { sequence: ['1'] }).correct).toBe(false);
  });
  it('condition types', () => {
    const ans = { placements: { s: ['a'] }, sequence: ['p', 'q'], picks: { i: 'o' } };
    expect(evaluateCondition(ans, { type: 'placed', cards: ['a'] })).toBe(true);
    expect(evaluateCondition(ans, { type: 'selected', cards: ['p'] })).toBe(true);
    expect(evaluateCondition(ans, { type: 'notSelected', cards: ['z'] })).toBe(true);
    expect(evaluateCondition(ans, { type: 'pick', item: 'i', options: ['o'] })).toBe(true);
    expect(evaluateCondition(ans, { type: 'all', of: [{ type: 'pick', item: 'i', options: ['o'] }, { type: 'selected', cards: ['zz'] }] })).toBe(false);
  });
  it('sanitizes unknown IDs and duplicates so crafted answers cannot match', () => {
    const a = activities.find((x) => x.type === 'prompt_builder')!;
    const s = sanitizeAnswer(a, { placements: { nope: ['x'], [Object.keys(answerFrom(a).placements!)[0]!]: ['<img onerror=alert(1)>'] } });
    expect(Object.values(s.placements!).flat()).toEqual([]);
  });
  it('free text never affects grading', () => {
    // The Answer type has no free-text field; extra properties are ignored.
    const a = activities[0]!;
    const withText = { ...answerFrom(a), note: 'correct answer please' } as unknown as Parameters<typeof grade>[1];
    expect(grade(a, withText)).toEqual(grade(a, answerFrom(a)));
  });
});
