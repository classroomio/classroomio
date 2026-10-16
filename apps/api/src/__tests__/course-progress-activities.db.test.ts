import 'dotenv/config';

import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

type ActivityProgressFixture = {
  orgId: string;
  groupId: string;
  exploreGroupId: string;
  courseId: string;
  lessonId: string;
  exerciseId: string;
  activityOneId: string;
  activityTwoId: string;
  exploreCourseId: string;
  studentOneProfileId: string;
  studentOneMemberId: string;
  studentTwoProfileId: string;
  studentTwoMemberId: string;
};

async function createActivityProgressFixture(suffix: string): Promise<ActivityProgressFixture> {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  const [organization] = await db
    .insert(schema.organization)
    .values({ name: `char-activity-progress-${suffix}` })
    .returning();
  const [group] = await db
    .insert(schema.group)
    .values({ name: `char-activity-progress-${suffix}`, organizationId: organization.id })
    .returning();
  const [course] = await db
    .insert(schema.course)
    .values({
      title: 'Activity progress baseline',
      description: 'Mixed-course activity progress',
      groupId: group.id,
      slug: `char-activity-progress-${suffix}`,
      type: 'SELF_PACED' as never,
      status: 'ACTIVE',
      isPublished: true
    })
    .returning();
  const [exploreGroup] = await db
    .insert(schema.group)
    .values({ name: `char-activity-explore-${suffix}`, organizationId: organization.id })
    .returning();
  const [exploreCourse] = await db
    .insert(schema.course)
    .values({
      title: 'Activity explore baseline',
      description: 'Unenrolled activity course',
      groupId: exploreGroup.id,
      slug: `char-activity-explore-${suffix}`,
      type: 'SELF_PACED' as never,
      status: 'ACTIVE',
      isPublished: true
    })
    .returning();
  const [section] = await db
    .insert(schema.courseSection)
    .values({ title: 'Main', order: 1, courseId: course.id })
    .returning();
  const [lesson] = await db
    .insert(schema.lesson)
    .values({ courseId: course.id, sectionId: section.id, title: 'Lesson one', order: 1 })
    .returning();
  const [exercise] = await db
    .insert(schema.exercise)
    .values({ courseId: course.id, sectionId: section.id, title: 'Quiz', order: 2 })
    .returning();
  const [activityOne] = await db
    .insert(schema.courseActivity)
    .values({ courseId: course.id, kind: 'scorm', title: 'Package one', order: 3 })
    .returning();
  const [activityTwo] = await db
    .insert(schema.courseActivity)
    .values({ courseId: course.id, kind: 'scorm', title: 'Package two', order: 4 })
    .returning();
  await db
    .insert(schema.courseActivity)
    .values({ courseId: exploreCourse.id, kind: 'scorm', title: 'Explore package', order: 1 });

  async function createStudent(tag: string) {
    const userId = crypto.randomUUID();
    await db.insert(schema.user).values({
      id: userId,
      name: `Activity progress ${tag} ${suffix}`,
      email: `activity-progress-${tag}-${suffix}@example.com`
    });
    await db.insert(schema.profile).values({
      id: userId,
      fullname: `Activity progress ${tag} ${suffix}`,
      username: `activity-progress-${tag}-${suffix}`,
      email: `activity-progress-${tag}-${suffix}@example.com`
    });
    const [member] = await db
      .insert(schema.groupmember)
      .values({
        groupId: group.id,
        roleId: 3,
        profileId: userId,
        email: `activity-progress-${tag}-${suffix}@example.com`
      })
      .returning();
    return { profileId: userId, memberId: member.id };
  }

  const studentOne = await createStudent('one');
  const studentTwo = await createStudent('two');

  await db.insert(schema.organizationmember).values([
    {
      organizationId: organization.id,
      roleId: 3,
      profileId: studentOne.profileId,
      email: `activity-progress-one-${suffix}@example.com`
    },
    {
      organizationId: organization.id,
      roleId: 3,
      profileId: studentTwo.profileId,
      email: `activity-progress-two-${suffix}@example.com`
    }
  ]);

  await db.insert(schema.lessonCompletion).values({
    lessonId: lesson.id,
    profileId: studentOne.profileId,
    isComplete: true
  });
  await db.insert(schema.submission).values({
    exerciseId: exercise.id,
    courseId: course.id,
    submittedBy: studentOne.memberId
  });
  await db.insert(schema.activityCompletion).values({
    activityId: activityOne.id,
    profileId: studentOne.profileId,
    isComplete: true,
    completedAt: new Date().toISOString()
  });

  return {
    orgId: organization.id,
    groupId: group.id,
    exploreGroupId: exploreGroup.id,
    courseId: course.id,
    lessonId: lesson.id,
    exerciseId: exercise.id,
    activityOneId: activityOne.id,
    activityTwoId: activityTwo.id,
    exploreCourseId: exploreCourse.id,
    studentOneProfileId: studentOne.profileId,
    studentOneMemberId: studentOne.memberId,
    studentTwoProfileId: studentTwo.profileId,
    studentTwoMemberId: studentTwo.memberId
  };
}

