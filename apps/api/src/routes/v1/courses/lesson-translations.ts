import {
  ZPublicApiCourseLessonHistoryQuery,
  ZPublicApiCourseLessonHistoryResponse,
  ZPublicApiCourseLessonParam,
  ZPublicApiCourseLessonTranslationParam,
  ZPublicApiCourseLessonTranslationResponse,
  ZPublicApiCourseLessonTranslationsQuery,
  ZPublicApiSetCourseLessonTranslation
} from '@cio/utils/validation/public-api';
import {
  listPublicApiCourseLessonHistoryService,
  listPublicApiCourseLessonTranslationsService,
  setPublicApiCourseLessonTranslationService
} from '@api/services/v1/courses/lesson-translations';

import * as z from 'zod';
import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse } from '@api/utils/openapi/responses';
import { COURSE_TEAM_RULE, contentForbiddenResponses, mcpRateLimitResponse } from './docs';

const TAG = 'Public API Course Lessons';

export const v1CourseLessonTranslationsRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List a lesson's content in each language, with the full HTML. Pass locale to get just one; the list is empty when that language has no content. At most one entry per supported locale. ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse(
          'Translations returned successfully',
          itemResponse(z.array(ZPublicApiCourseLessonTranslationResponse))
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.read,
        404: { description: 'Course or lesson not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseLessonParam),
    validator('query', ZPublicApiCourseLessonTranslationsQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const translations = await listPublicApiCourseLessonTranslationsService(
          orgId,
          actorId,
          c.req.valid('param'),
          c.req.valid('query')
        );

        return c.json({ success: true, data: translations }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list lesson translations');
      }
    }
  )
  .put(
    '/:locale',
    describeRoute({
      description: `Create or replace a lesson's content in one language (idempotent). The HTML is sanitized, and each save is recorded in the lesson history as the key creator. versionIntent manual marks a named version (versionLabel); auto (default) may merge into the current editing session. ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Translation saved successfully', itemResponse(ZPublicApiCourseLessonTranslationResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.write,
        404: { description: 'Course or lesson not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseLessonTranslationParam),
    validator('json', ZPublicApiSetCourseLessonTranslation),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const translation = await setPublicApiCourseLessonTranslationService(
          orgId,
          actorId,
          c.req.valid('param'),
          c.req.valid('json')
        );

        return c.json({ success: true, data: translation }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to save lesson translation');
      }
    }
  );

export const v1CourseLessonHistoryRouter = new Hono().get(
  '/',
  describeRoute({
    description: `List saved versions of a lesson's content in one language, newest first, with the content before and after each save. Cursor-paginated: pass data.nextCursor back as cursor; limit defaults to 10, max 50. ${COURSE_TEAM_RULE}`,
    tags: [TAG],
    responses: {
      200: jsonResponse('History returned successfully', itemResponse(ZPublicApiCourseLessonHistoryResponse)),
      400: errorResponses.badRequest,
      401: errorResponses.unauthorized,
      403: contentForbiddenResponses.read,
      404: { description: 'Course or lesson not found' },
      429: mcpRateLimitResponse
    }
  }),
  validator('param', ZPublicApiCourseLessonParam),
  validator('query', ZPublicApiCourseLessonHistoryQuery),
  async (c) => {
    try {
      const orgId = c.get('orgId')!;
      const actorId = c.get('actorId');
      const history = await listPublicApiCourseLessonHistoryService(
        orgId,
        actorId,
        c.req.valid('param'),
        c.req.valid('query')
      );

      return c.json({ success: true, data: history }, 200);
    } catch (error) {
      return handlePublicApiError(c, error, 'Failed to list lesson history');
    }
  }
);
