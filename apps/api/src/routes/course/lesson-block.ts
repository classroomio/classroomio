import * as z from 'zod';

import {
  ZBlockAttach,
  ZBlockCreate,
  ZBlockDuplicate,
  ZBlockHistoryQuery,
  ZBlockLocale,
  ZBlockLocaleUpdate,
  ZBlockUpdate,
  ZPlacementMove,
  ZPlacementUpdate
} from '@cio/utils/validation/block';
import {
  attachLessonBlock,
  createLessonBlock,
  duplicateLessonBlock,
  getLessonBlockHistory,
  getLessonBlocks,
  moveLessonPlacement,
  removeLessonPlacement,
  updateLessonBlock,
  updateLessonBlockLocale,
  updateLessonPlacement
} from '@cio/core/services/block/block';
import { ContentType } from '@cio/utils/constants';

import { Hono } from '@api/utils/hono';
import { assertEnrolledStudentContentAccess } from '@api/services/course/access';
import { authMiddleware } from '@api/middlewares/auth';
import { courseMemberMiddleware } from '@api/middlewares/course-member';
import { courseTeamMemberMiddleware } from '@api/middlewares/course-team-member';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

const ZLessonParam = z.object({ lessonId: z.uuid() });
const ZLessonBlockParam = z.object({ lessonId: z.uuid(), blockId: z.uuid() });
const ZLessonBlockLocaleParam = z.object({ lessonId: z.uuid(), blockId: z.uuid(), locale: ZBlockLocale });
const ZLessonPlacementParam = z.object({ lessonId: z.uuid(), placementId: z.uuid() });

export const lessonBlockRouter = new Hono()
  .get('/', authMiddleware, courseMemberMiddleware, zValidator('param', ZLessonParam), async (c) => {
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

      const blocks = await getLessonBlocks(lessonId);

      return c.json({ success: true, data: blocks }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch lesson blocks');
    }
  })
  .post(
    '/',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZLessonParam),
    zValidator('json', ZBlockCreate),
    async (c) => {
      try {
        const { lessonId } = c.req.valid('param');
        const input = c.req.valid('json');

        const block = await createLessonBlock(lessonId, input, { actorProfileId: c.get('user')?.id ?? null });

        return c.json({ success: true, data: block }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create block');
      }
    }
  )
  .post(
    '/attach',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZLessonParam),
    zValidator('json', ZBlockAttach),
    async (c) => {
      try {
        const { lessonId } = c.req.valid('param');
        const input = c.req.valid('json');

        const block = await attachLessonBlock(lessonId, input, { actorProfileId: c.get('user')?.id ?? null });

        return c.json({ success: true, data: block }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to attach block');
      }
    }
  )
  .patch(
    '/placements/:placementId',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZLessonPlacementParam),
    zValidator('json', ZPlacementUpdate),
    async (c) => {
      try {
        const { lessonId, placementId } = c.req.valid('param');
        const input = c.req.valid('json');

        const block = await updateLessonPlacement(lessonId, placementId, input);

        return c.json({ success: true, data: block }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update block placement');
      }
    }
  )
  .put(
    '/placements/:placementId/move',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZLessonPlacementParam),
    zValidator('json', ZPlacementMove),
    async (c) => {
      try {
        const { lessonId, placementId } = c.req.valid('param');
        const anchor = c.req.valid('json');

        const block = await moveLessonPlacement(lessonId, placementId, anchor);

        return c.json({ success: true, data: block }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to move block');
      }
    }
  )
  .delete(
    '/placements/:placementId',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZLessonPlacementParam),
    async (c) => {
      try {
        const { lessonId, placementId } = c.req.valid('param');

        const result = await removeLessonPlacement(lessonId, placementId, {
          actorProfileId: c.get('user')?.id ?? null
        });

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to remove block');
      }
    }
  )
  .patch(
    '/:blockId',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZLessonBlockParam),
    zValidator('json', ZBlockUpdate),
    async (c) => {
      try {
        const { lessonId, blockId } = c.req.valid('param');
        const input = c.req.valid('json');

        const block = await updateLessonBlock(lessonId, blockId, input, {
          actorProfileId: c.get('user')?.id ?? null
        });

        return c.json({ success: true, data: block }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update block');
      }
    }
  )
  .put(
    '/:blockId/locale/:locale',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZLessonBlockLocaleParam),
    zValidator('json', ZBlockLocaleUpdate),
    async (c) => {
      try {
        const { lessonId, blockId, locale } = c.req.valid('param');
        const input = c.req.valid('json');

        const block = await updateLessonBlockLocale(lessonId, blockId, locale, input, {
          actorProfileId: c.get('user')?.id ?? null
        });

        return c.json({ success: true, data: block }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update block content');
      }
    }
  )
  .post(
    '/:blockId/duplicate',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZLessonBlockParam),
    zValidator('json', ZBlockDuplicate),
    async (c) => {
      try {
        const { lessonId, blockId } = c.req.valid('param');
        const input = c.req.valid('json');

        const block = await duplicateLessonBlock(lessonId, blockId, input, {
          actorProfileId: c.get('user')?.id ?? null
        });

        return c.json({ success: true, data: block }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to duplicate block');
      }
    }
  )
  .get(
    '/:blockId/history',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZLessonBlockParam),
    zValidator('query', ZBlockHistoryQuery),
    async (c) => {
      try {
        const { lessonId, blockId } = c.req.valid('param');
        const { locale, limit, cursor } = c.req.valid('query');

        const history = await getLessonBlockHistory(lessonId, blockId, locale, { limit, cursor });

        return c.json({ success: true, data: history }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to fetch block history');
      }
    }
  );
