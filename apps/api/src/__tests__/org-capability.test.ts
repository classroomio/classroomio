import { beforeEach, describe, expect, it, vi } from 'vitest';

const queryMocks = vi.hoisted(() => ({
  getOrgCapabilities: vi.fn(),
  upsertOrgCapability: vi.fn()
}));

vi.mock('@cio/db/queries/plugins/org-capability', () => ({
  getOrgCapabilities: queryMocks.getOrgCapabilities,
  upsertOrgCapability: queryMocks.upsertOrgCapability
}));

import {
  assertOrgCapabilityEnabled,
  listOrgCapabilitiesService,
  setOrgCapabilityService
} from '@api/services/plugin/org-capability';

describe('organization plugin capabilities', () => {
  beforeEach(() => {
    queryMocks.getOrgCapabilities.mockReset();
    queryMocks.upsertOrgCapability.mockReset();
  });

  it('lists only capabilities derived from configured plugins', async () => {
    queryMocks.getOrgCapabilities.mockResolvedValue([
      {
        capabilityId: 'certificate_studio',
        isEnabled: true,
        updatedAt: '2026-09-23T10:00:00.000Z'
      },
      {
        capabilityId: 'removed_plugin_capability',
        isEnabled: true,
        updatedAt: '2026-09-23T10:00:00.000Z'
      }
    ]);

    const capabilities = await listOrgCapabilitiesService('org-1');

    expect(capabilities.some((capability) => capability.id === 'certificate_studio')).toBe(true);
    expect(capabilities.some((capability) => capability.id === 'removed_plugin_capability')).toBe(false);
  });

  it('does not authorize a stale enabled row for an unconfigured plugin', async () => {
    await expect(assertOrgCapabilityEnabled('org-1', 'removed_plugin_capability')).rejects.toMatchObject({
      statusCode: 403
    });
    expect(queryMocks.getOrgCapabilities).not.toHaveBeenCalled();
  });

  it('rejects toggles for capabilities absent from configured plugins', async () => {
    await expect(setOrgCapabilityService('org-1', 'removed_plugin_capability', true)).rejects.toMatchObject({
      statusCode: 404
    });
    expect(queryMocks.upsertOrgCapability).not.toHaveBeenCalled();
  });
});
