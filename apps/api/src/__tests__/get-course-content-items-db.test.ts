import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

describe.skipIf(!hasDatabase)('getCourseContentItems / getCourseContentStructure against the database', () => {
  const suffix = `${Date.now()}`;
  let organizationId = '';
  let userId = '';
  let groupId = '';
  let courseId = '';
  let memberId = '';
  let sectionId = '';
  let notedLessonId = '';
  let translatedLessonId = '';
  let plainLessonId = '';
  let directExerciseId = '';
  let lessonOnlyExerciseId = '';
  let submittedExerciseId = '';
  let passedExerciseId = '';
  let failedPassedExerciseId = '';

  beforeAll(async () => {
    const { db } = await import('@db/drizzle');
    const { createOrganization } = await import('@db/queries/organization');
    const schema = await import('@db/schema');

    const organization = await createOrganization({ name: `course-content-${suffix}` });
    organizationId = organization.id;

    const email = `student-${suffix}@course-content.test`;
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
    memberId = member.id;

    await db
      .insert(schema.submissionstatus)
      .values([
        { id: 1, label: 'Submitted' },
        { id: 2, label: 'In Progress' },
        { id: 3, label: 'Graded' }
      ])
      .onConflictDoNothing();

    const [section] = await db.insert(schema.courseSection).values({ courseId, title: 'Week 1', order: 1 }).returning();
    sectionId = section.id;

    // Created through the real write path (createLessons/createLessonLanguage), not a raw
    // insert, so this also exercises `has_note_content` the way production writes do.
    const { createLessons } = await import('@db/queries/lesson/lesson');
    const { createLessonLanguage } = await import('@db/queries/lesson/language');

    const [noted, plain, translated] = await createLessons([
      { courseId, sectionId, title: 'Noted lesson', slug: 'noted-lesson', order: 1, note: '  Some notes  ' },
      { courseId, sectionId, title: 'Plain lesson', slug: 'plain-lesson', order: 2 },
      { courseId, sectionId, title: 'Translated lesson', slug: 'translated-lesson', order: 3 }
    ]);
    notedLessonId = noted.id;
    plainLessonId = plain.id;
    translatedLessonId = translated.id;

    await createLessonLanguage({ lessonId: translatedLessonId, locale: 'fr', content: '<p>&nbsp;Bonjour&nbsp;</p>' });

    const [direct, submitted, passed, failedPassed] = await db
      .insert(schema.exercise)
      .values([
        { title: 'Direct exercise', slug: 'direct-exercise', order: 4, courseId, sectionId },
        { title: 'Submitted exercise', slug: 'submitted-exercise', order: 5, courseId, sectionId },
        {
          title: 'Passed exercise',
          slug: 'passed-exercise',
          order: 6,
          courseId,
          sectionId,
          completionPolicy: 'passed',
          passThreshold: 80
        },
        {
          title: 'Failed passed exercise',
          slug: 'failed-passed-exercise',
          order: 7,
          courseId,
          sectionId,
          completionPolicy: 'passed',
          passThreshold: 80
        }
      ])
      .returning();
    directExerciseId = direct.id;
    submittedExerciseId = submitted.id;
    passedExerciseId = passed.id;
    failedPassedExerciseId = failedPassed.id;

    // Legacy exercise reachable only through its (deprecated) lesson_id, with no course_id of its own.
    const [lessonOnly] = await db
      .insert(schema.exercise)
      .values({ title: 'Lesson-only exercise', slug: 'lesson-only-exercise', order: 8, lessonId: plainLessonId })
      .returning();
    lessonOnlyExerciseId = lessonOnly.id;

    await db.insert(schema.question).values([
      { exerciseId: passedExerciseId, questionTypeId: 1, title: 'Q1', points: 5, order: 0 },
      { exerciseId: passedExerciseId, questionTypeId: 1, title: 'Q2', points: 5, order: 1 },
      { exerciseId: failedPassedExerciseId, questionTypeId: 1, title: 'Q1', points: 5, order: 0 },
      { exerciseId: failedPassedExerciseId, questionTypeId: 1, title: 'Q2', points: 5, order: 1 }
    ]);

    await db.insert(schema.lessonCompletion).values({ lessonId: notedLessonId, profileId: userId, isComplete: true });
    await db.insert(schema.submission).values([
      { exerciseId: submittedExerciseId, courseId, submittedBy: memberId, statusId: 1 },
      {
        exerciseId: passedExerciseId,
        courseId,
        submittedBy: memberId,
        statusId: 3,
        gradingState: 'completed',
        total: 8
      },
      {
        exerciseId: failedPassedExerciseId,
        courseId,
        submittedBy: memberId,
        statusId: 3,
        gradingState: 'completed',
        total: 5
      }
    ]);
  });

  afterAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    if (courseId) {
      await db.delete(schema.submission).where(eq(schema.submission.courseId, courseId));
      await db.delete(schema.question).where(eq(schema.question.exerciseId, passedExerciseId));
      await db.delete(schema.question).where(eq(schema.question.exerciseId, failedPassedExerciseId));
      await db.delete(schema.exercise).where(eq(schema.exercise.courseId, courseId));
      if (lessonOnlyExerciseId) {
        await db.delete(schema.exercise).where(eq(schema.exercise.id, lessonOnlyExerciseId));
      }
      await db.delete(schema.lessonCompletion).where(eq(schema.lessonCompletion.lessonId, notedLessonId));
      await db.delete(schema.lessonLanguage).where(eq(schema.lessonLanguage.lessonId, translatedLessonId));
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

  it('computes hasNoteContent from the note column and from any lesson_language translation', async () => {
    const { getCourseContentStructure } = await import('@cio/db/queries/course/content');

    const items = await getCourseContentStructure(courseId);
    const byId = new Map(items.map((item) => [item.id, item]));

    expect(byId.get(notedLessonId)?.hasNoteContent).toBe(true);
    expect(byId.get(translatedLessonId)?.hasNoteContent).toBe(true);
    expect(byId.get(plainLessonId)?.hasNoteContent).toBe(false);
  });

  it('keeps hasNoteContent in sync when a note is cleared and when its only translation is deleted', async () => {
    const { updateLesson } = await import('@db/queries/lesson/lesson');
    const { deleteLessonLanguage } = await import('@db/queries/lesson/language');
    const { getCourseContentStructure } = await import('@cio/db/queries/course/content');

    await updateLesson(notedLessonId, { note: '  ' });
    await deleteLessonLanguage(translatedLessonId, 'fr');

    const items = await getCourseContentStructure(courseId);
    const byId = new Map(items.map((item) => [item.id, item]));

    expect(byId.get(notedLessonId)?.hasNoteContent).toBe(false);
    expect(byId.get(translatedLessonId)?.hasNoteContent).toBe(false);

    // Restore for the other assertions in this suite.
    await updateLesson(notedLessonId, { note: '  Some notes  ' });
    const { createLessonLanguage } = await import('@db/queries/lesson/language');
    await createLessonLanguage({ lessonId: translatedLessonId, locale: 'fr', content: '<p>&nbsp;Bonjour&nbsp;</p>' });
  });

  it('includes an exercise reachable only through its deprecated lesson_id, placed under the lesson’s section', async () => {
    const { getCourseContentStructure } = await import('@cio/db/queries/course/content');

    const items = await getCourseContentStructure(courseId);
    const lessonOnly = items.find((item) => item.id === lessonOnlyExerciseId);

    expect(lessonOnly).toBeDefined();
    expect(lessonOnly?.sectionId).toBe(sectionId);
  });

  it('reports questionCount from the question table', async () => {
    const { getCourseContentStructure } = await import('@cio/db/queries/course/content');

    const items = await getCourseContentStructure(courseId);
    const passed = items.find((item) => item.id === passedExerciseId);

    expect(passed?.questionCount).toBe(2);
  });

  it('leaves isComplete false for every lesson and exercise when no profile is given', async () => {
    const { getCourseContentStructure } = await import('@cio/db/queries/course/content');

    const items = await getCourseContentStructure(courseId);
    const trackable = items.filter((item) => item.type === 'LESSON' || item.type === 'EXERCISE');

    expect(trackable.every((item) => item.isComplete === false)).toBe(true);
  });

  it('marks a lesson complete for the profile with a true lesson_completion row, and no others', async () => {
    const { getCourseContentItems } = await import('@cio/db/queries/course/content');

    const items = await getCourseContentItems(courseId, userId);
    const byId = new Map(items.map((item) => [item.id, item]));

    expect(byId.get(notedLessonId)?.isComplete).toBe(true);
    expect(byId.get(plainLessonId)?.isComplete).toBe(false);
  });

  it('honors the exercise completion policy: any submission for "submitted", pass_threshold for "passed"', async () => {
    const { getCourseContentItems } = await import('@cio/db/queries/course/content');

    const items = await getCourseContentItems(courseId, userId);
    const byId = new Map(items.map((item) => [item.id, item]));

    expect(byId.get(directExerciseId)?.isComplete).toBe(false);
    expect(byId.get(submittedExerciseId)?.isComplete).toBe(true);
    expect(byId.get(passedExerciseId)?.isComplete).toBe(true);
    expect(byId.get(failedPassedExerciseId)?.isComplete).toBe(false);
  });
});
