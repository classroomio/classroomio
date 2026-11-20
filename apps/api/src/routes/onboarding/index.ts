import { Hono } from '@api/utils/hono';

import { onboardingRouter as welcomeEmailRouter } from './onboarding';
import { onboardingFlowRouter } from './flow';
import { onboardingSiteNameRouter } from './site-name';
import { onboardingStarterRouter } from './starter';

export const onboardingRouter = new Hono()
  .route('/', welcomeEmailRouter)
  .route('/', onboardingFlowRouter)
  .route('/site-name', onboardingSiteNameRouter)
  .route('/starter', onboardingStarterRouter);
