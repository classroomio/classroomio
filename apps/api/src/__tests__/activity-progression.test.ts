import 'dotenv/config';

import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { ContentType, ROLE } from '@cio/utils/constants';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

type MixedFixture = {
  orgId: string;
  groupId: string;
  courseId: string;
  sectionId: string;
  lessonOneId: string;
  activityOneId: string;
  lessonTwoId: string;
  activityTwoId: string;
  studentProfileId: string;
  studentMemberId: string;
  tutorProfileId: string;
};

async function createMixedFixture(suffix: string): Promise<MixedFixture> {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  const [organization] = await db
    .insert(schema.organization)
    .values({ name: `char-mixed-${suffix}` })
    .returning();
  const [group] = await db
    .insert(schema.group)
    .values({ name: `char-mixed-${suffix}`, organizationId: organization.id })
    .returning();
  const [course] = await db
    .insert(schema.course)
    .values({
      title: 'Mixed baseline',
      description: 'Lesson and activity progression characterization',
      groupId: group.id,
      slug: `char-mixed-${suffix}`,
      type: 'SELF_PACED' as never,
      status: 'ACTIVE',
      isPublished: true,
      metadata: { progressionMode: 'sequential' }
    })
    .returning();
  const [section] = await db
    .insert(schema.courseSection)
    .values({ title: 'Main', order: 1, courseId: course.id })
    .returning();
  const [lessonOne] = await db
    .insert(schema.lesson)
    .values({ courseId: course.id, sectionId: section.id, title: 'Lesson one', slug: 'lesson-one', order: 1 })
    .returning();
  const [activityOne] = await db
    .insert(schema.courseActivity)
    .values({ courseId: course.id, sectionId: section.id, kind: 'scorm', title: 'Package one', order: 2 })
    .returning();
  const [lessonTwo] = await db
    .insert(schema.lesson)
    .values({ courseId: course.id, sectionId: section.id, title: 'Lesson two', slug: 'lesson-two', order: 3 })
    .returning();
  const [activityTwo] = await db
    .insert(schema.courseActivity)
    .values({
      courseId: course.id,
      sectionId: section.id,
      kind: 'scorm',
      title: 'Locked package',
      order: 4,
      isUnlocked: false
    })
    .returning();

  async function createMember(tag: string, roleId: number) {
    const userId = crypto.randomUUID();
    await db.insert(schema.user).values({
      id: userId,
      name: `Mixed ${tag} ${suffix}`,
      email: `mixed-${tag}-${suffix}@example.com`
    });
    await db.insert(schema.profile).values({
      id: userId,
      fullname: `Mixed ${tag} ${suffix}`,
      username: `mixed-${tag}-${suffix}`,
      email: `mixed-${tag}-${suffix}@example.com`
    });
    const [member] = await db
      .insert(schema.groupmember)
      .values({ groupId: group.id, roleId, profileId: userId, email: `mixed-${tag}-${suffix}@example.com` })
      .returning();
    return { profileId: userId, memberId: member.id };
  }

  const student = await createMember('student', ROLE.STUDENT);
  const tutor = await createMember('tutor', ROLE.TUTOR);

  await db.insert(schema.lessonCompletion).values({
    lessonId: lessonOne.id,
    profileId: student.profileId,
    isComplete: true
  });

  return {
    orgId: organization.id,
    groupId: group.id,
    courseId: course.id,
    sectionId: section.id,
    lessonOneId: lessonOne.id,
    activityOneId: activityOne.id,
    lessonTwoId: lessonTwo.id,
    activityTwoId: activityTwo.id,
    studentProfileId: student.profileId,
    studentMemberId: student.memberId,
    tutorProfileId: tutor.profileId
  };
}

