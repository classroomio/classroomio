import {
  ZPublicApiOrganizationCustomizationResponse,
  ZPublicApiUpdateOrganizationCustomization
} from '@cio/utils/validation/public-api';
import {
  getPublicApiOrganizationCustomizationService,
  updatePublicApiOrganizationCustomizationService
} from '@api/services/v1/organization/customization';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse } from '@api/utils/openapi/responses';
import { mcpRateLimitResponse } from '../courses/docs';
import {
  CUSTOMIZATION_TAG,
  ORG_ADMIN_RULE,
  ORGANIZATION_CACHE_CONTROL,
  organizationForbiddenResponse,
  organizationPlanForbiddenResponse
} from './docs';

const CustomizationResponse = itemResponse(ZPublicApiOrganizationCustomizationResponse);

export const v1OrganizationCustomizationRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `Get the LMS customization students see (dashboard widgets and banner, course tabs, lesson comments, login background), with defaults filled in; ${ORG_ADMIN_RULE}.`,
      tags: [CUSTOMIZATION_TAG],
      responses: {
        200: jsonResponse('The LMS customization', CustomizationResponse),
        401: errorResponses.unauthorized,
        403: organizationForbiddenResponse('organization:read'),
        429: mcpRateLimitResponse
      }
    }),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const customization = await getPublicApiOrganizationCustomizationService(orgId, actorId);

        c.header('Cache-Control', ORGANIZATION_CACHE_CONTROL);
        return c.json({ success: true, data: customization }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to fetch LMS customization');
      }
    }
  )
  .patch(
    '/',
    describeRoute({
      description: `Update the LMS customization; omitted fields keep their values; ${ORG_ADMIN_RULE}. Setting a login background needs a paid plan or a self-hosted install.`,
      tags: [CUSTOMIZATION_TAG],
      responses: {
        200: jsonResponse('LMS customization updated', CustomizationResponse),
        400: { description: 'Invalid body, or no fields to update' },
        401: errorResponses.unauthorized,
        403: organizationPlanForbiddenResponse,
        429: mcpRateLimitResponse
      }
    }),
    validator('json', ZPublicApiUpdateOrganizationCustomization),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const payload = c.req.valid('json');
        const customization = await updatePublicApiOrganizationCustomizationService(orgId, actorId, payload);

        return c.json({ success: true, data: customization }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update LMS customization');
      }
    }
  );
