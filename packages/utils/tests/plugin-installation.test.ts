import { describe, expect, it } from 'vitest';

import { ZUninstallPlugin, ZUpdateInstallationStatus } from '../src/validation/plugin';

describe('plugin installation lifecycle validation', () => {
  it('requires the dedicated uninstall operation', () => {
    expect(ZUpdateInstallationStatus.safeParse({ status: 'active' }).success).toBe(true);
    expect(ZUpdateInstallationStatus.safeParse({ status: 'disabled' }).success).toBe(true);
    expect(ZUpdateInstallationStatus.safeParse({ status: 'uninstalled' }).success).toBe(false);
  });

  it('requires an explicit choice for each uninstall cleanup option', () => {
    expect(ZUninstallPlugin.parse({ deletePluginStorage: false, removePublishedOutputs: true })).toEqual({
      deletePluginStorage: false,
      removePublishedOutputs: true
    });
    expect(ZUninstallPlugin.safeParse({}).success).toBe(false);
  });
});
