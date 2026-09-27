import { beforeEach, describe, expect, it, vi } from 'vitest';

const queryMocks = vi.hoisted(() => ({
  getOrgEnabledCapabilityIds: vi.fn(),
  isOrgCapabilityEnabled: vi.fn(),
  upsertOrgCapability: vi.fn()
}));

vi.mock('@cio/db/queries/plugins/org-capability', () => ({
  getOrgEnabledCapabilityIds: queryMocks.getOrgEnabledCapabilityIds,
  isOrgCapabilityEnabled: queryMocks.isOrgCapabilityEnabled,
  upsertOrgCapability: queryMocks.upsertOrgCapability
}));

import {
  assertOrgCapabilityEnabled,
  listOrgCapabilitiesService,
  setOrgCapabilityService
} from '@api/services/plugin/org-capability';

describe('organization plugin capabilities', () => {
  beforeEach(() => {
    queryMocks.getOrgEnabledCapabilityIds.mockReset();
    queryMocks.isOrgCapabilityEnabled.mockReset();
    queryMocks.upsertOrgCapability.mockReset();
  });

  it('lists only capabilities derived from configured plugins', async () => {
    queryMocks.getOrgEnabledCapabilityIds.mockResolvedValue(['certificate_studio', 'removed_plugin_capability']);

    const capabilities = await listOrgCapabilitiesService('org-1');

    expect(capabilities).toContain('certificate_studio');
    expect(capabilities).not.toContain('removed_plugin_capability');
  });

  it('does not authorize a stale enabled row for an unconfigured plugin', async () => {
    await expect(assertOrgCapabilityEnabled('org-1', 'removed_plugin_capability')).rejects.toMatchObject({
      statusCode: 403
    });
    expect(queryMocks.isOrgCapabilityEnabled).not.toHaveBeenCalled();
  });

  it('authorizes an enabled configured plugin', async () => {
    queryMocks.isOrgCapabilityEnabled.mockResolvedValue(true);
    await expect(assertOrgCapabilityEnabled('org-1', 'certificate_studio')).resolves.toBeUndefined();
    expect(queryMocks.isOrgCapabilityEnabled).toHaveBeenCalledWith('org-1', 'certificate_studio');
  });

  it('rejects an authorized configured plugin if disabled in db', async () => {
    queryMocks.isOrgCapabilityEnabled.mockResolvedValue(false);
    await expect(assertOrgCapabilityEnabled('org-1', 'certificate_studio')).rejects.toMatchObject({
      statusCode: 403
    });
  });

  it('rejects toggles for capabilities absent from configured plugins', async () => {
    await expect(setOrgCapabilityService('org-1', 'removed_plugin_capability', true)).rejects.toMatchObject({
      statusCode: 404
    });
    expect(queryMocks.upsertOrgCapability).not.toHaveBeenCalled();
  });
});