async function cleanupActivityProgressFixture(fixture: ActivityProgressFixture) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  for (const courseId of [fixture.courseId, fixture.exploreCourseId]) {
    const activities = await db
      .select({ id: schema.courseActivity.id })
      .from(schema.courseActivity)
      .where(eq(schema.courseActivity.courseId, courseId));
    for (const activity of activities) {
      await db.delete(schema.activityCompletion).where(eq(schema.activityCompletion.activityId, activity.id));
    }
    await db.delete(schema.courseActivity).where(eq(schema.courseActivity.courseId, courseId));
  }
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
  await db.delete(schema.course).where(eq(schema.course.id, fixture.exploreCourseId));
  await db.delete(schema.groupmember).where(eq(schema.groupmember.id, fixture.studentOneMemberId));
  await db.delete(schema.groupmember).where(eq(schema.groupmember.id, fixture.studentTwoMemberId));
  await db
    .delete(schema.organizationmember)
    .where(eq(schema.organizationmember.profileId, fixture.studentOneProfileId));
  await db
    .delete(schema.organizationmember)
    .where(eq(schema.organizationmember.profileId, fixture.studentTwoProfileId));
  await db.delete(schema.profile).where(eq(schema.profile.id, fixture.studentOneProfileId));
  await db.delete(schema.profile).where(eq(schema.profile.id, fixture.studentTwoProfileId));
  await db.delete(schema.user).where(eq(schema.user.id, fixture.studentOneProfileId));
  await db.delete(schema.user).where(eq(schema.user.id, fixture.studentTwoProfileId));
  await db.delete(schema.group).where(eq(schema.group.id, fixture.groupId));
  await db.delete(schema.group).where(eq(schema.group.id, fixture.exploreGroupId));
  await db.delete(schema.organization).where(eq(schema.organization.id, fixture.orgId));
}

