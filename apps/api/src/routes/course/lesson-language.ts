import {
  ZLessonLanguageCreate,
  ZLessonLanguageGetByLocaleParam,
  ZLessonLanguageGetParam,
  ZLessonLanguageUpdate
} from '@cio/utils/validation/lesson';
import {
  getLessonLanguage,
  listLessonLanguages,
  updateLessonLanguageService,
  upsertLessonLanguageService
} from '@api/services/lesson-language';

import { Hono } from '@api/utils/hono';
import type { TLocale } from '@db/types';
import { authMiddleware } from '@api/middlewares/auth';
import { courseMemberMiddleware } from '@api/middlewares/course-member';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const lessonLanguageRouter = new Hono()
  /**
   * GET /course/:courseId/lesson/:lessonId/language
   * Gets all language translations for a lesson
   * Requires authentication and course membership
   */
  .get('/language', authMiddleware, courseMemberMiddleware, zValidator('param', ZLessonLanguageGetParam), async (c) => {
    try {
      const { lessonId } = c.req.valid('param');
      const languages = await listLessonLanguages(lessonId);

      return c.json(
        {
          success: true,
          data: languages
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to fetch lesson languages');
    }
  })
  /**
   * GET /course/:courseId/lesson/:lessonId/language/:locale
   * Gets a single lesson language by locale
   * Requires authentication and course membership
   */
  .get(
    '/language/:locale',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZLessonLanguageGetByLocaleParam),
    async (c) => {
      try {
        const { lessonId, locale } = c.req.valid('param');
        const language = await getLessonLanguage(lessonId, locale as TLocale);

        if (!language) {
          return c.json(
            {
              success: false,
              error: 'Lesson language not found'
            },
            404
          );
        }

        return c.json(
          {
            success: true,
            data: language
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to fetch lesson language');
      }
    }
  )
  /**
   * POST /course/:courseId/lesson/:lessonId/language
   * Creates or updates a lesson language translation (upsert)
   * Requires authentication and course membership
   */
  .post(
    '/language',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZLessonLanguageGetParam),
    zValidator('json', ZLessonLanguageCreate),
    async (c) => {
      try {
        const { lessonId } = c.req.valid('param');
        const data = c.req.valid('json');

        const language = await upsertLessonLanguageService(lessonId, data);

        return c.json(
          {
            success: true,
            data: language
          },
          201
        );
      } catch (error) {
        return handleError(c, error, 'Failed to create or update lesson language');
      }
    }
  )
  /**
   * PUT /course/:courseId/lesson/:lessonId/language/:locale
   * Updates a lesson language translation
   * Requires authentication and course membership
   */
  .put(
    '/language/:locale',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZLessonLanguageGetByLocaleParam),
    zValidator('json', ZLessonLanguageUpdate),
    async (c) => {
      try {
        const { lessonId, locale } = c.req.valid('param');
        const data = c.req.valid('json');

        const language = await updateLessonLanguageService(lessonId, locale as TLocale, data);

        return c.json(
          {
            success: true,
            data: language
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to update lesson language');
      }
    }
  );
