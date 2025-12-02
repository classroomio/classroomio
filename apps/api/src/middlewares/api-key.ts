import { Context, Next } from 'hono';

import { env } from '@api/config/env';

/**
 * Middleware to authenticate requests using API key
 * Checks for Authorization: Bearer <api-key> header
 * Used for server-to-server communication (webhooks, etc.)
 */
export const apiKeyMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json(
        {
          success: false,
          message: 'Unauthorized: Missing or invalid API key'
        },
        401
      );
    }

    const apiKey = authHeader.replace('Bearer ', '').trim();
    const expectedApiKey = env.SERVER_KEY;

    if (!expectedApiKey) {
      console.error('SERVER_KEY not configured in environment');
      return c.json(
        {
          success: false,
          message: 'Server configuration error'
        },
        500
      );
    }

    if (apiKey !== expectedApiKey) {
      return c.json(
        {
          success: false,
          message: 'Unauthorized: Invalid API key'
        },
        401
      );
    }

    // API key is valid, continue
    await next();
  } catch (error) {
    return c.json(
      {
        success: false,
        message: 'Unauthorized'
      },
      401
    );
  }
};
