import 'dotenv/config';

import { app } from '@api/app';
import { configureOpenAPI } from '@api/utils/openapi';
import { env } from '@api/config/env';
import { serve } from '@hono/node-server';
import { showRoutes } from 'hono/dev';

// Start server
const port = env.PORT ? parseInt(env.PORT) : 3002;

function startServer() {
  console.log('Starting server on port:', port);

  serve({ fetch: app.fetch, port });

  showRoutes(app, { colorize: true });
}

configureOpenAPI(app);

startServer();
