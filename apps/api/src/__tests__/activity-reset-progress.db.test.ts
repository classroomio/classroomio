import 'dotenv/config';

import { describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

type FixtureIds = {
  orgId: string;
  groupId: string;
  courseId: string;
  sectionId: string;
  activityId: string;
  lessonId: string;
  profileId: string;
  groupMemberId: string;
};

async function createActivityFixture(suffix: string): Promise<FixtureIds> {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  const [organization] = await db
    .insert(schema.organization)
    .values({ name: `char-activity-${suffix}` })
    .returning();
  const [group] = await db
    .insert(schema.group)
    .values({ name: `char-activity-${suffix}`, organizationId: organization.id })
    .returning();
  const [course] = await db
    .insert(schema.course)
    .values({
      title: 'Activity reset course',
      description: 'Reset and lifecycle coverage for activities',
      groupId: group.id,
      slug: `char-activity-${suffix}`,
      type: 'SELF_PACED' as never,
      status: 'ACTIVE'
    })
    .returning();
  const [section] = await db
    .insert(schema.courseSection)
    .values({ title: 'Getting started', order: 1, courseId: course.id })
    .returning();
  const [activity] = await db
    .insert(schema.courseActivity)
    .values({
      courseId: course.id,
      sectionId: section.id,
      kind: 'scorm',
      title: 'Package item',
      slug: 'package-item',
      order: 1
    })
    .returning();
  const [lesson] = await db
    .insert(schema.lesson)
    .values({
      courseId: course.id,
      sectionId: section.id,
      title: 'Welcome',
      order: 2,
      slug: `welcome-${suffix}`,
      note: '<p>Welcome.</p>'
    })
    .returning();

  const userId = crypto.randomUUID();
  await db.insert(schema.user).values({
    id: userId,
    name: `Char Activity ${suffix}`,
    email: `char-activity-${suffix}@example.com`
  });
  await db.insert(schema.profile).values({
    id: userId,
    fullname: `Char Activity ${suffix}`,
    username: `char-activity-${suffix}`,
    email: `char-activity-${suffix}@example.com`
  });
  const [member] = await db
    .insert(schema.groupmember)
    .values({
      groupId: group.id,
      roleId: 3,
      profileId: userId,
      email: `char-activity-${suffix}@example.com`
    })
    .returning();

  await db.insert(schema.activityCompletion).values({
    activityId: activity.id,
    profileId: userId,
    isComplete: true,
    completedAt: new Date().toISOString()
  });
  await db.insert(schema.lessonCompletion).values({
    lessonId: lesson.id,
    profileId: userId,
    isComplete: true
  });

  return {
    orgId: organization.id,
    groupId: group.id,
    courseId: course.id,
    sectionId: section.id,
    activityId: activity.id,
    lessonId: lesson.id,
    profileId: userId,
    groupMemberId: member.id
  };
}

async function cleanupActivityFixture(ids: FixtureIds) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  await db
    .delete(schema.activityCompletionSideEffect)
    .where(eq(schema.activityCompletionSideEffect.profileId, ids.profileId));
  await db.delete(schema.activityCompletion).where(eq(schema.activityCompletion.profileId, ids.profileId));
  await db.delete(schema.lessonCompletion).where(eq(schema.lessonCompletion.profileId, ids.profileId));
  await db.delete(schema.courseActivity).where(eq(schema.courseActivity.courseId, ids.courseId));
  await db.delete(schema.lesson).where(eq(schema.lesson.courseId, ids.courseId));
  await db.delete(schema.courseSection).where(eq(schema.courseSection.courseId, ids.courseId));
  await db.delete(schema.course).where(eq(schema.course.id, ids.courseId));
  await db.delete(schema.groupmember).where(eq(schema.groupmember.id, ids.groupMemberId));
  await db.delete(schema.organizationmember).where(eq(schema.organizationmember.profileId, ids.profileId));
  await db.delete(schema.profile).where(eq(schema.profile.id, ids.profileId));
  await db.delete(schema.user).where(eq(schema.user.id, ids.profileId));
  await db.delete(schema.group).where(eq(schema.group.id, ids.groupId));
  await db.delete(schema.organization).where(eq(schema.organization.id, ids.orgId));
}

