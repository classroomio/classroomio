import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineEntity, definePlugin, createInMemoryEntityAdapter } from '@cio/sdk';

const mocks = vi.hoisted(() => ({
  completeLessonService: vi.fn()
}));

vi.mock('@api/services/lesson/complete-lesson', () => ({
  completeLessonService: mocks.completeLessonService
}));

describe('activity write-back context', () => {
  const xpEntity = defineEntity('xp_points', {
    scope: ['org', 'user'],
    fields: { points: { type: 'int', default: 0 } }
  });

  const testPlugin = definePlugin({
    id: 'integration_test_plugin',
    name: 'test-plugin',
    version: '1.0.0',
    category: 'integration',
    description: 'Test plugin for writeback context',
    entities: [xpEntity],
    privacy: {
      description: 'Stores test XP points',
      storesPersonalData: false,
      onDeleteUser: async () => {},
      onExportUser: async () => ({})
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.completeLessonService.mockResolvedValue({ id: 'l1', isComplete: true });
  });

  it('provides completion.mark(lessonId) that calls completeLessonService', async () => {
    const { createWriteBackContext } = await import('@api/services/plugin/writeback');

    const ctx = createWriteBackContext({
      plugin: testPlugin,
      userId: 'user-123',
      orgId: 'org-456'
    });

    await ctx.completion.mark('lesson-789');

    expect(mocks.completeLessonService).toHaveBeenCalledWith({
      userId: 'user-123',
      lessonId: 'lesson-789',
      orgId: 'org-456'
    });
  });

  it('injects typed entity repositories into ctx.data', async () => {
    const { createWriteBackContext } = await import('@api/services/plugin/writeback');
    const inMemoryAdapter = createInMemoryEntityAdapter();

    const ctx = createWriteBackContext({
      plugin: testPlugin,
      userId: 'user-123',
      orgId: 'org-456',
      adapter: inMemoryAdapter
    });

    expect(ctx.data.xp_points).toBeDefined();
    expect(typeof ctx.data.xp_points.upsert).toBe('function');

    await ctx.data.xp_points.upsert({
      where: { userId: 'user-123' },
      create: { userId: 'user-123', data: { points: 50 } },
      update: { data: { points: 100 } }
    });

    const records = await ctx.data.xp_points.findMany({ userId: 'user-123' });
    expect(records).toHaveLength(1);
    expect(records[0].pluginName).toBe(testPlugin.id);
    expect(records[0].data.points).toBe(50);
  });

  it('throws or rejects if orgId or userId are missing', async () => {
    const { createWriteBackContext } = await import('@api/services/plugin/writeback');

    expect(() => {
      createWriteBackContext({
        plugin: testPlugin,
        userId: '',
        orgId: 'org-456'
      });
    }).toThrow(/userId/i);

    expect(() => {
      createWriteBackContext({
        plugin: testPlugin,
        userId: 'user-123',
        orgId: ''
      });
    }).toThrow(/orgId/i);
  });
});
