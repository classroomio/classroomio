import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

describe.skipIf(!hasDatabase)('createSubmissionService against the database', () => {
  const suffix = `${Date.now()}`;
  let organizationId = '';
  let userId = '';
  let groupId = '';
  let courseId = '';
  let exerciseId = '';
  let memberId = '';
  let choiceQuestionId = 0;
  let correctOptionId = 0;
  let paragraphQuestionId = 0;

  const countSubmissions = async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const rows = await db
      .select({ id: schema.submission.id })
      .from(schema.submission)
      .where(eq(schema.submission.exerciseId, exerciseId));

    return rows.length;
  };

  beforeAll(async () => {
    const { db } = await import('@db/drizzle');
    const { createOrganization } = await import('@db/queries/organization');
    const schema = await import('@db/schema');

    const organization = await createOrganization({ name: `submission-create-${suffix}` });
    organizationId = organization.id;

    const email = `student-${suffix}@submission-create.test`;
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

    const [exercise] = await db
      .insert(schema.exercise)
      .values({ title: 'One attempt quiz', slug: 'one-attempt-quiz', order: 1, courseId, allowMultipleAttempts: false })
      .returning();
    exerciseId = exercise.id;

    const [choice, paragraph] = await db
      .insert(schema.question)
      .values([
        { exerciseId, questionTypeId: 1, title: 'Pick one', points: 1, order: 0 },
        { exerciseId, questionTypeId: 3, title: 'Explain', points: 1, order: 1, settings: { maxCharacters: 5 } }
      ])
      .returning();
    choiceQuestionId = choice.id;
    paragraphQuestionId = paragraph.id;

    const [correct] = await db
      .insert(schema.option)
      .values([
        { questionId: choiceQuestionId, label: 'A', isCorrect: true },
        { questionId: choiceQuestionId, label: 'B', isCorrect: false }
      ])
      .returning();
    correctOptionId = correct.id;
  });

  afterAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    if (exerciseId) {
      await db.delete(schema.submission).where(eq(schema.submission.exerciseId, exerciseId));
      await db.delete(schema.exercise).where(eq(schema.exercise.id, exerciseId));
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

  it('saves nothing when an answer is invalid, so the one attempt is not used up', async () => {
    const { createSubmissionService } = await import('@api/services/submission/submission');

    await expect(
      createSubmissionService(courseId, exerciseId, memberId, [
        { questionId: choiceQuestionId, optionId: correctOptionId },
        { questionId: paragraphQuestionId, answer: 'far too long' }
      ])
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(await countSubmissions()).toBe(0);
  });

  it('keeps one submission when two arrive at once for a one-attempt exercise', async () => {
    const { createSubmissionService } = await import('@api/services/submission/submission');
    const answers = [
      { questionId: choiceQuestionId, optionId: correctOptionId },
      { questionId: paragraphQuestionId, answer: 'ok' }
    ];

    const results = await Promise.allSettled([
      createSubmissionService(courseId, exerciseId, memberId, answers),
      createSubmissionService(courseId, exerciseId, memberId, answers)
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find((result) => result.status === 'rejected') as PromiseRejectedResult;
    expect(rejected.reason).toMatchObject({ statusCode: 409 });
    expect(await countSubmissions()).toBe(1);
  });

  it('deletes an empty exercise section under a row lock and refuses one that holds a question', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { deleteExerciseSectionService } = await import('@cio/core/services/exercise/exercise');

    const [empty, used] = await db
      .insert(schema.exerciseSection)
      .values([
        { exerciseId, title: 'Empty part', order: 0 },
        { exerciseId, title: 'Used part', order: 1 }
      ])
      .returning();
    await db.insert(schema.question).values({
      exerciseId,
      questionTypeId: 1,
      title: 'In a part',
      points: 1,
      exerciseSectionId: used.id
    });

    await deleteExerciseSectionService(exerciseId, empty.id);
    await expect(deleteExerciseSectionService(exerciseId, used.id)).rejects.toMatchObject({ statusCode: 409 });

    const remaining = await db
      .select({ id: schema.exerciseSection.id })
      .from(schema.exerciseSection)
      .where(eq(schema.exerciseSection.exerciseId, exerciseId));
    expect(remaining.map((section) => section.id)).toEqual([used.id]);
  });
});
