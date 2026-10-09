import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';

import { courseRouter } from '@api/routes/course/course';
import { Hono } from '@api/utils/hono';
import { ROLE } from '@cio/utils/constants';

import type { Context, Next } from 'hono';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

type FixturePerson = {
  userId: string;
  email: string;
};

function appAs(profileId: string) {
  const setContext = async (c: Context, next: Next) => {
    c.set('user', { id: profileId });
    c.set('session', { id: 'session' });
    await next();
  };

  return new Hono().use(setContext).route('/course', courseRouter);
}

describe.skipIf(!hasDatabase)('cohort tutor submission access', () => {
  const suffix = `${Date.now()}`;
  let organizationId = '';
  let linkedGroupId = '';
  let addedGroupId = '';
  let linkedCourseId = '';
  let addedCourseId = '';
  let cohortId = '';
  const people: FixturePerson[] = [];

  let mentorId = '';
  let studentId = '';
  let cohortLearnerId = '';

  beforeAll(async () => {
    const { db } = await import('@db/drizzle');
    const { createOrganization, createOrganizationMember } = await import('@db/queries/organization');
    const schema = await import('@db/schema');

    const organization = await createOrganization({ name: `submission-access-${suffix}` });
    organizationId = organization.id;

    async function createPerson(label: string, orgRoleId: number): Promise<string> {
      const email = `${label}-${suffix}@submission-access.test`;
      const [userRow] = await db.insert(schema.user).values({ name: label, email, emailVerified: true }).returning();

      await db.insert(schema.profile).values({
        id: userRow.id,
        fullname: label,
        username: `${label}-${suffix}`,
        email
      });

      await createOrganizationMember({
        organizationId,
        roleId: orgRoleId,
        profileId: userRow.id,
        email,
        verified: true,
        status: 'ACTIVE'
      });

      people.push({ userId: userRow.id, email });

      return userRow.id;
    }

    mentorId = await createPerson('mentor', ROLE.TUTOR);
    studentId = await createPerson('student', ROLE.STUDENT);
    cohortLearnerId = await createPerson('learner', ROLE.TUTOR);

    const [linkedGroup] = await db
      .insert(schema.group)
      .values({ name: `linked-${suffix}`, organizationId })
      .returning();
    const [addedGroup] = await db
      .insert(schema.group)
      .values({ name: `added-${suffix}`, organizationId })
      .returning();

    linkedGroupId = linkedGroup.id;
    addedGroupId = addedGroup.id;

    const [linkedCourse] = await db
      .insert(schema.course)
      .values({
        title: 'Linked course',
        description: 'Already on the cohort',
        groupId: linkedGroupId,
        slug: `linked-${suffix}`
      })
      .returning();
    const [addedCourse] = await db
      .insert(schema.course)
      .values({
        title: 'Added course',
        description: 'Linked during the test',
        groupId: addedGroupId,
        slug: `added-${suffix}`
      })
      .returning();

    linkedCourseId = linkedCourse.id;
    addedCourseId = addedCourse.id;

    await db.insert(schema.groupmember).values({
      groupId: linkedGroupId,
      roleId: ROLE.STUDENT,
      profileId: studentId,
      email: `student-${suffix}@submission-access.test`
    });

    const [cohort] = await db
      .insert(schema.cohort)
      .values({
        organizationId,
        name: `Cohort ${suffix}`,
        description: 'Submission access fixture'
      })
      .returning();

    cohortId = cohort.id;

    await db.insert(schema.cohortCourse).values({ cohortId, courseId: linkedCourseId });
    await db.insert(schema.cohortMember).values([
      {
        cohortId,
        profileId: mentorId,
        roleId: ROLE.TUTOR,
        email: `mentor-${suffix}@submission-access.test`
      },
      {
        cohortId,
        profileId: studentId,
        roleId: ROLE.STUDENT,
        email: `student-${suffix}@submission-access.test`
      },
      {
        cohortId,
        profileId: cohortLearnerId,
        roleId: ROLE.STUDENT,
        email: `learner-${suffix}@submission-access.test`
      }
    ]);
  });

  afterAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    if (cohortId) {
      await db.delete(schema.cohort).where(eq(schema.cohort.id, cohortId));
    }

    const groupIds = [linkedGroupId, addedGroupId].filter(Boolean);
    for (const groupId of groupIds) {
      await db.delete(schema.groupmember).where(eq(schema.groupmember.groupId, groupId));
      await db.delete(schema.course).where(eq(schema.course.groupId, groupId));
      await db.delete(schema.group).where(eq(schema.group.id, groupId));
    }

    if (organizationId) {
      await db.delete(schema.organizationmember).where(eq(schema.organizationmember.organizationId, organizationId));
      await db.delete(schema.organization).where(eq(schema.organization.id, organizationId));
    }

    for (const person of people) {
      await db.delete(schema.profile).where(eq(schema.profile.id, person.userId));
      await db.delete(schema.user).where(eq(schema.user.id, person.userId));
    }
  });

  it('lets a cohort tutor grade without a course group row or org admin', async () => {
    const response = await appAs(mentorId).request(`/course/${linkedCourseId}/submission/for-grading`);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.sections).toHaveLength(3);
  });

  it('rejects a course student', async () => {
    const response = await appAs(studentId).request(`/course/${linkedCourseId}/submission/for-grading`);

    expect(response.status).toBe(403);
  });

  it('rejects an org tutor who is only a learner in the cohort', async () => {
    const response = await appAs(cohortLearnerId).request(`/course/${linkedCourseId}/submission/for-grading`);

    expect(response.status).toBe(403);
  });

  it('enrolls existing cohort tutors when a course is added', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { addCourseToCohortService } = await import('@api/services/cohort/cohort');

    const before = await db
      .select({ id: schema.groupmember.id })
      .from(schema.groupmember)
      .where(and(eq(schema.groupmember.groupId, addedGroupId), eq(schema.groupmember.profileId, mentorId)));

    expect(before).toHaveLength(0);

    await addCourseToCohortService(cohortId, { courseId: addedCourseId });

    const tutorMembership = await db
      .select({ roleId: schema.groupmember.roleId })
      .from(schema.groupmember)
      .where(and(eq(schema.groupmember.groupId, addedGroupId), eq(schema.groupmember.profileId, mentorId)));
    const studentMembership = await db
      .select({ roleId: schema.groupmember.roleId })
      .from(schema.groupmember)
      .where(and(eq(schema.groupmember.groupId, addedGroupId), eq(schema.groupmember.profileId, studentId)));
    const learnerMembership = await db
      .select({ roleId: schema.groupmember.roleId })
      .from(schema.groupmember)
      .where(and(eq(schema.groupmember.groupId, addedGroupId), eq(schema.groupmember.profileId, cohortLearnerId)));

    expect(tutorMembership).toHaveLength(1);
    expect(Number(tutorMembership[0].roleId)).toBe(ROLE.TUTOR);
    expect(studentMembership).toHaveLength(1);
    expect(Number(studentMembership[0].roleId)).toBe(ROLE.STUDENT);
    expect(learnerMembership).toHaveLength(1);
    expect(Number(learnerMembership[0].roleId)).toBe(ROLE.STUDENT);
  });
});
