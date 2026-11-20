import { verifyAnswerKey, type AnswerKeyInput } from './math-key-verification';
import { readQuestionParameters } from './variant-settings';
import { instantiateQuestion, instantiateVariant, type VariantQuestion } from './variants';

export type VariantPreview = {
  seed: string;
  values: Record<string, number>;
  title: string;
  answer?: string;
  /** Problems the answer-key verifier found in this instance; empty means the key is safe. */
  issues: string[];
};

export type VariantPreviewInput = AnswerKeyInput & VariantQuestion;

/** Builds `count` sample instances of a parameterised question and runs the answer-key verifier on each. */
export function previewVariants(question: VariantPreviewInput, count = 5, seedPrefix = 'preview'): VariantPreview[] {
  const parameters = readQuestionParameters(question.settings);
  if (!parameters) return [];

  return Array.from({ length: count }, (_, index) => {
    const seed = seedPrefix + '-' + (index + 1);
    const instance = instantiateVariant(parameters, seed);
    const instantiated = instantiateQuestion(question, seed);
    const issues = verifyAnswerKey({
      ...question,
      title: instantiated.title ?? '',
      settings: instantiated.settings,
      optionLabels: instantiated.options?.map((option) => option.label ?? '')
    });
    if (!instance.satisfiesConstraints) issues.push('No numbers satisfy the constraints; loosen the ranges or constraints.');
    if (/\{\{[^}]*\}\}/.test(JSON.stringify([instantiated.title, instantiated.settings, instantiated.options]))) {
      issues.push('A {{placeholder}} could not be filled; check the variable names and formulas.');
    }

    return { seed, values: instance.values, title: instantiated.title ?? '', answer: instance.answer, issues };
  });
}

const MAX_SEED_TRIES_PER_VARIANT = 40;

/**
 * Turns one parameterised question into `count` fixed questions with different numbers: each copy has its placeholders
 * filled in and no `parameters`, so it stands alone. Fewer copies come back when the ranges hold fewer distinct draws.
 */
export function makeFixedVariants<Question extends VariantQuestion>(
  question: Question,
  count: number
): Array<{ seed: string; values: Record<string, number>; question: Question }> {
  const parameters = readQuestionParameters(question.settings);
  if (!parameters) return [];

  const seenDraws = new Set<string>();
  const variants: Array<{ seed: string; values: Record<string, number>; question: Question }> = [];

  for (let attempt = 0; attempt < count * MAX_SEED_TRIES_PER_VARIANT && variants.length < count; attempt++) {
    const seed = 'variant-' + attempt;
    const instance = instantiateVariant(parameters, seed);
    const drawKey = JSON.stringify(instance.values);
    if (!instance.satisfiesConstraints || seenDraws.has(drawKey)) continue;

    seenDraws.add(drawKey);
    const { parameters: _parameters, ...settings } = instantiateQuestion(question, seed).settings ?? {};
    variants.push({ seed, values: instance.values, question: { ...instantiateQuestion(question, seed), settings } });
  }

  return variants;
}
