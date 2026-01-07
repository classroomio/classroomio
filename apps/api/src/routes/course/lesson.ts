import {
  ZLessonCommentCreate,
  ZLessonCommentGetParam,
  ZLessonCommentUpdate,
  ZLessonCommentsQuery,
  ZLessonCompletionCreate,
  ZLessonCompletionUpdate,
  ZLessonCreate,
  ZLessonGetParam,
  ZLessonHistoryParam,
  ZLessonHistoryQuery,
  ZLessonListQuery,
  ZLessonReorder,
  ZLessonSectionCreate,
  ZLessonSectionGetParam,
  ZLessonSectionReorder,
  ZLessonSectionUpdate,
  ZLessonUpdate
} from '@cio/utils/validation/lesson';
import {
  createLesson,
  createLessonCommentService,
  createLessonSection,
  deleteLessonCommentService,
  deleteLessonSectionService,
  deleteLessonService,
  getLesson,
  getLessonCommentsPaginated,
  getLessonCompletionService,
  getLessonHistoryService,
  listLessons,
  reorderLessonSections,
  reorderLessons,
  updateLessonCommentService,
  updateLessonSectionService,
  updateLessonService,
  upsertLessonCompletionService
} from '@api/services/lesson';

import { Hono } from '@api/utils/hono';
import { ZLessonDownloadContent } from '@cio/utils/validation/course';
import { authMiddleware } from '@api/middlewares/auth';
import { courseMemberMiddleware } from '@api/middlewares/course-member';
import { generateLessonPdf } from '@api/utils/lesson';
import { getGroupMemberIdByCourseAndProfile } from '@cio/db/queries/group';
import { handleError } from '@api/utils/errors';
import { lessonLanguageRouter } from '@api/routes/course/lesson-language';
import { zValidator } from '@hono/zod-validator';

