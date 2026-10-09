import 'dotenv/config';

import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

type ProgressFixture = {
  orgId: string;
  groupId: string;
  courseId: string;
  lessonOneId: string;
  lessonTwoId: string;
  exerciseId: string;
  studentOneProfileId: string;
  studentOneMemberId: string;
  studentTwoProfileId: string;
  studentTwoMemberId: string;
};

async function createProgressFixture(suffix: string): Promise<ProgressFixture> {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  const [organization] = await db
    .insert(schema.organization)
    .values({ name: `char-progress-${suffix}` })
    .returning();
  const [group] = await db
    .insert(schema.group)
    .values({ name: `char-progress-${suffix}`, organizationId: organization.id })
    .returning();
  const [course] = await db
    .insert(schema.course)
    .values({
      title: 'Progress baseline',
      description: 'Zero-activity progress characterization',
      groupId: group.id,
      slug: `char-progress-${suffix}`,
      type: 'SELF_PACED' as never,
      status: 'ACTIVE',
      isPublished: true
    })
    .returning();
  const [section] = await db
    .insert(schema.courseSection)
    .values({ title: 'Main', order: 1, courseId: course.id })
    .returning();
  const [lessonOne] = await db
    .insert(schema.lesson)
    .values({ courseId: course.id, sectionId: section.id, title: 'Lesson one', order: 1 })
    .returning();
  const [lessonTwo] = await db
    .insert(schema.lesson)
    .values({ courseId: course.id, sectionId: section.id, title: 'Lesson two', order: 2 })
    .returning();
  const [exercise] = await db
    .insert(schema.exercise)
    .values({ courseId: course.id, sectionId: section.id, title: 'Quiz', order: 3 })
    .returning();

  async function createStudent(tag: string) {
    const userId = crypto.randomUUID();
    await db.insert(schema.user).values({
      id: userId,
      name: `Progress ${tag} ${suffix}`,
      email: `progress-${tag}-${suffix}@example.com`
    });
    await db.insert(schema.profile).values({
      id: userId,
      fullname: `Progress ${tag} ${suffix}`,
      username: `progress-${tag}-${suffix}`,
      email: `progress-${tag}-${suffix}@example.com`
    });
    const [member] = await db
      .insert(schema.groupmember)
      .values({
        groupId: group.id,
        roleId: 3,
        profileId: userId,
        email: `progress-${tag}-${suffix}@example.com`
      })
      .returning();
    return { profileId: userId, memberId: member.id };
  }

  const studentOne = await createStudent('one');
  const studentTwo = await createStudent('two');

  // Student one: one lesson complete + one exercise submission.
  await db.insert(schema.lessonCompletion).values({
    lessonId: lessonOne.id,
    profileId: studentOne.profileId,
    isComplete: true
  });
  await db.insert(schema.submission).values({
    exerciseId: exercise.id,
    courseId: course.id,
    submittedBy: studentOne.memberId
  });

  return {
    orgId: organization.id,
    groupId: group.id,
    courseId: course.id,
    lessonOneId: lessonOne.id,
    lessonTwoId: lessonTwo.id,
    exerciseId: exercise.id,
    studentOneProfileId: studentOne.profileId,
    studentOneMemberId: studentOne.memberId,
    studentTwoProfileId: studentTwo.profileId,
    studentTwoMemberId: studentTwo.memberId
  };
}

async function cleanupProgressFixture(fixture: ProgressFixture) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  await db.delete(schema.submission).where(eq(schema.submission.courseId, fixture.courseId));
  await db.delete(schema.lessonCompletion).where(eq(schema.lessonCompletion.profileId, fixture.studentOneProfileId));
  await db.delete(schema.lessonCompletion).where(eq(schema.lessonCompletion.profileId, fixture.studentTwoProfileId));
  await db.delete(schema.exercise).where(eq(schema.exercise.courseId, fixture.courseId));
  await db.delete(schema.lesson).where(eq(schema.lesson.courseId, fixture.courseId));
  const sections = await db
    .select({ id: schema.courseSection.id })
    .from(schema.courseSection)
    .where(eq(schema.courseSection.courseId, fixture.courseId));
  for (const section of sections) {
    await db.delete(schema.courseSection).where(eq(schema.courseSection.id, section.id));
  }
  await db.delete(schema.course).where(eq(schema.course.id, fixture.courseId));
  await db.delete(schema.groupmember).where(eq(schema.groupmember.id, fixture.studentOneMemberId));
  await db.delete(schema.groupmember).where(eq(schema.groupmember.id, fixture.studentTwoMemberId));
  await db.delete(schema.profile).where(eq(schema.profile.id, fixture.studentOneProfileId));
  await db.delete(schema.profile).where(eq(schema.profile.id, fixture.studentTwoProfileId));
  await db.delete(schema.user).where(eq(schema.user.id, fixture.studentOneProfileId));
  await db.delete(schema.user).where(eq(schema.user.id, fixture.studentTwoProfileId));
  await db.delete(schema.group).where(eq(schema.group.id, fixture.groupId));
  await db.delete(schema.organization).where(eq(schema.organization.id, fixture.orgId));
}

