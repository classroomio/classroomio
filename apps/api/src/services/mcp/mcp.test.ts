import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ resource: 'https://mcp.example.com' }));

vi.mock('@cio/db/auth', () => ({
  get MCP_RESOURCE() {
    return mocks.resource;
  }
}));
vi.mock('@api/services/oauth/oauth', () => ({ authenticateOAuthAccessTokenService: vi.fn() }));
vi.mock('@api/services/organization/automation-key', () => ({ authenticateOrganizationApiKeyService: vi.fn() }));

import { getMcpResourceMetadataUrl } from './mcp';

describe('getMcpResourceMetadataUrl', () => {
  it('uses the bare well-known path for a resource at the host root', () => {
    mocks.resource = 'https://mcp.example.com';

    expect(getMcpResourceMetadataUrl()).toBe('https://mcp.example.com/.well-known/oauth-protected-resource');
  });

  it('inserts the resource path for a resource with a path', () => {
    mocks.resource = 'https://api.example.com/mcp';

    expect(getMcpResourceMetadataUrl()).toBe('https://api.example.com/.well-known/oauth-protected-resource/mcp');
  });
});
