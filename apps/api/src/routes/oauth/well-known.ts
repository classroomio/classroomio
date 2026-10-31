import { MCP_RESOURCE, OAUTH_API_SCOPES, OAUTH_ISSUER, OAUTH_SCOPES } from '@cio/db/auth';

import { Hono } from '@api/utils/hono';

function buildAuthorizationServerMetadata() {
  return {
    issuer: OAUTH_ISSUER,
    authorization_endpoint: `${OAUTH_ISSUER}/oauth2/authorize`,
    token_endpoint: `${OAUTH_ISSUER}/oauth2/token`,
    registration_endpoint: `${OAUTH_ISSUER}/oauth2/register`,
    revocation_endpoint: `${OAUTH_ISSUER}/oauth2/revoke`,
    jwks_uri: `${OAUTH_ISSUER}/jwks`,
    scopes_supported: OAUTH_SCOPES,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'client_secret_basic'],
    code_challenge_methods_supported: ['S256']
  };
}

function buildMcpProtectedResourceMetadata() {
  return {
    resource: MCP_RESOURCE,
    authorization_servers: [OAUTH_ISSUER],
    scopes_supported: OAUTH_API_SCOPES,
    bearer_methods_supported: ['header']
  };
}

export const wellKnownRouter = new Hono()
  .get('/oauth-authorization-server', (c) => c.json(buildAuthorizationServerMetadata()))
  .get('/oauth-authorization-server/*', (c) => c.json(buildAuthorizationServerMetadata()))
  .get('/oauth-protected-resource', (c) => c.json(buildMcpProtectedResourceMetadata()))
  .get('/oauth-protected-resource/*', (c) => c.json(buildMcpProtectedResourceMetadata()));