export const lessonRouter = new Hono()
  // Lesson CRUD routes
  .get('/', authMiddleware, courseMemberMiddleware, zValidator('query', ZLessonListQuery), async (c) => {
    try {
      const { courseId, sectionId } = c.req.valid('query');
      const lessons = await listLessons(courseId, sectionId);

      return c.json({ success: true, data: lessons }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list lessons');
    }
  })
  .post('/reorder', authMiddleware, courseMemberMiddleware, zValidator('json', ZLessonReorder), async (c) => {
    try {
      const courseId = c.req.param('courseId')!;
      const { lessons } = c.req.valid('json');

      const updated = await reorderLessons(courseId, lessons);

      return c.json({ success: true, data: updated }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to reorder lessons');
    }
  })
  .get('/:lessonId', authMiddleware, courseMemberMiddleware, zValidator('param', ZLessonGetParam), async (c) => {
    try {
      const { lessonId } = c.req.valid('param');
      const lesson = await getLesson(lessonId);

      return c.json({ success: true, data: lesson }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch lesson');
    }
  })
  .post('/', authMiddleware, courseMemberMiddleware, zValidator('json', ZLessonCreate), async (c) => {
    try {
      const courseId = c.req.param('courseId')!;
      const data = c.req.valid('json');

      const lesson = await createLesson(courseId, { ...data, courseId });

      return c.json({ success: true, data: lesson }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create lesson');
    }
  })
  .put(
    '/:lessonId',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZLessonGetParam),
    zValidator('json', ZLessonUpdate),
    async (c) => {
      try {
        const { lessonId } = c.req.valid('param');
        const data = c.req.valid('json');

        const lesson = await updateLessonService(lessonId, data);

        return c.json({ success: true, data: lesson }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update lesson');
      }
    }
  )
  .delete('/:lessonId', authMiddleware, courseMemberMiddleware, zValidator('param', ZLessonGetParam), async (c) => {
    try {
      const { lessonId } = c.req.valid('param');
      const lesson = await deleteLessonService(lessonId);

      return c.json({ success: true, data: lesson }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to delete lesson');
    }
  })
  // Lesson Section routes
  .post('/section', authMiddleware, courseMemberMiddleware, zValidator('json', ZLessonSectionCreate), async (c) => {
    try {
      const courseId = c.req.param('courseId')!;
      const data = c.req.valid('json');

      const section = await createLessonSection(courseId, { ...data, courseId });

      return c.json({ success: true, data: section }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create lesson section');
    }
  })
  .put(
    '/section/:sectionId',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZLessonSectionGetParam),
    zValidator('json', ZLessonSectionUpdate),
    async (c) => {
      try {
        const { sectionId } = c.req.valid('param');
        const data = c.req.valid('json');

        const section = await updateLessonSectionService(sectionId, data);

        return c.json({ success: true, data: section }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update lesson section');
      }
    }
  )
  .delete(
    '/section/:sectionId',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZLessonSectionGetParam),
    async (c) => {
      try {
        const { sectionId } = c.req.valid('param');
        const section = await deleteLessonSectionService(sectionId);

        return c.json({ success: true, data: section }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to delete lesson section');
      }
    }
  )
  .post(
    '/section/reorder',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('json', ZLessonSectionReorder),
    async (c) => {
      try {
        const courseId = c.req.param('courseId')!;
        const { sections } = c.req.valid('json');

        const updated = await reorderLessonSections(courseId, sections);

        return c.json({ success: true, data: updated }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to reorder lesson sections');
      }
    }
  )
  // Lesson Comment routes
  .get(
    '/:lessonId/comment',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZLessonGetParam),
    zValidator('query', ZLessonCommentsQuery),
    async (c) => {
      try {
        const { lessonId } = c.req.valid('param');
        const { cursor, limit = 10 } = c.req.valid('query');

        const result = await getLessonCommentsPaginated(lessonId, { cursor, limit });

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to get lesson comments');
      }
    }
  )
  .post(
    '/:lessonId/comment',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZLessonGetParam),
    zValidator('json', ZLessonCommentCreate),
    async (c) => {
      try {
        const user = c.get('user')!;
        const courseId = c.req.param('courseId')!;
        const { lessonId } = c.req.valid('param');
        const { comment } = c.req.valid('json');

        const groupMemberId = await getGroupMemberIdByCourseAndProfile(courseId, user.id);
        if (!groupMemberId) {
          return c.json({ success: false, error: 'User is not a member of this course' }, 403);
        }

        const commentData = await createLessonCommentService(lessonId, groupMemberId, comment);

        return c.json({ success: true, data: commentData }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create lesson comment');
      }
    }
  )
  .put(
    '/comment/:commentId',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZLessonCommentGetParam),
    zValidator('json', ZLessonCommentUpdate),
    async (c) => {
      try {
        const { commentId } = c.req.valid('param');
        const { comment } = c.req.valid('json');
        const updated = await updateLessonCommentService(Number(commentId), comment);

        return c.json({ success: true, data: updated }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update lesson comment');
      }
    }
  )
  .delete(
    '/comment/:commentId',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZLessonCommentGetParam),
    async (c) => {
      try {
        const { commentId } = c.req.valid('param');
        const comment = await deleteLessonCommentService(Number(commentId));

        return c.json({ success: true, data: comment }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to delete lesson comment');
      }
    }
  )
  // Lesson Completion routes
  .get(
    '/:lessonId/completion',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZLessonGetParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { lessonId } = c.req.valid('param');

        const completion = await getLessonCompletionService(lessonId, user.id);

        return c.json({ success: true, data: completion }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to get lesson completion');
      }
    }
  )
  .put(
    '/:lessonId/completion',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZLessonGetParam),
    zValidator('json', ZLessonCompletionUpdate),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { lessonId } = c.req.valid('param');
        const { isComplete } = c.req.valid('json');

        const completion = await upsertLessonCompletionService(lessonId, user.id, isComplete);

        return c.json({ success: true, data: completion }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update lesson completion');
      }
    }
  )
  /**
   * GET /course/:courseId/lesson/:lessonId/history
   * Gets lesson version history for a lesson and locale
   * Query params: locale (required), endRange (optional, default 9)
   * Requires authentication and course membership
   */
  .get(
    '/:lessonId/history',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZLessonHistoryParam),
    zValidator('query', ZLessonHistoryQuery),
    async (c) => {
      try {
        const { lessonId } = c.req.valid('param');
        const { locale, endRange } = c.req.valid('query');
        const history = await getLessonHistoryService(lessonId, locale, endRange);

        return c.json(
          {
            success: true,
            data: history
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to fetch lesson history');
      }
    }
  )
  // PDF download route (existing)
  .post('/download/pdf', courseMemberMiddleware, zValidator('json', ZLessonDownloadContent), async (c) => {
    const validatedData = c.req.valid('json');

    const pdfBuffer = await generateLessonPdf(validatedData);

    c.header('Content-Type', 'application/pdf');
    return c.body(
      new ReadableStream({
        start(controller) {
          controller.enqueue(pdfBuffer);
          controller.close();
        }
      })
    );
  })
  .route('/:lessonId/language', lessonLanguageRouter);
