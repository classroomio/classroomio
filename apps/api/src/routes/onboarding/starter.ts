import { ZOnboardingStarterRename, ZOnboardingStarterSlotParam } from '@cio/utils/validation/onboarding';
import {
  getStarterStatus,
  regenerateStarterCourses,
  removeStarterCourse,
  renameStarterCourse,
  restoreStarterCourse
} from '@api/services/onboarding';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const onboardingStarterRouter = new Hono()
  .get('/', authMiddleware, async (c) => {
    try {
      const data = await getStarterStatus(c.get('user')!.id);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load starter courses');
    }
  })
  .post('/regenerate', authMiddleware, async (c) => {
    try {
      const data = await regenerateStarterCourses(c.get('user')!.id);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to regenerate starter courses');
    }
  })
  .put(
    '/:slot',
    authMiddleware,
    zValidator('param', ZOnboardingStarterSlotParam),
    zValidator('json', ZOnboardingStarterRename),
    async (c) => {
      try {
        const { slot } = c.req.valid('param');
        const { title } = c.req.valid('json');
        const data = await renameStarterCourse(c.get('user')!.id, slot, title);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to rename the course');
      }
    }
  )
  .delete('/:slot', authMiddleware, zValidator('param', ZOnboardingStarterSlotParam), async (c) => {
    try {
      const data = await removeStarterCourse(c.get('user')!.id, c.req.valid('param').slot);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to remove the course');
    }
  })
  .post('/:slot/restore', authMiddleware, zValidator('param', ZOnboardingStarterSlotParam), async (c) => {
    try {
      const data = await restoreStarterCourse(c.get('user')!.id, c.req.valid('param').slot);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to restore the course');
    }
  });
