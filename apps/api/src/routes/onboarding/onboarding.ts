import { markOnboardingWelcomeEmailPending } from '@api/services/onboarding';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';

export const onboardingRouter = new Hono().post('/welcome-email-pending', authMiddleware, async (c) => {
  try {
    await markOnboardingWelcomeEmailPending(c.get('user')!.id);
    return c.json({ success: true, data: null }, 200);
  } catch (error) {
    return handleError(c, error, 'Failed to prepare welcome email');
  }
});
