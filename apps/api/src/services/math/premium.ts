import { assertNoPaidQuestionFeatures, assertPaidMathFeature } from '@cio/core/services/exercise/premium-guard';
import { isOrgOnPaidPlan } from '@cio/core/services/agent/usage';
import { getOrgIdByCourseId } from '@cio/db/queries/course';
import type { PaidMathFeature } from '@cio/question-types';

import { AppError, ErrorCodes } from '@api/utils/errors';

async function isCoursePaid(courseId: string): Promise<boolean> {
  const orgId = await getOrgIdByCourseId(courseId);
  if (!orgId) throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);

  return isOrgOnPaidPlan(orgId);
}

/** Throws 403 UPGRADE_REQUIRED unless the course's organization is on a paid plan. */
export async function assertCourseHasPaidMathFeature(courseId: string, feature: PaidMathFeature): Promise<void> {
  assertPaidMathFeature(feature, await isCoursePaid(courseId));
}

/** Throws 403 UPGRADE_REQUIRED when a free-plan course saves questions with variables or AI grading. */
export async function assertCourseQuestionsAllowed(
  courseId: string,
  questions: ReadonlyArray<{ settings?: unknown }>
): Promise<void> {
  if (questions.length === 0) return;

  assertNoPaidQuestionFeatures(questions, await isCoursePaid(courseId));
}
