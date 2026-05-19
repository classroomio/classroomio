import 'dotenv/config';

import { API_SERVER_URL } from '@api/constants';
import { resolveTrustedBrowserOriginForCors } from '@api/utils/origins';

import { Hono } from '@api/utils/hono';
import { accountRouter } from '@api/routes/account';
import { auth } from '@cio/db/auth';
import { communityRouter } from '@api/routes/community';
import { cors } from 'hono/cors';
import { courseRouter } from '@api/routes/course';
import { dashAnalyticsRouter } from '@api/routes/dash';
import { domainRouter } from '@api/routes/domain/domain';
import { inviteRouter } from '@api/routes/invite';
import { logger } from 'hono/logger';
// ROUTES
import { mailRouter } from '@api/routes/mail';
import { jobsRouter } from '@api/routes/jobs';
import { mediaRouter } from '@api/routes/media';
import { onboardingRouter } from '@api/routes/onboarding';
import { organizationRouter } from '@api/routes/organization';
import { publicCourseRouter } from '@api/routes/org-site';
import { licenseRouter } from '@api/routes/license';
import { organizationSsoRouter } from '@api/routes/organization/sso';
import { organizationTokenAuthRouter } from '@api/routes/organization/token-auth';
import { v1Router } from '@api/routes/v1';
import { ssoDiscoveryRouter } from '@api/routes/sso/discovery';
import { publicWidgetsRouter } from '@api/routes/widgets';
import { prettyJSON } from 'hono/pretty-json';
import rateLimiter from '@api/middlewares/rate-limiter';
import { secureHeaders } from 'hono/secure-headers';
import { signupGuard } from '@api/middlewares/signup-guard';
import { programRouter } from '@api/routes/program';
import { unsplashRouter } from '@api/routes/unsplash/unsplash';
import { agentRouter } from '@api/routes/agent';
import { internalRouter } from '@api/routes/internal';
import { mountQueueDashboard } from '@api/routes/admin/queues';

// Create Hono app with chaining for RPC support
export const app = new Hono()
  // Middleware
  .use('*', logger())
  .use('*', prettyJSON())
  .use('*', secureHeaders())
  .use(
    '*',
    cors({
      origin: (origin) => resolveTrustedBrowserOriginForCors(origin),
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'Cio-org-id'],
      exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
      maxAge: 600,
      credentials: true
    })
  )
  .use('*', rateLimiter)
  .use('*', async (c, next) => {
    let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;

    try {
      session = await auth.api.getSession({ headers: c.req.raw.headers });
    } catch (error) {
      console.error('auth.api.getSession error:', error);
    }

    if (!session) {
      c.set('user', null);
      c.set('session', null);
      c.set('orgRoles', {});
      await next();

      return;
    }

    c.set('user', session.user);
    c.set('session', session.session);
    c.set('orgRoles', (session as { orgRoles?: Record<string, number> }).orgRoles ?? {});
    await next();
  })

  // Routes
  .get('/', (c) =>
    c.json({
      message: `"Welcome to Classroomio.com API - docs are at ${API_SERVER_URL}/docs"`
    })
  )
  .use('/api/auth/sign-up/*', signupGuard)
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
  .route('/domain', domainRouter)
  .route('/mail', mailRouter)
  .route('/media', mediaRouter)
  .route('/jobs', jobsRouter)
  .route('/license', licenseRouter)
  .route('/organization', organizationRouter)
  .route('/organization/sso', organizationSsoRouter)
  .route('/organization/token-auth', organizationTokenAuthRouter)
  .route('/sso', ssoDiscoveryRouter)
  .route('/dash', dashAnalyticsRouter)
  .route('/community', communityRouter)
  .route('/invite', inviteRouter)
  .route('/org-site/course', publicCourseRouter)
  .route('/public-api/v1', v1Router)
  .route('/program', programRouter)
  .route('/unsplash', unsplashRouter)
  .route('/widgets', publicWidgetsRouter)
  .route('/internal', internalRouter)
  .route('/agent', agentRouter)

  // Error handling
  .onError((err, c) => {
    console.error('Error:', err);
    return c.json({ error: 'Internal Server Error' }, 500);
  });

// Dev-only BullMQ dashboard at /admin/queues. Mounted after the typed RPC
// chain so it doesn't pollute the client type.
mountQueueDashboard(app);
