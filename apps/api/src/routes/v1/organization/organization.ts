import { ZPublicApiOrganizationResponse, ZPublicApiUpdateOrganization } from '@cio/utils/validation/public-api';
import {
  getPublicApiOrganizationService,
  updatePublicApiOrganizationService
} from '@api/services/v1/organization/organization';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse } from '@api/utils/openapi/responses';
import { mcpRateLimitResponse } from '../courses/docs';
import { ORG_ADMIN_RULE, ORGANIZATION_CACHE_CONTROL, ORGANIZATION_TAG, organizationForbiddenResponse } from './docs';

const OrganizationResponse = itemResponse(ZPublicApiOrganizationResponse);

export const v1OrganizationProfileRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `Get the organization's name, logo and theme; ${ORG_ADMIN_RULE}.`,
      tags: [ORGANIZATION_TAG],
      responses: {
        200: jsonResponse('The organization', OrganizationResponse),
        401: errorResponses.unauthorized,
        403: organizationForbiddenResponse('organization:read'),
        429: mcpRateLimitResponse
      }
    }),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const organization = await getPublicApiOrganizationService(orgId, actorId);

        c.header('Cache-Control', ORGANIZATION_CACHE_CONTROL);
        return c.json({ success: true, data: organization }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to fetch organization');
      }
    }
  )
  .patch(
    '/',
    describeRoute({
      description: `Update the organization's name, logo or theme; omitted fields keep their values; ${ORG_ADMIN_RULE}.`,
      tags: [ORGANIZATION_TAG],
      responses: {
        200: jsonResponse('Organization updated', OrganizationResponse),
        400: { description: 'Invalid body, or no fields to update' },
        401: errorResponses.unauthorized,
        403: organizationForbiddenResponse('organization:write'),
        429: mcpRateLimitResponse
      }
    }),
    validator('json', ZPublicApiUpdateOrganization),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const payload = c.req.valid('json');
        const organization = await updatePublicApiOrganizationService(orgId, actorId, payload);

        return c.json({ success: true, data: organization }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update organization');
      }
    }
  );
