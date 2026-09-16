import { getEventBus } from '@cio/sdk';
import { upsertLessonCompletionService } from '@cio/core/services/lesson/lesson';
import { getLessonById } from '@cio/db/queries/lesson';
import { getOrgIdByCourseId } from '@cio/db/queries/course';
import { AppError, ErrorCodes } from '@api/utils/errors';

export interface CompleteLessonInput {
  userId: string;
  lessonId: string;
  orgId: string;
}

export async function completeLessonService({ userId, lessonId, orgId }: CompleteLessonInput) {
  const lesson = await getLessonById(lessonId);

  if (!lesson?.courseId) {
    throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
  }

  const lessonOrgId = await getOrgIdByCourseId(lesson.courseId);

  if (lessonOrgId !== orgId) {
    throw new AppError('Lesson does not belong to this organization', ErrorCodes.FORBIDDEN, 403);
  }

  const result = await upsertLessonCompletionService(lessonId, userId, true);
  const eventBus = getEventBus();

  void eventBus.dispatch('lesson.completed', { userId, lessonId, orgId }).catch((error) => {
    console.error('Failed to dispatch plugin event for lesson.completed:', error);
  });

  return result;
}
