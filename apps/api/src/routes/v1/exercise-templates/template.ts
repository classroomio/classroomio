import {
  ZPublicApiExerciseTemplateDetailResponse,
  ZPublicApiExerciseTemplateParam,
  ZPublicApiExerciseTemplateResponse,
  ZPublicApiExerciseTemplatesQuery
} from '@cio/utils/validation/public-api';
import { getExerciseTemplateService, listExerciseTemplatesService } from '@api/services/v1/exercise-templates/template';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';
import { ORG_TEAM_RULE, PAGINATION_NOTE, TAG, forbiddenResponse, mcpRateLimitResponse } from './docs';

export const v1ExerciseTemplateRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List the built-in exercise templates (the same catalog for every organization). Filter by tag. Use a template's id as templateId in POST /courses/{courseId}/exercises. ${PAGINATION_NOTE} ${ORG_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Templates returned successfully', paginatedResponse(ZPublicApiExerciseTemplateResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: forbiddenResponse,
        429: mcpRateLimitResponse
      }
    }),
    validator('query', ZPublicApiExerciseTemplatesQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const result = await listExerciseTemplatesService(orgId, actorId, c.req.valid('query'));

        return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list exercise templates');
      }
    }
  )
  .get(
    '/:templateId',
    describeRoute({
      description: `Get an exercise template with the questions it creates. ${ORG_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Template returned successfully', itemResponse(ZPublicApiExerciseTemplateDetailResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: forbiddenResponse,
        404: { description: 'Template not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiExerciseTemplateParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const template = await getExerciseTemplateService(orgId, actorId, c.req.valid('param'));

        return c.json({ success: true, data: template }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to fetch exercise template');
      }
    }
  );
