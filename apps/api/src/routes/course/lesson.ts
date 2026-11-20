import {
  ZLessonCommentCreate,
  ZLessonCommentGetParam,
  ZLessonCommentUpdate,
  ZLessonCommentsQuery,
  ZLessonCompletionUpdate,
  ZLessonChangeSetUndo,
  ZLessonCreate,
  ZLessonGetParam,
  ZLessonHistoryParam,
  ZLessonHistoryQuery,
  ZLessonListQuery,
  ZLessonHistoryEntryRestore,
  ZLessonUpdate,
  ZUpdateLessonWatchProgress
} from '@cio/utils/validation/lesson';
import {
  createLesson,
  createLessonCommentService,
  deleteLessonCommentService,
  deleteLessonService,
  getLesson,
  getLessonCommentsPaginated,
  getLessonCompletionService,
  getLessonHistoryService,
  getLessonVideoHlsStatusesService,
  getLessonWatchProgressService,
  hideLessonRecordingsFromLearners,
  listLessons,
  releaseLessonRecordingsForViewer,
  updateLessonCommentService,
  updateLessonService,
  updateLessonWatchProgressService,
  upsertLessonCompletionService
} from '@api/services/lesson';
import { assertEnrolledStudentContentAccess, assertEnrolledStudentCourseAccess } from '@api/services/course/access';
import { evaluateCourseCertification } from '@api/services/course/completion';
import { ContentType } from '@cio/utils/constants';

import { Hono } from '@api/utils/hono';
import { ZLessonDownloadContent } from '@cio/utils/validation/course';
import { authMiddleware } from '@api/middlewares/auth';
import { courseMemberMiddleware } from '@api/middlewares/course-member';
import { courseTeamMemberMiddleware } from '@api/middlewares/course-team-member';
import { lessonInCourseMiddleware } from '@api/middlewares/lesson-in-course';
import { restoreLessonToEntry, undoLessonChangeSet } from '@cio/core/services/block/lesson-structure';
import { restoreLessonBlockVersion } from '@cio/core/services/block/block';
import { ZBlockVersionRestore } from '@cio/utils/validation/block';
import { notifyCourseSessionUpdateService } from '@api/services/course/notify-session';
import { generateLessonPdf } from '@api/utils/lesson';
import { ensureCourseGroupMemberId } from '@cio/core/services/course/course';
import { handleError } from '@api/utils/errors';
import { lessonBlockRouter } from '@api/routes/course/lesson-block';
import { lessonLanguageRouter } from '@api/routes/course/lesson-language';
import { zValidator } from '@hono/zod-validator';

