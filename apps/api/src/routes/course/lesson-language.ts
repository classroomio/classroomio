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
} from '@cio/core/services/lesson-language';

import { Hono } from '@api/utils/hono';
import type { TLocale } from '@db/types';
import { b64EnvelopeRewrite } from '@api/middlewares/b64-envelope';
import { authMiddleware } from '@api/middlewares/auth';
import { courseMemberMiddleware } from '@api/middlewares/course-member';
import { courseTeamMemberMiddleware } from '@api/middlewares/course-team-member';
import { AppError, ErrorCodes, handleError } from '@api/utils/errors';
import { getLessonById } from '@cio/db/queries/lesson';
import { zValidator } from '@hono/zod-validator';

export const lessonLanguageRouter = new Hono()
  .use('*', b64EnvelopeRewrite)
  .get('/', authMiddleware, courseMemberMiddleware, zValidator('param', ZLessonLanguageGetParam), async (c) => {
    try {
      const courseId = c.req.param('courseId')!;
      const { lessonId } = c.req.valid('param');

      const lesson = await getLessonById(lessonId);
      if (!lesson || lesson.courseId !== courseId) {
        throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
      }

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
  .get(
    '/:locale',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZLessonLanguageGetByLocaleParam),
    async (c) => {
      try {
        const courseId = c.req.param('courseId')!;
        const { lessonId, locale } = c.req.valid('param');

        const lesson = await getLessonById(lessonId);
        if (!lesson || lesson.courseId !== courseId) {
          throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
        }

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
  .post(
    '/',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZLessonLanguageGetParam),
    zValidator('json', ZLessonLanguageCreate),
    async (c) => {
      try {
        const user = c.get('user')!;
        const courseId = c.req.param('courseId')!;
        const { lessonId } = c.req.valid('param');
        const { versionIntent, versionLabel, ...data } = c.req.valid('json');

        const lesson = await getLessonById(lessonId);
        if (!lesson || lesson.courseId !== courseId) {
          throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
        }

        const language = await upsertLessonLanguageService(lessonId, data, {
          authorId: user.id,
          versionIntent,
          versionLabel
        });

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
  .put(
    '/:locale',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZLessonLanguageGetByLocaleParam),
    zValidator('json', ZLessonLanguageUpdate),
    async (c) => {
      try {
        const user = c.get('user')!;
        const courseId = c.req.param('courseId')!;
        const { lessonId, locale } = c.req.valid('param');
        const { versionIntent, versionLabel, ...data } = c.req.valid('json');

        const lesson = await getLessonById(lessonId);
        if (!lesson || lesson.courseId !== courseId) {
          throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
        }

        const language = await updateLessonLanguageService(lessonId, locale as TLocale, data, {
          authorId: user.id,
          versionIntent,
          versionLabel
        });

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
