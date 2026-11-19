import { describe, expect, it } from 'vitest';

import { ZCreateOrganizationApiKey } from '@cio/utils/validation/organization';

describe('ZCreateOrganizationApiKey scopes', () => {
  it('rejects public_api:* on an MCP key', () => {
    const result = ZCreateOrganizationApiKey.safeParse({ type: 'mcp', scopes: ['course:read', 'public_api:*'] });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['scopes']);
  });

  it('allows route-level scopes on an MCP key', () => {
    const result = ZCreateOrganizationApiKey.safeParse({
      type: 'mcp',
      scopes: ['course:member:read', 'course:member:write']
    });

    expect(result.success).toBe(true);
  });

  it('allows an MCP key with default scopes', () => {
    expect(ZCreateOrganizationApiKey.safeParse({ type: 'mcp' }).success).toBe(true);
  });

  it('allows public_api:* on API and Zapier keys', () => {
    expect(ZCreateOrganizationApiKey.safeParse({ type: 'api', scopes: ['public_api:*'] }).success).toBe(true);
    expect(ZCreateOrganizationApiKey.safeParse({ type: 'zapier', scopes: ['public_api:*'] }).success).toBe(true);
  });
});
