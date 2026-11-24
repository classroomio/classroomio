import { ZPublicApiMeResponse } from '@cio/utils/validation/public-api';
import { describeRoute } from 'hono-openapi';

import { getMeService } from '@api/services/v1/me/me';
import { toAutomationPrincipal } from '@api/utils/automation-principal';
import { handlePublicApiError } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import { errorResponses, itemResponse, jsonResponse } from '@api/utils/openapi/responses';
import { mcpRateLimitResponse } from '../courses/docs';
import { CONNECTION_TAG } from './docs';

export const v1MeRouter = new Hono().get(
  '/',
  describeRoute({
    description:
      'Get the organization, connection and acting admin behind the credential; any valid key or OAuth token can call it.',
    tags: [CONNECTION_TAG],
    responses: {
      200: jsonResponse('The credential is valid', itemResponse(ZPublicApiMeResponse)),
      401: errorResponses.unauthorized,
      429: mcpRateLimitResponse
    }
  }),
  async (c) => {
    try {
      const orgId = c.get('orgId')!;
      const actorId = c.get('actorId');
      const principal = toAutomationPrincipal(c.get('automationKey'), c.get('oauthClientId'));
      const me = await getMeService(orgId, actorId, principal);

      return c.json({ success: true, data: me }, 200);
    } catch (error) {
      return handlePublicApiError(c, error, 'Failed to load the connection');
    }
  }
);
