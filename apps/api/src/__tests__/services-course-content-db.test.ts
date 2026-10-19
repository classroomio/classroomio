import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

describe.skipIf(!hasDatabase)('course content delete and lock against the database', () => {
  const suffix = `${Date.now()}`;
  let organizationId = '';
  let userId = '';
  let groupId = '';
  let courseId = '';
  let sectionWithWorkId = '';
  let answeredLessonId = '';
  let submittedExerciseId = '';
  let untouchedLessonId = '';
  let lockLessonId = '';

  const lessonExists = async (lessonId: string) => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const rows = await db.select({ id: schema.lesson.id }).from(schema.lesson).where(eq(schema.lesson.id, lessonId));

    return rows.length > 0;
  };

  beforeAll(async () => {
    const { db } = await import('@db/drizzle');
    const { createOrganization } = await import('@db/queries/organization');
    const schema = await import('@db/schema');

    const organization = await createOrganization({ name: `content-delete-${suffix}` });
    organizationId = organization.id;

    const email = `student-${suffix}@content-delete.test`;
    const [user] = await db.insert(schema.user).values({ name: 'student', email, emailVerified: true }).returning();
    userId = user.id;
    await db.insert(schema.profile).values({ id: userId, fullname: 'Student', username: `student-${suffix}`, email });

    const [group] = await db
      .insert(schema.group)
      .values({ name: `group-${suffix}`, organizationId })
      .returning();
    groupId = group.id;

    const [course] = await db
      .insert(schema.course)
      .values({ title: 'Course', description: 'Fixture', groupId, slug: `course-${suffix}` })
      .returning();
    courseId = course.id;

    const [member] = await db
      .insert(schema.groupmember)
      .values({ groupId, roleId: ROLE.STUDENT, profileId: userId, email })
      .returning();

    await db
      .insert(schema.submissionstatus)
      .values([
        { id: 1, label: 'Submitted' },
        { id: 2, label: 'In Progress' },
        { id: 3, label: 'Graded' }
      ])
      .onConflictDoNothing();

    const [section] = await db.insert(schema.courseSection).values({ courseId, title: 'Week 1', order: 1 }).returning();
    sectionWithWorkId = section.id;

    const [answered, untouched, lockable] = await db
      .insert(schema.lesson)
      .values([
        { courseId, sectionId: sectionWithWorkId, title: 'Done lesson', slug: 'done-lesson', order: 1 },
        { courseId, title: 'Untouched lesson', slug: 'untouched-lesson', order: 2 },
        { courseId, title: 'Lockable lesson', slug: 'lockable-lesson', order: 3, isUnlocked: true }
      ])
      .returning();
    answeredLessonId = answered.id;
    untouchedLessonId = untouched.id;
    lockLessonId = lockable.id;

    const [exercise] = await db
      .insert(schema.exercise)
      .values({ title: 'Quiz', slug: 'quiz', order: 2, courseId, sectionId: sectionWithWorkId })
      .returning();
    submittedExerciseId = exercise.id;

    await db
      .insert(schema.lessonCompletion)
      .values({ lessonId: answeredLessonId, profileId: userId, isComplete: true });
    await db
      .insert(schema.submission)
      .values({ exerciseId: submittedExerciseId, courseId, submittedBy: member.id, statusId: 1 });
  });

  afterAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    if (courseId) {
      await db.delete(schema.submission).where(eq(schema.submission.courseId, courseId));
      await db.delete(schema.exercise).where(eq(schema.exercise.courseId, courseId));
      await db.delete(schema.lesson).where(eq(schema.lesson.courseId, courseId));
      await db.delete(schema.courseSection).where(eq(schema.courseSection.courseId, courseId));
    }
    if (groupId) {
      await db.delete(schema.groupmember).where(eq(schema.groupmember.groupId, groupId));
      await db.delete(schema.course).where(eq(schema.course.groupId, groupId));
      await db.delete(schema.group).where(eq(schema.group.id, groupId));
    }
    if (organizationId) {
      await db.delete(schema.organization).where(eq(schema.organization.id, organizationId));
    }
    if (userId) {
      await db.delete(schema.profile).where(eq(schema.profile.id, userId));
      await db.delete(schema.user).where(eq(schema.user.id, userId));
    }
  });

  it('returns each locked item as stored after the change', async () => {
    const { updateCourseContent } = await import('@cio/core/services/course/content');

    const result = await updateCourseContent(courseId, [{ id: lockLessonId, type: 'LESSON', isUnlocked: false }]);

    expect(result.items).toEqual([expect.objectContaining({ id: lockLessonId, type: 'LESSON', isUnlocked: false })]);
  });

  it('refuses to delete a section holding student work without force, and deletes nothing', async () => {
    const { deleteCourseContent } = await import('@cio/core/services/course/content');

    await expect(
      deleteCourseContent(courseId, { sectionId: sectionWithWorkId }, { force: false })
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(await lessonExists(answeredLessonId)).toBe(true);
  });

  it('deletes content with no student work without force', async () => {
    const { deleteCourseContent } = await import('@cio/core/services/course/content');

    const result = await deleteCourseContent(
      courseId,
      { items: [{ id: untouchedLessonId, type: 'LESSON' }] },
      { force: false }
    );

    expect(result).toEqual({
      items: [{ id: untouchedLessonId, type: 'LESSON' }],
      deletedSubmissions: 0,
      deletedLessonCompletions: 0
    });
    expect(await lessonExists(untouchedLessonId)).toBe(false);
  });

  it('with force, deletes the section and reports the student work it removed', async () => {
    const { deleteCourseContent } = await import('@cio/core/services/course/content');

    const result = await deleteCourseContent(courseId, { sectionId: sectionWithWorkId }, { force: true });

    expect(result.deletedSubmissions).toBe(1);
    expect(result.deletedLessonCompletions).toBe(1);
    expect(result.items).toEqual(
      expect.arrayContaining([
        { id: answeredLessonId, type: 'LESSON' },
        { id: submittedExerciseId, type: 'EXERCISE' }
      ])
    );
    expect(await lessonExists(answeredLessonId)).toBe(false);
  });
});
