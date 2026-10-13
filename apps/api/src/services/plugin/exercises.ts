import { AppError } from '@api/utils/errors';
import { authorizePluginRequest } from '@api/services/plugin/authorization';
import { assertCourseMemberOrOrgAdmin } from '@api/services/v1/shared';
import { getPluginExerciseById, getPluginExercisesList } from '@cio/db/queries';
import { type TPluginApiExerciseMetadata, ZPluginApiExerciseMetadata } from '@cio/utils/validation/plugin';

export async function listExercisesForPlugin(
  installationId: string,
  organizationId: string,
  actorId: string,
  courseId: string,
  options?: { limit?: number; cursor?: string; lessonId?: string }
): Promise<{ items: TPluginApiExerciseMetadata[]; nextCursor: string | null }> {
  const authorization = await authorizePluginRequest({
    installationId,
    organizationId,
    actorId,
    requiredScope: 'exercise.metadata:read'
  });

  await assertCourseMemberOrOrgAdmin(courseId, actorId);

  const canReadAll = authorization.organizationRole === 'admin' || authorization.organizationRole === 'tutor';
  const result = await getPluginExercisesList(organizationId, courseId, actorId, canReadAll, options);

  const items = result.items.map((item) => ZPluginApiExerciseMetadata.parse(item));

  return { items, nextCursor: result.nextCursor };
}

export async function getExerciseForPlugin(
  installationId: string,
  organizationId: string,
  actorId: string,
  exerciseId: string
): Promise<TPluginApiExerciseMetadata> {
  const authorization = await authorizePluginRequest({
    installationId,
    organizationId,
    actorId,
    requiredScope: 'exercise.metadata:read'
  });

  const canReadAll = authorization.organizationRole === 'admin' || authorization.organizationRole === 'tutor';
  const item = await getPluginExerciseById(organizationId, exerciseId, actorId, canReadAll);

  if (!item) {
    throw new AppError('Exercise not found', 'EXERCISE_NOT_FOUND', 404);
  }

  await assertCourseMemberOrOrgAdmin(item.courseId, actorId);

  return ZPluginApiExerciseMetadata.parse(item);
}
