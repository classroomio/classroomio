import { Hono } from '@api/utils/hono';
import { apiKeyRouter } from './api-key';
import { v1Router } from './v1';

export const publicApiRouter = new Hono().route('/', apiKeyRouter).route('/v1', v1Router);
