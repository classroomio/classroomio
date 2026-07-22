import 'dotenv/config';
import './instrument';

import { API_PORT } from '@api/constants';
import { app } from '@api/app';
import { configureOpenAPI } from '@api/utils/openapi';
import { connectRedis } from '@cio/core/utils/redis/redis';
import { env } from '@cio/core/config/env';
import { preloadVerifiedCustomDomainOriginsRegistry } from '@api/utils/origins';
import { serve } from '@hono/node-server';
import * as Sentry from '@sentry/node';
import { showRoutes } from 'hono/dev';

/**
 * Transient Redis / ioredis disconnects (e.g. `read ECONNABORTED` during Redis
 * Cloud maintenance) are handled at the connection layer, so they no longer
 * reach here. Anything that does reach `uncaughtException` leaves the process in
 * an undefined state, so we report it and fail fast — the orchestrator restarts
 * us cleanly instead of running on in a corrupted state.
 */
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  Sentry.captureException(error);
  void Sentry.flush(2000).finally(() => process.exit(1));
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  Sentry.captureException(reason);
});

// Start server
async function startServer() {
  console.log('Starting server on port:', API_PORT);

  // Connect to Redis (non-blocking: API starts even if Redis fails)
  await connectRedis();

  preloadVerifiedCustomDomainOriginsRegistry().then(() => {
    console.log('Verified custom domain origins preloaded');
  });

  serve({ fetch: app.fetch, port: API_PORT });

  if (env.NODE_ENV !== 'production') {
    showRoutes(app, { colorize: true });
  }
}

configureOpenAPI(app);

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});
