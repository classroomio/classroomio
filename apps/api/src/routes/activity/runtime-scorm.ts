import { ZRuntimeTokenParam, ZScormCommit, ZScormRuntimeEvent } from '@cio/utils/validation/activity/scorm';
import {
  commitScormAttempt,
  getScormRuntimeState,
  reportScormRuntimeEvent
} from '@api/services/activity/runtime-scorm';

import { Hono } from '@api/utils/hono';
import { activityRuntimeRateLimiter } from '@api/middlewares/rate-limiter';
import { AppError, ErrorCodes, handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const runtimeScormRouter = new Hono()
  .get('/:launchToken/state', activityRuntimeRateLimiter, zValidator('param', ZRuntimeTokenParam), async (c) => {
    try {
      const { launchToken } = c.req.valid('param');
      const result = await getScormRuntimeState(launchToken, c.req.header('user-agent') ?? null);

      return c.json(result, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load launch state');
    }
  })
  .post('/:launchToken/commit', activityRuntimeRateLimiter, zValidator('param', ZRuntimeTokenParam), async (c) => {
    try {
      const { launchToken } = c.req.valid('param');
      const text = await c.req.text();
      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        body = null;
      }
      const parsed = ZScormCommit.safeParse(body);
      if (!parsed.success) throw new AppError('Invalid commit payload', ErrorCodes.VALIDATION_ERROR, 400);
      const contentType = c.req.header('content-type') ?? '';
      const viaBeacon = contentType.includes('text/plain');
      const result = await commitScormAttempt(launchToken, parsed.data, viaBeacon, c.req.header('user-agent') ?? null);

      return c.json({ result: true, errorCode: 0, completedActivity: result.completedActivity }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to save commit');
    }
  })
  .post(
    '/:launchToken/event',
    activityRuntimeRateLimiter,
    zValidator('param', ZRuntimeTokenParam),
    zValidator('json', ZScormRuntimeEvent),
    async (c) => {
      try {
        const { launchToken } = c.req.valid('param');
        const event = c.req.valid('json');
        const result = await reportScormRuntimeEvent(
          launchToken,
          event.kind,
          event.detail,
          c.req.header('user-agent') ?? null
        );

        return c.json({ result: true, errorCode: 0, recorded: result.recorded }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to record event');
      }
    }
  );
