import { describe, expect, it, vi } from 'vitest';

import { Hono } from '@api/utils/hono';

import { buildAuthorizationServerMetadata, isAuthServerDiscoveryPath, wellKnownRouter } from './well-known';

vi.mock('@cio/db/auth', () => ({
  MCP_RESOURCE: 'https://mcp.example.com',
  OAUTH_ISSUER: 'https://app.example.com/api/auth',
  OAUTH_API_SCOPES: ['course:read'],
  OAUTH_SCOPES: ['course:read', 'offline_access']
}));

const app = new Hono().route('/.well-known', wellKnownRouter);

describe('authorization server metadata', () => {
  it('points every endpoint at the issuer and advertises issuer identification', () => {
    const metadata = buildAuthorizationServerMetadata();

    expect(metadata.issuer).toBe('https://app.example.com/api/auth');
    expect(metadata.authorization_endpoint).toBe('https://app.example.com/api/auth/oauth2/authorize');
    expect(metadata.token_endpoint).toBe('https://app.example.com/api/auth/oauth2/token');
    expect(metadata.registration_endpoint).toBe('https://app.example.com/api/auth/oauth2/register');
    expect(metadata.authorization_response_iss_parameter_supported).toBe(true);
  });

  it.each([
    '/.well-known/oauth-authorization-server',
    '/.well-known/oauth-authorization-server/api/auth',
    '/.well-known/openid-configuration',
    '/.well-known/openid-configuration/api/auth'
  ])('serves the same document at %s', async (path) => {
    const response = await app.request(path);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(buildAuthorizationServerMetadata());
  });

  it('recognizes the discovery paths Better Auth also serves', () => {
    expect(isAuthServerDiscoveryPath('/api/auth/.well-known/oauth-authorization-server')).toBe(true);
    expect(isAuthServerDiscoveryPath('/api/auth/.well-known/openid-configuration')).toBe(true);
    expect(isAuthServerDiscoveryPath('/api/auth/jwks')).toBe(false);
  });
});
