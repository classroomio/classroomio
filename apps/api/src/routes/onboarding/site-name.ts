import { ZOnboardingSiteNameCheck } from '@cio/utils/validation/onboarding';
import { checkOnboardingSiteName } from '@api/services/onboarding';
import { createRateLimiter } from '@api/middlewares/rate-limiter';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

const siteNameCheckRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Too many checks. Please try again shortly.',
  keyGenerator: (c) => `onboarding_site_name:${c.get('user')?.id ?? 'unknown'}`
});

export const onboardingSiteNameRouter = new Hono().post(
  '/check',
  authMiddleware,
  siteNameCheckRateLimit,
  zValidator('json', ZOnboardingSiteNameCheck),
  async (c) => {
    try {
      const user = c.get('user')!;
      const { siteName } = c.req.valid('json');
      const data = await checkOnboardingSiteName(user.id, siteName);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to check the address');
    }
  }
);
