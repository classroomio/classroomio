import 'dotenv/config';

import * as Sentry from '@sentry/node';
import { consumeHandoffPayload, storeHandoffPayload } from '@api/utils/redis/oauth-handoff';
import { isPublicCorsPath, sessionCors } from '@api/middlewares/cors';
import { randomBytes } from 'crypto';

import { API_SERVER_URL } from '@api/constants';
import { Hono } from '@api/utils/hono';
import { ErrorCodes } from '@api/utils/errors';
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
import { hlsRouter } from '@api/routes/hls';
import { mailRouter } from '@api/routes/mail';
import { mediaRouter } from '@api/routes/media';
import { transcriptsRouter } from '@api/routes/transcripts';
import { mountQueueDashboard } from '@api/routes/admin/queues';
import { onboardingRouter } from '@api/routes/onboarding';
import { organizationRouter } from '@api/routes/organization';
import { organizationSsoRouter } from '@api/routes/organization/sso';
import { organizationTokenAuthRouter } from '@api/routes/organization/token-auth';
import { prettyJSON } from 'hono/pretty-json';
import { cohortRouter } from '@api/routes/cohort';
import { publicCourseRouter, orgSiteOgRouter } from '@api/routes/org-site';
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
  // `Cross-Origin-Resource-Policy: same-origin` (Hono's default) blocks the
  // dashboard from embedding api-served media (e.g. HLS segments via
  // `<video>`) when the dashboard and api live on different origins in
  // local dev / self-hosted. We're an API server — every response is
  // designed for cross-origin consumption, so the right value is
  // `cross-origin`. CORS still gates which origins can read the bytes.
  .use('*', secureHeaders({ crossOriginResourcePolicy: 'cross-origin' }))
  .use('*', async (c, next) => {
    if (isPublicCorsPath(c.req.path)) return next();

    return sessionCors(c, next);
  })
  .use('*', async (c, next) => {
    if (isPublicCorsPath(c.req.path)) {
      c.set('user', null);
      c.set('session', null);
      c.set('orgRoles', {});

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
      c.set('orgRoles', {});
      await next();

      return;
    }

    c.set('user', session.user);
    c.set('session', session.session);
    c.set('orgRoles', (session as { orgRoles?: Record<string, number> }).orgRoles ?? {});

    Sentry.setUser({
      id: session.user.id,
      ...(session.user.email && { email: session.user.email }),
      ...(session.user.name && { username: session.user.name })
    });

    await next();
  })
  .use('*', rateLimiter)

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

    // Inbound: if the browser is hitting `/oauth-proxy-callback?token=…`
    // (our short handoff token), swap the token back to the original
    // encrypted `cookies=…` payload before handing the request to Better
    // Auth — the oauth-proxy plugin expects the cookies query param.
    {
      const inUrl = new URL(request.url);
      if (inUrl.pathname.endsWith('/oauth-proxy-callback')) {
        const token = inUrl.searchParams.get('token');
        if (token && !inUrl.searchParams.has('cookies')) {
          const cookies = await consumeHandoffPayload(token);
          if (cookies) {
            inUrl.searchParams.set('cookies', cookies);
            inUrl.searchParams.delete('token');
            request = new Request(inUrl, request);
          }
        }
      }
    }

    // Check if the social auth provider is configured before forwarding
    // to Better Auth, which returns a confusing generic 500 otherwise.
    if (c.req.method === 'POST' && c.req.path === '/api/auth/sign-in/social') {
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return c.json(
          {
            success: false,
            error: "This auth provider isn't enabled.",
            code: ErrorCodes.SOCIAL_AUTH_NOT_ENABLED
          },
          400
        );
      }
    }

    const response = await auth.handler(request);

    // Outbound: if the OAuth callback redirected to
    // `/oauth-proxy-callback?cookies=…<huge>`, stash the cookies payload
    // in Redis under a short token and rewrite the Location header so the
    // browser only carries the token across hosts. The companion swap on
    // the inbound side restores the cookies before Better Auth's plugin
    // tries to decrypt them. Without this, the encrypted cookies blob
    // pushes the Location header past Render's response size ceiling and
    // the redirect silently never reaches the browser.
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location && location.includes('/oauth-proxy-callback') && location.includes('cookies=')) {
        try {
          const outUrl = new URL(location);
          const cookies = outUrl.searchParams.get('cookies');
          if (cookies && cookies.length > 500) {
            const token = randomBytes(16).toString('hex');
            await storeHandoffPayload(token, cookies);
            outUrl.searchParams.delete('cookies');
            outUrl.searchParams.set('token', token);
            const headers = new Headers(response.headers);
            headers.set('location', outUrl.toString());
            return new Response(response.body, { status: response.status, headers });
          }
        } catch (error) {
          console.error('[auth-handler] failed to swap cookies → token, falling back to inline cookies:', error);
        }
      }
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location') ?? '';
      console.log(
        '[auth-handler]',
        c.req.method,
        c.req.path,
        '→',
        response.status,
        `location.length=${location.length}`
      );
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
  .route('/hls', hlsRouter)
  .route('/transcripts', transcriptsRouter)
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
  .route('/org-site/og', orgSiteOgRouter)
  .route('/public-api/v1', v1Router)
  .route('/cohort', cohortRouter)
  .route('/unsplash', unsplashRouter)
  .route('/widgets', publicWidgetsRouter)
  .route('/internal', internalRouter)
  .route('/agent', agentRouter)

  // Error handling
  .onError((err, c) => {
    Sentry.captureException(err);
    console.error('Error:', err);
    return c.json({ error: 'Internal Server Error' }, 500);
  });

// Dev-only BullMQ dashboard at /admin/queues. Mounted after the typed RPC
// chain so it doesn't pollute the client type.
mountQueueDashboard(app);
