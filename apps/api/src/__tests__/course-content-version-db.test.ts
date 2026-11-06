import 'dotenv/config';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

describe.skipIf(!hasDatabase)('getCourseContentVersion against the database', () => {
  const suffix = `${Date.now()}`;
  let testIndex = 0;
  let courseId = '';
  let sectionId = '';
  let lessonAId = '';
  let lessonBId = '';

  beforeEach(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    testIndex += 1;
    const [course] = await db
      .insert(schema.course)
      .values({ title: 'Course', description: 'Fixture', slug: `course-version-${suffix}-${testIndex}` })
      .returning();
    courseId = course.id;

    const [section] = await db.insert(schema.courseSection).values({ courseId, title: 'Week 1', order: 1 }).returning();
    sectionId = section.id;

    const [lessonA, lessonB] = await db
      .insert(schema.lesson)
      .values([
        { courseId, sectionId, title: 'Lesson A', slug: `lesson-a-${suffix}`, order: 1 },
        { courseId, sectionId, title: 'Lesson B', slug: `lesson-b-${suffix}`, order: 2 }
      ])
      .returning();
    lessonAId = lessonA.id;
    lessonBId = lessonB.id;
  });

  afterEach(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    if (courseId) {
      await db.delete(schema.lesson).where(eq(schema.lesson.courseId, courseId));
      await db.delete(schema.courseSection).where(eq(schema.courseSection.courseId, courseId));
      await db.delete(schema.course).where(eq(schema.course.id, courseId));
    }
  });

  it('changes when a lesson is reordered, even though a pure reorder does not bump updated_at', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { getCourseContentVersion } = await import('@db/queries/course/content-timestamp');

    const before = await getCourseContentVersion(courseId);

    await db.update(schema.lesson).set({ order: 5 }).where(eq(schema.lesson.id, lessonBId));

    const after = await getCourseContentVersion(courseId);
    expect(after).not.toBe(before);
  });

  it('changes when a lesson moves to a different section, even though that does not bump updated_at', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { getCourseContentVersion } = await import('@db/queries/course/content-timestamp');

    const [otherSection] = await db
      .insert(schema.courseSection)
      .values({ courseId, title: 'Week 2', order: 2 })
      .returning();
    const before = await getCourseContentVersion(courseId);

    await db.update(schema.lesson).set({ sectionId: otherSection.id }).where(eq(schema.lesson.id, lessonBId));

    const after = await getCourseContentVersion(courseId);
    expect(after).not.toBe(before);
  });

  it('changes when a lesson other than the most recently updated one is deleted', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { getCourseContentVersion } = await import('@db/queries/course/content-timestamp');

    // Touch lessonB so it (not lessonA, the one we delete) holds the latest updated_at.
    await db.update(schema.lesson).set({ title: 'Lesson B edited' }).where(eq(schema.lesson.id, lessonBId));
    const before = await getCourseContentVersion(courseId);

    await db.delete(schema.lesson).where(eq(schema.lesson.id, lessonAId));

    const after = await getCourseContentVersion(courseId);
    expect(after).not.toBe(before);
  });

  it('changes when a legacy lesson-linked exercise (no course_id of its own) is edited or deleted', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { getCourseContentVersion } = await import('@db/queries/course/content-timestamp');

    const [legacyExercise] = await db
      .insert(schema.exercise)
      .values({ title: 'Legacy exercise', slug: `legacy-exercise-${suffix}`, order: 3, lessonId: lessonAId })
      .returning();

    const { updateExercise } = await import('@db/queries/exercise/exercise');

    const beforeEdit = await getCourseContentVersion(courseId);
    await updateExercise(legacyExercise.id, { title: 'Legacy exercise edited' });
    const afterEdit = await getCourseContentVersion(courseId);
    expect(afterEdit).not.toBe(beforeEdit);

    await db.delete(schema.exercise).where(eq(schema.exercise.id, legacyExercise.id));
    const afterDelete = await getCourseContentVersion(courseId);
    expect(afterDelete).not.toBe(afterEdit);
  });
});
