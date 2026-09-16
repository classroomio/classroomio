import { describe, expect, it, vi } from 'vitest';
import { definePlugin, getEventBus } from '@cio/sdk';
import { initializePluginRuntime } from '@api/services/plugin/runtime';

describe('API plugin runtime bootstrap', () => {
  it('registers configured server hooks with the process event bus', async () => {
    const handler = vi.fn();
    const plugin = definePlugin({
      id: 'integration_runtime_test',
      name: 'Runtime test integration',
      version: '1.0.0',
      category: 'integration',
      description: 'Verifies API plugin bootstrap.',
      on: {
        'certificate.issued': handler
      }
    });

    initializePluginRuntime([plugin]);
    await getEventBus().dispatch('certificate.issued', { certificateId: 'cert-1' });

    expect(handler).toHaveBeenCalledWith(
      { certificateId: 'cert-1' },
      expect.objectContaining({ timestamp: expect.any(Date) })
    );
  });
});
