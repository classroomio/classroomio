import { generateKeyPairSync, sign } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@db/queries/auth/oauth', () => ({ listPublicJwks: vi.fn(async () => [publicJwk]) }));

import { MCP_RESOURCE, MCP_RESOURCE_IDENTIFIERS, OAUTH_ISSUER, PUBLIC_API_RESOURCE } from '@cio/db/constants';
import { verifyOAuthAccessToken } from '@cio/db/auth/oauth/verify-access-token';

const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
const publicJwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key', alg: 'ES256' };

function encode(value: object) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function signToken(audience: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: 'ES256', kid: 'test-key', typ: 'JWT' });
  const payload = encode({
    iss: OAUTH_ISSUER,
    sub: 'user-1',
    aud: audience,
    azp: 'client-1',
    org_id: 'org-1',
    iat: now,
    exp: now + 300
  });
  const signature = sign('sha256', Buffer.from(`${header}.${payload}`), {
    key: privateKey,
    dsaEncoding: 'ieee-p1363'
  }).toString('base64url');

  return `${header}.${payload}.${signature}`;
}

describe('MCP OAuth resource identifiers', () => {
  it('accepts the cloud MCP URL with and without a trailing slash', () => {
    expect(MCP_RESOURCE).toBe('https://mcp.classroomio.com');
    expect(MCP_RESOURCE_IDENTIFIERS).toEqual(['https://mcp.classroomio.com', 'https://mcp.classroomio.com/']);
  });

  it.each(MCP_RESOURCE_IDENTIFIERS)('verifies an MCP token issued for %s', async (audience) => {
    const token = await signToken(audience);

    await expect(verifyOAuthAccessToken(token, 'mcp')).resolves.toMatchObject({ kind: 'mcp' });
    await expect(verifyOAuthAccessToken(token, 'any')).resolves.toMatchObject({ kind: 'mcp' });
    await expect(verifyOAuthAccessToken(token, 'api')).rejects.toThrow();
  });

  it('keeps public API tokens out of the MCP endpoint', async () => {
    const token = await signToken(PUBLIC_API_RESOURCE);

    await expect(verifyOAuthAccessToken(token, 'any')).resolves.toMatchObject({ kind: 'api' });
    await expect(verifyOAuthAccessToken(token, 'mcp')).rejects.toThrow();
  });
});
