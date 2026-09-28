// Turn answer IDs back into readable labels: per-option explanations after a judgement, and the
// accepted answers shown in reading mode. Pure lookups; no grading happens here.

import { lt, t } from './i18n';
import type { AcceptedCombination, ActivityDefinition, Answer, OptionDef } from '../core/types';

export interface Explained {
  context: string;
  label: string;
  explain: string;
}

function cardOf(a: ActivityDefinition, id: string): OptionDef | undefined {
  return a.type === 'prompt_builder' || a.type === 'evidence_board' ? a.cards.find((c) => c.id === id) : undefined;
}

function itemLabel(a: ActivityDefinition, item: string): string {
  if (a.type === 'change_review') return lt(a.questions.find((q) => q.id === item)?.label);
  if (a.type === 'triage_decision') {
    const [caseId, reason] = item.split(':');
    const idx = a.cases.findIndex((c) => c.id === caseId);
    const c = a.cases[idx];
    const base = c ? `${t('tr.case', { n: idx + 1 })} ${lt(c.title)}` : item;
    return reason ? `${base} — ${t('tr.reason')}` : base;
  }
  return item;
}

function pickOption(a: ActivityDefinition, item: string, optionId: string): OptionDef | undefined {
  if (a.type === 'change_review') return a.questions.find((q) => q.id === item)?.options.find((o) => o.id === optionId);
  if (a.type === 'triage_decision') {
    const [caseId, reason] = item.split(':');
    if (reason) return a.cases.find((c) => c.id === caseId)?.reasons?.find((o) => o.id === optionId);
    return a.decisions.find((o) => o.id === optionId);
  }
  return undefined;
}

/** The explanation for every option the learner chose (§6.3: every option carries feedback). */
export function chosenExplanations(a: ActivityDefinition, answer: Answer): Explained[] {
  const out: Explained[] = [];
  if (a.type === 'prompt_builder') {
    for (const s of a.slots) {
      for (const cid of answer.placements?.[s.id] ?? []) {
        const c = cardOf(a, cid);
        if (c) out.push({ context: lt(s.label), label: lt(c.label), explain: lt(c.explain) });
      }
    }
  } else if (a.type === 'evidence_board') {
    (answer.sequence ?? []).forEach((cid, i) => {
      const c = cardOf(a, cid);
      if (c) out.push({ context: a.mode === 'order' ? t('answer.step', { n: i + 1 }) : t('answer.selected'), label: lt(c.label), explain: lt(c.explain) });
    });
  } else {
    for (const [item, optionId] of Object.entries(answer.picks ?? {})) {
      const o = pickOption(a, item, optionId);
      if (o) out.push({ context: itemLabel(a, item), label: lt(o.label), explain: lt(o.explain) });
    }
  }
  return out;
}

/** Explanations for options that were not chosen (shown in reading mode and review). */
export function allOptionExplanations(a: ActivityDefinition): Explained[] {
  switch (a.type) {
    case 'prompt_builder':
    case 'evidence_board':
      return a.cards.map((c) => ({ context: '', label: lt(c.label), explain: lt(c.explain) }));
    case 'change_review':
      return a.questions.flatMap((q) => q.options.map((o) => ({ context: lt(q.label), label: lt(o.label), explain: lt(o.explain) })));
    case 'triage_decision':
      return [
        ...a.decisions.map((d) => ({ context: t('tr.decision'), label: lt(d.label), explain: lt(d.explain) })),
        ...a.cases.flatMap((c) => (c.reasons ?? []).map((r) => ({ context: itemLabel(a, `${c.id}:reason`), label: lt(r.label), explain: lt(r.explain) }))),
      ];
  }
}

/** One accepted combination as readable lines. */
export function describeAccepted(a: ActivityDefinition, combo: AcceptedCombination): string[] {
  const card = (id: string) => lt(cardOf(a, id)?.label) || id;
  switch (combo.kind) {
    case 'placements': {
      if (a.type !== 'prompt_builder') return [];
      return a.slots.map((s) => {
        const r = combo.slots[s.id] ?? {};
        const parts: string[] = [];
        if (r.required?.length) parts.push(r.required.map(card).join(t('answer.and')));
        if (r.requireAny?.length) parts.push(t('answer.anyOf', { list: r.requireAny.map(card).join(t('answer.or')) }));
        if (r.allowed?.length) parts.push(t('answer.allowed', { list: r.allowed.map(card).join(t('answer.and')) }));
        return `${lt(s.label)}：${parts.length ? parts.join(' ') : t('answer.emptySlot')}`;
      });
    }
    case 'sequence':
      if (combo.ordered) return combo.sequence.map((id, i) => `${i + 1}. ${card(id)}`);
      return [
        ...combo.required.map((id) => `・${card(id)}`),
        ...(combo.allowed?.length ? [t('answer.allowed', { list: combo.allowed.map(card).join(t('answer.and')) })] : []),
      ];
    case 'picks':
      return Object.entries(combo.picks).map(([item, opts]) => {
        const labels = opts.map((o) => lt(pickOption(a, item, o)?.label) || o);
        return `${itemLabel(a, item)}：${labels.join(t('answer.or'))}`;
      });
  }
}
