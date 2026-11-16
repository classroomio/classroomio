import {
  PREMIUM_QUESTION_TYPE_KEYS,
  QUESTION_TYPE_ID_TO_KEY,
  QUESTION_TYPE_REGISTRY,
  detectPaidQuestionFeatures,
  type PaidMathFeature
} from '@cio/question-types';
import { AppError } from '@cio/utils/errors';

/** Throws 403 UPGRADE_REQUIRED if a free-plan org uses a premium question type. */
export function assertNoPremiumQuestionTypes(
  questionTypeIds: ReadonlyArray<number | undefined | null>,
  isOrgOnPaidPlan: boolean
): void {
  if (isOrgOnPaidPlan) return;

  const blockedTypenames = new Set<string>();
  for (const typeId of questionTypeIds) {
    if (typeId == null) continue;

    const key = QUESTION_TYPE_ID_TO_KEY[typeId];
    if (key && PREMIUM_QUESTION_TYPE_KEYS.has(key)) {
      const registry = QUESTION_TYPE_REGISTRY.find((t) => t.id === typeId);
      blockedTypenames.add(registry?.typename ?? key);
    }
  }

  if (blockedTypenames.size === 0) return;

  const allowed = QUESTION_TYPE_REGISTRY.filter((t) => !PREMIUM_QUESTION_TYPE_KEYS.has(t.key))
    .map((t) => t.typename)
    .join(', ');

  throw new AppError(
    `Question type(s) ${Array.from(blockedTypenames).join(', ')} require a paid plan and are not available on this org. Use one of: ${allowed}.`,
    'UPGRADE_REQUIRED',
    403
  );
}

const PAID_MATH_FEATURE_LABELS: Record<PaidMathFeature, string> = {
  variants: 'Questions with variables',
  ai_grading: 'AI suggestions for marking working',
  skill_mastery: 'Skill mastery',
  practice_assignment: 'Assigning practice',
  student_reports: 'Student reports',
  desmos: 'The Desmos graphing calculator key'
};

/** Throws 403 UPGRADE_REQUIRED if a free-plan org uses a paid math feature. */
export function assertPaidMathFeature(feature: PaidMathFeature, isOrgOnPaidPlan: boolean): void {
  if (isOrgOnPaidPlan) return;

  throw new AppError(`${PAID_MATH_FEATURE_LABELS[feature]} requires a paid plan`, 'UPGRADE_REQUIRED', 403);
}

/** Throws 403 UPGRADE_REQUIRED if a free-plan org saves questions with variables or AI grading turned on. */
export function assertNoPaidQuestionFeatures(
  questions: ReadonlyArray<{ settings?: unknown; parts?: ReadonlyArray<{ settings?: unknown }> | null }>,
  isOrgOnPaidPlan: boolean
): void {
  if (isOrgOnPaidPlan) return;

  for (const feature of detectPaidQuestionFeatures(questions)) assertPaidMathFeature(feature, false);
}
