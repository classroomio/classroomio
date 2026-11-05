import { describe, expect, it } from 'vitest';
import { ClassroomIOClient } from '../../src/client/client';
import { PluginBridgeHost } from '../../src/host/bridge-host';
import type { PluginContext } from '../../src/bridge/protocol';

describe('Conformance: hosted capabilities', () => {
  it('discovers granted capabilities and dispatches typed data methods', async () => {
    const channel = new MessageChannel();
    const context: PluginContext = {
      installationId: 'installation-1',
      pluginId: 'com.example.plugin',
      version: '1.0.0',
      capabilities: ['identity.profile:read', 'course.metadata:read']
    };
    const requests: Array<{ action: string; payload: Record<string, unknown> }> = [];
    const host = new PluginBridgeHost({
      iframe: {} as HTMLIFrameElement,
      targetOrigin: '*',
      context,
      handlers: {
        onDataRequest: async (action, payload) => {
          requests.push({ action, payload });
          if (action === 'identity:getCurrent') return { id: 'profile-1', displayName: 'Ada' };

          return { id: payload.id };
        }
      }
    });
    const client = new ClassroomIOClient();
    host.attachPort(channel.port1);
    client.attachPort(channel.port2, context);

    await expect(client.capabilities.list()).resolves.toEqual(context.capabilities);
    await expect(client.identity.getCurrent()).resolves.toMatchObject({ id: 'profile-1' });
    await expect(client.courses.get('course-1')).resolves.toEqual({ id: 'course-1' });
    expect(requests).toEqual([
      { action: 'identity:getCurrent', payload: {} },
      { action: 'courses:get', payload: { id: 'course-1' } }
    ]);

    client.destroy();
    host.destroy();
  });

  it('dispatches every published hosted data namespace without raw action calls', async () => {
    const channel = new MessageChannel();
    const context: PluginContext = {
      installationId: 'installation-1',
      pluginId: 'com.example.plugin',
      version: '1.0.0'
    };
    const actions: string[] = [];
    const host = new PluginBridgeHost({
      iframe: {} as HTMLIFrameElement,
      targetOrigin: '*',
      context,
      handlers: {
        onCoursesList: async () => {
          actions.push('courses:list');
          return { items: [], nextCursor: null };
        },
        onLessonsList: async () => {
          actions.push('lessons:list');
          return { items: [], nextCursor: null };
        },
        onExercisesList: async () => {
          actions.push('exercises:list');
          return { items: [], nextCursor: null };
        },
        onLandingTemplatePreview: async () => {
          actions.push('landing.templates:preview');
        },
        onLandingTemplateSelect: async () => {
          actions.push('landing.templates:select');
        },
        onCertificateTemplateApply: async () => {
          actions.push('certificate.templates:apply');
        },
        onDataRequest: async (action) => {
          actions.push(action);
          return {};
        }
      }
    });
    const client = new ClassroomIOClient();
    host.attachPort(channel.port1);
    client.attachPort(channel.port2, context);

    await client.identity.getCurrent();
    await client.organization.getProfile();
    await client.courses.list();
    await client.courses.get('course-1');
    await client.courses.getStructure('course-1');
    await client.lessons.list({ courseId: 'course-1' });
    await client.lessons.get('lesson-1');
    await client.lessons.getContent('lesson-1');
    await client.exercises.list({ courseId: 'course-1' });
    await client.exercises.get('exercise-1');
    await client.progress.getCurrent({ type: 'lesson', id: 'lesson-1' });
    await client.progress.getCurrent({ type: 'course', id: 'course-1' });
    await client.progress.setCompletion('lesson-1', true);
    await client.certificates.list({ courseId: 'course-1' });
    await client.certificates.get('certificate-1');
    await client.certificateTemplates.list();
    await client.certificateTemplates.getApplied('course-1');
    await client.certificateTemplates.apply({ templateId: 'template-1', document: {} });
    await client.landingTemplates.preview('template-1');
    await client.landingTemplates.select('template-1');

    expect(actions).toEqual([
      'identity:getCurrent',
      'organization:getProfile',
      'courses:list',
      'courses:get',
      'courses:getStructure',
      'lessons:list',
      'lessons:get',
      'lessons:getContent',
      'exercises:list',
      'exercises:get',
      'progress:getLesson',
      'progress:getCourse',
      'progress:setCompletion',
      'certificates:list',
      'certificates:get',
      'certificateTemplates:list',
      'certificateTemplates:getApplied',
      'certificate.templates:apply',
      'landing.templates:preview',
      'landing.templates:select'
    ]);

    client.destroy();
    host.destroy();
  });

  it('keeps storage handlers isolated to each installation host', async () => {
    const records = new Map<string, unknown>();

    async function connect(installationId: string) {
      const channel = new MessageChannel();
      const context: PluginContext = { installationId, pluginId: 'com.example.plugin', version: '1.0.0' };
      const host = new PluginBridgeHost({
        iframe: {} as HTMLIFrameElement,
        targetOrigin: '*',
        context,
        handlers: {
          onStorageGet: async ({ key }) => records.get(`${installationId}:${key}`) ?? null,
          onStorageSet: async ({ key, value }) => {
            records.set(`${installationId}:${key}`, value);
            return { version: 1, schemaVersion: 1 };
          }
        }
      });
      const client = new ClassroomIOClient();
      host.attachPort(channel.port1);
      client.attachPort(channel.port2, context);

      return { client, host };
    }

    const first = await connect('installation-1');
    const second = await connect('installation-2');
    await first.client.storage.set('config', { enabled: true });

    await expect(first.client.storage.get('config')).resolves.toEqual({ enabled: true });
    await expect(second.client.storage.get('config')).resolves.toBeNull();

    first.client.destroy();
    first.host.destroy();
    second.client.destroy();
    second.host.destroy();
  });
});
