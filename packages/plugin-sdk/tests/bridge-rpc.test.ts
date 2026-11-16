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

  it('handles exercise.question bridge RPCs and context in take mode', async () => {
    const channel = new MessageChannel();
    let receivedAnswer: unknown = null;
    let resizedHeight: number | null = null;

    const questionContext: PluginContext = {
      installationId: 'inst_123',
      pluginId: 'com.example.code-runner',
      version: '1.0.0',
      actor: { role: 'learner' },
      surface: {
        target: 'exercise.question',
        resource: {
          type: 'question',
          id: 'q_456',
          questionId: 'q_456',
          mode: 'take',
          publicConfig: { starterCode: 'print("hello")' },
          currentAnswer: { code: 'print("hi")' },
          readOnly: false,
          points: 10
        }
      }
    };

    const host = new PluginBridgeHost({
      iframe: {} as HTMLIFrameElement,
      targetOrigin: 'https://plugin.example.com',
      context: questionContext,
      handlers: {
        onQuestionSetAnswer: async ({ value }) => {
          receivedAnswer = value;
        },
        onQuestionResize: async ({ height }) => {
          resizedHeight = height;
        }
      }
    });
    const client = new ClassroomIOClient();

    host.attachPort(channel.port1);
    client.attachPort(channel.port2, questionContext);

    const ctx = await client.exercise.getContext();
    expect(ctx.mode).toBe('take');
    expect(ctx.questionId).toBe('q_456');
    expect(ctx.publicConfig).toEqual({ starterCode: 'print("hello")' });
    expect(ctx.currentAnswer).toEqual({ code: 'print("hi")' });
    expect(ctx.readOnly).toBe(false);
    expect(ctx.points).toBe(10);

    await client.exercise.setAnswer({ code: 'print("solved")' });
    expect(receivedAnswer).toEqual({ code: 'print("solved")' });

    await client.exercise.resize(350);
    expect(resizedHeight).toBe(350);

    // Learner cannot update config
    await expect(client.exercise.updatePublicConfig({ test: 123 })).rejects.toThrow(
      'Only authoring roles can update question configuration'
    );

    client.destroy();
    host.destroy();
  });

  it('allows author to update config in edit mode and blocks answers in read-only mode', async () => {
    const channel = new MessageChannel();
    let updatedPublic: unknown = null;
    let updatedAuthor: unknown = null;

    const editContext: PluginContext = {
      installationId: 'inst_123',
      pluginId: 'com.example.code-runner',
      version: '1.0.0',
      actor: { role: 'admin' },
      surface: {
        target: 'exercise.question',
        resource: {
          type: 'question',
          id: 'q_456',
          mode: 'edit',
          publicConfig: { starterCode: 'print()' },
          authorConfig: { hiddenTests: [] },
          readOnly: false
        }
      }
    };

    const host = new PluginBridgeHost({
      iframe: {} as HTMLIFrameElement,
      targetOrigin: 'https://plugin.example.com',
      context: editContext,
      handlers: {
        onQuestionUpdatePublicConfig: async ({ value }) => {
          updatedPublic = value;
        },
        onQuestionUpdateAuthorConfig: async ({ value }) => {
          updatedAuthor = value;
        }
      }
    });
    const client = new ClassroomIOClient();

    host.attachPort(channel.port1);
    client.attachPort(channel.port2, editContext);

    await client.exercise.updatePublicConfig({ starterCode: 'def main(): pass' });
    expect(updatedPublic).toEqual({ starterCode: 'def main(): pass' });

    await client.exercise.updateAuthorConfig({ hiddenTests: [{ input: '1', output: '2' }] });
    expect(updatedAuthor).toEqual({ hiddenTests: [{ input: '1', output: '2' }] });

    client.destroy();
    host.destroy();

    // Now test read-only mode blocks setAnswer
    const readOnlyChannel = new MessageChannel();
    const readOnlyContext: PluginContext = {
      ...editContext,
      surface: {
        target: 'exercise.question',
        resource: {
          type: 'question',
          id: 'q_456',
          mode: 'review',
          readOnly: true
        }
      }
    };

    const roHost = new PluginBridgeHost({
      iframe: {} as HTMLIFrameElement,
      targetOrigin: 'https://plugin.example.com',
      context: readOnlyContext,
      handlers: {}
    });
    const roClient = new ClassroomIOClient();

    roHost.attachPort(readOnlyChannel.port1);
    roClient.attachPort(readOnlyChannel.port2, readOnlyContext);

    await expect(roClient.exercise.setAnswer({ code: 'hack' })).rejects.toThrow('Cannot set answer in read-only mode');

    roClient.destroy();
    roHost.destroy();
  });
});
