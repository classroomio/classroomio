import { describe, expect, it } from 'vitest';
import { definePlugin, findConfiguredCapability, resolvePluginCapabilities } from '@cio/sdk';

describe('plugin capability discovery', () => {
  const studio = definePlugin({
    id: 'certificate_studio',
    name: 'Certificate Studio',
    version: '1.0.0',
    category: 'certificate',
    description: 'Build certificate templates.',
    activation: {
      kind: 'org-capability',
      capabilityId: 'certificate_studio',
      nameKey: 'plugins.certificate_studio.name',
      descriptionKey: 'plugins.certificate_studio.description'
    },
    pluginNav: {
      titleKey: 'certificate_studio.sidebar_title',
      path: 'certificate-studio',
      icon: 'award',
      manageLabelKey: 'plugins.manage_templates'
    }
  });

  it('derives cloud-visible capabilities from configured plugins', () => {
    expect(resolvePluginCapabilities([studio])).toEqual([
      {
        id: 'certificate_studio',
        pluginId: 'certificate_studio',
        category: 'certificate',
        nameKey: 'plugins.certificate_studio.name',
        descriptionKey: 'plugins.certificate_studio.description',
        icon: 'award',
        managePath: '/plugins/certificate-studio',
        manageLabelKey: 'plugins.manage_templates'
      }
    ]);
  });

  it('does not expose always-on plugins as cloud capabilities', () => {
    const alwaysOn = definePlugin({
      id: 'integration_always',
      name: 'Always On',
      version: '1.0.0',
      category: 'integration',
      description: 'Always available.',
      activation: { kind: 'always' }
    });

    expect(resolvePluginCapabilities([alwaysOn])).toEqual([]);
  });

  it('finds only capabilities present in the supplied plugin registry', () => {
    expect(findConfiguredCapability([studio], 'certificate_studio')?.pluginId).toBe('certificate_studio');
    expect(findConfiguredCapability([], 'certificate_studio')).toBeUndefined();
  });

  it('rejects duplicate capability ids', () => {
    const duplicate = definePlugin({
      id: 'integration_studio_bridge',
      name: 'Studio Bridge',
      version: '1.0.0',
      category: 'integration',
      description: 'Duplicate capability for validation.',
      activation: {
        kind: 'org-capability',
        capabilityId: 'certificate_studio',
        nameKey: 'plugins.certificate_studio.name',
        descriptionKey: 'plugins.certificate_studio.description'
      }
    });

    expect(() => resolvePluginCapabilities([studio, duplicate])).toThrow(/registered more than once/i);
  });
});
