import 'dotenv/config';

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { courseRouter } from '$src/routes/course/course';
import { logger } from 'hono/logger';
import { mailRouter } from '$src/routes/mail';
import { prettyJSON } from 'hono/pretty-json';
import { rateLimiterMiddleware } from '$src/middlewares/rate-limiter';
import { secureHeaders } from 'hono/secure-headers';

// Create Hono app with chaining for RPC support
export const app = new Hono()
  // Middleware
  .use('*', logger())
  .use('*', prettyJSON())
  .use('*', secureHeaders())
  .use(
    '*',
    cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
      exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
      maxAge: 600,
      credentials: true
    })
  )
  .use('*', rateLimiterMiddleware)

  // Routes
  .get('/', (c) =>
    c.json({
      message: '"Welcome to Classroomio.com API - docs are at https://api.classroomio.com/docs"'
    })
  )
  .route('/course', courseRouter)
  .route('/mail', mailRouter)

  // Error handling
  .onError((err, c) => {
    console.error('Error:', err);
    return c.json({ error: 'Internal Server Error' }, 500);
  });