describe.skipIf(!hasDatabase)('characterization: course progress calculations (zero activities)', () => {
  it('counts lessons and policy-aware exercises for a member', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createProgressFixture(suffix);
    try {
      const { getCourseProgress } = await import('@db/queries/course/course');

      const studentOne = await getCourseProgress(fixture.courseId, fixture.studentOneProfileId);
      expect(studentOne).toMatchObject({
        lessonsCount: 2,
        lessonsCompleted: 1,
        exercisesCount: 1,
        exercisesCompleted: 1
      });
      expect(studentOne.groupMemberId).toBe(fixture.studentOneMemberId);
      expect(studentOne.roleId).toBe(3);

      const studentTwo = await getCourseProgress(fixture.courseId, fixture.studentTwoProfileId);
      expect(studentTwo).toMatchObject({
        lessonsCount: 2,
        lessonsCompleted: 0,
        exercisesCount: 1,
        exercisesCompleted: 0
      });
    } finally {
      await cleanupProgressFixture(fixture);
    }
  });

  it('returns zero counts for non-members', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createProgressFixture(suffix);
    try {
      const { getCourseProgress } = await import('@db/queries/course/course');
      const outsider = await getCourseProgress(fixture.courseId, crypto.randomUUID());

      expect(outsider).toEqual({
        lessonsCount: 0,
        lessonsCompleted: 0,
        exercisesCount: 0,
        exercisesCompleted: 0,
        groupMemberId: null,
        roleId: null,
        certificateEarnedAt: null,
        certificationEmailSentAt: null
      });
    } finally {
      await cleanupProgressFixture(fixture);
    }
  });

  it('lists enrolled courses with lesson progress and exercise counts', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createProgressFixture(suffix);
    try {
      const { getEnrolledCourses } = await import('@db/queries/course/course');
      const courses = await getEnrolledCourses({
        orgId: fixture.orgId,
        profileId: fixture.studentOneProfileId
      });

      const course = courses.find((row) => row.id === fixture.courseId);
      expect(course).toBeDefined();
      expect(course).toMatchObject({
        lessonCount: 2,
        progressRate: 1,
        exerciseCount: 1,
        exercisesCompleted: 1
      });
    } finally {
      await cleanupProgressFixture(fixture);
    }
  });

  it('lists org courses with lesson and exercise counts', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createProgressFixture(suffix);
    try {
      const { getOrgCourses } = await import('@db/queries/course/course');
      const result = await getOrgCourses({ orgId: fixture.orgId });

      const course = result.items.find((row) => row.id === fixture.courseId);
      expect(course).toBeDefined();
      expect(course).toMatchObject({ lessonCount: 2, exerciseCount: 1 });
      expect(result.total).toBeGreaterThanOrEqual(1);
    } finally {
      await cleanupProgressFixture(fixture);
    }
  });

  it('paginates members with total and completed lateral progress', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createProgressFixture(suffix);
    try {
      const { getPaginatedCourseMembers } = await import('@db/queries/course/people');
      const page = await getPaginatedCourseMembers(fixture.courseId, {
        page: 1,
        limit: 20,
        sortBy: 'role',
        sortOrder: 'asc'
      } as never);

      expect(page.total).toBe(2);
      // Items are flattened: member columns on top, profile nested.
      const percents = new Map(page.items.map((item) => [item.profileId, item.progressPercent]));
      // 2 of 3 items complete (1 lesson + 1 exercise of 2 lessons + 1 exercise) = 67%.
      expect(percents.get(fixture.studentOneProfileId)).toBe(67);
      expect(percents.get(fixture.studentTwoProfileId)).toBe(0);
    } finally {
      await cleanupProgressFixture(fixture);
    }
  });

  it('counts any submission in the analytics progress view', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createProgressFixture(suffix);
    try {
      const { getProfileCourseProgress } = await import('@db/queries/analytics/analytics');
      const progress = await getProfileCourseProgress(fixture.courseId, fixture.studentOneProfileId);

      expect(progress).toMatchObject({
        lessons_count: 2,
        lessons_completed: 1,
        exercises_count: 1,
        exercises_completed: 1
      });
    } finally {
      await cleanupProgressFixture(fixture);
    }
  });

  it('exposes trackable ids and batched completions', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createProgressFixture(suffix);
    try {
      const {
        getBatchCompletedExerciseIdsForMembers,
        getBatchLessonCompletionsForCourse,
        getCourseTrackableContentCounts
      } = await import('@db/queries/course/member-progress');
      const { getCompletedExerciseIdsForMember, getCompletedLessonIdsForProfile } = await import(
        '@db/queries/course/progression'
      );

      const counts = await getCourseTrackableContentCounts(fixture.courseId);
      expect(counts.lessonsCount).toBe(2);
      expect(counts.exercisesCount).toBe(1);
      expect(counts.lessonIds).toHaveLength(2);
      expect(counts.exerciseIds).toEqual([fixture.exerciseId]);

      const lessonMap = await getBatchLessonCompletionsForCourse(fixture.courseId, [
        fixture.studentOneProfileId,
        fixture.studentTwoProfileId
      ]);
      expect([...(lessonMap.get(fixture.studentOneProfileId) ?? [])].sort()).toEqual([fixture.lessonOneId]);
      expect(lessonMap.get(fixture.studentTwoProfileId)?.size ?? 0).toBe(0);

      const exerciseMap = await getBatchCompletedExerciseIdsForMembers(fixture.courseId, [
        fixture.studentOneMemberId,
        fixture.studentTwoMemberId
      ]);
      expect([...(exerciseMap.get(fixture.studentOneMemberId) ?? [])]).toEqual([fixture.exerciseId]);
      expect(exerciseMap.get(fixture.studentTwoMemberId)?.size ?? 0).toBe(0);

      expect(await getCompletedLessonIdsForProfile(fixture.courseId, fixture.studentOneProfileId)).toEqual(
        new Set([fixture.lessonOneId])
      );
      expect(await getCompletedExerciseIdsForMember(fixture.courseId, fixture.studentOneMemberId)).toEqual(
        new Set([fixture.exerciseId])
      );
    } finally {
      await cleanupProgressFixture(fixture);
    }
  });

  it('completes non-compliance goals per the lesson-join semantics', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createProgressFixture(suffix);
    try {
      const { getNonComplianceCourseCompletions } = await import('@db/queries/cohort/goal');

      // Recorded behaviour: the total counts lessons that have a completion
      // row among the queried profiles (LEFT JOIN on lesson + profile list),
      // so a learner who completed the only started lesson counts as done
      // while a learner with no rows never appears.
      const partial = await getNonComplianceCourseCompletions(
        [fixture.studentOneProfileId, fixture.studentTwoProfileId],
        [fixture.courseId]
      );
      expect(partial.has(`${fixture.studentOneProfileId}:${fixture.courseId}`)).toBe(true);
      expect(partial.has(`${fixture.studentTwoProfileId}:${fixture.courseId}`)).toBe(false);

      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      await db.insert(schema.lessonCompletion).values({
        lessonId: fixture.lessonTwoId,
        profileId: fixture.studentOneProfileId,
        isComplete: true
      });

      const done = await getNonComplianceCourseCompletions([fixture.studentOneProfileId], [fixture.courseId]);
      expect(done.has(`${fixture.studentOneProfileId}:${fixture.courseId}`)).toBe(true);
    } finally {
      await cleanupProgressFixture(fixture);
    }
  });

  it('reports course stats with lesson totals only', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createProgressFixture(suffix);
    try {
      const { getCourseStats } = await import('@db/queries/dash/dash');
      const rows = await getCourseStats(fixture.orgId);

      const row = rows.find((entry) => entry.courseId === fixture.courseId);
      expect(row).toBeDefined();
      expect(Number(row?.totalStudents)).toBe(2);
      // One of two students completed one of two lessons: 1 / (2*2) = 25%.
      expect(Number(row?.completionPercentage)).toBe(25);
    } finally {
      await cleanupProgressFixture(fixture);
    }
  });
});
