import 'dotenv/config';
import './instrument';

import { API_PORT } from '@api/constants';
import { app } from '@api/app';
import { configureOpenAPI } from '@api/utils/openapi';
import { connectRedis } from '@cio/core/utils/redis/redis';
import { env } from '@cio/core/config/env';
import { preloadVerifiedCustomDomainOriginsRegistry } from '@api/utils/origins';
import { serve } from '@hono/node-server';
import { showRoutes } from 'hono/dev';

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
