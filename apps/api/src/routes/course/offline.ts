import { ZCourseOfflineManifestQuery, ZCourseOfflineParam, ZCourseSyncRequest } from '@cio/utils/validation/course';
import { getCourseOfflineManifest } from '@api/services/course/offline-manifest';
import { syncCourseIntents } from '@api/services/course/offline-sync';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { courseMemberMiddleware } from '@api/middlewares/course-member';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const offlineRouter = new Hono()
  /**
   * GET /course/:courseId/offline-manifest?lessonId=<id>
   * Lessons, media links, sizes and online-only items for downloading the course, or one lesson of it.
   * Requires authentication and course membership; locked lessons come back without content.
   */
  .get(
    '/offline-manifest',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZCourseOfflineParam),
    zValidator('query', ZCourseOfflineManifestQuery),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { courseId } = c.req.valid('param');
        const { lessonId } = c.req.valid('query');
        const manifest = await getCourseOfflineManifest(courseId, user.id, lessonId);

        return c.json({ success: true, data: manifest }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to build offline manifest');
      }
    }
  )
  /**
   * POST /course/:courseId/sync
   * Replays lesson completions and video watch progress recorded offline, oldest first. Each intent carries an
   * idempotency key; duplicates and lessons that are already complete count as success.
   * Requires authentication and course membership.
   */
  .post(
    '/sync',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZCourseOfflineParam),
    zValidator('json', ZCourseSyncRequest),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { courseId } = c.req.valid('param');
        const { intents } = c.req.valid('json');
        const result = await syncCourseIntents(courseId, user.id, intents);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to sync offline changes');
      }
    }
  );
