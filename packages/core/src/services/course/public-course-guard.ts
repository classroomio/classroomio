import { AppError, ErrorCodes } from '@cio/utils/errors';
import { findNonAutoGradableQuestionsInCourse, getCourseTypeById } from '@cio/db/queries/course';
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
 * auto-gradable. Throws `PUBLIC_COURSE_CONVERSION_BLOCKED` with the offending list
 * in `message`; callers should surface the list to the creator so they can fix them.
 */
export async function guardCourseTypeTransition(params: {
  courseId: string;
  currentType: string | null;
  nextType: string | null | undefined;
}): Promise<void> {
  if (!params.nextType) return;
  if (params.nextType !== 'PUBLIC') return;
  if (params.currentType === 'PUBLIC') return;

  const offenders = await findNonAutoGradableQuestionsInCourse(params.courseId, AUTO_GRADABLE_QUESTION_TYPE_IDS);
  if (offenders.length === 0) return;

  const preview = offenders.slice(0, 5).map((item) => `"${item.questionTitle}" in "${item.exerciseTitle}"`);
  const more = offenders.length > 5 ? ` (+${offenders.length - 5} more)` : '';

  throw new AppError(
    `Remove or replace these non-auto-gradable questions before converting to Public: ${preview.join('; ')}${more}`,
    ErrorCodes.PUBLIC_COURSE_CONVERSION_BLOCKED,
    400,
    'type'
  );
}
