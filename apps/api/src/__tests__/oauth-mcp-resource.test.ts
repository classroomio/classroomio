import { generateKeyPairSync, sign } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@db/queries/auth/oauth', () => ({ listPublicJwks: vi.fn(async () => [publicJwk]) }));

const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
const publicJwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key', alg: 'ES256' };

function encode(value: object) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function signToken(issuer: string, audience: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: 'ES256', kid: 'test-key', typ: 'JWT' });
  const payload = encode({
    iss: issuer,
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

async function loadWithEnv(env: Record<string, string>) {
  vi.resetModules();
  vi.stubEnv('PUBLIC_IS_SELFHOSTED', '');
  vi.stubEnv('DASHBOARD_ORIGIN', '');
  vi.stubEnv('NODE_ENV', 'production');
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);

  const constants = await import('@cio/db/constants');
  const { verifyOAuthAccessToken } = await import('@cio/db/auth/oauth/verify-access-token');

  return { ...constants, verifyOAuthAccessToken };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('MCP OAuth resource identifiers', () => {
  it('accepts the cloud MCP URL with and without a trailing slash', async () => {
    const { MCP_RESOURCE, MCP_RESOURCE_IDENTIFIERS } = await loadWithEnv({});

    expect(MCP_RESOURCE).toBe('https://mcp.classroomio.com');
    expect(MCP_RESOURCE_IDENTIFIERS).toEqual(['https://mcp.classroomio.com', 'https://mcp.classroomio.com/']);
  });

  it('keeps a single identifier for a self-hosted /mcp URL', async () => {
    const { MCP_RESOURCE_IDENTIFIERS } = await loadWithEnv({
      PUBLIC_IS_SELFHOSTED: 'true',
      DASHBOARD_ORIGIN: 'https://lms.example.com'
    });

    expect(MCP_RESOURCE_IDENTIFIERS).toEqual(['https://lms.example.com/mcp']);
  });

  it.each(['https://mcp.classroomio.com', 'https://mcp.classroomio.com/'])(
    'verifies an MCP token issued for %s',
    async (audience) => {
      const { OAUTH_ISSUER, verifyOAuthAccessToken } = await loadWithEnv({});
      const token = signToken(OAUTH_ISSUER, audience);

      await expect(verifyOAuthAccessToken(token, 'mcp')).resolves.toMatchObject({ kind: 'mcp' });
      await expect(verifyOAuthAccessToken(token, 'any')).resolves.toMatchObject({ kind: 'mcp' });
      await expect(verifyOAuthAccessToken(token, 'api')).rejects.toThrow();
    }
  );

  it('keeps public API tokens out of the MCP endpoint', async () => {
    const { OAUTH_ISSUER, PUBLIC_API_RESOURCE, verifyOAuthAccessToken } = await loadWithEnv({});
    const token = signToken(OAUTH_ISSUER, PUBLIC_API_RESOURCE);

    await expect(verifyOAuthAccessToken(token, 'any')).resolves.toMatchObject({ kind: 'api' });
    await expect(verifyOAuthAccessToken(token, 'mcp')).rejects.toThrow();
  });
});
