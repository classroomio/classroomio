import { ZOnboardingStep1, ZOnboardingStep2 } from '@cio/utils/validation/onboarding';
import { completeOnboarding, createOrganizationWithOwner, updateUserOnboarding } from '@api/services/onboarding';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const onboardingRouter = new Hono()
  .post('/step1', authMiddleware, zValidator('json', ZOnboardingStep1), async (c) => {
    try {
      const user = c.get('user');
      const { fullname, orgName, siteName } = c.req.valid('json');

      const result = await createOrganizationWithOwner(user.id, { fullname, orgName, siteName });

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create organization');
    }
  })
  .post('/step2', authMiddleware, zValidator('json', ZOnboardingStep2), async (c) => {
    try {
      const user = c.get('user');
      const { goal, source, fullname } = c.req.valid('json');

      const result = await updateUserOnboarding(user.id, { goal, source, fullname });

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to update onboarding data');
    }
  })
  .post('/complete', authMiddleware, async (c) => {
    try {
      const user = c.get('user');

      await completeOnboarding(user);

      return c.json({ success: true }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to complete onboarding');
    }
  });
