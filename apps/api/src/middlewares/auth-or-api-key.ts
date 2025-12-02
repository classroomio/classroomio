import { Context, Next } from 'hono';

import { apiKeyMiddleware } from './api-key';
import { authMiddleware } from './auth';

/**
 * Middleware that accepts either user authentication OR API key
 * Used for endpoints that can be accessed by:
 * 1. Authenticated users (via session cookies)
 * 2. Server-to-server calls (via API key)
 */
export const authOrApiKeyMiddleware = async (c: Context, next: Next) => {
  const user = c.get('user');
  const session = c.get('session');

  if (user && session) {
    await next();
    return;
  }

  const authHeader = c.req.header('Authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return apiKeyMiddleware(c, next);
  }

  return c.json(
    {
      success: false,
      message: 'Unauthorized: Authentication required (session or API key)'
    },
    401
  );
};