export const lessonRouter = new Hono()
  // Lesson CRUD routes
  .get('/', authMiddleware, courseMemberMiddleware, zValidator('query', ZLessonListQuery), async (c) => {
    try {
      const user = c.get('user')!;
      const { courseId, sectionId } = c.req.valid('query');

      await assertEnrolledStudentCourseAccess({ courseId, profileId: user.id });

      const storedLessons = await listLessons(courseId, sectionId);
      const lessons = await hideLessonRecordingsFromLearners(courseId, user.id, storedLessons);

      return c.json({ success: true, data: lessons }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list lessons');
    }
  })
  .get('/:lessonId', authMiddleware, courseMemberMiddleware, zValidator('param', ZLessonGetParam), async (c) => {
    try {
      const user = c.get('user')!;
      const courseId = c.req.param('courseId')!;
      const { lessonId } = c.req.valid('param');

      await assertEnrolledStudentContentAccess({
        courseId,
        profileId: user.id,
        contentId: lessonId,
        type: ContentType.Lesson
      });

      const [storedLesson, watchProgress] = await Promise.all([
        getLesson(lessonId),
        getLessonWatchProgressService(lessonId, user.id)
      ]);
      const [lesson] = await releaseLessonRecordingsForViewer(courseId, user.id, [storedLesson]);

      return c.json({ success: true, data: { ...lesson, watchProgress } }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch lesson');
    }
  })
  .get(
    '/:lessonId/video-status',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZLessonGetParam),
    async (c) => {
      try {
        const { lessonId } = c.req.valid('param');
        const statuses = await getLessonVideoHlsStatusesService(lessonId);

        return c.json({ success: true, data: { statuses } }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to fetch lesson video status');
      }
    }
  )
  .post('/', authMiddleware, courseMemberMiddleware, zValidator('json', ZLessonCreate), async (c) => {
    try {
      const user = c.get('user')!;
      const courseId = c.req.param('courseId')!;
      const data = c.req.valid('json');

      const createdLesson = await createLesson(
        courseId,
        { ...data, courseId },
        { actorProfileId: c.get('user')?.id ?? null }
      );
      const [lesson] = await hideLessonRecordingsFromLearners(courseId, user.id, [createdLesson]);

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
        const user = c.get('user')!;
        const courseId = c.req.param('courseId')!;
        const { lessonId } = c.req.valid('param');
        const data = c.req.valid('json');

        const updatedLesson = await updateLessonService(lessonId, data, { actorProfileId: c.get('user')?.id ?? null });
        const [lesson] = await hideLessonRecordingsFromLearners(courseId, user.id, [updatedLesson]);

        return c.json({ success: true, data: lesson }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update lesson');
      }
    }
  )
  .post(
    '/:lessonId/notify-session-update',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZLessonGetParam),
    async (c) => {
      try {
        const courseId = c.req.param('courseId')!;
        const { lessonId } = c.req.valid('param');

        const result = await notifyCourseSessionUpdateService(courseId, lessonId);
        return c.json({ success: true, data: result }, 202);
      } catch (error) {
        return handleError(c, error, 'Failed to notify session update');
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

        const groupMemberId = await ensureCourseGroupMemberId(courseId, user.id);
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
        const courseId = c.req.param('courseId')!;
        const { lessonId } = c.req.valid('param');
        const { isComplete } = c.req.valid('json');

        await assertEnrolledStudentContentAccess({
          courseId,
          profileId: user.id,
          contentId: lessonId,
          type: ContentType.Lesson
        });

        const completion = await upsertLessonCompletionService(lessonId, user.id, isComplete);

        if (isComplete) {
          void evaluateCourseCertification(courseId, user.id).catch((certError) => {
            console.error('Failed to evaluate course certification after lesson completion:', certError);
          });
        }

        return c.json({ success: true, data: completion }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update lesson completion');
      }
    }
  )
  .get(
    '/:lessonId/watch-progress',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZLessonGetParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const courseId = c.req.param('courseId')!;
        const { lessonId } = c.req.valid('param');

        await assertEnrolledStudentContentAccess({
          courseId,
          profileId: user.id,
          contentId: lessonId,
          type: ContentType.Lesson
        });

        const watchProgress = await getLessonWatchProgressService(lessonId, user.id);

        return c.json({ success: true, data: watchProgress }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to get lesson watch progress');
      }
    }
  )
  .put(
    '/:lessonId/watch-progress',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZLessonGetParam),
    zValidator('json', ZUpdateLessonWatchProgress),
    async (c) => {
      try {
        const user = c.get('user')!;
        const courseId = c.req.param('courseId')!;
        const { lessonId } = c.req.valid('param');
        const beat = c.req.valid('json');

        await assertEnrolledStudentContentAccess({
          courseId,
          profileId: user.id,
          contentId: lessonId,
          type: ContentType.Lesson
        });

        const watchProgress = await updateLessonWatchProgressService(lessonId, user.id, beat);

        if (watchProgress.didJustComplete) {
          void evaluateCourseCertification(courseId, user.id).catch((certError) => {
            console.error('Failed to evaluate course certification after video watch:', certError);
          });
        }

        return c.json({ success: true, data: watchProgress }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update lesson watch progress');
      }
    }
  )
  /**
   * GET /course/:courseId/lesson/:lessonId/history
   * Gets one keyset page of lesson version history, newest first.
   * Query params: locale (required), limit (optional, default 10), cursor (optional)
   * Requires authentication and course membership
   */
  .get(
    '/:lessonId/history',
    authMiddleware,
    courseTeamMemberMiddleware,
    lessonInCourseMiddleware,
    zValidator('param', ZLessonHistoryParam),
    zValidator('query', ZLessonHistoryQuery),
    async (c) => {
      try {
        const { lessonId } = c.req.valid('param');
        const { locale, limit, cursor } = c.req.valid('query');
        const history = await getLessonHistoryService(lessonId, locale, limit, cursor);

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
  /**
   * POST /course/:courseId/lesson/:lessonId/history/restore
   * Restores one text block to a past version. A shared block is first replaced in this
   * lesson by its own copy, so other lessons keep their current text.
   */
  .post(
    '/:lessonId/history/restore',
    authMiddleware,
    courseTeamMemberMiddleware,
    lessonInCourseMiddleware,
    zValidator('param', ZLessonHistoryParam),
    zValidator('json', ZBlockVersionRestore),
    async (c) => {
      try {
        const { lessonId } = c.req.valid('param');
        const input = c.req.valid('json');
        const user = c.get('user')!;
        const restored = await restoreLessonBlockVersion(lessonId, input, { actorProfileId: user.id });

        return c.json({ success: true, data: restored }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to restore lesson version');
      }
    }
  )
  /**
   * POST /course/:courseId/lesson/:lessonId/history/restore-lesson
   * Restores the whole lesson to the moment of one history entry: block order and settings, and
   * every locale of every text block as saved then.
   */
  .post(
    '/:lessonId/history/restore-lesson',
    authMiddleware,
    courseTeamMemberMiddleware,
    lessonInCourseMiddleware,
    zValidator('param', ZLessonHistoryParam),
    zValidator('json', ZLessonHistoryEntryRestore),
    async (c) => {
      try {
        const { lessonId } = c.req.valid('param');
        const entry = c.req.valid('json');
        const user = c.get('user')!;
        const restored = await restoreLessonToEntry(lessonId, entry, { authorId: user.id });

        return c.json({ success: true, data: restored }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to restore lesson');
      }
    }
  )
  /**
   * POST /course/:courseId/lesson/:lessonId/history/undo
   * Reverts one change set (an assistant chat request or a restore) in this lesson, and refuses
   * when something it touched was edited again afterwards.
   */
  .post(
    '/:lessonId/history/undo',
    authMiddleware,
    courseTeamMemberMiddleware,
    lessonInCourseMiddleware,
    zValidator('param', ZLessonHistoryParam),
    zValidator('json', ZLessonChangeSetUndo),
    async (c) => {
      try {
        const { lessonId } = c.req.valid('param');
        const { changeSetId } = c.req.valid('json');
        const user = c.get('user')!;
        const undone = await undoLessonChangeSet({ lessonId, changeSetId, authorId: user.id });

        return c.json({ success: true, data: undone }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to undo lesson change');
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
  .route('/:lessonId/language', lessonLanguageRouter)
  .route('/:lessonId/blocks', lessonBlockRouter);
