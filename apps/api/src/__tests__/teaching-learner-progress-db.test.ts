import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq, inArray } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

const DAY_MS = 24 * 60 * 60 * 1000;

describe.skipIf(!hasDatabase)('learner progress and nudges against the database', () => {
  const suffix = `${Date.now()}`;
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * DAY_MS).toISOString();

  let organizationId = '';
  let groupId = '';
  let courseId = '';
  let exerciseId = '';
  let lessonIds: string[] = [];
  const profileIds: Record<string, string> = {};
  const memberIds: Record<string, string> = {};

  const learners = ['quiet', 'active', 'failing', 'recovered', 'finished', 'newcomer'] as const;

  beforeAll(async () => {
    const { db } = await import('@db/drizzle');
    const { createOrganization } = await import('@db/queries/organization');
    const schema = await import('@db/schema');

    const organization = await createOrganization({ name: `learner-progress-${suffix}` });
    organizationId = organization.id;

    for (const name of ['tutor', ...learners]) {
      const email = `${name}-${suffix}@learner-progress.test`;
      const [user] = await db.insert(schema.user).values({ name, email, emailVerified: true }).returning();
      await db.insert(schema.profile).values({ id: user!.id, fullname: name, username: `${name}-${suffix}`, email });
      profileIds[name] = user!.id;
    }

    const [group] = await db
      .insert(schema.group)
      .values({ name: `group-${suffix}`, organizationId })
      .returning();
    groupId = group!.id;

    const [course] = await db
      .insert(schema.course)
      .values({ title: 'Progress course', description: 'Fixture', groupId, slug: `progress-${suffix}` })
      .returning();
    courseId = course!.id;

    const lessons = await db
      .insert(schema.lesson)
      .values([
        { courseId, title: 'Lesson 1', order: 1, slug: `lesson-1-${suffix}` },
        { courseId, title: 'Lesson 2', order: 2, slug: `lesson-2-${suffix}` }
      ])
      .returning();
    lessonIds = lessons.map((lesson) => lesson.id);

    const [exercise] = await db
      .insert(schema.exercise)
      .values({ title: 'Quiz', slug: `quiz-${suffix}`, order: 3, courseId, allowMultipleAttempts: true })
      .returning();
    exerciseId = exercise!.id;
    await db.insert(schema.question).values({ exerciseId, questionTypeId: 1, title: 'Pick one', points: 10, order: 0 });

    await db
      .insert(schema.groupmember)
      .values({ groupId, roleId: ROLE.TUTOR, profileId: profileIds.tutor, email: `tutor-${suffix}@x.test` });

    const enrolledAt: Record<(typeof learners)[number], string> = {
      quiet: daysAgo(20),
      active: daysAgo(20),
      failing: daysAgo(3),
      recovered: daysAgo(3),
      finished: daysAgo(30),
      newcomer: daysAgo(2)
    };

    for (const name of learners) {
      const [member] = await db
        .insert(schema.groupmember)
        .values({ groupId, roleId: ROLE.STUDENT, profileId: profileIds[name], createdAt: enrolledAt[name] })
        .returning();
      memberIds[name] = member!.id;
    }

    await db
      .update(schema.groupmember)
      .set({ completedAt: daysAgo(1) })
      .where(eq(schema.groupmember.id, memberIds.finished!));

    await db.insert(schema.lessonCompletion).values([
      { lessonId: lessonIds[0]!, profileId: profileIds.quiet, isComplete: true, updatedAt: daysAgo(10) },
      { lessonId: lessonIds[0]!, profileId: profileIds.active, isComplete: true, updatedAt: daysAgo(1) }
    ]);

    const graded = (name: string, total: number, createdAt: string) => ({
      exerciseId,
      courseId,
      submittedBy: memberIds[name]!,
      gradingState: 'completed',
      total,
      createdAt
    });

    await db
      .insert(schema.submission)
      .values([
        graded('failing', 2, daysAgo(2)),
        graded('failing', 3, daysAgo(1)),
        graded('recovered', 2, daysAgo(2)),
        graded('recovered', 3, daysAgo(1.5)),
        graded('recovered', 9, daysAgo(1))
      ]);
  });

  afterAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    if (courseId) {
      await db.delete(schema.learnerNudge).where(eq(schema.learnerNudge.courseId, courseId));
      await db.delete(schema.submission).where(eq(schema.submission.courseId, courseId));
      await db.delete(schema.exercise).where(eq(schema.exercise.courseId, courseId));
      await db.delete(schema.lessonCompletion).where(inArray(schema.lessonCompletion.lessonId, lessonIds));
      await db.delete(schema.lesson).where(eq(schema.lesson.courseId, courseId));
    }
    if (groupId) {
      await db.delete(schema.groupmember).where(eq(schema.groupmember.groupId, groupId));
      await db.delete(schema.course).where(eq(schema.course.groupId, groupId));
      await db.delete(schema.group).where(eq(schema.group.id, groupId));
    }
    if (organizationId) {
      await db.delete(schema.organization).where(eq(schema.organization.id, organizationId));
    }
    const ids = Object.values(profileIds);
    if (ids.length > 0) {
      await db.delete(schema.profile).where(inArray(schema.profile.id, ids));
      await db.delete(schema.user).where(inArray(schema.user.id, ids));
    }
  });

  it('flags a week of inactivity and an exercise failed twice without a pass, and nothing else', async () => {
    const { listLearnerProgress } = await import('@db/queries/teaching/learner-progress');
    const { rows } = await listLearnerProgress({ courseIds: [courseId], now });
    const reasonOf = (name: string) => rows.find((row) => row.profileId === profileIds[name])?.nudgeReason ?? null;

    expect(rows).toHaveLength(learners.length);
    expect(reasonOf('quiet')).toBe('inactive');
    expect(reasonOf('failing')).toBe('failed_quiz');
    expect(reasonOf('active')).toBeNull();
    expect(reasonOf('recovered')).toBeNull();
    expect(reasonOf('finished')).toBeNull();
    expect(reasonOf('newcomer')).toBeNull();

    const failing = rows.find((row) => row.profileId === profileIds.failing)!;
    expect(failing.failedExerciseId).toBe(exerciseId);
    expect(failing.failedExerciseTitle).toBe('Quiz');

    const quiet = rows.find((row) => row.profileId === profileIds.quiet)!;
    expect(quiet.progressPercent).toBe(33);
    expect(new Date(quiet.lastActivityAt!).getTime()).toBe(new Date(daysAgo(10)).getTime());

    const flagged = await listLearnerProgress({ courseIds: [courseId], needsNudgeOnly: true, now });
    expect(flagged.total).toBe(2);
    expect(flagged.rows.map((row) => row.profileId).sort()).toEqual([profileIds.failing, profileIds.quiet].sort());
  });

  it('records one nudge when two arrive at once, and refuses another inside the window', async () => {
    const { recordLearnerNudge } = await import('@db/queries/teaching/nudge');
    const attempt = () =>
      recordLearnerNudge({
        organizationId,
        courseId,
        learnerProfileId: profileIds.quiet!,
        nudgedByProfileId: profileIds.tutor!,
        windowStart: new Date(Date.now() - DAY_MS)
      });

    const results = await Promise.all([attempt(), attempt()]);
    expect(results.filter((result) => result.created)).toHaveLength(1);

    const again = await attempt();
    expect(again.created).toBe(false);

    const { listLearnerProgress } = await import('@db/queries/teaching/learner-progress');
    const { rows } = await listLearnerProgress({ courseIds: [courseId], profileId: profileIds.quiet!, now });
    expect(rows[0]?.lastNudgedAt).not.toBeNull();
  });
});
