import { getLicenseStatus } from '@api/services/license';
import { Hono } from '@api/utils/hono';
import { authOrApiKeyMiddleware } from '@api/middlewares/auth-or-api-key';
import { handleError } from '@api/utils/errors';

export const licenseRouter = new Hono()
  /**
   * GET /license/features
   * Returns the list of licensed features for the current instance.
   * Used by the dashboard to gate UI (PostHog, Senja, SSO, token-auth, etc.).
   * Accepts: User session OR API key (for server-side layout load)
   */
  .get('/features', authOrApiKeyMiddleware, async (c) => {
    try {
      const status = await getLicenseStatus();
      return c.json(
        {
          success: true,
          data: {
            valid: status.valid,
            features: status.features,
            expiresAt: status.expiresAt
          }
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to fetch license features');
    }
  });
