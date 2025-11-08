import 'dotenv/config';

import { Hono } from '@api/utils/hono';
import { cors } from 'hono/cors';
import { courseRouter } from '@api/routes/course/course';
import { logger } from 'hono/logger';
import { mailRouter } from '@api/routes/mail';
import { accountRouter } from '@api/routes/account';
import { prettyJSON } from 'hono/pretty-json';
import rateLimiter from '@api/middlewares/rate-limiter';
import { secureHeaders } from 'hono/secure-headers';
import { auth } from '@cio/db/auth';
import { API_SERVER_URL, TRUSTED_ORIGINS } from '@api/constants';

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
      allowHeaders: ['Content-Type', 'Authorization'],
      exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
      maxAge: 600,
      credentials: true
    })
  )
  .use('*', rateLimiter)

  // Routes
  .get('/', (c) =>
    c.json({
      message: `"Welcome to Classroomio.com API - docs are at ${API_SERVER_URL}/docs"`
    })
  )
  .on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw))
  .route('/account', accountRouter)
  .route('/course', courseRouter)
  .route('/mail', mailRouter)

  // Error handling
  .onError((err, c) => {
    console.error('Error:', err);
    return c.json({ error: 'Internal Server Error' }, 500);
  });
