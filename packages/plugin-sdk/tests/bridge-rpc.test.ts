import { describe, expect, it } from 'vitest';
import { ClassroomIOClient } from '../src/client/client';
import {
  DEFAULT_DARK_THEME_V1,
  DEFAULT_LIGHT_THEME_V1,
  isValidBridgeRpcPayload,
  type PluginContext
} from '../src/bridge/protocol';
import { PluginBridgeHost } from '../src/host/bridge-host';

describe('MessageChannel UI host bridge', () => {
  const mockContext: PluginContext = {
    installationId: 'inst_123',
    pluginId: 'com.example.plugin',
    version: '1.0.0',
    surface: {
      target: 'lesson.after'
    }
  };

  it('exposes only generic host capabilities', async () => {
    const channel = new MessageChannel();
    const calls: string[] = [];
    const host = new PluginBridgeHost({
      iframe: {} as HTMLIFrameElement,
      targetOrigin: 'https://plugin.example.com',
      context: mockContext,
      handlers: {
        onToast: async ({ message }) => {
          calls.push(`toast:${message}`);
        },
        onResize: async ({ height }) => {
          calls.push(`resize:${height}`);
        },
        onNavigate: async ({ href }) => {
          calls.push(`navigate:${href}`);
        },
        onSetDirty: async ({ dirty }) => {
          calls.push(`dirty:${dirty}`);
        }
      }
    });
    const client = new ClassroomIOClient();

    host.attachPort(channel.port1);
    client.attachPort(channel.port2, mockContext);

    await expect(client.context.get()).resolves.toEqual(mockContext);
    await client.ui.toast({ message: 'Saved', variant: 'success' });
    await client.ui.resize(72);
    await client.navigation.open('/courses/course-1');
    await client.ui.setDirty(true);

    expect(calls).toEqual(['toast:Saved', 'resize:72', 'navigate:/courses/course-1', 'dirty:true']);

    client.destroy();
    host.destroy();
  });

  it('returns a one-time launch code for a plugin backend', async () => {
    const channel = new MessageChannel();
    const host = new PluginBridgeHost({
      iframe: {} as HTMLIFrameElement,
      targetOrigin: 'https://plugin.example.com',
      context: mockContext,
      handlers: {
        onRequestLaunchCode: async () => ({
          code: 'lc_sec_random_9999',
          expiresInSeconds: 60
        })
      }
    });
    const client = new ClassroomIOClient();

    host.attachPort(channel.port1);
    client.attachPort(channel.port2, mockContext);

    await expect(client.auth.requestLaunchCode()).resolves.toEqual({
      code: 'lc_sec_random_9999',
      expiresInSeconds: 60
    });

    client.destroy();
    host.destroy();
  });

  it('does not recognize data API calls as UI-host capabilities', () => {
    expect(isValidBridgeRpcPayload('lessons:get', { id: 'lesson_123' })).toBe(false);
    expect(isValidBridgeRpcPayload('courses:list', {})).toBe(false);
    expect(isValidBridgeRpcPayload('storage:get', { namespace: 'settings', key: 'theme' })).toBe(false);
  });

  it('exchanges theme state and notifies the plugin when it changes', async () => {
    const channel = new MessageChannel();
    const host = new PluginBridgeHost({
      iframe: {} as HTMLIFrameElement,
      targetOrigin: 'https://plugin.example.com',
      context: mockContext,
      theme: DEFAULT_LIGHT_THEME_V1,
      handlers: {}
    });
    const client = new ClassroomIOClient();
    let colorScheme: string | null = null;
    const unsubscribe = client.theme.onChange((theme) => {
      colorScheme = theme.colorScheme;
    });

    host.attachPort(channel.port1);
    client.attachPort(channel.port2, mockContext, DEFAULT_LIGHT_THEME_V1);
    host.setTheme(DEFAULT_DARK_THEME_V1);
    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(colorScheme).toBe('dark');
    expect(client.theme.current().colorScheme).toBe('dark');

    unsubscribe();
    client.destroy();
    host.destroy();
  });
});
