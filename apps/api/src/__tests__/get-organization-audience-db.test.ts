import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

describe.skipIf(!hasDatabase)('getOrganizationAudience / getOrganizationAudienceMember against the database', () => {
  const suffix = `${Date.now()}`;
  let organizationId = '';
  let groupId = '';
  let courseId = '';
  let aliceUserId = '';
  let aliceMemberId = 0;
  let aliceGroupMemberId = '';
  let bobUserId = '';
  let bobMemberId = 0;
  let bobGroupMemberId = '';
  let lessonId = '';
  let directExerciseId = '';
  let legacyExerciseId = '';

  beforeAll(async () => {
    const { db } = await import('@db/drizzle');
    const { createOrganization } = await import('@db/queries/organization');
    const schema = await import('@db/schema');

    const organization = await createOrganization({ name: `audience-${suffix}` });
    organizationId = organization.id;

    const [group] = await db
      .insert(schema.group)
      .values({ name: `audience-group-${suffix}`, organizationId })
      .returning();
    groupId = group.id;

    const [course] = await db
      .insert(schema.course)
      .values({ title: 'Audience course', description: 'Fixture', groupId, slug: `audience-course-${suffix}` })
      .returning();
    courseId = course.id;

    const aliceEmail = `alice-${suffix}@audience.test`;
    const [aliceUser] = await db
      .insert(schema.user)
      .values({ name: 'Alice', email: aliceEmail, emailVerified: true })
      .returning();
    aliceUserId = aliceUser.id;
    await db
      .insert(schema.profile)
      .values({ id: aliceUserId, fullname: 'Alice', username: `alice-${suffix}`, email: aliceEmail });

    const bobEmail = `bob-${suffix}@audience.test`;
    const [bobUser] = await db
      .insert(schema.user)
      .values({ name: 'Bob', email: bobEmail, emailVerified: true })
      .returning();
    bobUserId = bobUser.id;
    await db
      .insert(schema.profile)
      .values({ id: bobUserId, fullname: 'Bob', username: `bob-${suffix}`, email: bobEmail });

    const [aliceGroupMember, bobGroupMember] = await db
      .insert(schema.groupmember)
      .values([
        { groupId, roleId: ROLE.STUDENT, profileId: aliceUserId, email: aliceEmail },
        { groupId, roleId: ROLE.STUDENT, profileId: bobUserId, email: bobEmail }
      ])
      .returning();
    aliceGroupMemberId = aliceGroupMember.id;
    bobGroupMemberId = bobGroupMember.id;

    const [aliceMember, bobMember] = await db
      .insert(schema.organizationmember)
      .values([
        { organizationId, roleId: ROLE.STUDENT, profileId: aliceUserId, email: aliceEmail },
        { organizationId, roleId: ROLE.STUDENT, profileId: bobUserId, email: bobEmail }
      ])
      .returning();
    aliceMemberId = aliceMember.id;
    bobMemberId = bobMember.id;

    const [lesson] = await db
      .insert(schema.lesson)
      .values({ courseId, title: 'Lesson 1', slug: `lesson-1-${suffix}`, order: 1 })
      .returning();
    lessonId = lesson.id;

    const [directExercise] = await db
      .insert(schema.exercise)
      .values({ title: 'Direct exercise', slug: `direct-exercise-${suffix}`, order: 2, courseId })
      .returning();
    directExerciseId = directExercise.id;

    // Legacy exercise reachable only through its (deprecated) lesson_id, with no course_id of its own.
    const [legacyExercise] = await db
      .insert(schema.exercise)
      .values({ title: 'Legacy exercise', slug: `legacy-exercise-${suffix}`, order: 3, lessonId })
      .returning();
    legacyExerciseId = legacyExercise.id;

    await db
      .insert(schema.submissionstatus)
      .values([
        { id: 1, label: 'Submitted' },
        { id: 2, label: 'In Progress' },
        { id: 3, label: 'Graded' }
      ])
      .onConflictDoNothing();

    // Alice completes everything: the lesson, the direct exercise, and the legacy lesson-linked exercise.
    await db.insert(schema.lessonCompletion).values({ lessonId, profileId: aliceUserId, isComplete: true });
    await db.insert(schema.submission).values([
      { exerciseId: directExerciseId, courseId, submittedBy: aliceGroupMemberId, statusId: 1 },
      { exerciseId: legacyExerciseId, courseId, submittedBy: aliceGroupMemberId, statusId: 1 }
    ]);
    // Bob has no completions at all.
  });

  afterAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    if (courseId) {
      await db.delete(schema.submission).where(eq(schema.submission.courseId, courseId));
      await db.delete(schema.exercise).where(eq(schema.exercise.courseId, courseId));
      if (legacyExerciseId) {
        await db.delete(schema.exercise).where(eq(schema.exercise.id, legacyExerciseId));
      }
      await db.delete(schema.lessonCompletion).where(eq(schema.lessonCompletion.lessonId, lessonId));
      await db.delete(schema.lesson).where(eq(schema.lesson.courseId, courseId));
    }
    if (groupId) {
      await db.delete(schema.groupmember).where(eq(schema.groupmember.groupId, groupId));
      await db.delete(schema.course).where(eq(schema.course.groupId, groupId));
      await db.delete(schema.group).where(eq(schema.group.id, groupId));
    }
    if (organizationId) {
      await db.delete(schema.organizationmember).where(eq(schema.organizationmember.organizationId, organizationId));
      await db.delete(schema.organization).where(eq(schema.organization.id, organizationId));
    }
    for (const userId of [aliceUserId, bobUserId]) {
      if (!userId) continue;
      await db.delete(schema.profile).where(eq(schema.profile.id, userId));
      await db.delete(schema.user).where(eq(schema.user.id, userId));
    }
  });

  it('counts a legacy lesson-linked exercise toward both total and completed items', async () => {
    const { getOrganizationAudienceMember } = await import('@cio/db/queries/organization');

    const alice = await getOrganizationAudienceMember(organizationId, aliceMemberId);
    const bob = await getOrganizationAudienceMember(organizationId, bobMemberId);

    // Alice: 1 lesson + 1 direct exercise + 1 legacy lesson-linked exercise, all completed.
    expect(alice?.enrolledCount).toBe(1);
    expect(alice?.completedCount).toBe(1);
    expect(alice?.progressPercent).toBe(100);

    // Bob: same course shape, nothing completed.
    expect(bob?.enrolledCount).toBe(1);
    expect(bob?.completedCount).toBe(0);
    expect(bob?.progressPercent).toBe(0);
  });

  it('paginates the roster without an enrolment filter, attaching the right progress to each page', async () => {
    const { getOrganizationAudience } = await import('@cio/db/queries/organization');

    const pageOne = await getOrganizationAudience(organizationId, {
      limit: 1,
      page: 1,
      sortBy: 'name',
      sortOrder: 'asc'
    });
    const pageTwo = await getOrganizationAudience(organizationId, {
      limit: 1,
      page: 2,
      sortBy: 'name',
      sortOrder: 'asc'
    });

    expect(pageOne.total).toBe(2);
    expect(pageOne.totalPages).toBe(2);
    expect(pageOne.items).toHaveLength(1);
    expect(pageTwo.items).toHaveLength(1);

    const [alice] = pageOne.items;
    const [bob] = pageTwo.items;

    expect(alice.id).toBe(aliceMemberId);
    expect(alice.progressPercent).toBe(100);
    expect(alice.completedCount).toBe(1);

    expect(bob.id).toBe(bobMemberId);
    expect(bob.progressPercent).toBe(0);
    expect(bob.completedCount).toBe(0);
  });

  it('still filters correctly when a completion filter forces the enrolment join before LIMIT', async () => {
    const { getOrganizationAudience } = await import('@cio/db/queries/organization');

    const completed = await getOrganizationAudience(organizationId, { completion: 'completed' });

    expect(completed.items.map((item) => item.id)).toEqual([aliceMemberId]);
  });
});