async function cleanupMixedFixture(fixture: MixedFixture) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  await db.delete(schema.activityCompletion).where(eq(schema.activityCompletion.profileId, fixture.studentProfileId));
  await db.delete(schema.activityCompletion).where(eq(schema.activityCompletion.profileId, fixture.tutorProfileId));
  await db.delete(schema.lessonCompletion).where(eq(schema.lessonCompletion.profileId, fixture.studentProfileId));
  await db.delete(schema.courseActivity).where(eq(schema.courseActivity.courseId, fixture.courseId));
  await db.delete(schema.lesson).where(eq(schema.lesson.courseId, fixture.courseId));
  await db.delete(schema.courseSection).where(eq(schema.courseSection.courseId, fixture.courseId));
  await db.delete(schema.course).where(eq(schema.course.id, fixture.courseId));
  for (const profileId of [fixture.studentProfileId, fixture.tutorProfileId]) {
    await db.delete(schema.groupmember).where(eq(schema.groupmember.profileId, profileId));
    await db.delete(schema.profile).where(eq(schema.profile.id, profileId));
    await db.delete(schema.user).where(eq(schema.user.id, profileId));
  }
  await db.delete(schema.group).where(eq(schema.group.organizationId, fixture.orgId));
  await db.delete(schema.organization).where(eq(schema.organization.id, fixture.orgId));
}

function suffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

describe.skipIf(!hasDatabase)('activity content listing in mixed courses', () => {
  it('lists activity rows with kind and completion state', async () => {
    const fixture = await createMixedFixture(suffix());
    try {
      const { getCourseContentItems } = await import('@db/queries/course/content');

      const rows = await getCourseContentItems(fixture.courseId, fixture.studentProfileId);
      const activities = rows.filter((row) => row.type === ContentType.Activity);

      expect(activities).toHaveLength(2);
      expect(activities.map((row) => row.activityKind)).toEqual(['scorm', 'scorm']);
      expect(activities.map((row) => row.isComplete)).toEqual([false, false]);
      expect(rows.map((row) => row.type).sort()).toEqual(['ACTIVITY', 'ACTIVITY', 'LESSON', 'LESSON', 'SECTION']);
    } finally {
      await cleanupMixedFixture(fixture);
    }
  }, 30000);
});

describe.skipIf(!hasDatabase)('activity completion predicate and helpers', () => {
  it('matches only completed activities through isActivityCompletedSql', async () => {
    const fixture = await createMixedFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { isActivityCompletedSql } = await import('@db/queries/course/progression');
      const { completeActivityOnce } = await import('@cio/core/services/activity/activity');

      expect(await completeActivityOnce(fixture.activityOneId, fixture.studentProfileId)).toBe(true);

      const rows = await db
        .select({ id: schema.courseActivity.id })
        .from(schema.courseActivity)
        .where(isActivityCompletedSql('course_activity', fixture.studentProfileId));

      expect(rows.map((row) => row.id).sort()).toEqual([fixture.activityOneId]);
    } finally {
      await cleanupMixedFixture(fixture);
    }
  }, 30000);
  it('exposes activity policies and per-profile completion sets', async () => {
    const fixture = await createMixedFixture(suffix());
    try {
      const { getActivityProgressionPolicies, getCompletedActivityIdsForProfile } = await import(
        '@cio/db/queries/course/progression'
      );
      const { getBatchActivityCompletionsForCourse } = await import('@cio/db/queries/course/member-progress');
      const { getCourseTrackableContentCounts } = await import('@cio/db/queries/course/member-progress');
      const { completeActivityOnce } = await import('@cio/core/services/activity/activity');

      expect(await completeActivityOnce(fixture.activityOneId, fixture.studentProfileId)).toBe(true);

      const policies = await getActivityProgressionPolicies(fixture.courseId);
      expect(policies).toHaveLength(2);
      expect(new Map(policies.map((policy) => [policy.id, policy.isUnlocked]))).toEqual(
        new Map([
          [fixture.activityOneId, true],
          [fixture.activityTwoId, false]
        ])
      );

      expect(await getCompletedActivityIdsForProfile(fixture.courseId, fixture.studentProfileId)).toEqual(
        new Set([fixture.activityOneId])
      );

      const batch = await getBatchActivityCompletionsForCourse(fixture.courseId, [
        fixture.studentProfileId,
        fixture.tutorProfileId
      ]);
      expect([...(batch.get(fixture.studentProfileId) ?? [])]).toEqual([fixture.activityOneId]);
      expect(batch.get(fixture.tutorProfileId)?.size ?? 0).toBe(0);

      const counts = await getCourseTrackableContentCounts(fixture.courseId);
      expect(counts.activityIds.sort()).toEqual([fixture.activityOneId, fixture.activityTwoId].sort());
      expect(counts.activitiesCount).toBe(2);
    } finally {
      await cleanupMixedFixture(fixture);
    }
  }, 30000);
});

