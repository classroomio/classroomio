import { describe, expect, it } from 'vitest';
import { definePlugin } from '../src/plugin';
import { resolveActiveSlotLoaders } from '../src/slots';

describe('resolveActiveSlotLoaders', () => {
  const dummyComponent = () => Promise.resolve({ default: class {} });

  const alwaysOnPlugin = definePlugin({
    id: 'integration_always_on',
    name: 'Always On Plugin',
    version: '1.0.0',
    category: 'integration',
    description: 'Always on test plugin',
    slots: {
      'certificate.actions': dummyComponent
    }
  });

  const capabilityGatedPlugin = definePlugin({
    id: 'integration_linkedin_badge',
    name: 'LinkedIn Badge Plugin',
    version: '1.0.0',
    category: 'integration',
    activation: {
      kind: 'org-capability',
      capabilityId: 'linkedin_certificate_sharing',
      nameKey: 'plugins.linkedin_certificate_sharing.name',
      descriptionKey: 'plugins.linkedin_certificate_sharing.description'
    },
    description: 'Capability gated test plugin',
    slots: {
      'certificate.actions': dummyComponent
    }
  });

  it('includes always-on plugins even with empty enabledCapabilities', () => {
    const loaders = resolveActiveSlotLoaders({
      slotName: 'certificate.actions',
      plugins: [alwaysOnPlugin],
      enabledCapabilities: new Set()
    });

    expect(loaders).toHaveLength(1);
  });

  it('excludes capability-gated plugins when capability is not enabled', () => {
    const loaders = resolveActiveSlotLoaders({
      slotName: 'certificate.actions',
      plugins: [capabilityGatedPlugin],
      enabledCapabilities: new Set(['other_capability'])
    });

    expect(loaders).toHaveLength(0);
  });

  it('includes capability-gated plugins when capability is enabled', () => {
    const loaders = resolveActiveSlotLoaders({
      slotName: 'certificate.actions',
      plugins: [capabilityGatedPlugin],
      enabledCapabilities: new Set(['linkedin_certificate_sharing'])
    });

    expect(loaders).toHaveLength(1);
  });

  it('resolves both always-on and enabled capability-gated plugins together', () => {
    const loaders = resolveActiveSlotLoaders({
      slotName: 'certificate.actions',
      plugins: [alwaysOnPlugin, capabilityGatedPlugin],
      enabledCapabilities: new Set(['linkedin_certificate_sharing'])
    });

    expect(loaders).toHaveLength(2);
  });
});
