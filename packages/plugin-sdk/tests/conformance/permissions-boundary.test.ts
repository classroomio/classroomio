import { describe, expect, it } from 'vitest';
import { ClassroomIOClient } from '../../src/client/client';
import { PluginBridgeHost } from '../../src/host/bridge-host';
import type { PluginContext } from '../../src/bridge/protocol';

describe('Conformance: Permissions Boundary & RPC Host Isolation', () => {
  const context: PluginContext = {
    installationId: 'inst_conformance_1',
    pluginId: 'com.example.boundary-test',
    version: '1.0.0',
    surface: {
      target: 'organization.settings'
    }
  };

  it('restricts UI bridge host strictly to allowed non-data UI actions', async () => {
    const channel = new MessageChannel();
    const recordedEvents: string[] = [];

    const host = new PluginBridgeHost({
      iframe: {} as HTMLIFrameElement,
      targetOrigin: 'https://plugin.classroomio.com',
      context,
      handlers: {
        onToast: async (payload) => {
          recordedEvents.push(`toast:${payload.message}`);
        },
        onResize: async (payload) => {
          recordedEvents.push(`resize:${payload.height}`);
        },
        onNavigate: async (payload) => {
          recordedEvents.push(`navigate:${payload.href}`);
        },
        onSetDirty: async (payload) => {
          recordedEvents.push(`dirty:${payload.dirty}`);
        }
      }
    });

    const client = new ClassroomIOClient();
    host.attachPort(channel.port1);
    client.attachPort(channel.port2, context);

    await client.ui.toast({ message: 'Saved successfully', variant: 'success' });
    await client.ui.resize(450);
    await client.ui.setDirty(false);

    expect(recordedEvents).toEqual(['toast:Saved successfully', 'resize:450', 'dirty:false']);

    // Ensure client cannot invoke fake/mocked direct data access methods
    expect((client as any).getExercises).toBeUndefined();
    expect((client as any).getCertificates).toBeUndefined();
    expect((client as any).getProfile).toBeUndefined();

    client.destroy();
    host.destroy();
  });
});