describe.skipIf(!hasDatabase)('activity progression and access in mixed courses', () => {
  it('blocks sequential items until the activity completes', async () => {
    const fixture = await createMixedFixture(suffix());
    try {
      const { annotateCourseContentWithProgression } = await import('@cio/core/services/course/progression');
      const { getCourseContentItems } = await import('@db/queries/course/content');
      const { completeActivityOnce } = await import('@cio/core/services/activity/activity');

      const rows = await getCourseContentItems(fixture.courseId, fixture.studentProfileId);
      const annotated = await annotateCourseContentWithProgression({
        courseId: fixture.courseId,
        profileId: fixture.studentProfileId,
        roleId: ROLE.STUDENT,
        progressionMode: 'sequential',
        contentRows: rows,
        isContentGroupingEnabled: true
      });

      const byId = new Map(annotated.sections[0].items.map((item) => [item.id, item]));
      expect(byId.get(fixture.lessonOneId)).toMatchObject({ accessible: true, lockReason: null });
      expect(byId.get(fixture.activityOneId)).toMatchObject({ accessible: true, lockReason: null });
      expect(byId.get(fixture.lessonTwoId)).toMatchObject({ accessible: false, lockReason: 'progression_blocked' });
      expect(byId.get(fixture.activityTwoId)).toMatchObject({ accessible: false, lockReason: 'teacher_locked' });

      expect(await completeActivityOnce(fixture.activityOneId, fixture.studentProfileId)).toBe(true);

      const reopened = await annotateCourseContentWithProgression({
        courseId: fixture.courseId,
        profileId: fixture.studentProfileId,
        roleId: ROLE.STUDENT,
        progressionMode: 'sequential',
        contentRows: await getCourseContentItems(fixture.courseId, fixture.studentProfileId),
        isContentGroupingEnabled: true
      });
      const reopenedById = new Map(reopened.sections[0].items.map((item) => [item.id, item]));
      expect(reopenedById.get(fixture.lessonTwoId)).toMatchObject({ accessible: true, lockReason: null });
    } finally {
      await cleanupMixedFixture(fixture);
    }
  }, 30000);
  it('gates activity access by enrollment, locks and progression', async () => {
    const fixture = await createMixedFixture(suffix());
    try {
      const { assertEnrolledStudentContentAccess } = await import('@api/services/course/access');

      await expect(
        assertEnrolledStudentContentAccess({
          courseId: fixture.courseId,
          profileId: fixture.studentProfileId,
          contentId: fixture.activityOneId,
          type: ContentType.Activity
        })
      ).resolves.toBeUndefined();

      await expect(
        assertEnrolledStudentContentAccess({
          courseId: fixture.courseId,
          profileId: fixture.studentProfileId,
          contentId: fixture.activityTwoId,
          type: ContentType.Activity
        })
      ).rejects.toMatchObject({ statusCode: 403 });

      await expect(
        assertEnrolledStudentContentAccess({
          courseId: fixture.courseId,
          profileId: fixture.tutorProfileId,
          contentId: fixture.activityTwoId,
          type: ContentType.Activity
        })
      ).resolves.toBeUndefined();
    } finally {
      await cleanupMixedFixture(fixture);
    }
  }, 30000);
  it('counts activities in member progress and stages the activity next', async () => {
    const fixture = await createMixedFixture(suffix());
    try {
      const { getCourseMemberProgressSummaries } = await import('@api/services/course/member-progress');
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');

      const [membership] = await db
        .select({ createdAt: schema.groupmember.createdAt })
        .from(schema.groupmember)
        .where(eq(schema.groupmember.id, fixture.studentMemberId));

      const summaries = await getCourseMemberProgressSummaries(fixture.courseId, [
        { profileId: fixture.studentProfileId, roleId: ROLE.STUDENT, createdAt: membership.createdAt }
      ]);
      const summary = summaries.get(fixture.studentProfileId);

      // 1 of 4 items (2 lessons + 2 activities) = 25%.
      expect(summary?.progressPercent).toBe(25);
      expect(summary?.stage).toEqual({
        kind: 'content',
        position: 2,
        title: 'Package one',
        contentType: 'activity'
      });
    } finally {
      await cleanupMixedFixture(fixture);
    }
  }, 30000);
});

