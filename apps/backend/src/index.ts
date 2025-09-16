import 'dotenv/config';

import { Hono } from 'hono';
import { configureOpenAPI } from '$src/utils/openapi';
import { cors } from 'hono/cors';
import { courseRouter } from '$src/routes/course/course';
import { env } from '$src/config/env';
import { logger } from 'hono/logger';
import { mailRouter } from '$src/routes/mail';
import { prettyJSON } from 'hono/pretty-json';
import { rateLimiter } from 'hono-rate-limiter';
import { secureHeaders } from 'hono/secure-headers';
import { serve } from '@hono/node-server';
import { showRoutes } from 'hono/dev';

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
  .use(
    rateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
      standardHeaders: 'draft-6', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
      keyGenerator: (c) => c.req.header('Authorization')?.split(' ')[1] ?? 'unknown' // Method to generate custom identifiers for clients.
    })
  )

  // Routes
  .get('/', (c) => c.json({ message: 'Welcome to ClassroomIO' }))
  .route('/course', courseRouter)
  .route('/mail', mailRouter)

  // Error handling
  .onError((err, c) => {
    console.error('Error:', err);
    return c.json({ error: 'Internal Server Error' }, 500);
  });

// Start server
const port = env.PORT ? parseInt(env.PORT) : 3002;

function startServer() {
  console.log('Starting server...');

  serve({ fetch: app.fetch, port });

  showRoutes(app, { colorize: true });
}

configureOpenAPI(app);

startServer();
