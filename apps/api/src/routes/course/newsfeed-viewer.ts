import { ZNewsfeedGetParam, ZNewsfeedReactionToggle } from '@cio/utils/validation/newsfeed';
import { getNewsfeedViewer, toggleNewsfeedReaction } from '@api/services/newsfeed/newsfeed-viewer';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { courseMemberMiddleware } from '@api/middlewares/course-member';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const newsfeedViewerRouter = new Hono()
  /**
   * GET /course/:courseId/newsfeed-viewer
   * The signed-in user's group member id in the course and whether they can moderate the newsfeed.
   */
  .get('/', authMiddleware, courseMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const courseId = c.req.param('courseId')!;

      const result = await getNewsfeedViewer(courseId, user.id);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load newsfeed viewer');
    }
  })
  /**
   * PUT /course/:courseId/newsfeed-viewer/:feedId/reaction
   * Sets the signed-in user's reaction on a post, or clears it when it is already set.
   */
  .put(
    '/:feedId/reaction',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZNewsfeedGetParam),
    zValidator('json', ZNewsfeedReactionToggle),
    async (c) => {
      try {
        const user = c.get('user')!;
        const courseId = c.req.param('courseId')!;
        const { feedId } = c.req.valid('param');
        const { type } = c.req.valid('json');

        const result = await toggleNewsfeedReaction(courseId, feedId, user.id, type);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update reaction');
      }
    }
  );
