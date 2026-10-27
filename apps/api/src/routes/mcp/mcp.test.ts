import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError, ErrorCodes } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import { setInternalDispatch } from '@api/utils/internal-dispatch';
import { isInternalRequest } from '@api/utils/internal-request';
import { mcpCors } from '@api/middlewares/cors';

import { mcpRouter } from './mcp';

const mocks = vi.hoisted(() => ({
  authenticateKey: vi.fn(),
  authenticateOAuth: vi.fn()
}));

vi.mock('@cio/db/auth', () => ({ MCP_RESOURCE: 'https://mcp.example.com/mcp' }));
vi.mock('@api/services/organization/automation-key', () => ({
  authenticateOrganizationApiKeyService: mocks.authenticateKey,
  touchOrganizationApiKeyLastUsedService: vi.fn()
}));
vi.mock('@api/services/oauth/oauth', () => ({
  authenticateOAuthAccessTokenService: mocks.authenticateOAuth
}));

const app = new Hono().route('/mcp', mcpRouter);

const JSON_HEADERS = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' };

function rpc(method: string, params: Record<string, unknown> = {}, headers: Record<string, string> = {}) {
  return app.request('/mcp', {
    method: 'POST',
    headers: { ...JSON_HEADERS, ...headers },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  });
}

const dispatched = vi.fn<[Request], Response>();

describe('POST /mcp', () => {
  beforeEach(() => {
    mocks.authenticateKey.mockReset();
    mocks.authenticateOAuth.mockReset();
    mocks.authenticateOAuth.mockResolvedValue({ id: 'key-1', type: 'mcp', organizationId: 'org-1' });
    dispatched.mockReset();
    dispatched.mockImplementation(
      () =>
        new Response(
          JSON.stringify({ success: true, data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
          {
            headers: { 'content-type': 'application/json' }
          }
        )
    );
    setInternalDispatch((request) => dispatched(request));
  });

  it('challenges unauthenticated requests with the protected resource metadata URL', async () => {
    const response = await rpc('initialize');

    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toBe(
      'Bearer resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource/mcp"'
    );
  });

  it('answers 401 without leaking the reason when the credential is rejected', async () => {
    mocks.authenticateOAuth.mockRejectedValue(new AppError('Access has been revoked', ErrorCodes.UNAUTHORIZED, 401));

    const response = await rpc('initialize', {}, { Authorization: 'Bearer eyJhbGciOi' });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.message).toBe('Invalid or expired credential');
  });

  it('refuses credentials that were not issued for MCP', async () => {
    mocks.authenticateOAuth.mockResolvedValue({ id: 'key-1', type: 'api', organizationId: 'org-1' });

    const response = await rpc('initialize', {}, { Authorization: 'Bearer eyJhbGciOi' });

    expect(response.status).toBe(403);
  });

  it('authenticates cio_ credentials as automation keys', async () => {
    mocks.authenticateKey.mockResolvedValue({ id: 'key-2', type: 'mcp', organizationId: 'org-1' });

    const response = await rpc('initialize', {}, { Authorization: 'Bearer cio_mcp_abc' });

    expect(response.status).toBe(200);
    expect(mocks.authenticateKey).toHaveBeenCalledWith('cio_mcp_abc');
    expect(mocks.authenticateOAuth).not.toHaveBeenCalled();
  });

  it('requires OAuth tokens to be issued for the MCP resource', async () => {
    await rpc('initialize', {}, { Authorization: 'Bearer eyJhbGciOi' });

    expect(mocks.authenticateOAuth).toHaveBeenCalledWith('eyJhbGciOi', 'mcp');
  });

  it('completes initialize and reports the server identity', async () => {
    const response = await rpc(
      'initialize',
      { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } },
      { Authorization: 'Bearer eyJhbGciOi' }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.result.serverInfo.name).toBe('classroomio-course-authoring');
    expect(response.headers.get('mcp-session-id')).toBeNull();
  });

  it('lists tools without exposing local filesystem tools', async () => {
    const response = await rpc('tools/list', {}, { Authorization: 'Bearer eyJhbGciOi' });
    const body = await response.json();
    const names: string[] = body.result.tools.map((tool: { name: string }) => tool.name);

    expect(names).toContain('list_team_members');
    expect(names).not.toContain('upload_video');
  });

  it('runs a tool call through the internal dispatch with the caller credential', async () => {
    const response = await rpc(
      'tools/call',
      { name: 'list_team_members', arguments: {} },
      { Authorization: 'Bearer eyJhbGciOi', 'cf-connecting-ip': '203.0.113.7' }
    );

    expect(response.status).toBe(200);
    expect(dispatched).toHaveBeenCalledTimes(1);

    const forwarded = dispatched.mock.calls[0]![0];

    expect(new URL(forwarded.url).pathname).toBe('/public-api/v1/team');
    expect(forwarded.headers.get('authorization')).toBe('Bearer eyJhbGciOi');
    expect(forwarded.headers.get('cf-connecting-ip')).toBe('203.0.113.7');
    expect(isInternalRequest(forwarded.headers)).toBe(true);
  });
});

describe('other methods on /mcp', () => {
  it.each(['GET', 'DELETE'])('rejects %s with 405', async (method) => {
    const response = await app.request('/mcp', { method });

    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST');
  });
});

describe('mcpCors', () => {
  const corsApp = new Hono()
    .use('/mcp', mcpCors)
    .post('/mcp', (c) => c.body(null, 401, { 'WWW-Authenticate': 'Bearer' }));

  it('answers preflight from any origin with the MCP protocol headers', async () => {
    const response = await corsApp.request('/mcp', {
      method: 'OPTIONS',
      headers: {
        origin: 'https://client.example.com',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'authorization,content-type,mcp-protocol-version'
      }
    });

    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('access-control-allow-headers')?.toLowerCase()).toContain('mcp-protocol-version');
    expect(response.headers.get('access-control-allow-credentials')).toBeNull();
  });

  it('exposes WWW-Authenticate so a browser client can start the OAuth flow', async () => {
    const response = await corsApp.request('/mcp', {
      method: 'POST',
      headers: { origin: 'https://client.example.com' }
    });

    expect(response.headers.get('access-control-expose-headers')).toContain('WWW-Authenticate');
  });
});
