import { ZPublicApiConnectCustomDomain, ZPublicApiUpdateDomain } from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

const ORG_ADMIN_RULE = 'the API key creator must be an org admin';

const READ_ONLY: ToolAnnotations = { readOnlyHint: true, destructiveHint: false };
const UPDATE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: true };
const DESTRUCTIVE: ToolAnnotations = { readOnlyHint: false, destructiveHint: true };

const NO_INPUT = {} as ZodRawShapeCompat;

const asText = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data) }] });

export function registerDomainTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'get_domain',
    `Get the subdomain, favicon and custom domain the organization site is served on; ${ORG_ADMIN_RULE}.`,
    NO_INPUT,
    READ_ONLY,
    async () => asText(await apiClient.getDomain())
  );

  server.tool(
    'update_domain',
    `Change the site subdomain or favicon; ${ORG_ADMIN_RULE}. A new subdomain breaks every link to the old one, so confirm with the user first.`,
    ZPublicApiUpdateDomain.shape as unknown as ZodRawShapeCompat,
    UPDATE,
    async (args) => asText(await apiClient.updateDomain(ZPublicApiUpdateDomain.parse(args)))
  );

  server.tool(
    'connect_custom_domain',
    `Connect a custom domain (paid plans only), or reconnect the one already connected; ${ORG_ADMIN_RULE}. Returns the DNS records the user must add; then call refresh_custom_domain until it is verified.`,
    ZPublicApiConnectCustomDomain.shape as unknown as ZodRawShapeCompat,
    UPDATE,
    async (args) => asText(await apiClient.connectCustomDomain(ZPublicApiConnectCustomDomain.parse(args)))
  );

  server.tool(
    'refresh_custom_domain',
    `Check DNS and SSL for the connected custom domain again; ${ORG_ADMIN_RULE}.`,
    NO_INPUT,
    UPDATE,
    async () => asText(await apiClient.refreshCustomDomain())
  );

  server.tool(
    'remove_custom_domain',
    `Remove the connected custom domain so the site is served only on its subdomain; ${ORG_ADMIN_RULE}. Confirm with the user first.`,
    NO_INPUT,
    DESTRUCTIVE,
    async () => asText(await apiClient.removeCustomDomain())
  );
}
