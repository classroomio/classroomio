import { describe, expect, it } from 'vitest';

import { BLOCK_CHANGE_CLIENT_NAME_MAX_LENGTH } from '@cio/utils/constants/lesson-version';
import type { TOrganizationApiKey } from '@cio/db/types';

import { getChangeAttribution, normalizeClientName, resolveKeyClientName } from './change-attribution';

function buildKey(overrides: Partial<TOrganizationApiKey>): TOrganizationApiKey {
  return { type: 'mcp', label: 'Laptop key', ...overrides } as TOrganizationApiKey;
}

function buildContext(values: Record<string, unknown>) {
  return { get: (name: string) => values[name] } as Parameters<typeof getChangeAttribution>[0];
}

describe('normalizeClientName', () => {
  it('trims, collapses whitespace and strips control characters', () => {
    expect(normalizeClientName('  Claude \n\t Desktop\u0000 ')).toBe('Claude Desktop');
  });

  it('caps the length', () => {
    expect(normalizeClientName('x'.repeat(500))).toHaveLength(BLOCK_CHANGE_CLIENT_NAME_MAX_LENGTH);
  });

  it('returns null for empty input', () => {
    expect(normalizeClientName('   ')).toBeNull();
    expect(normalizeClientName(undefined)).toBeNull();
  });
});

describe('resolveKeyClientName', () => {
  it('prefers the clientInfo name an MCP client reported over the key label', () => {
    expect(resolveKeyClientName(buildKey({}), 'claude-ai')).toBe('claude-ai');
  });

  it('decodes the percent-encoded name the MCP server sends', () => {
    expect(resolveKeyClientName(buildKey({}), encodeURIComponent('学习助手'))).toBe('学习助手');
  });

  it('uses a header that is not valid percent-encoding as it is', () => {
    expect(resolveKeyClientName(buildKey({}), '100% client')).toBe('100% client');
  });

  it('falls back to the key label', () => {
    expect(resolveKeyClientName(buildKey({}), undefined)).toBe('Laptop key');
  });

  it('ignores the MCP header on a public API key', () => {
    expect(resolveKeyClientName(buildKey({ type: 'api', label: 'Zapier' }), 'claude-ai')).toBe('Zapier');
  });
});

describe('getChangeAttribution', () => {
  it('attributes nothing for a dashboard session', () => {
    expect(getChangeAttribution(buildContext({ automationKey: null }))).toEqual({});
  });

  it('attributes an MCP credential to its client', () => {
    const context = buildContext({ automationKey: buildKey({ type: 'mcp' }), clientName: 'Claude' });

    expect(getChangeAttribution(context)).toEqual({ source: 'mcp', clientName: 'Claude' });
  });

  it('attributes a public API key to its label', () => {
    const context = buildContext({ automationKey: buildKey({ type: 'api' }), clientName: 'Zapier' });

    expect(getChangeAttribution(context)).toEqual({ source: 'api', clientName: 'Zapier' });
  });

  it('has a null client name when none was resolved', () => {
    expect(getChangeAttribution(buildContext({ automationKey: buildKey({ type: 'mcp' }) }))).toEqual({
      source: 'mcp',
      clientName: null
    });
  });
});
