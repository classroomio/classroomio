import 'dotenv/config';

import { describe, expect, it } from 'vitest';
import { eq, inArray } from 'drizzle-orm';

import { pullCourseTemplateUpdates } from '@api/services/course/template-sync';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

describe.skipIf(!hasDatabase)('pulling template lesson blocks', () => {
  it('updates linked blocks in place, keeping their history and their sharing', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const past = '2020-01-01T00:00:00.000Z';
    const current = '2026-01-01T00:00:00.000Z';
    const [profile] = await db.select({ id: schema.profile.id }).from(schema.profile).limit(1);
    if (!profile) return;

    const [organization] = await db
      .insert(schema.organization)
      .values({ name: `tpl-blocks-${Date.now()}` })
      .returning();
    const courseIds: string[] = [];

    try {
      const [group] = await db
        .insert(schema.group)
        .values({ name: 'Pull blocks', organizationId: organization.id })
        .returning();
      const [template] = await db
        .insert(schema.course)
        .values({ title: 'Template', description: '', groupId: group.id, isTemplate: true, status: 'ACTIVE' })
        .returning();
      const [course] = await db
        .insert(schema.course)
        .values({ title: 'Course', description: '', groupId: group.id, templateId: template.id, status: 'ACTIVE' })
        .returning();
      courseIds.push(template.id, course.id);

      const [templateLessonA, templateLessonB] = await db
        .insert(schema.lesson)
        .values([
          { courseId: template.id, title: 'A', slug: 'a', order: 1, createdAt: past, updatedAt: current },
          { courseId: template.id, title: 'B', slug: 'b', order: 2, createdAt: past, updatedAt: current }
        ])
        .returning();
      const [courseLessonA, courseLessonB] = await db
        .insert(schema.lesson)
        .values([
          {
            courseId: course.id,
            title: 'A',
            slug: 'a',
            order: 1,
            sourceId: templateLessonA.id,
            sourceSyncedAt: past,
            createdAt: past,
            updatedAt: past
          },
          {
            courseId: course.id,
            title: 'B',
            slug: 'b',
            order: 2,
            sourceId: templateLessonB.id,
            sourceSyncedAt: past,
            createdAt: past,
            updatedAt: past
          }
        ])
        .returning();

      const [templateNote] = await db
        .insert(schema.block)
        .values({ organizationId: organization.id, type: 'note', data: {} })
        .returning();
      await db.insert(schema.blockPlacement).values([
        { lessonId: templateLessonA.id, blockId: templateNote.id, position: 'a0' },
        { lessonId: templateLessonB.id, blockId: templateNote.id, position: 'a0' }
      ]);
      await db.insert(schema.blockLocale).values({ blockId: templateNote.id, locale: 'en', content: '<p>v2</p>' });

      const [courseNote] = await db
        .insert(schema.block)
        .values({ organizationId: organization.id, type: 'note', data: {}, sourceId: templateNote.id })
        .returning();
      await db.insert(schema.blockPlacement).values([
        { lessonId: courseLessonA.id, blockId: courseNote.id, position: 'a0' },
        { lessonId: courseLessonB.id, blockId: courseNote.id, position: 'a0' }
      ]);
      const [courseLocale] = await db
        .insert(schema.blockLocale)
        .values({ blockId: courseNote.id, locale: 'en', content: '<p>v1</p>' })
        .returning();
      const [savedVersion] = await db
        .insert(schema.blockLocaleHistory)
        .values({ blockLocaleId: courseLocale.id, newContent: '<p>v1</p>', kind: 'manual', isSealed: true })
        .returning();

      await pullCourseTemplateUpdates(
        course.id,
        organization.id,
        profile.id,
        [templateLessonA.id, templateLessonB.id],
        []
      );

      const placements = await db
        .select({ blockId: schema.blockPlacement.blockId })
        .from(schema.blockPlacement)
        .where(inArray(schema.blockPlacement.lessonId, [courseLessonA.id, courseLessonB.id]));
      expect(placements.map((placement) => placement.blockId)).toEqual([courseNote.id, courseNote.id]);

      const [locale] = await db
        .select({ content: schema.blockLocale.content })
        .from(schema.blockLocale)
        .where(eq(schema.blockLocale.id, courseLocale.id));
      expect(locale.content).toBe('<p>v2</p>');

      const history = await db
        .select({ id: schema.blockLocaleHistory.id, newContent: schema.blockLocaleHistory.newContent })
        .from(schema.blockLocaleHistory)
        .where(eq(schema.blockLocaleHistory.blockLocaleId, courseLocale.id));
      expect(history.map((entry) => entry.id)).toContain(savedVersion.id);
      expect(history.map((entry) => entry.newContent)).toContain('<p>v2</p>');
    } finally {
      if (courseIds.length > 0) {
        await db.delete(schema.lesson).where(inArray(schema.lesson.courseId, courseIds));
        await db.delete(schema.course).where(inArray(schema.course.id, courseIds));
      }
      await db.delete(schema.group).where(eq(schema.group.organizationId, organization.id));
      await db.delete(schema.organization).where(eq(schema.organization.id, organization.id));
    }
  });
});
