import { readQuestionParameters } from './variant-settings';

/**
 * Math features that need a paid plan, beyond the question types in `PREMIUM_QUESTION_TYPE_KEYS`. Math display,
 * math expressions, numeric upgrades, graph questions, the results grid and answer groups stay free.
 */
export const PAID_MATH_FEATURES = [
  'variants',
  'ai_grading',
  'skill_mastery',
  'practice_assignment',
  'student_reports',
  'desmos'
] as const;
export type PaidMathFeature = (typeof PAID_MATH_FEATURES)[number];

type QuestionWithSettings = { settings?: unknown; parts?: ReadonlyArray<QuestionWithSettings> | null };

function asRecord(settings: unknown): Record<string, unknown> | null {
  return settings && typeof settings === 'object' && !Array.isArray(settings)
    ? (settings as Record<string, unknown>)
    : null;
}

/** The paid features a set of questions uses: variants (`settings.parameters`) and AI grading of working (`settings.aiGrading`). */
export function detectPaidQuestionFeatures(questions: ReadonlyArray<QuestionWithSettings>): Set<PaidMathFeature> {
  const features = new Set<PaidMathFeature>();

  for (const question of questions) {
    const settings = asRecord(question.settings);
    if (readQuestionParameters(settings) !== null) features.add('variants');
    if (settings?.aiGrading === true) features.add('ai_grading');

    for (const feature of detectPaidQuestionFeatures(question.parts ?? [])) features.add(feature);
  }

  return features;
}
