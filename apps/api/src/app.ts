import 'dotenv/config';

import { isPublicCorsPath, sessionCors } from '@api/middlewares/cors';

import { API_SERVER_URL } from '@api/constants';
import { Hono } from '@api/utils/hono';
import { accountRouter } from '@api/routes/account';
import { agentRouter } from '@api/routes/agent';
import { auth } from '@cio/db/auth';
import { communityRouter } from '@api/routes/community';
import { courseRouter } from '@api/routes/course';
import { dashAnalyticsRouter } from '@api/routes/dash';
import { domainRouter } from '@api/routes/domain/domain';
import { internalRouter } from '@api/routes/internal';
import { inviteRouter } from '@api/routes/invite';
import { jobsRouter } from '@api/routes/jobs';
import { licenseRouter } from '@api/routes/license';
import { logger } from 'hono/logger';
// ROUTES
import { mailRouter } from '@api/routes/mail';
import { mediaRouter } from '@api/routes/media';
import { mountQueueDashboard } from '@api/routes/admin/queues';
import { onboardingRouter } from '@api/routes/onboarding';
import { organizationRouter } from '@api/routes/organization';
import { organizationSsoRouter } from '@api/routes/organization/sso';
import { organizationTokenAuthRouter } from '@api/routes/organization/token-auth';
import { prettyJSON } from 'hono/pretty-json';
import { programRouter } from '@api/routes/program';
import { publicCourseRouter } from '@api/routes/org-site';
import { publicWidgetsRouter } from '@api/routes/widgets';
import rateLimiter from '@api/middlewares/rate-limiter';
import { secureHeaders } from 'hono/secure-headers';
import { signupGuard } from '@api/middlewares/signup-guard';
import { ssoDiscoveryRouter } from '@api/routes/sso/discovery';
import { unsplashRouter } from '@api/routes/unsplash/unsplash';
import { v1Router } from '@api/routes/v1';

// Create Hono app with chaining for RPC support
export const app = new Hono()
  // Middleware
  .use('*', logger())
  .use('*', prettyJSON())
  .use('*', secureHeaders())
  .use('*', async (c, next) => {
    if (isPublicCorsPath(c.req.path)) return next();

    return sessionCors(c, next);
  })
  .use('*', rateLimiter)
  .use('*', async (c, next) => {
    if (isPublicCorsPath(c.req.path)) {
      c.set('user', null);
      c.set('session', null);

      return next();
    }

    let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;

    try {
      session = await auth.api.getSession({ headers: c.req.raw.headers });
    } catch (error) {
      console.error('auth.api.getSession error:', error);
    }

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
  .use('/api/auth/sign-up/*', signupGuard)
  .on(['POST', 'GET'], '/api/auth/*', async (c) => {
    // Behind the Cloudflare Worker proxy the raw Request URL points at the
    // upstream `.onrender.com` host. Better Auth (and the oauth-proxy plugin)
    // need the original tenant/admin host to construct correct OAuth callback
    // URLs and to decide whether to engage the proxy flow. Rebuild from
    // X-Forwarded-Host / X-Forwarded-Proto when present.
    let request = c.req.raw;
    const fwdHost = c.req.header('x-forwarded-host');
    const fwdProto = c.req.header('x-forwarded-proto');
    if (fwdHost) {
      const url = new URL(request.url);
      url.host = fwdHost;
      if (fwdProto === 'https' || fwdProto === 'http') {
        url.protocol = `${fwdProto}:`;
      }
      request = new Request(url, request);
    }

    const response = await auth.handler(request);

    if (response.status >= 300 && response.status < 400) {
      console.log('[auth-handler]', c.req.method, c.req.path, '→', response.status, response.headers.get('location'));
    }

    return response;
  })
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
