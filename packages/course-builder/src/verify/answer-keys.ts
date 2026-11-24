import * as z from 'zod/v4';

import type { QuizQuestion } from '../package/schema';
import { questionTarget, type BlockLookup, type CheckIssue, type StructuredCaller } from './types';

export const BLIND_SOLVES = 3;

export const ZBlindAnswer = z.object({
  chosen: z.array(z.string()),
  reason: z.string()
});

export const ZOptionAudit = z.object({
  options: z.array(z.object({ label: z.string(), alsoCorrect: z.boolean(), reason: z.string() }))
});

export const BLIND_SOLVER_SYSTEM = [
  'You answer one quiz question using only the source text given, as a careful learner would.',
  'Choose the option labels the source text shows to be correct: exactly one for a single-answer or true/false question,',
  'every correct one for a multiple-answer question. Copy each chosen label exactly as written.'
].join(' ');

export const OPTION_AUDIT_SYSTEM = [
  'You audit the wrong options of a quiz question against the source text given.',
  'For each listed option, say whether the source text makes it also correct, or correct under a reasonable reading.',
  'A question is only fair when every listed option is clearly wrong according to the source.'
].join(' ');

const KEYED_TYPES = new Set<QuizQuestion['type']>(['single', 'multiple', 'true-false']);

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function supportText(question: QuizQuestion, blocks: BlockLookup): string {
  return question.supportBlockIds
    .map((id) => blocks.get(id)?.text)
    .filter(Boolean)
    .map((text) => `- ${text}`)
    .join('\n');
}

function questionPrompt(question: QuizQuestion, labels: string[], blocks: BlockLookup): string {
  const kind =
    question.type === 'multiple' ? 'multiple-answer' : question.type === 'true-false' ? 'true/false' : 'single-answer';

  return `SOURCE:\n${supportText(question, blocks)}\n\nQUESTION (${kind}): ${question.prompt}\nOPTIONS:\n${labels.map((label) => `- ${label}`).join('\n')}`;
}

function sameChoice(chosen: string[], key: string[]): boolean {
  const left = new Set(chosen.map(normalize));
  const right = new Set(key.map(normalize));

  return left.size === right.size && [...left].every((label) => right.has(label));
}

/**
 * Checks the source steps a question cites against the order the question gives. Done in code: the source numbers its
 * steps, so no model is needed.
 */
export function checkOrdering(question: QuizQuestion, blocks: BlockLookup): string | null {
  const steps = question.supportBlockIds
    .map((id) => blocks.get(id))
    .filter((block) => block?.kind === 'step' && block.stepNumber !== undefined)
    .sort((left, right) => left!.stepNumber! - right!.stepNumber!);
  const ordered = question.orderedSteps ?? [];
  const positions = ordered.map((step) => steps.findIndex((block) => normalize(block!.text).includes(normalize(step))));

  if (positions.some((position) => position === -1))
    return 'a step to order is not one of the numbered source steps it cites';
  if (positions.some((position, index) => index > 0 && position <= positions[index - 1])) {
    return 'the order given differs from the numbered source steps';
  }

  return null;
}

/**
 * Checks one question's key. Single, multiple and true/false questions are solved blind three times (in parallel) and
 * pass only when every solve picks exactly the keyed options; their wrong options are then audited for a second correct
 * answer. Ordering is checked in code. Matching, link and text questions carry no key to check.
 */
export async function checkAnswerKey(
  caller: StructuredCaller,
  question: QuizQuestion,
  target: { group: string; index: number },
  blocks: BlockLookup,
  signal?: AbortSignal
): Promise<CheckIssue[]> {
  const where = questionTarget(target.group, target.index);

  if (question.type === 'ordering') {
    const problem = checkOrdering(question, blocks);

    return problem ? [{ target: where, kind: 'wrong-order', reason: problem }] : [];
  }
  if (!KEYED_TYPES.has(question.type)) return [];

  const labels = question.options.map((option) => option.label);
  const key = question.options.filter((option) => option.correct).map((option) => option.label);
  const wrong = question.options.filter((option) => !option.correct).map((option) => option.label);
  const prompt = questionPrompt(question, labels, blocks);
  const solves = await Promise.all(
    Array.from({ length: BLIND_SOLVES }, () =>
      caller.structured({
        role: 'checker',
        system: BLIND_SOLVER_SYSTEM,
        content: [{ type: 'text', text: prompt }],
        schema: ZBlindAnswer,
        signal
      })
    )
  );
  const disagreements = solves.filter((solve) => !sameChoice(solve.chosen, key));
  if (disagreements.length) {
    const reasons = disagreements.map((solve) => `chose ${JSON.stringify(solve.chosen)}: ${solve.reason}`).join('; ');

    return [
      {
        target: where,
        kind: 'wrong-key',
        reason: `${disagreements.length} of ${BLIND_SOLVES} blind solves disagree with the key (${reasons})`
      }
    ];
  }
  if (!wrong.length) return [];

  const audit = await caller.structured({
    role: 'checker',
    system: OPTION_AUDIT_SYSTEM,
    content: [
      { type: 'text', text: `${prompt}\n\nWRONG OPTIONS TO AUDIT:\n${wrong.map((label) => `- ${label}`).join('\n')}` }
    ],
    schema: ZOptionAudit,
    signal
  });

  return audit.options
    .filter((option) => option.alsoCorrect)
    .map((option) => ({
      target: where,
      kind: 'ambiguous-option' as const,
      reason: `"${option.label}" is also correct: ${option.reason}`
    }));
}
