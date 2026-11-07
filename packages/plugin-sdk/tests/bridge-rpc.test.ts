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

  it('serializes proxy-backed context before posting it to a plugin', async () => {
    const channel = new MessageChannel();
    const selectedTemplateDocument = new Proxy({ templateId: 'modular', accentColor: '#d4a017' }, {});
    const context: PluginContext = {
      ...mockContext,
      surface: {
        target: 'certificate.templates',
        resource: {
          type: 'course',
          id: 'course-1',
          selectedTemplateDocument
        }
      }
    };
    const contextMessage = new Promise<MessageEvent['data']>((resolve) => {
      channel.port2.onmessage = (event) => resolve(event.data);
    });
    const host = new PluginBridgeHost({
      iframe: {} as HTMLIFrameElement,
      targetOrigin: 'https://plugin.example.com',
      context,
      handlers: {}
    });

    host.attachPort(channel.port1);

    await expect(contextMessage).resolves.toMatchObject({
      type: 'CIO_BRIDGE_CONTEXT_INIT',
      context
    });

    channel.port2.close();
    host.destroy();
  });

  it('reads and writes client preferences', async () => {
    const channel = new MessageChannel();
    const stored = new Map<string, unknown>();
    const host = new PluginBridgeHost({
      iframe: {} as HTMLIFrameElement,
      targetOrigin: 'https://plugin.example.com',
      context: mockContext,
      handlers: {
        onPreferenceGet: async ({ key, namespace }) => {
          return stored.get(`${namespace || 'default'}:${key}`) ?? null;
        },
        onPreferenceSet: async ({ key, value, namespace }) => {
          stored.set(`${namespace || 'default'}:${key}`, value);
        }
      }
    });
    const client = new ClassroomIOClient();

    host.attachPort(channel.port1);
    client.attachPort(channel.port2, mockContext);

    await client.preferences.set('sidebar-open', true, 'ui');
    await expect(client.preferences.get('sidebar-open', 'ui')).resolves.toBe(true);

    client.destroy();
    host.destroy();
  });

  it('validates the published typed data capabilities', () => {
    expect(isValidBridgeRpcPayload('lessons:get', { id: 'lesson_123' })).toBe(true);
    expect(isValidBridgeRpcPayload('courses:list', {})).toBe(true);
    expect(isValidBridgeRpcPayload('storage:get', { namespace: 'settings', key: 'theme' })).toBe(false);
    expect(isValidBridgeRpcPayload('lessons:get', {})).toBe(false);
    expect(isValidBridgeRpcPayload('progress:setCompletion', { lessonId: 'lesson_123', isComplete: true })).toBe(true);
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

  it('dispatches typed course and storage calls', async () => {
    const channel = new MessageChannel();
    let courseListingRequested = false;
    const host = new PluginBridgeHost({
      iframe: {} as HTMLIFrameElement,
      targetOrigin: 'https://plugin.example.com',
      context: mockContext,
      handlers: {
        onStorageGet: async ({ key }) => (key === 'setting' ? 'dark' : null),
        onStorageSet: async () => {},
        onDataRequest: async (action) => {
          if (action === 'courses:list') {
            courseListingRequested = true;
            return { items: [], nextCursor: null };
          }

          return null;
        }
      }
    });
    const client = new ClassroomIOClient();

    host.attachPort(channel.port1);
    client.attachPort(channel.port2, mockContext);

    const result = await client.courses.list();
    expect(result).toEqual({ items: [], nextCursor: null });
    expect(courseListingRequested).toBe(true);

    await expect(client.storage.get('setting')).resolves.toBe('dark');

    client.destroy();
    host.destroy();
  });
});