describe.skipIf(!hasDatabase)('compliance follows activity-driven certification', () => {
  it('marks a lessons-plus-activity compliance course compliant', async () => {
    const tag = suffix();
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    const [organization] = await db
      .insert(schema.organization)
      .values({ name: `char-comp-act-${tag}` })
      .returning();
    const [group] = await db
      .insert(schema.group)
      .values({ name: `char-comp-act-${tag}`, organizationId: organization.id })
      .returning();
    const [course] = await db
      .insert(schema.course)
      .values({
        title: 'Compliance with package',
        description: 'Compliance course with a lesson and an activity',
        groupId: group.id,
        slug: `char-comp-act-${tag}`,
        type: 'COMPLIANCE' as never,
        status: 'ACTIVE',
        isPublished: true,
        certificate: { deadline: '2027-12-31T23:59:00.000Z', isDownloadable: false },
        compliance: { retakeIntervalMonths: 12 }
      })
      .returning();
    const [lesson] = await db
      .insert(schema.lesson)
      .values({ courseId: course.id, title: 'Policy', slug: 'policy', order: 1 })
      .returning();
    const [activity] = await db
      .insert(schema.courseActivity)
      .values({ courseId: course.id, kind: 'scorm', title: 'Package', order: 2 })
      .returning();

    const userId = crypto.randomUUID();
    await db.insert(schema.user).values({ id: userId, name: `Comp ${tag}`, email: `comp-act-${tag}@example.com` });
    await db.insert(schema.profile).values({
      id: userId,
      fullname: `Comp ${tag}`,
      username: `comp-act-${tag}`,
      email: `comp-act-${tag}@example.com`
    });
    await db.insert(schema.groupmember).values({
      groupId: group.id,
      roleId: ROLE.STUDENT,
      profileId: userId,
      email: `comp-act-${tag}@example.com`
    });
    await db.insert(schema.lessonCompletion).values({ lessonId: lesson.id, profileId: userId, isComplete: true });

    try {
      const { completeActivityOnce } = await import('@cio/core/services/activity/activity');
      const { syncComplianceProgressForMember } = await import('@api/services/course/compliance');

      expect(await completeActivityOnce(activity.id, userId)).toBe(true);

      const result = await syncComplianceProgressForMember(course.id, userId, 'activity');

      expect(result).toMatchObject({ status: 'compliant', completed: true });
    } finally {
      await db.delete(schema.activityCompletion).where(eq(schema.activityCompletion.profileId, userId));
      await db.delete(schema.lessonCompletion).where(eq(schema.lessonCompletion.profileId, userId));
      await db.delete(schema.courseCompletionRecord).where(eq(schema.courseCompletionRecord.profileId, userId));
      await db.delete(schema.courseActivity).where(eq(schema.courseActivity.courseId, course.id));
      await db.delete(schema.lesson).where(eq(schema.lesson.courseId, course.id));
      await db.delete(schema.course).where(eq(schema.course.id, course.id));
      await db.delete(schema.groupmember).where(eq(schema.groupmember.profileId, userId));
      await db.delete(schema.profile).where(eq(schema.profile.id, userId));
      await db.delete(schema.user).where(eq(schema.user.id, userId));
      await db.delete(schema.group).where(eq(schema.group.id, group.id));
      await db.delete(schema.organization).where(eq(schema.organization.id, organization.id));
    }
  }, 30000);
});
