import { describe, expect, it, vi } from 'vitest';
import {
  defineEntity,
  definePlugin,
  defineConfig,
  resolveConfig,
  createEntityRepository,
  createInMemoryEntityAdapter,
  getEventBus
} from '@cio/sdk';

describe('Dogfood: XP & Leaderboard Plugin End-to-End', () => {
  const xpEntity = defineEntity('xp_points', {
    scope: ['org', 'user'],
    fields: {
      points: { type: 'int', default: 0 },
      level: { type: 'int', default: 1 }
    }
  });

  function createXpPlugin(options: { lessonPoints?: number; multiplier?: number } = {}) {
    const lessonPoints = options.lessonPoints ?? 50;
    const multiplier = options.multiplier ?? 1;

    return definePlugin({
      id: 'integration_xp_leaderboard',
      name: 'XP & Leaderboard',
      version: '1.0.0',
      category: 'integration' as const,
      description: 'Awards XP points on lesson completion and exercise grading.',
      entities: [xpEntity],
      privacy: {
        description: 'Stores cumulative XP points and level per student per org.',
        storesPersonalData: true,
        onDeleteUser: async (_userId: string, _orgId: string) => {
          // In production: delete all xp_points records for this userId+orgId
        },
        onExportUser: async (_userId: string, _orgId: string) => {
          // In production: return all xp_points records for this userId+orgId
          return {};
        }
      },
      nav: {
        add: [
          {
            key: 'leaderboard',
            title: 'Leaderboard',
            path: '/leaderboard'
          }
        ]
      },
      on: {
        'lesson.completed': async (event: any, ctx: any) => {
          const current = (await ctx.data.xp_points.findOne({ userId: event.userId }))?.data?.points ?? 0;
          await ctx.data.xp_points.upsert({
            where: { userId: event.userId },
            create: { userId: event.userId, data: { points: lessonPoints, level: 1 } },
            update: { data: { points: current + lessonPoints } }
          });
        },
        'exercise.graded': async (event: any, ctx: any) => {
          const current = (await ctx.data.xp_points.findOne({ userId: event.userId }))?.data?.points ?? 0;
          const earned = Math.round(event.score * multiplier);
          await ctx.data.xp_points.upsert({
            where: { userId: event.userId },
            create: { userId: event.userId, data: { points: earned, level: 1 } },
            update: { data: { points: current + earned } }
          });
        }
      }
    });
  }

  it('resolves plugin registration, entities, nav, and hooks in resolveConfig', () => {
    const plugin = createXpPlugin({ lessonPoints: 100, multiplier: 2 });
    const resolved = resolveConfig(defineConfig({ plugins: [plugin] }));

    expect(resolved.entities['xp_points']).toBeDefined();
    expect(resolved.entities['xp_points'].name).toBe('xp_points');
    expect(resolved.entities['xp_points'].schema.scope).toContain('org');
    expect(resolved.entities['xp_points'].schema.scope).toContain('user');

    const navKeys = resolved.nav.add.map((i) => i.key);
    expect(navKeys).toContain('leaderboard');

    expect(plugin.on?.['lesson.completed']).toBeDefined();
    expect(plugin.on?.['exercise.graded']).toBeDefined();
  });

  it('awards XP upon lesson.completed and exercise.graded with tenant isolation', async () => {
    const adapter = createInMemoryEntityAdapter();
    const plugin = createXpPlugin({ lessonPoints: 50, multiplier: 1 });

    const org1Repo = createEntityRepository(xpEntity, adapter, {
      pluginId: plugin.id,
      orgId: 'org-1'
    });

    const org1Ctx = {
      data: { xp_points: org1Repo }
    };

    // 1. Simulate lesson.completed
    await plugin.on!['lesson.completed']({ userId: 'student-1', lessonId: 'lesson-1', orgId: 'org-1' }, org1Ctx);

    let records = await org1Repo.findMany({ userId: 'student-1' });
    expect(records).toHaveLength(1);
    expect(records[0].data.points).toBe(50);

    // 2. Simulate exercise.graded with score 80
    await plugin.on!['exercise.graded'](
      { userId: 'student-1', exerciseId: 'ex-1', score: 80, orgId: 'org-1' },
      org1Ctx
    );

    records = await org1Repo.findMany({ userId: 'student-1' });
    expect(records).toHaveLength(1);
    expect(records[0].data.points).toBe(130); // 50 + 80

    // 3. Multi-tenant isolation: org-2 repo sees 0 points for student-1
    const org2Repo = createEntityRepository(xpEntity, adapter, {
      pluginId: plugin.id,
      orgId: 'org-2'
    });
    const org2Records = await org2Repo.findMany({ userId: 'student-1' });
    expect(org2Records).toHaveLength(0);
  });
});