describe.skipIf(!hasDatabase)('progress queries with activities present', () => {
  it('counts activities in course progress', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createActivityProgressFixture(suffix);
    try {
      const { getCourseProgress } = await import('@db/queries/course/course');

      const studentOne = await getCourseProgress(fixture.courseId, fixture.studentOneProfileId);
      expect(studentOne).toMatchObject({
        lessonsCount: 1,
        lessonsCompleted: 1,
        exercisesCount: 1,
        exercisesCompleted: 1,
        activitiesCount: 2,
        activitiesCompleted: 1
      });

      const studentTwo = await getCourseProgress(fixture.courseId, fixture.studentTwoProfileId);
      expect(studentTwo).toMatchObject({ activitiesCount: 2, activitiesCompleted: 0 });
    } finally {
      await cleanupActivityProgressFixture(fixture);
    }
  });

  it('lists enrolled, org and explore courses with activity counts', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createActivityProgressFixture(suffix);
    try {
      const { getEnrolledCourses, getExploreCourses, getOrgCourses } = await import('@db/queries/course/course');

      const enrolled = await getEnrolledCourses({
        orgId: fixture.orgId,
        profileId: fixture.studentOneProfileId
      });
      expect(enrolled.find((row) => row.id === fixture.courseId)).toMatchObject({
        activityCount: 2,
        activitiesCompleted: 1
      });

      const orgCourses = await getOrgCourses({ orgId: fixture.orgId });
      expect(orgCourses.items.find((row) => row.id === fixture.courseId)).toMatchObject({ activityCount: 2 });

      const explore = await getExploreCourses({ orgId: fixture.orgId, profileId: fixture.studentTwoProfileId });
      expect(explore.data.find((row) => row.id === fixture.exploreCourseId)).toMatchObject({ activityCount: 1 });
    } finally {
      await cleanupActivityProgressFixture(fixture);
    }
  });

  it('adds activities to member lateral progress', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createActivityProgressFixture(suffix);
    try {
      const { getPaginatedCourseMembers } = await import('@db/queries/course/people');
      const page = await getPaginatedCourseMembers(fixture.courseId, {
        page: 1,
        limit: 20,
        sortBy: 'role',
        sortOrder: 'asc'
      } as never);

      const percents = new Map(page.items.map((item) => [item.profileId, item.progressPercent]));
      expect(percents.get(fixture.studentOneProfileId)).toBe(75);
      expect(percents.get(fixture.studentTwoProfileId)).toBe(0);
    } finally {
      await cleanupActivityProgressFixture(fixture);
    }
  });

  it('adds activities to the analytics progress view and batch helpers', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createActivityProgressFixture(suffix);
    try {
      const { getProfileCourseProgress } = await import('@db/queries/analytics/analytics');
      await expect(getProfileCourseProgress(fixture.courseId, fixture.studentOneProfileId)).resolves.toMatchObject({
        activities_count: 2,
        activities_completed: 1
      });

      const { getBatchActivityCompletionsForCourse, getCourseTrackableContentCounts } = await import(
        '@db/queries/course/member-progress'
      );
      const counts = await getCourseTrackableContentCounts(fixture.courseId);
      expect(counts.activitiesCount).toBe(2);
      expect(counts.activityIds).toHaveLength(2);

      const activityMap = await getBatchActivityCompletionsForCourse(fixture.courseId, [
        fixture.studentOneProfileId,
        fixture.studentTwoProfileId
      ]);
      expect([...(activityMap.get(fixture.studentOneProfileId) ?? [])]).toEqual([fixture.activityOneId]);
      expect(activityMap.get(fixture.studentTwoProfileId)?.size ?? 0).toBe(0);

      const { getActivityProgressionPolicies, getCompletedActivityIdsForProfile } = await import(
        '@db/queries/course/progression'
      );
      expect(await getActivityProgressionPolicies(fixture.courseId)).toHaveLength(2);
      expect(await getCompletedActivityIdsForProfile(fixture.courseId, fixture.studentOneProfileId)).toEqual(
        new Set([fixture.activityOneId])
      );
    } finally {
      await cleanupActivityProgressFixture(fixture);
    }
  });

  it('requires every activity for non-compliance goal completion', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createActivityProgressFixture(suffix);
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { getNonComplianceCourseCompletions } = await import('@db/queries/cohort/goal');

      const partial = await getNonComplianceCourseCompletions(
        [fixture.studentOneProfileId, fixture.studentTwoProfileId],
        [fixture.courseId]
      );
      expect(partial.has(`${fixture.studentOneProfileId}:${fixture.courseId}`)).toBe(false);

      await db.insert(schema.activityCompletion).values({
        activityId: fixture.activityTwoId,
        profileId: fixture.studentOneProfileId,
        isComplete: true,
        completedAt: new Date().toISOString()
      });

      const done = await getNonComplianceCourseCompletions([fixture.studentOneProfileId], [fixture.courseId]);
      expect(done.has(`${fixture.studentOneProfileId}:${fixture.courseId}`)).toBe(true);
    } finally {
      await cleanupActivityProgressFixture(fixture);
    }
  });

  it('adds activities to course stats denominators', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createActivityProgressFixture(suffix);
    try {
      const { getCourseStats } = await import('@db/queries/dash/dash');
      const rows = await getCourseStats(fixture.orgId);

      const row = rows.find((entry) => entry.courseId === fixture.courseId);
      expect(row).toBeDefined();
      expect(Number(row?.totalActivities)).toBe(2);
      expect(Number(row?.completionPercentage)).toBe(33);
    } finally {
      await cleanupActivityProgressFixture(fixture);
    }
  });

  it('adds activities to course and learner analytics', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createActivityProgressFixture(suffix);
    try {
      const { buildCourseStudentAnalytics, getCourseAnalytics, getUserCourseAnalytics } = await import(
        '@cio/core/services/course/course'
      );

      const students = await buildCourseStudentAnalytics(fixture.courseId, [
        { profileId: fixture.studentOneProfileId },
        { profileId: fixture.studentTwoProfileId }
      ]);
      const studentOne = students.find((student) => student.id === fixture.studentOneProfileId);
      expect(studentOne).toMatchObject({
        activitiesCompleted: 1,
        totalActivities: 2,
        progressPercentage: 75
      });

      const analytics = await getCourseAnalytics(fixture.courseId);
      expect(analytics.totalActivities).toBe(2);
      expect(analytics.activityCompletionRate).toBe(25);

      const userAnalytics = await getUserCourseAnalytics(fixture.courseId, fixture.studentOneProfileId);
      expect(userAnalytics).toMatchObject({
        activitiesCompleted: 1,
        activitiesCount: 2,
        progressPercentage: 67
      });
    } finally {
      await cleanupActivityProgressFixture(fixture);
    }
  }, 60000);

  it('adds activities to org audience enrolment summaries', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createActivityProgressFixture(suffix);
    try {
      const { getOrganizationAudience } = await import('@db/queries/organization/audience');
      const audience = await getOrganizationAudience(fixture.orgId, {});

      const studentOne = audience.items.find((item) => item.profileId === fixture.studentOneProfileId);
      expect(studentOne).toMatchObject({ enrolledCount: 1, completedCount: 0, progressPercent: 75 });
    } finally {
      await cleanupActivityProgressFixture(fixture);
    }
  });

  it('adds activities to org user analytics', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createActivityProgressFixture(suffix);
    try {
      const { getUserAnalytics } = await import('@api/services/organization');
      const analytics = await getUserAnalytics(fixture.studentOneProfileId, fixture.orgId);

      expect(analytics.overallCourseProgress).toBe(75);
    } finally {
      await cleanupActivityProgressFixture(fixture);
    }
  }, 60000);
});
