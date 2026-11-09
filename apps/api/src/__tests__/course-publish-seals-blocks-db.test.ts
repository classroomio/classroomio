import 'dotenv/config';

import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import type { DbOrTxClient } from '@cio/db/drizzle';
import { updateCourse } from '@cio/core/services/course/course';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

describe.skipIf(!hasDatabase)('publishing through a course update', () => {
  async function inRolledBackCourse(
    run: (context: {
      courseId: string;
      historyId: number;
      tx: DbOrTxClient;
      schema: typeof import('@db/schema');
    }) => Promise<void>
  ) {
    const { db } = await import('@db/drizzle');
    const { createOrganization } = await import('@db/queries/organization');
    const schema = await import('@db/schema');
    const rollback = new Error('rollback');

    try {
      await db.transaction(async (tx) => {
        const organization = await createOrganization({ name: `publish-seal-${Date.now()}` }, tx);
        const [group] = await tx
          .insert(schema.group)
          .values({ name: 'Publish', organizationId: organization.id })
          .returning();
        const [course] = await tx
          .insert(schema.course)
          .values({ title: 'Publish course', description: '', groupId: group.id, slug: `publish-${organization.id}` })
          .returning();
        const [lesson] = await tx
          .insert(schema.lesson)
          .values({ courseId: course.id, title: 'Intro', slug: 'intro', order: 1 })
          .returning();
        const [block] = await tx
          .insert(schema.block)
          .values({ organizationId: organization.id, type: 'note', data: {} })
          .returning();
        await tx.insert(schema.blockPlacement).values({ lessonId: lesson.id, blockId: block.id, position: 'a0' });
        const [locale] = await tx
          .insert(schema.blockLocale)
          .values({ blockId: block.id, locale: 'en', content: '<p>draft</p>' })
          .returning();
        const [history] = await tx
          .insert(schema.blockLocaleHistory)
          .values({ blockLocaleId: locale.id, newContent: '<p>draft</p>', kind: 'auto' })
          .returning();

        await run({ courseId: course.id, historyId: history.id, tx, schema });

        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
  }

  it('seals the latest block version when the course goes live', async () => {
    await inRolledBackCourse(async ({ courseId, historyId, tx, schema }) => {
      await updateCourse(courseId, { isPublished: true }, tx);

      const [history] = await tx
        .select({ kind: schema.blockLocaleHistory.kind, isSealed: schema.blockLocaleHistory.isSealed })
        .from(schema.blockLocaleHistory)
        .where(eq(schema.blockLocaleHistory.id, historyId));
      expect(history).toEqual({ kind: 'publish', isSealed: true });
    });
  });

  it('leaves versions open for an update that does not publish', async () => {
    await inRolledBackCourse(async ({ courseId, historyId, tx, schema }) => {
      await updateCourse(courseId, { title: 'Renamed' }, tx);

      const [history] = await tx
        .select({ isSealed: schema.blockLocaleHistory.isSealed })
        .from(schema.blockLocaleHistory)
        .where(eq(schema.blockLocaleHistory.id, historyId));
      expect(history.isSealed).toBe(false);
    });
  });
});
