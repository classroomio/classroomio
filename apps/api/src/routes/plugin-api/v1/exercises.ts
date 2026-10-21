import { Hono } from '@api/utils/hono';
import { getExerciseForPlugin } from '@api/services/plugin/exercises';
import { recordPluginAuditEvent } from '@cio/db/queries';
import { handlePluginApiError } from '../errors';
import { AppError } from '@api/utils/errors';
import { describePluginApiRoute } from '../openapi';
import { ZPluginApiExerciseMetadata } from '@cio/utils/validation/plugin';

export const pluginApiExercisesRouter = new Hono().get(
  '/:exerciseId',
  describePluginApiRoute({
    operationId: 'pluginExercisesGet',
    summary: 'Get exercise metadata by ID',
    scope: 'exercise.metadata:read'
  }),
  async (c) => {
    const claims = c.get('pluginApiClaims')!;
    const requestId = c.get('pluginApiRequestId') as string;
    const exerciseId = c.req.param('exerciseId');

    if (!claims.scopes.includes('exercise.metadata:read')) {
      return handlePluginApiError(
        c,
        new AppError('Permission exercise.metadata:read is required', 'FORBIDDEN', 403),
        'Permission denied'
      );
    }

    try {
      const exercise = await getExerciseForPlugin(claims.installationId, claims.organizationId, claims.sub, exerciseId);
      const data = ZPluginApiExerciseMetadata.parse(exercise);

      await recordPluginAuditEvent({
        installationId: claims.installationId,
        organizationId: claims.organizationId,
        actorProfileId: claims.sub,
        action: 'plugin.api.exercise.get',
        resource: exerciseId,
        outcome: 'success',
        metadata: { requestId, tokenId: claims.jti }
      });

      return c.json({ success: true as const, data, requestId }, 200);
    } catch (error) {
      await recordPluginAuditEvent({
        installationId: claims.installationId,
        organizationId: claims.organizationId,
        actorProfileId: claims.sub,
        action: 'plugin.api.exercise.get',
        resource: exerciseId,
        outcome: 'denied',
        metadata: { requestId, tokenId: claims.jti }
      });

      return handlePluginApiError(c, error, 'Failed to read exercise');
    }
  }
);
