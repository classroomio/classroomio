import { AppError, ErrorCodes } from '@cio/utils/errors';
import type { DbOrTxClient } from '@cio/db/drizzle';
import type { NonAutoGradableQuestionOffender } from '@cio/utils/validation/course';
import { findNonAutoGradableQuestionsInCourse, getCourseTypeById } from '@cio/db/queries/course';
import { getActivitiesByCourseId } from '@cio/db/queries/activity';
import { AUTO_GRADABLE_QUESTION_TYPE_IDS, isAutoGradableQuestionTypeId } from '@cio/question-types';

/**
 * Throws `QUESTION_TYPE_NOT_ALLOWED_IN_PUBLIC_COURSE` when a non-auto-gradable question
 * type is being attached to an exercise that belongs to a `PUBLIC` course.
 *
 * Accepts the full list of question type ids being created / updated (ignore-null safe).
 */
export async function guardNonAutoGradableQuestionsForCourseType(params: {
  courseId: string;
  questionTypeIds: Array<number | null | undefined>;
}): Promise<void> {
  const typeIds = params.questionTypeIds.filter((id): id is number => typeof id === 'number');
  if (typeIds.length === 0) return;

  const hasDisallowed = typeIds.some((id) => !isAutoGradableQuestionTypeId(id));
  if (!hasDisallowed) return;

  const rowType = await getCourseTypeById(params.courseId);

  if (!rowType) return;

  if (rowType === 'PUBLIC') {
    throw new AppError(
      'Public courses only support auto-gradable question types',
      ErrorCodes.QUESTION_TYPE_NOT_ALLOWED_IN_PUBLIC_COURSE,
      400,
      'questions'
    );
  }
}

/**
 * When converting a course to `PUBLIC`, enumerate any questions whose type is not
 * auto-gradable. Returns the offending list so callers can block the type conversion
 * while allowing other changes to proceed.
 */
export async function getPublicConversionOffenders(params: {
  courseId: string;
  currentType: string | null;
  nextType: string | null | undefined;
  dbClient?: DbOrTxClient;
}): Promise<NonAutoGradableQuestionOffender[]> {
  if (!params.nextType) return [];
  if (params.nextType !== 'PUBLIC') return [];
  if (params.currentType === 'PUBLIC') return [];

  return findNonAutoGradableQuestionsInCourse(params.courseId, AUTO_GRADABLE_QUESTION_TYPE_IDS, params.dbClient);
}

/**
 * Throws when an activity would be created in a `PUBLIC` course.
 */
export async function assertCourseAllowsActivities(courseId: string): Promise<void> {
  const courseType = await getCourseTypeById(courseId);

  if (courseType === 'PUBLIC') {
    throw new AppError('Activities cannot be added to Public courses', ErrorCodes.VALIDATION_ERROR, 400);
  }
}

/**
 * Throws when converting a course with activities to `PUBLIC`, naming them.
 */
export async function assertNoActivitiesForPublicConversion(courseId: string, dbClient?: DbOrTxClient): Promise<void> {
  const activities = await getActivitiesByCourseId(courseId, dbClient ?? undefined);
  if (activities.length === 0) return;

  const names = activities.map((activity) => activity.title).join(', ');

  throw new AppError(
    `Cannot convert to Public while this course has SCORM items (${names}). Remove them first.`,
    ErrorCodes.VALIDATION_ERROR,
    400
  );
}
