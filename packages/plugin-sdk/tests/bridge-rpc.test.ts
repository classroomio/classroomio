import { describe, expect, it } from 'vitest';
import { ClassroomIOClient } from '../src/client/client';
import { PluginBridgeHost } from '../src/host/bridge-host';
import type { PluginContext } from '../src/bridge/protocol';

describe('MessageChannel RPC Plugin Bridge', () => {
  const mockContext: PluginContext = {
    installationId: 'inst_123',
    pluginId: 'com.classroomio.reading-time',
    version: '1.0.0',
    organizationId: 'org_abc',
    userId: 'user_xyz'
  };

  it('performs RPC calls and context exchange between Client and Host', async () => {
    const channel = new MessageChannel();
    const storedData = new Map<string, unknown>();

    const host = new PluginBridgeHost({
      iframe: {} as HTMLIFrameElement,
      targetOrigin: 'https://plugin.classroomio.com',
      context: mockContext,
      handlers: {
        onStorageGet: async (namespace, key) => {
          return storedData.get(`${namespace}:${key}`) ?? null;
        },
        onStorageSet: async (namespace, key, value) => {
          storedData.set(`${namespace}:${key}`, value);
        },
        onStorageDelete: async (namespace, key) => {
          return storedData.delete(`${namespace}:${key}`);
        },
        onToast: async (payload) => {
          expect(payload.message).toBe('Settings saved');
        }
      }
    });

    const client = new ClassroomIOClient();

    // Wire up simulated port connection
    host.attachPort(channel.port1);
    client.attachPort(channel.port2, mockContext);

    // 1. Verify Context
    const receivedContext = await client.context.get();
    expect(receivedContext).toEqual(mockContext);

    // 2. Storage set and get
    await client.storage.set('theme', 'dark', 'settings');
    const value = await client.storage.get('theme', 'settings');
    expect(value).toBe('dark');

    // 3. Storage delete
    const deleted = await client.storage.delete('theme', 'settings');
    expect(deleted).toBe(true);

    const deletedValue = await client.storage.get('theme', 'settings');
    expect(deletedValue).toBeNull();

    // 4. UI Toast
    await expect(client.ui.toast({ message: 'Settings saved', variant: 'success' })).resolves.toBeUndefined();

    // Cleanup
    client.destroy();
    host.destroy();
  });

  it('rejects with error when host returns an error', async () => {
    const channel = new MessageChannel();

    const host = new PluginBridgeHost({
      iframe: {} as HTMLIFrameElement,
      targetOrigin: 'https://plugin.classroomio.com',
      context: mockContext,
      handlers: {
        onCustomRpc: async () => {
          throw { code: 'UNAUTHORIZED', message: 'You lack permission to perform this action' };
        }
      }
    });

    const client = new ClassroomIOClient();
    host.attachPort(channel.port1);
    client.attachPort(channel.port2, mockContext);

    await expect(client.rpc('custom:action', {})).rejects.toThrowError(
      '[ClassroomIO Bridge Error] UNAUTHORIZED: You lack permission to perform this action'
    );

    client.destroy();
    host.destroy();
  });

  it('handles backend launch code request exchange', async () => {
    const channel = new MessageChannel();

    const host = new PluginBridgeHost({
      iframe: {} as HTMLIFrameElement,
      targetOrigin: 'https://plugin.classroomio.com',
      context: mockContext,
      handlers: {
        onRequestLaunchCode: async (payload) => {
          expect(payload.target).toBe('certificate.actions');
          return {
            code: 'lc_sec_random_9999',
            expiresInSeconds: 60
          };
        }
      }
    });

    const client = new ClassroomIOClient();
    host.attachPort(channel.port1);
    client.attachPort(channel.port2, mockContext);

    const result = await client.auth.requestLaunchCode({ target: 'certificate.actions' });
    expect(result.code).toBe('lc_sec_random_9999');
    expect(result.expiresInSeconds).toBe(60);

    client.destroy();
    host.destroy();
  });

  it('exchanges theme state and notifies client on dynamic theme change', async () => {
    const channel = new MessageChannel();
    const { DEFAULT_LIGHT_THEME_V1, DEFAULT_DARK_THEME_V1 } = await import('../src/bridge/protocol');

    const host = new PluginBridgeHost({
      iframe: {} as HTMLIFrameElement,
      targetOrigin: 'https://plugin.classroomio.com',
      context: mockContext,
      theme: DEFAULT_LIGHT_THEME_V1,
      handlers: {}
    });

    const client = new ClassroomIOClient();

    let notifiedTheme: any = null;
    const unsubscribe = client.theme.onChange((theme) => {
      notifiedTheme = theme;
    });

    host.attachPort(channel.port1);
    client.attachPort(channel.port2, mockContext, DEFAULT_LIGHT_THEME_V1);

    expect(client.theme.current().colorScheme).toBe('light');

    // Host updates theme to dark
    host.setTheme(DEFAULT_DARK_THEME_V1);

    // Wait a tick for postMessage event processing
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(notifiedTheme).not.toBeNull();
    expect(notifiedTheme.colorScheme).toBe('dark');
    expect(client.theme.current().colorScheme).toBe('dark');
    expect(client.theme.current().tokens.background).toBe('#090d16');

    unsubscribe();
    client.destroy();
    host.destroy();
  });
});
