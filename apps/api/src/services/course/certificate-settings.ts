import type { TCourse } from '@cio/db/types';
import { resolveCertificateDesign } from '@api/utils/certificate';

const DEFAULT_THRESHOLD = 100;
const DEFAULT_EXERCISE_MIN_SCORE_PERCENT = 100;

type TCertificateCourse = Pick<TCourse, 'certificate' | 'type' | 'compliance'>;

/**
 * Returns the settings the dashboard shows and completion evaluation applies: stored values with defaults filled in.
 */
export function toEffectiveCertificateSettings(course: TCertificateCourse) {
  const stored = course.certificate ?? {};
  const design = resolveCertificateDesign(stored);
  const requiredExerciseId = stored.requiredExerciseId ?? null;
  const complianceMinScore = course.type === 'COMPLIANCE' ? (course.compliance?.passingScore ?? null) : null;
  const requiredExerciseMinScore =
    stored.exerciseMinScorePercent ?? complianceMinScore ?? DEFAULT_EXERCISE_MIN_SCORE_PERCENT;

  return {
    isDownloadable: stored.isDownloadable ?? false,
    theme: stored.theme ?? design.templateId,
    design,
    deadline: stored.deadline ?? null,
    threshold: stored.threshold ?? DEFAULT_THRESHOLD,
    requiredExerciseId,
    exerciseMinScorePercent: requiredExerciseId ? requiredExerciseMinScore : (stored.exerciseMinScorePercent ?? null),
    emailMessage: stored.emailMessage ?? null
  };
}
