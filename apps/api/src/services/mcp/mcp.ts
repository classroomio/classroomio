import type { TOrganizationApiKey } from '@cio/db/types';
import { ClassroomIoApiClient, createMcpServer } from '@classroomio/mcp/server';
import { MCP_RESOURCE } from '@cio/db/auth';

import { AppError, ErrorCodes } from '@api/utils/errors';
import { authenticateOAuthAccessTokenService } from '@api/services/oauth/oauth';
import { authenticateOrganizationApiKeyService } from '@api/services/organization/automation-key';
import { AUTOMATION_KEY_PREFIX } from '@api/middlewares/oauth-token';
import { dispatchInternalRequest } from '@api/utils/internal-dispatch';

const INTERNAL_API_ORIGIN = 'http://mcp.internal';
const FORWARDED_CLIENT_HEADERS = ['cf-connecting-ip', 'x-real-ip', 'x-forwarded-for'] as const;

/**
 * Resolves the bearer credential of an MCP request to its organization key.
 * Throws 401 when the credential is invalid and 403 when it was not issued for MCP.
 */
export async function authenticateMcpCredentialService(credential: string): Promise<TOrganizationApiKey> {
  const key = credential.startsWith(AUTOMATION_KEY_PREFIX)
    ? await authenticateOrganizationApiKeyService(credential)
    : await authenticateOAuthAccessTokenService(credential);

  if (key.type !== 'mcp') {
    throw new AppError('This credential cannot be used with the MCP endpoint', ErrorCodes.FORBIDDEN, 403);
  }

  return key;
}

/**
 * URL of the protected resource metadata document that clients follow to find the authorization server.
 */
export function getMcpResourceMetadataUrl(): string {
  const resource = new URL(MCP_RESOURCE);
  const resourcePath = resource.pathname === '/' ? '' : resource.pathname;

  return `${resource.origin}/.well-known/oauth-protected-resource${resourcePath}`;
}

/**
 * Builds an MCP server whose tool calls run in-process against the caller's own credential,
 * so every tool is subject to the same routes, scopes, limits and metering as a direct API call.
 * Tools that read the server's filesystem are never registered.
 */
export function createRemoteMcpServer(options: { credential: string; requestHeaders: Headers; env: unknown }) {
  const forwardedHeaders: Record<string, string> = {};

  for (const name of FORWARDED_CLIENT_HEADERS) {
    const value = options.requestHeaders.get(name);

    if (value) forwardedHeaders[name] = value;
  }

  const apiClient = new ClassroomIoApiClient(
    {
      CLASSROOMIO_API_URL: INTERNAL_API_ORIGIN,
      CLASSROOMIO_API_KEY: options.credential,
      CLASSROOMIO_USER_AGENT: 'classroomio-mcp-remote'
    },
    {
      fetch: (input, init) => Promise.resolve(dispatchInternalRequest(new Request(input, init), options.env)),
      headers: forwardedHeaders
    }
  );

  return createMcpServer(apiClient, { includeLocalFileTools: false });
}
