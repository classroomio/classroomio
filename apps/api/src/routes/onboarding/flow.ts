import {
  ZOnboardingBusiness,
  ZOnboardingBusinessDraft,
  ZOnboardingComplete,
  ZOnboardingCustomise,
  ZOnboardingStart,
  ZOnboardingTourUpdate,
  ZOnboardingWorkspace
} from '@cio/utils/validation/onboarding';
import {
  applyCustomisation,
  completeOnboarding,
  getOnboardingState,
  saveBusinessDraft,
  startOnboarding,
  submitBusiness,
  submitWorkspace,
  updateOnboardingTour
} from '@api/services/onboarding';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { createRateLimiter } from '@api/middlewares/rate-limiter';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

const businessSubmitRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: 'Too many attempts. Please try again shortly.',
  keyGenerator: (c) => `onboarding_business:${c.get('user')?.id ?? 'unknown'}`
});

export const onboardingFlowRouter = new Hono()
  .get('/state', authMiddleware, async (c) => {
    try {
      const data = await getOnboardingState(c.get('user')!.id);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load onboarding');
    }
  })
  .post('/start', authMiddleware, zValidator('json', ZOnboardingStart), async (c) => {
    try {
      const data = await startOnboarding(c.get('user')!.id, c.req.valid('json'));

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to start onboarding');
    }
  })
  .put('/business/draft', authMiddleware, zValidator('json', ZOnboardingBusinessDraft), async (c) => {
    try {
      await saveBusinessDraft(c.get('user')!.id, c.req.valid('json'));

      return c.json({ success: true, data: null }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to save your answers');
    }
  })
  .post('/business', authMiddleware, businessSubmitRateLimit, zValidator('json', ZOnboardingBusiness), async (c) => {
    try {
      const data = await submitBusiness(c.get('user')!.id, c.req.valid('json'));

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to save your answers');
    }
  })
  .post('/workspace', authMiddleware, zValidator('json', ZOnboardingWorkspace), async (c) => {
    try {
      const data = await submitWorkspace(c.get('user')!.id, c.req.valid('json'));

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to create your workspace');
    }
  })
  .post('/customise', authMiddleware, zValidator('json', ZOnboardingCustomise), async (c) => {
    try {
      const data = await applyCustomisation(c.get('user')!.id, c.req.valid('json'));

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to apply your customisation');
    }
  })
  .post('/complete', authMiddleware, zValidator('json', ZOnboardingComplete), async (c) => {
    try {
      const data = await completeOnboarding(c.get('user')!.id, c.req.valid('json'));

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to finish onboarding');
    }
  })
  .put('/tour', authMiddleware, zValidator('json', ZOnboardingTourUpdate), async (c) => {
    try {
      const data = await updateOnboardingTour(c.get('user')!.id, c.req.valid('json'));

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to update the tour');
    }
  });
