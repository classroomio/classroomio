import 'dotenv/config';
import './instrument';

import { API_PORT } from '@api/constants';
import { app } from '@api/app';
import { configureOpenAPI } from '@api/utils/openapi';
import { connectRedis, isTransientRedisError } from '@cio/core/utils/redis/redis';
import { env } from '@cio/core/config/env';
import { preloadVerifiedCustomDomainOriginsRegistry } from '@api/utils/origins';
import { serve } from '@hono/node-server';
import * as Sentry from '@sentry/node';
import { showRoutes } from 'hono/dev';

/**
 * Process-level safety net. Transient Redis / socket errors during Redis Cloud
 * maintenance or failover can surface as uncaught exceptions / rejections
 * (e.g. ioredis `read ECONNABORTED`, or node-redis `AggregateError [ECONNREFUSED]`
 * mid-reconnect). Those are recoverable — the clients reconnect on their own —
 * so we log and keep serving. Anything else leaves the process in an undefined
 * state, so we report it and fail fast; the orchestrator restarts us cleanly.
 */
process.on('uncaughtException', (error) => {
  if (isTransientRedisError(error)) {
    console.warn('Ignoring transient Redis error (client will reconnect):', error);
    return;
  }

  console.error('Uncaught exception:', error);
  Sentry.captureException(error);
  void Sentry.flush(2000).finally(() => process.exit(1));
});

process.on('unhandledRejection', (reason) => {
  if (isTransientRedisError(reason)) {
    console.warn('Ignoring transient Redis rejection (client will reconnect):', reason);
    return;
  }

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
