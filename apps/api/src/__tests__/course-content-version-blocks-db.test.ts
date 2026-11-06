import 'dotenv/config';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

describe.skipIf(!hasDatabase)('getCourseContentVersion against block content', () => {
  const suffix = `${Date.now()}`;
  let testIndex = 0;
  let organizationId = '';
  let courseId = '';
  let lessonId = '';
  let noteBlockId = '';

  beforeEach(async () => {
    const { db } = await import('@db/drizzle');
    const { createOrganization } = await import('@db/queries/organization');
    const schema = await import('@db/schema');

    testIndex += 1;
    const organization = await createOrganization({ name: `course-content-version-blocks-${suffix}-${testIndex}` });
    organizationId = organization.id;

    const [course] = await db
      .insert(schema.course)
      .values({ title: 'Course', description: 'Fixture', slug: `course-version-blocks-${suffix}-${testIndex}` })
      .returning();
    courseId = course.id;

    const [lesson] = await db
      .insert(schema.lesson)
      .values({ courseId, title: 'Lesson', slug: `lesson-version-blocks-${suffix}-${testIndex}`, order: 1 })
      .returning();
    lessonId = lesson.id;

    const [noteBlock] = await db.insert(schema.block).values({ organizationId, type: 'note', data: {} }).returning();
    noteBlockId = noteBlock.id;

    await db.insert(schema.blockPlacement).values({ lessonId, blockId: noteBlockId, position: 'a0' });
  });

  afterEach(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    if (courseId) {
      await db.delete(schema.lesson).where(eq(schema.lesson.courseId, courseId));
      await db.delete(schema.course).where(eq(schema.course.id, courseId));
    }
    if (organizationId) {
      await db.delete(schema.organization).where(eq(schema.organization.id, organizationId));
    }
  });

  it('changes when a note block gains locale content, and when that content is edited', async () => {
    const { upsertBlockLocale } = await import('@db/queries/block/locale');
    const { getCourseContentVersion } = await import('@db/queries/course/content-timestamp');

    const empty = await getCourseContentVersion(courseId);

    await upsertBlockLocale({ blockId: noteBlockId, locale: 'en', content: '<p>Hello</p>' });
    const withContent = await getCourseContentVersion(courseId);
    expect(withContent).not.toBe(empty);

    await upsertBlockLocale({ blockId: noteBlockId, locale: 'en', content: '<p>Hello again</p>' });
    const edited = await getCourseContentVersion(courseId);
    expect(edited).not.toBe(withContent);
  });

  it('changes when a block is removed from a lesson', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { getCourseContentVersion } = await import('@db/queries/course/content-timestamp');

    const before = await getCourseContentVersion(courseId);

    await db.delete(schema.blockPlacement).where(eq(schema.blockPlacement.blockId, noteBlockId));

    const after = await getCourseContentVersion(courseId);
    expect(after).not.toBe(before);
  });
});
