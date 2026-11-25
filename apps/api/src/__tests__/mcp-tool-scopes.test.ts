import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authenticateKey: vi.fn(),
  authenticateOAuth: vi.fn()
}));

vi.mock('@api/services/organization/automation-key', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@api/services/organization/automation-key')>()),
  authenticateOrganizationApiKeyService: mocks.authenticateKey
}));
vi.mock('@api/services/oauth/oauth', () => ({
  authenticateOAuthAccessTokenService: mocks.authenticateOAuth
}));

import { ClassroomIoApiClient, createMcpServer } from '@classroomio/mcp/server';
import { OAUTH_API_SCOPES } from '@cio/db/auth';
import { getReadOnlyOAuthScopes } from '@cio/utils/constants/oauth-scopes';
import { Hono } from '@api/utils/hono';
import { mcpRouter } from '@api/routes/mcp';
import { DEFAULT_SCOPES } from '@api/services/organization/automation-key';
import { isMcpToolAllowedForScopes, MCP_TOOL_SCOPES } from '@api/services/mcp/tool-scopes';

function remoteToolNames(isToolAllowed?: (toolName: string) => boolean): string[] {
  const apiClient = new ClassroomIoApiClient({
    CLASSROOMIO_API_URL: 'https://api.example.com',
    CLASSROOMIO_API_KEY: 'cio_mcp_test',
    CLASSROOMIO_USER_AGENT: 'test'
  });
  const server = createMcpServer(apiClient, { includeLocalFileTools: false, isToolAllowed });

  return Object.keys((server as unknown as { _registeredTools: Record<string, unknown> })._registeredTools).sort();
}

const allRemoteTools = remoteToolNames();
const readOnlyScopes = getReadOnlyOAuthScopes([...OAUTH_API_SCOPES]);

describe('MCP tool scopes', () => {
  it('knows a scope for every remotely served tool, so none is hidden by mistake', () => {
    for (const name of allRemoteTools) {
      expect(MCP_TOOL_SCOPES.get(name)?.size ?? 0, `${name} has no scope`).toBeGreaterThan(0);
    }
  });

  it('only lists tools that are registered', () => {
    for (const name of MCP_TOOL_SCOPES.keys()) {
      expect(allRemoteTools, `${name} has a scope but is not registered`).toContain(name);
    }
  });

  it('serves every tool to a key with public_api:*, a full OAuth grant and a default MCP key', () => {
    for (const scopes of [['public_api:*'], [...OAUTH_API_SCOPES], DEFAULT_SCOPES.mcp]) {
      expect(remoteToolNames((name) => isMcpToolAllowedForScopes(name, scopes))).toEqual(allRemoteTools);
    }
  });

  it('serves only read tools to a read-only grant', () => {
    const tools = remoteToolNames((name) => isMcpToolAllowedForScopes(name, readOnlyScopes));

    expect(tools).toContain('list_org_courses');
    expect(tools).toContain('get_course_structure');
    expect(tools).not.toContain('create_course');
    expect(tools).not.toContain('delete_course_lesson');
    expect(tools.length).toBeLessThan(allRemoteTools.length);
  });

  it('hides a tool from a grant that lacks any one of its scopes', () => {
    const tagScopes = [...MCP_TOOL_SCOPES.get('tag_courses')!];

    expect(isMcpToolAllowedForScopes('tag_courses', tagScopes)).toBe(true);
    expect(isMcpToolAllowedForScopes('tag_courses', tagScopes.slice(1))).toBe(false);
  });

  it('hides every tool from a grant with no scopes, and an unknown tool unless the key has public_api:*', () => {
    expect(remoteToolNames((name) => isMcpToolAllowedForScopes(name, []))).toEqual([]);
    expect(isMcpToolAllowedForScopes('not_a_tool', ['public_api:*'])).toBe(true);
    expect(isMcpToolAllowedForScopes('not_a_tool', [...OAUTH_API_SCOPES])).toBe(false);
  });
});

describe('POST /mcp tools/list', () => {
  const app = new Hono().route('/mcp', mcpRouter);

  function listTools(authorization: string) {
    return app.request('/mcp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        Authorization: authorization
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} })
    });
  }

  async function listedNames(authorization: string): Promise<string[]> {
    const body = await (await listTools(authorization)).json();

    return body.result.tools.map((tool: { name: string }) => tool.name);
  }

  beforeEach(() => {
    mocks.authenticateKey.mockReset();
    mocks.authenticateOAuth.mockReset();
  });

  it('lists only the tools a read-only OAuth grant can call', async () => {
    mocks.authenticateOAuth.mockResolvedValue({
      key: { id: 'key-1', type: 'mcp', organizationId: 'org-1', scopes: readOnlyScopes },
      clientId: 'client-1',
      planName: null
    });

    const names = await listedNames('Bearer eyJhbGciOi');

    expect(names).toContain('list_org_courses');
    expect(names).not.toContain('create_course');
  });

  it('lists every tool for a full OAuth grant', async () => {
    mocks.authenticateOAuth.mockResolvedValue({
      key: { id: 'key-1', type: 'mcp', organizationId: 'org-1', scopes: [...OAUTH_API_SCOPES] },
      clientId: 'client-1',
      planName: null
    });

    expect((await listedNames('Bearer eyJhbGciOi')).sort()).toEqual(allRemoteTools);
  });

  it('filters cio_ MCP keys by their own scopes', async () => {
    mocks.authenticateKey.mockResolvedValue({
      id: 'key-2',
      type: 'mcp',
      organizationId: 'org-1',
      scopes: ['course:read']
    });

    const names = await listedNames('Bearer cio_mcp_abc');

    expect(names).toContain('list_org_courses');
    expect(names).not.toContain('list_team_members');
    expect(names).not.toContain('create_course');
  });
});
