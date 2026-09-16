import { describe, expect, it, beforeEach } from 'vitest';
import { defineEntity, createEntityRepository, createInMemoryEntityAdapter } from '@cio/sdk';

describe('createEntityRepository — tenant isolation & data:own scope', () => {
  const xpEntity = defineEntity('xp_points', {
    scope: ['org', 'user'],
    fields: {
      points: { type: 'int', default: 0 },
      level: { type: 'int', default: 1 }
    }
  });

  let adapter: ReturnType<typeof createInMemoryEntityAdapter>;

  beforeEach(() => {
    adapter = createInMemoryEntityAdapter();
  });

  it('inserts and retrieves records strictly scoped to orgId', async () => {
    const org1Repo = createEntityRepository(xpEntity, adapter, {
      pluginId: 'integration_xp',
      orgId: 'org-1'
    });

    const org2Repo = createEntityRepository(xpEntity, adapter, {
      pluginId: 'integration_xp',
      orgId: 'org-2'
    });

    await org1Repo.insert({
      userId: 'user-a',
      data: { points: 100, level: 2 }
    });

    const org1Records = await org1Repo.findMany();
    expect(org1Records).toHaveLength(1);
    expect(org1Records[0].data.points).toBe(100);

    // org-2 should see zero records (tenant isolation)
    const org2Records = await org2Repo.findMany();
    expect(org2Records).toHaveLength(0);

    const org2FindOne = await org2Repo.findOne({ userId: 'user-a' });
    expect(org2FindOne).toBeNull();
  });

  it('enforces data:own scope — prevents access across plugin names', async () => {
    const xpRepo = createEntityRepository(xpEntity, adapter, {
      pluginId: 'integration_xp',
      orgId: 'org-1'
    });

    await xpRepo.insert({
      userId: 'user-a',
      data: { points: 50, level: 1 }
    });

    // Another plugin attempting to access the same entity table/records
    const otherPluginRepo = createEntityRepository(xpEntity, adapter, {
      pluginId: 'integration_rogue',
      orgId: 'org-1'
    });

    const records = await otherPluginRepo.findMany();
    expect(records).toHaveLength(0);

    const record = await otherPluginRepo.findOne({ userId: 'user-a' });
    expect(record).toBeNull();
  });

  it('filters by relational scope keys (userId, courseId, lessonId)', async () => {
    const lessonActivityEntity = defineEntity('lesson_notes', {
      scope: ['org', 'lesson', 'user'],
      fields: {
        note: { type: 'text' }
      }
    });

    const repo = createEntityRepository(lessonActivityEntity, adapter, {
      pluginId: 'block_notes',
      orgId: 'org-1'
    });

    await repo.insert({
      userId: 'user-1',
      lessonId: 'lesson-101',
      data: { note: 'Note for lesson 101' }
    });

    await repo.insert({
      userId: 'user-1',
      lessonId: 'lesson-102',
      data: { note: 'Note for lesson 102' }
    });

    const userLesson101Notes = await repo.findMany({
      userId: 'user-1',
      lessonId: 'lesson-101'
    });

    expect(userLesson101Notes).toHaveLength(1);
    expect(userLesson101Notes[0].data.note).toBe('Note for lesson 101');
  });

  it('performs idempotent upsert and updates on conflict', async () => {
    const repo = createEntityRepository(xpEntity, adapter, {
      pluginId: 'integration_xp',
      orgId: 'org-1'
    });

    // First upsert inserts
    const record1 = await repo.upsert({
      where: { userId: 'user-1' },
      create: { userId: 'user-1', data: { points: 10, level: 1 } },
      update: { data: { points: 20, level: 1 } }
    });

    expect(record1.data.points).toBe(10);

    // Second upsert updates existing record without duplicate
    const record2 = await repo.upsert({
      where: { userId: 'user-1' },
      create: { userId: 'user-1', data: { points: 10, level: 1 } },
      update: { data: { points: 35, level: 2 } }
    });

    expect(record2.data.points).toBe(35);
    expect(record2.data.level).toBe(2);

    const all = await repo.findMany();
    expect(all).toHaveLength(1);
  });

  it('deletes and updates records with orgId scoping preserved', async () => {
    const repo = createEntityRepository(xpEntity, adapter, {
      pluginId: 'integration_xp',
      orgId: 'org-1'
    });

    const inserted = await repo.insert({
      userId: 'user-del',
      data: { points: 5, level: 1 }
    });

    const updated = await repo.update({ userId: 'user-del' }, { data: { points: 99, level: 5 } });
    expect(updated?.data.points).toBe(99);

    const deleted = await repo.delete({ userId: 'user-del' });
    expect(deleted).toBe(true);

    const notFound = await repo.findOne({ userId: 'user-del' });
    expect(notFound).toBeNull();
  });

  it('rejects repositories without mandatory plugin and organization scope', () => {
    expect(() => createEntityRepository(xpEntity, adapter, { pluginId: '', orgId: 'org-1' })).toThrow(/pluginId/i);
    expect(() => createEntityRepository(xpEntity, adapter, { pluginId: 'integration_xp', orgId: '' })).toThrow(
      /orgId/i
    );
  });
});
