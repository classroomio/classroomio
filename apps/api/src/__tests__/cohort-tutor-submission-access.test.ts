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
  let exerciseId = '';
  let submissionId = '';
  let otherCourseSubmissionId = '';
  const extraCohortIds: string[] = [];
  const extraCourseIds: string[] = [];
  const extraGroupIds: string[] = [];

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
        slug: `linked-${suffix}`,
        isPublished: true
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
    const [linkedExercise] = await db
      .insert(schema.exercise)
      .values({ title: 'Linked quiz', order: 1, courseId: linkedCourseId })
      .returning();
    const [addedExercise] = await db
      .insert(schema.exercise)
      .values({ title: 'Added quiz', order: 1, courseId: addedCourseId })
      .returning();
    exerciseId = linkedExercise.id;

    const [studentMembership] = await db
      .select({ id: schema.groupmember.id })
      .from(schema.groupmember)
      .where(and(eq(schema.groupmember.groupId, linkedGroupId), eq(schema.groupmember.profileId, studentId)));

    await db
      .insert(schema.submissionstatus)
      .values([
        { id: 1, label: 'Submitted' },
        { id: 2, label: 'In Progress' },
        { id: 3, label: 'Graded' }
      ])
      .onConflictDoNothing();

    const [linkedSubmission] = await db
      .insert(schema.submission)
      .values({
        exerciseId: linkedExercise.id,
        courseId: linkedCourseId,
        submittedBy: studentMembership.id,
        gradingState: 'awaiting_manual',
        statusId: 1
      })
      .returning();
    const [addedSubmission] = await db
      .insert(schema.submission)
      .values({
        exerciseId: addedExercise.id,
        courseId: addedCourseId,
        gradingState: 'awaiting_manual',
        statusId: 1
      })
      .returning();

    submissionId = linkedSubmission.id;
    otherCourseSubmissionId = addedSubmission.id;

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

    const cohortIds = [cohortId, ...extraCohortIds].filter(Boolean);
    for (const id of cohortIds) {
      await db.delete(schema.cohort).where(eq(schema.cohort.id, id));
    }

    const courseIds = [linkedCourseId, addedCourseId, ...extraCourseIds].filter(Boolean);
    for (const id of courseIds) {
      await db.delete(schema.exercise).where(eq(schema.exercise.courseId, id));
    }

    const groupIds = [linkedGroupId, addedGroupId, ...extraGroupIds].filter(Boolean);
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

  it('lets a cohort tutor open the course shell without a course group row', async () => {
    const response = await appAs(mentorId).request(`/course/${linkedCourseId}?slug=linked-${suffix}`);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(linkedCourseId);
    expect(body.data.canGrade).toBe(true);
  });

  it('rejects a slug that resolves to a different course', async () => {
    const response = await appAs(mentorId).request(`/course/${linkedCourseId}?slug=added-${suffix}`);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe('COURSE_NOT_FOUND');
  });

  it('tells a course student they cannot grade', async () => {
    const response = await appAs(studentId).request(`/course/${linkedCourseId}`);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.canGrade).toBe(false);
  });

  it('hides the course shell from an org tutor who is only a cohort learner', async () => {
    const response = await appAs(cohortLearnerId).request(`/course/${linkedCourseId}`);

    expect(response.status).toBe(403);
  });

  it('lets a cohort tutor grade without a course group row or org admin', async () => {
    const listResponse = await appAs(mentorId).request(`/course/${linkedCourseId}/submission/for-grading`);

    expect(listResponse.status).toBe(200);
    const listBody = await listResponse.json();
    expect(listBody.success).toBe(true);
    expect(listBody.data.sections).toHaveLength(3);

    const gradeResponse = await appAs(mentorId).request(`/course/${linkedCourseId}/submission/${submissionId}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ feedback: 'Reviewed by mentor', gradingState: 'completed' })
    });

    expect(gradeResponse.status).toBe(200);
    const gradeBody = await gradeResponse.json();
    expect(gradeBody.success).toBe(true);
    expect(gradeBody.data.gradingState).toBe('completed');
    expect(gradeBody.data.feedback).toBe('Reviewed by mentor');
  });

  it('rejects a grade for a submission from another course', async () => {
    const response = await appAs(mentorId).request(`/course/${linkedCourseId}/submission/${otherCourseSubmissionId}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ feedback: 'Wrong course', gradingState: 'completed' })
    });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe('SUBMISSION_NOT_FOUND');

    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const [submission] = await db
      .select({ gradingState: schema.submission.gradingState })
      .from(schema.submission)
      .where(eq(schema.submission.id, otherCourseSubmissionId));

    expect(submission.gradingState).toBe('awaiting_manual');
  });

  it('reports grading permission on the exercise submissions overview', async () => {
    const mentorResponse = await appAs(mentorId).request(
      `/course/${linkedCourseId}/exercise/${exerciseId}/submissions`
    );
    expect(mentorResponse.status).toBe(200);
    const mentorBody = await mentorResponse.json();
    expect(mentorBody.data.canGrade).toBe(true);

    const studentResponse = await appAs(studentId).request(
      `/course/${linkedCourseId}/exercise/${exerciseId}/submissions`
    );
    expect(studentResponse.status).toBe(200);
    const studentBody = await studentResponse.json();
    expect(studentBody.data.canGrade).toBe(false);
    expect(studentBody.data.allSubmissions).toEqual([]);
  });

  it('rejects a course student', async () => {
    const response = await appAs(studentId).request(`/course/${linkedCourseId}/submission/for-grading`);

    expect(response.status).toBe(403);

    const gradeResponse = await appAs(studentId).request(`/course/${linkedCourseId}/submission/${submissionId}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ feedback: 'Student should not grade', gradingState: 'completed' })
    });

    expect(gradeResponse.status).toBe(403);
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

  it('does not give an organization student a course tutor row', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { createOrganizationMember } = await import('@db/queries/organization');
    const { addCohortMembersSettled } = await import('@api/services/cohort/cohort');

    const email = `org-student-${suffix}@submission-access.test`;
    const [userRow] = await db
      .insert(schema.user)
      .values({ name: 'org-student', email, emailVerified: true })
      .returning();
    await db.insert(schema.profile).values({
      id: userRow.id,
      fullname: 'org-student',
      username: `org-student-${suffix}`,
      email
    });
    await createOrganizationMember({
      organizationId,
      roleId: ROLE.STUDENT,
      profileId: userRow.id,
      email,
      verified: true,
      status: 'ACTIVE'
    });
    people.push({ userId: userRow.id, email });

    const [result] = await addCohortMembersSettled(cohortId, {
      members: [{ profileId: userRow.id, email, roleId: ROLE.TUTOR }]
    });

    expect(result.status).toBe('fulfilled');

    const memberships = await db
      .select({ roleId: schema.groupmember.roleId })
      .from(schema.groupmember)
      .where(eq(schema.groupmember.profileId, userRow.id));

    expect(memberships).toHaveLength(0);

    const response = await appAs(userRow.id).request(`/course/${linkedCourseId}/submission/for-grading`);
    expect(response.status).toBe(403);
  });

  it('leaves the enrolled course tutor in place when the cohort link ends', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { createOrganizationMember } = await import('@db/queries/organization');
    const {
      addCourseToCohortService,
      removeCohortMemberService,
      removeCourseFromCohortService,
      updateCohortMemberService
    } = await import('@api/services/cohort/cohort');

    const independentEmail = `independent-${suffix}@submission-access.test`;
    const [independentUser] = await db
      .insert(schema.user)
      .values({ name: 'independent', email: independentEmail, emailVerified: true })
      .returning();
    await db.insert(schema.profile).values({
      id: independentUser.id,
      fullname: 'independent',
      username: `independent-${suffix}`,
      email: independentEmail
    });
    await createOrganizationMember({
      organizationId,
      roleId: ROLE.TUTOR,
      profileId: independentUser.id,
      email: independentEmail,
      verified: true,
      status: 'ACTIVE'
    });
    people.push({ userId: independentUser.id, email: independentEmail });
    await db.insert(schema.groupmember).values({
      groupId: addedGroupId,
      roleId: ROLE.TUTOR,
      profileId: independentUser.id,
      email: independentEmail
    });

    await removeCourseFromCohortService(cohortId, addedCourseId);

    const afterUnlink = await db
      .select({ roleId: schema.groupmember.roleId })
      .from(schema.groupmember)
      .where(and(eq(schema.groupmember.groupId, addedGroupId), eq(schema.groupmember.profileId, mentorId)));
    const independentMembership = await db
      .select({ roleId: schema.groupmember.roleId })
      .from(schema.groupmember)
      .where(and(eq(schema.groupmember.groupId, addedGroupId), eq(schema.groupmember.profileId, independentUser.id)));

    expect(afterUnlink).toHaveLength(1);
    expect(Number(afterUnlink[0].roleId)).toBe(ROLE.TUTOR);
    expect(independentMembership).toHaveLength(1);
    expect(Number(independentMembership[0].roleId)).toBe(ROLE.TUTOR);

    const [demoteGroup] = await db
      .insert(schema.group)
      .values({ name: `demote-${suffix}`, organizationId })
      .returning();
    extraGroupIds.push(demoteGroup.id);
    const [demoteCourse] = await db
      .insert(schema.course)
      .values({
        title: 'Demote course',
        description: 'Used to check role changes',
        groupId: demoteGroup.id,
        slug: `demote-${suffix}`
      })
      .returning();
    extraCourseIds.push(demoteCourse.id);
    await addCourseToCohortService(cohortId, { courseId: demoteCourse.id });

    const [mentorMember] = await db
      .select({ id: schema.cohortMember.id })
      .from(schema.cohortMember)
      .where(and(eq(schema.cohortMember.cohortId, cohortId), eq(schema.cohortMember.profileId, mentorId)));

    await updateCohortMemberService(cohortId, mentorMember.id, { roleId: ROLE.STUDENT });

    const afterDemote = await db
      .select({ roleId: schema.groupmember.roleId })
      .from(schema.groupmember)
      .where(and(eq(schema.groupmember.groupId, demoteGroup.id), eq(schema.groupmember.profileId, mentorId)));
    expect(afterDemote).toHaveLength(1);
    expect(Number(afterDemote[0].roleId)).toBe(ROLE.TUTOR);

    const demoteCourseGrading = await appAs(mentorId).request(`/course/${demoteCourse.id}/submission/for-grading`);
    expect(demoteCourseGrading.status).toBe(200);

    const deniedOnUnenrolledCourse = await appAs(mentorId).request(`/course/${linkedCourseId}/submission/for-grading`);
    expect(deniedOnUnenrolledCourse.status).toBe(403);

    await removeCohortMemberService(cohortId, mentorMember.id);

    const stillOnDemoteCourse = await appAs(mentorId).request(`/course/${demoteCourse.id}/submission/for-grading`);
    expect(stillOnDemoteCourse.status).toBe(200);
  });
});
