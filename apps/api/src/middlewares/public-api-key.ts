import { Context, Next } from 'hono';
import { validateApiKey } from '@api/services/public-api';
import { AppError } from '@api/utils/errors';

/**
 * Middleware to authenticate requests using organization-scoped API keys
 * Reads Authorization: Bearer cio_live_... header
 * Validates the key hash, checks revocation and expiration
 * Sets orgId in context for use in route handlers
 */
export const publicApiKeyMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json(
        {
          success: false,
          message: 'Unauthorized: Missing or invalid Authorization header'
        },
        401
      );
    }

    const rawApiKey = authHeader.replace('Bearer ', '').trim();

    // Validate API key using service (single source of truth)
    const apiKey = await validateApiKey(rawApiKey);

    // Set context for route handlers
    c.set('orgId', apiKey.organizationId);
    c.set('apiKey', apiKey);
    c.set('createdByProfileId', apiKey.createdByProfileId);

    await next();
  } catch (error) {
    // Handle AppError with proper status codes
    if (error instanceof AppError) {
      return c.json(
        {
          success: false,
          message: error.message
        },
        error.statusCode
      );
    }

    console.error('Error in publicApiKeyMiddleware:', error);
    return c.json(
      {
        success: false,
        message: 'Internal server error'
      },
      500
    );
  }
};
