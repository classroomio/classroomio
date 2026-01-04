import 'dotenv/config';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';

import { auth } from '@cio/db/auth';
import { Hono } from '@api/utils/hono';
import rateLimiter from '@api/middlewares/rate-limiter';
import { API_SERVER_URL, TRUSTED_ORIGINS } from '@api/constants';

// --- routes
import { mailRouter } from '@api/routes/mail';
import { courseRouter } from '@api/routes/course';
import { accountRouter } from '@api/routes/account';
import { dashAnalyticsRouter } from '@api/routes/dash';
import { mediaRouter } from '@api/routes/media';
import { onboardingRouter } from '@api/routes/onboarding';
import { organizationRouter } from '@api/routes/organization';
import { exerciseRouter } from '@api/routes/exercise';
import { communityRouter } from '@api/routes/community';
import { paymentsRouter, webhooksRouter } from '@api/routes/payments';

// Create Hono app with chaining for RPC support
export const app = new Hono()
  // Middleware
  .use('*', logger())
  .use('*', prettyJSON())
  .use('*', secureHeaders())
  .use(
    '*',
    cors({
      origin: TRUSTED_ORIGINS,
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'Cio-org-id'],
      exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
      maxAge: 600,
      credentials: true
    })
  )
  .use('*', rateLimiter)
  .use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
      c.set('user', null);
      c.set('session', null);
      await next();

      return;
    }

    c.set('user', session.user);
    c.set('session', session.session);
    await next();
  })

  // Routes
  .get('/', (c) =>
    c.json({
      message: `"Welcome to Classroomio.com API - docs are at ${API_SERVER_URL}/docs"`
    })
  )
  .on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw))
  .get('/session', async (c) => {
    const session = c.get('session');
    const user = c.get('user');

    if (!user) return c.body(null, 401);

    return c.json({
      session,
      user
    });
  })
  .route('/onboarding', onboardingRouter)
  .route('/account', accountRouter)
  .route('/course', courseRouter)
  .route('/mail', mailRouter)
  .route('/media', mediaRouter)
  .route('/organization', organizationRouter)
  .route('/dash', dashAnalyticsRouter)
  .route('/exercise', exerciseRouter)
  .route('/community', communityRouter)
  .route('/payments', paymentsRouter)
  .route('/payments/webhooks', webhooksRouter)

  // Error handling
  .onError((err, c) => {
    console.error('Error:', err);
    return c.json({ error: 'Internal Server Error' }, 500);
  });
