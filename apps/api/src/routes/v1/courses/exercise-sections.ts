import {
  ZPublicApiAddExerciseSection,
  ZPublicApiCourseExerciseParam,
  ZPublicApiExerciseSectionParam,
  ZPublicApiExerciseSectionResponse,
  ZPublicApiUpdateExerciseSectionFields
} from '@cio/utils/validation/public-api';
import {
  addCourseExerciseSectionService,
  deleteCourseExerciseSectionService,
  updateCourseExerciseSectionService
} from '@api/services/v1/courses/exercise-sections';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse } from '@api/utils/openapi/responses';
import { COURSE_TEAM_RULE, LIVE_EDIT_NOTE, exerciseForbiddenResponses, mcpRateLimitResponse } from './docs';

const TAG = 'Exercise Sections';
const SectionResponse = itemResponse(ZPublicApiExerciseSectionResponse);

export const v1CourseExerciseSectionsRouter = new Hono()
  .post(
    '/',
    describeRoute({
      description: `Add one empty exercise section, a part of the exercise that groups questions; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        201: jsonResponse(
          `Exercise section added; put questions in it with the question endpoints. ${LIVE_EDIT_NOTE}`,
          SectionResponse
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: exerciseForbiddenResponses.write,
        404: { description: 'Course, exercise or go_to_section target not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseExerciseParam),
    validator('json', ZPublicApiAddExerciseSection),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const section = await addCourseExerciseSectionService(
          orgId,
          actorId,
          c.req.valid('param'),
          c.req.valid('json')
        );

        return c.json({ success: true, data: section }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to add exercise section');
      }
    }
  )
  .patch(
    '/:sectionId',
    describeRoute({
      description: `Edit one exercise section without touching its questions; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse(`Exercise section updated successfully. ${LIVE_EDIT_NOTE}`, SectionResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: exerciseForbiddenResponses.write,
        404: { description: 'Course, exercise or exercise section not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiExerciseSectionParam),
    validator('json', ZPublicApiUpdateExerciseSectionFields),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const section = await updateCourseExerciseSectionService(
          orgId,
          actorId,
          c.req.valid('param'),
          c.req.valid('json')
        );

        return c.json({ success: true, data: section }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update exercise section');
      }
    }
  )
  .delete(
    '/:sectionId',
    describeRoute({
      description: `Permanently delete one empty exercise section; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse(
          `Exercise section deleted successfully; returns the section as it was. ${LIVE_EDIT_NOTE}`,
          SectionResponse
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: exerciseForbiddenResponses.write,
        404: { description: 'Course, exercise or exercise section not found' },
        409: {
          description:
            "The section still holds questions (move or delete them first), or another section's afterBehavior goes to it"
        },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiExerciseSectionParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const section = await deleteCourseExerciseSectionService(orgId, actorId, c.req.valid('param'));

        return c.json({ success: true, data: section }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to delete exercise section');
      }
    }
  );
