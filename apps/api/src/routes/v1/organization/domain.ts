import {
  ZPublicApiConnectCustomDomain,
  ZPublicApiCustomDomainSetupResponse,
  ZPublicApiDomainResponse,
  ZPublicApiUpdateDomain
} from '@cio/utils/validation/public-api';
import {
  connectCustomDomainService,
  getDomainService,
  refreshCustomDomainService,
  removeCustomDomainService,
  updateDomainService
} from '@api/services/v1/organization/domain';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse } from '@api/utils/openapi/responses';
import { mcpRateLimitResponse } from '../courses/docs';
import { DOMAIN_TAG, ORG_ADMIN_RULE, organizationForbiddenResponse } from './docs';

const DomainResponse = itemResponse(ZPublicApiDomainResponse);
const SetupResponse = itemResponse(ZPublicApiCustomDomainSetupResponse);
const domainWriteForbidden = organizationForbiddenResponse('organization:domain:write');
const noCustomDomain = { description: 'No custom domain is connected (code CUSTOM_DOMAIN_NOT_FOUND)' };
const providerUnavailable = {
  description: 'Custom domains are not set up on this instance (code CUSTOM_DOMAIN_UNAVAILABLE)'
};

export const v1DomainRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `Get the subdomain, favicon and custom domain the organization site is served on; ${ORG_ADMIN_RULE}.`,
      tags: [DOMAIN_TAG],
      responses: {
        200: jsonResponse('Site address settings', DomainResponse),
        401: errorResponses.unauthorized,
        403: organizationForbiddenResponse('organization:read'),
        429: mcpRateLimitResponse
      }
    }),
    async (c) => {
      try {
        const domain = await getDomainService(c.get('orgId')!, c.get('actorId'));

        c.header('Cache-Control', 'private, no-store');
        return c.json({ success: true, data: domain }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to fetch domain settings');
      }
    }
  )
  .patch(
    '/',
    describeRoute({
      description: `Change the subdomain or favicon; ${ORG_ADMIN_RULE}. A new subdomain breaks every link to the old one.`,
      tags: [DOMAIN_TAG],
      responses: {
        200: jsonResponse('Site address settings after the change', DomainResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: domainWriteForbidden,
        409: { description: 'Another organization already uses this subdomain (code SITENAME_EXISTS)' },
        429: mcpRateLimitResponse
      }
    }),
    validator('json', ZPublicApiUpdateDomain),
    async (c) => {
      try {
        const domain = await updateDomainService(c.get('orgId')!, c.get('actorId'), c.req.valid('json'));

        return c.json({ success: true, data: domain }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update domain settings');
      }
    }
  )
  .put(
    '/custom',
    describeRoute({
      description: `Connect a custom domain, or reconnect the one already connected; ${ORG_ADMIN_RULE}. Add the returned DNS records, then refresh until it is verified.`,
      tags: [DOMAIN_TAG],
      responses: {
        200: jsonResponse('Domain connected, with the DNS records to add', SetupResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: {
          description: `${domainWriteForbidden.description} Also returned with code UPGRADE_REQUIRED when the organization is on the free plan.`
        },
        409: {
          description:
            'Another custom domain is connected (remove it first), the domain belongs to another organization (code CUSTOM_DOMAIN_TAKEN), or custom domains are not set up on this instance (code CUSTOM_DOMAIN_UNAVAILABLE)'
        },
        429: mcpRateLimitResponse
      }
    }),
    validator('json', ZPublicApiConnectCustomDomain),
    async (c) => {
      try {
        const result = await connectCustomDomainService(c.get('orgId')!, c.get('actorId'), c.req.valid('json'));

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to connect custom domain');
      }
    }
  )
  .post(
    '/custom/refresh',
    describeRoute({
      description: `Check DNS and SSL for the connected custom domain again; ${ORG_ADMIN_RULE}.`,
      tags: [DOMAIN_TAG],
      responses: {
        200: jsonResponse('Current verification status and DNS records', SetupResponse),
        401: errorResponses.unauthorized,
        403: domainWriteForbidden,
        404: noCustomDomain,
        409: providerUnavailable,
        429: mcpRateLimitResponse
      }
    }),
    async (c) => {
      try {
        const result = await refreshCustomDomainService(c.get('orgId')!, c.get('actorId'));

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to refresh custom domain');
      }
    }
  )
  .delete(
    '/custom',
    describeRoute({
      description: `Remove the connected custom domain; the site stays on its subdomain. ${ORG_ADMIN_RULE}; works on every plan.`,
      tags: [DOMAIN_TAG],
      responses: {
        200: jsonResponse('Domain removed', SetupResponse),
        401: errorResponses.unauthorized,
        403: domainWriteForbidden,
        404: noCustomDomain,
        409: providerUnavailable,
        429: mcpRateLimitResponse
      }
    }),
    async (c) => {
      try {
        const result = await removeCustomDomainService(c.get('orgId')!, c.get('actorId'));

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to remove custom domain');
      }
    }
  );
