import 'dotenv/config';

import { API_PORT } from '@api/constants';
import { app } from '@api/app';
import { configureOpenAPI } from '@api/utils/openapi';
import { serve } from '@hono/node-server';
import { showRoutes } from 'hono/dev';

// Start server
function startServer() {
  console.log('Starting server on port:', API_PORT);

  serve({ fetch: app.fetch, port: API_PORT });

  showRoutes(app, { colorize: true });
}

configureOpenAPI(app);

startServer();