describe.skipIf(!hasDatabase)('activity reset and lifecycle', () => {
  it('counts and clears activity completions with everything else', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const ids = await createActivityFixture(suffix);
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { getStudentCourseProgressImpactCounts, resetStudentCourseProgress } = await import(
        '@db/queries/course/reset-progress'
      );
      const { resetActivityLearnerState } = await import('@cio/core/services/activity/providers');
      const { enqueueActivityCompletionSideEffects } = await import('@cio/db/queries/activity/completion-side-effect');
      await enqueueActivityCompletionSideEffects(ids.activityId, [ids.profileId]);

      const before = await getStudentCourseProgressImpactCounts({
        courseId: ids.courseId,
        groupMemberId: ids.groupMemberId,
        profileId: ids.profileId
      });

      expect(before.completedActivities).toBe(1);
      expect(before.totalActivities).toBe(1);

      const summary = await resetStudentCourseProgress(
        { courseId: ids.courseId, groupMemberId: ids.groupMemberId, profileId: ids.profileId },
        { resetActivityLearnerState }
      );

      expect(summary.summary.activityCompletions).toBe(1);
      expect(summary.summary.lessonCompletion).toBe(1);

      const remaining = await db
        .select()
        .from(schema.activityCompletion)
        .where(
          and(
            eq(schema.activityCompletion.activityId, ids.activityId),
            eq(schema.activityCompletion.profileId, ids.profileId)
          )
        );

      expect(remaining).toHaveLength(0);

      const pendingWork = await db
        .select()
        .from(schema.activityCompletionSideEffect)
        .where(eq(schema.activityCompletionSideEffect.profileId, ids.profileId));

      expect(pendingWork).toHaveLength(0);

      const activities = await db
        .select()
        .from(schema.courseActivity)
        .where(eq(schema.courseActivity.id, ids.activityId));

      expect(activities).toHaveLength(1);
    } finally {
      await cleanupActivityFixture(ids);
    }
  });

  it('rolls back lesson and activity deletes when the provider reset fails', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const ids = await createActivityFixture(suffix);
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { resetStudentCourseProgress } = await import('@db/queries/course/reset-progress');

      await expect(
        resetStudentCourseProgress(
          { courseId: ids.courseId, groupMemberId: ids.groupMemberId, profileId: ids.profileId },
          {
            resetActivityLearnerState: async () => {
              throw new Error('provider boom');
            }
          }
        )
      ).rejects.toThrow('provider boom');

      const completions = await db
        .select()
        .from(schema.activityCompletion)
        .where(eq(schema.activityCompletion.profileId, ids.profileId));
      const lessons = await db
        .select()
        .from(schema.lessonCompletion)
        .where(eq(schema.lessonCompletion.profileId, ids.profileId));

      expect(completions).toHaveLength(1);
      expect(lessons).toHaveLength(1);
    } finally {
      await cleanupActivityFixture(ids);
    }
  });

  it('reconciles last active from activity completions', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const ids = await createActivityFixture(suffix);
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { reconcileMemberLastActive } = await import('@db/queries/organization/member-lifecycle');

      await db.insert(schema.organizationmember).values({
        organizationId: ids.orgId,
        roleId: 3,
        profileId: ids.profileId,
        email: `char-activity-${suffix}@example.com`
      });

      const updated = await reconcileMemberLastActive(30);

      expect(updated).toBeGreaterThanOrEqual(1);

      const [member] = await db
        .select()
        .from(schema.organizationmember)
        .where(eq(schema.organizationmember.profileId, ids.profileId));

      expect(member?.lastActiveAt).not.toBeNull();
    } finally {
      await cleanupActivityFixture(ids);
    }
  });
});
