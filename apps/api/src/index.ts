import 'dotenv/config';

import { API_PORT } from '@api/constants';
import { app } from '@api/app';
import { configureOpenAPI } from '@api/utils/openapi';
import { connectRedis } from '@api/utils/redis/redis';
import { serve } from '@hono/node-server';
import { showRoutes } from 'hono/dev';

// Start server
async function startServer() {
  console.log('Starting server on port:', API_PORT);

  // Connect to Redis (non-blocking: API starts even if Redis fails)
  await connectRedis();

  serve({ fetch: app.fetch, port: API_PORT });

  showRoutes(app, { colorize: true });
}

configureOpenAPI(app);

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
