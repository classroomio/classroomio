import 'dotenv/config';

import { Hono } from 'hono';
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

// Create Hono app
const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', secureHeaders());
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 600,
    credentials: true
  })
);

app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-6', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    keyGenerator: (c) => c.req.header('Authorization')?.split(' ')[1] ?? 'unknown' // Method to generate custom identifiers for clients.
  })
);

// Routes
app.get('/', (c) => c.json({ message: 'Welcome to ClassroomIO' }));

app.route('/course', courseRouter);
app.route('/mail', mailRouter);

// Error handling
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

// Start server
const port = env.PORT ? parseInt(env.PORT) : 3002;

function startServer() {
  console.log('Starting server...');
  console.log('this is a change');
  serve({ fetch: app.fetch, port });

  showRoutes(app, { colorize: true });
}

startServer();
