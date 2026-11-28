import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ROLE } from '@cio/utils/constants';

const shouldRun = Boolean(process.env.TEST_DATABASE_URL);

describe.skipIf(!shouldRun)('email-only membership claims (database)', () => {
  const suffix = Date.now();
  const organizationIds: string[] = [];
  const groupIds: string[] = [];
  const courseIds: string[] = [];
  const cohortIds: string[] = [];
  const programIds: string[] = [];
  const profileIds: string[] = [];
  const userIds: string[] = [];

  let organizationId = '';
  let otherOrganizationId = '';
  let otherOrgGroupId = '';
  let otherOrgCohortId = '';
  let learnerId = '';
  let otherLearnerId = '';

  async function createProfile(label: string) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    const email = `${label}-${suffix}@claims.test`;
    const [user] = await db.insert(schema.user).values({ name: label, email, emailVerified: true }).returning();
    await db.insert(schema.profile).values({ id: user.id, fullname: label, username: `${label}-${suffix}`, email });

    userIds.push(user.id);
    profileIds.push(user.id);

    return user.id;
  }

  async function createCourseGroup(orgId: string, label: string) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    const [group] = await db
      .insert(schema.group)
      .values({ name: `${label}-${suffix}`, organizationId: orgId })
      .returning();
    const [course] = await db
      .insert(schema.course)
      .values({
        title: label,
        description: label,
        groupId: group.id,
        isPublished: true,
        slug: `${label}-${suffix}`
      })
      .returning({ id: schema.course.id });

    groupIds.push(group.id);
    courseIds.push(course.id);

    return group.id;
  }

  async function createCohort(orgId: string, label: string) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    const [cohort] = await db
      .insert(schema.cohort)
      .values({ organizationId: orgId, name: `${label}-${suffix}` })
      .returning({ id: schema.cohort.id });

    cohortIds.push(cohort.id);

    return cohort.id;
  }

  async function createProgram(orgId: string, label: string) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    const [program] = await db
      .insert(schema.program)
      .values({ organizationId: orgId, name: `${label}-${suffix}` })
      .returning({ id: schema.program.id });

    programIds.push(program.id);

    return program.id;
  }

  async function insertEmailOnlyGroupMember(groupId: string, email: string) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    const [row] = await db.insert(schema.groupmember).values({ groupId, roleId: ROLE.STUDENT, email }).returning();

    return row;
  }

  async function countGroupMembers(groupId: string, email: string) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    return db
      .select()
      .from(schema.groupmember)
      .where(
        and(eq(schema.groupmember.groupId, groupId), eq(sql`lower(${schema.groupmember.email})`, email.toLowerCase()))
      );
  }

  async function getCourseId(groupId: string) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    const [course] = await db
      .select({ id: schema.course.id })
      .from(schema.course)
      .where(eq(schema.course.groupId, groupId))
      .limit(1);

    return course.id;
  }

  async function countCohortMembers(cohortId: string, email: string) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    return db
      .select()
      .from(schema.cohortMember)
      .where(
        and(
          eq(schema.cohortMember.cohortId, cohortId),
          eq(sql`lower(${schema.cohortMember.email})`, email.toLowerCase())
        )
      );
  }

  async function countProgramMembers(programId: string, email: string) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    return db
      .select()
      .from(schema.programMember)
      .where(
        and(
          eq(schema.programMember.programId, programId),
          eq(sql`lower(${schema.programMember.email})`, email.toLowerCase())
        )
      );
  }

  async function emailOnlyGroupRows(orgId: string, email: string) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    return db
      .select({ id: schema.groupmember.id, profileId: schema.groupmember.profileId })
      .from(schema.groupmember)
      .innerJoin(schema.group, eq(schema.group.id, schema.groupmember.groupId))
      .where(
        and(
          eq(schema.group.organizationId, orgId),
          isNull(schema.groupmember.profileId),
          eq(sql`lower(${schema.groupmember.email})`, email.toLowerCase())
        )
      );
  }

  async function emailOnlyCohortRows(orgId: string, email: string) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    return db
      .select({ id: schema.cohortMember.id })
      .from(schema.cohortMember)
      .innerJoin(schema.cohort, eq(schema.cohort.id, schema.cohortMember.cohortId))
      .where(
        and(
          eq(schema.cohort.organizationId, orgId),
          isNull(schema.cohortMember.profileId),
          eq(sql`lower(${schema.cohortMember.email})`, email.toLowerCase())
        )
      );
  }

  async function emailOnlyProgramRows(orgId: string, email: string) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    return db
      .select({ id: schema.programMember.id })
      .from(schema.programMember)
      .innerJoin(schema.program, eq(schema.program.id, schema.programMember.programId))
      .where(
        and(
          eq(schema.program.organizationId, orgId),
          isNull(schema.programMember.profileId),
          eq(sql`lower(${schema.programMember.email})`, email.toLowerCase())
        )
      );
  }

  beforeAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    await db
      .insert(schema.role)
      .values([
        { id: ROLE.ADMIN, type: 'admin' },
        { id: ROLE.TUTOR, type: 'tutor' },
        { id: ROLE.STUDENT, type: 'student' }
      ])
      .onConflictDoNothing();
    const { createOrganization } = await import('@db/queries/organization');

    const organization = await createOrganization({ name: `claims-${suffix}` });
    const otherOrganization = await createOrganization({ name: `claims-other-${suffix}` });

    organizationId = organization.id;
    otherOrganizationId = otherOrganization.id;
    organizationIds.push(organizationId, otherOrganizationId);

    learnerId = await createProfile('learner');
    otherLearnerId = await createProfile('other-learner');

    otherOrgGroupId = await createCourseGroup(otherOrganizationId, 'other-group');
    otherOrgCohortId = await createCohort(otherOrganizationId, 'other-cohort');
  });

  afterAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    if (groupIds.length > 0) {
      await db.delete(schema.groupmember).where(inArray(schema.groupmember.groupId, groupIds));
      await db.delete(schema.course).where(inArray(schema.course.groupId, groupIds));
      await db.delete(schema.group).where(inArray(schema.group.id, groupIds));
    }
    if (cohortIds.length > 0) {
      await db.delete(schema.cohortMember).where(inArray(schema.cohortMember.cohortId, cohortIds));
      await db.delete(schema.cohort).where(inArray(schema.cohort.id, cohortIds));
    }
    if (programIds.length > 0) {
      await db.delete(schema.programMember).where(inArray(schema.programMember.programId, programIds));
      await db.delete(schema.program).where(inArray(schema.program.id, programIds));
    }
    if (userIds.length > 0) {
      await db.delete(schema.profile).where(inArray(schema.profile.id, userIds));
      await db.delete(schema.user).where(inArray(schema.user.id, userIds));
    }
    if (organizationIds.length > 0) {
      await db.delete(schema.organization).where(inArray(schema.organization.id, organizationIds));
    }
  });

  it('claims a course membership written with only an email', async () => {
    const { claimEmailOnlyGroupMembers } = await import('@cio/db/queries/group');
    const groupId = await createCourseGroup(organizationId, 'claim-course');
    const email = `claim-${suffix}@claims.test`;

    await insertEmailOnlyGroupMember(groupId, email);

    const result = await claimEmailOnlyGroupMembers(organizationId, email, learnerId);
    const rows = await countGroupMembers(groupId, email);

    expect(result).toEqual({ claimed: 1, removedDuplicates: 0, claimedGroupIds: [groupId] });
    expect(rows).toHaveLength(1);
    expect(rows[0].profileId).toBe(learnerId);
  });

  it('never claims a membership owned by another organization', async () => {
    const { claimEmailOnlyGroupMembers } = await import('@cio/db/queries/group');
    const groupId = await createCourseGroup(organizationId, 'scoped-course');
    const email = `scoped-${suffix}@claims.test`;

    await insertEmailOnlyGroupMember(groupId, email);
    await insertEmailOnlyGroupMember(otherOrgGroupId, email);

    await claimEmailOnlyGroupMembers(organizationId, email, learnerId);

    const ownRows = await countGroupMembers(groupId, email);
    const otherRows = await emailOnlyGroupRows(otherOrganizationId, email);

    expect(ownRows[0].profileId).toBe(learnerId);
    expect(otherRows).toHaveLength(1);
    expect(otherRows[0].profileId).toBeNull();
  });

  it('drops an email-only duplicate when the profile already has the course row', async () => {
    const { claimEmailOnlyGroupMembers } = await import('@cio/db/queries/group');
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const groupId = await createCourseGroup(organizationId, 'duplicate-course');
    const email = `duplicate-${suffix}@claims.test`;

    await db.insert(schema.groupmember).values({ groupId, roleId: ROLE.STUDENT, profileId: learnerId });
    await insertEmailOnlyGroupMember(groupId, email);

    const result = await claimEmailOnlyGroupMembers(organizationId, email, learnerId);
    const remaining = await emailOnlyGroupRows(organizationId, email);

    expect(result).toEqual({ claimed: 0, removedDuplicates: 1, claimedGroupIds: [] });
    expect(remaining).toHaveLength(0);
  });

  it('enrolls into the missing courses only and reuses the claimed row', async () => {
    const { enrollUsersInCourseGroups } = await import('@cio/db/queries/group');
    const claimedGroupId = await createCourseGroup(organizationId, 'enroll-claimed');
    const newGroupId = await createCourseGroup(organizationId, 'enroll-new');
    const email = `enroll-${suffix}@claims.test`;

    await insertEmailOnlyGroupMember(claimedGroupId, email);

    const inserted = await enrollUsersInCourseGroups(
      [claimedGroupId, newGroupId],
      [{ profileId: learnerId, email }],
      ROLE.STUDENT
    );
    const secondRun = await enrollUsersInCourseGroups(
      [claimedGroupId, newGroupId],
      [{ profileId: learnerId, email }],
      ROLE.STUDENT
    );

    expect(inserted).toHaveLength(1);
    expect(inserted[0].groupId).toBe(newGroupId);
    expect(secondRun).toHaveLength(0);
    expect(await countGroupMembers(claimedGroupId, email)).toHaveLength(1);
    expect(await countGroupMembers(newGroupId, email)).toHaveLength(1);
  });

  it('adds a group member once, claiming the email-only row first', async () => {
    const { addGroupMember } = await import('@cio/db/queries/group');
    const groupId = await createCourseGroup(organizationId, 'add-member');
    const email = `add-${suffix}@claims.test`;

    const emailOnlyRow = await insertEmailOnlyGroupMember(groupId, email);

    const [first] = await addGroupMember({ groupId, roleId: ROLE.STUDENT, profileId: learnerId, email });
    const [second] = await addGroupMember({ groupId, roleId: ROLE.STUDENT, profileId: learnerId, email });
    const rows = await countGroupMembers(groupId, email);

    expect(first.id).toBe(emailOnlyRow.id);
    expect(second.id).toBe(emailOnlyRow.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].profileId).toBe(learnerId);
  });

  it('reuses a staff course row for a student enrollment without changing its role', async () => {
    const { addGroupMember } = await import('@cio/db/queries/group');
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const groupId = await createCourseGroup(organizationId, 'staff-row');
    const email = `staff-${suffix}@claims.test`;

    await db.insert(schema.groupmember).values({ groupId, roleId: ROLE.TUTOR, email });

    const [reused] = await addGroupMember({ groupId, roleId: ROLE.STUDENT, profileId: learnerId, email });
    const rows = await countGroupMembers(groupId, email);

    expect(reused.roleId).toBe(ROLE.TUTOR);
    expect(rows).toHaveLength(1);
    expect(rows[0].profileId).toBe(learnerId);
    expect(rows[0].roleId).toBe(ROLE.TUTOR);
  });

  it('adds a course member once, claiming the email-only row first', async () => {
    const { addCourseMember } = await import('@cio/db/queries/course/people');
    const groupId = await createCourseGroup(organizationId, 'add-course-member');
    const courseId = await getCourseId(groupId);
    const email = `add-course-${suffix}@claims.test`;

    const emailOnlyRow = await insertEmailOnlyGroupMember(groupId, email);

    const first = await addCourseMember(courseId, { profileId: learnerId, roleId: ROLE.STUDENT, email });
    const second = await addCourseMember(courseId, { profileId: learnerId, roleId: ROLE.STUDENT, email });
    const rows = await countGroupMembers(groupId, email);

    expect(first.member.id).toBe(emailOnlyRow.id);
    expect(first.created).toBe(true);
    expect(second.member.id).toBe(emailOnlyRow.id);
    expect(second.created).toBe(false);
    expect(rows).toHaveLength(1);
    expect(rows[0].profileId).toBe(learnerId);
  });

  it('claims an email-only course row stored with surrounding spaces and different case', async () => {
    const { addCourseMember } = await import('@cio/db/queries/course/people');
    const groupId = await createCourseGroup(organizationId, 'add-course-member-padded');
    const courseId = await getCourseId(groupId);
    const email = `add-course-padded-${suffix}@claims.test`;

    const emailOnlyRow = await insertEmailOnlyGroupMember(groupId, `  ${email.toUpperCase()} `);

    const added = await addCourseMember(courseId, { profileId: learnerId, roleId: ROLE.STUDENT, email });

    expect(added.created).toBe(true);
    expect(added.member.id).toBe(emailOnlyRow.id);
    expect(added.member.profileId).toBe(learnerId);
  });

  it('applies the requested role when it claims an email-only course row', async () => {
    const { addCourseMember } = await import('@cio/db/queries/course/people');
    const groupId = await createCourseGroup(organizationId, 'add-course-member-role');
    const courseId = await getCourseId(groupId);
    const email = `add-course-role-${suffix}@claims.test`;

    const emailOnlyRow = await insertEmailOnlyGroupMember(groupId, email);

    const added = await addCourseMember(courseId, { profileId: learnerId, roleId: ROLE.TUTOR, email });

    expect(added.created).toBe(true);
    expect(added.member.id).toBe(emailOnlyRow.id);
    expect(added.member.roleId).toBe(ROLE.TUTOR);
  });

  it('claims an email-only row through the conflict-safe insert used by cohort enrolment', async () => {
    const { insertGroupMembersOnConflictDoNothing } = await import('@cio/db/queries/group');
    const groupId = await createCourseGroup(organizationId, 'conflict-safe');
    const email = `conflict-${suffix}@claims.test`;

    await insertEmailOnlyGroupMember(groupId, email);

    const inserted = await insertGroupMembersOnConflictDoNothing([
      { groupId, roleId: ROLE.STUDENT, profileId: learnerId, email }
    ]);
    const rows = await countGroupMembers(groupId, email);

    expect(inserted).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0].profileId).toBe(learnerId);
  });

  it('claims a cohort membership written with only an email', async () => {
    const { addCohortMember } = await import('@cio/db/queries/cohort');
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const cohortId = await createCohort(organizationId, 'claim-cohort');
    const email = `cohort-${suffix}@claims.test`;

    await db.insert(schema.cohortMember).values({ cohortId, roleId: ROLE.STUDENT, email });

    const member = await addCohortMember({ cohortId, roleId: ROLE.STUDENT, profileId: learnerId, email });
    const again = await addCohortMember({ cohortId, roleId: ROLE.STUDENT, profileId: learnerId, email });
    const remaining = await emailOnlyCohortRows(organizationId, email);

    expect(member.profileId).toBe(learnerId);
    expect(again.id).toBe(member.id);
    expect(remaining).toHaveLength(0);
  });

  it('keeps cohort claims inside their organization', async () => {
    const { claimEmailOnlyCohortMembers } = await import('@cio/db/queries/cohort');
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const cohortId = await createCohort(organizationId, 'scoped-cohort');
    const email = `scoped-cohort-${suffix}@claims.test`;

    await db.insert(schema.cohortMember).values([
      { cohortId, roleId: ROLE.STUDENT, email },
      { cohortId: otherOrgCohortId, roleId: ROLE.STUDENT, email }
    ]);

    await claimEmailOnlyCohortMembers(organizationId, email, learnerId);

    const ownRemaining = await emailOnlyCohortRows(organizationId, email);
    const otherRemaining = await emailOnlyCohortRows(otherOrganizationId, email);

    expect(ownRemaining).toHaveLength(0);
    expect(otherRemaining).toHaveLength(1);
  });

  it('claims a program membership written with only an email', async () => {
    const { claimEmailOnlyProgramMembers } = await import('@cio/db/queries/cohort');
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const programId = await createProgram(organizationId, 'claim-program');
    const email = `program-${suffix}@claims.test`;

    await db.insert(schema.programMember).values({ programId, roleId: ROLE.STUDENT, email });

    const result = await claimEmailOnlyProgramMembers(organizationId, email, learnerId);
    const remaining = await emailOnlyProgramRows(organizationId, email);

    expect(result).toEqual({ claimed: 1, removedDuplicates: 0 });
    expect(remaining).toHaveLength(0);
  });

  it('drops the email-only cohort duplicate when the profile row already exists', async () => {
    const { claimEmailOnlyCohortMembers, getExistingCohortMembers } = await import('@cio/db/queries/cohort');
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const cohortId = await createCohort(organizationId, 'cohort-duplicate');
    const email = `cohort-duplicate-${suffix}@claims.test`;

    await db.insert(schema.cohortMember).values([
      { cohortId, roleId: ROLE.STUDENT, profileId: learnerId },
      { cohortId, roleId: ROLE.STUDENT, email }
    ]);

    const result = await claimEmailOnlyCohortMembers(organizationId, email, learnerId);
    const remaining = await emailOnlyCohortRows(organizationId, email);
    const existing = await getExistingCohortMembers([{ cohortId, profileId: learnerId }]);

    expect(result).toEqual({ claimed: 0, removedDuplicates: 1, claimedCohortIds: [] });
    expect(remaining).toHaveLength(0);
    expect(existing.has(`${cohortId}:${learnerId}`)).toBe(true);
  });

  it('drops the email-only program duplicate when the profile row already exists', async () => {
    const { claimEmailOnlyProgramMembers } = await import('@cio/db/queries/cohort');
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const programId = await createProgram(organizationId, 'program-duplicate');
    const email = `program-duplicate-${suffix}@claims.test`;

    await db.insert(schema.programMember).values([
      { programId, roleId: ROLE.STUDENT, profileId: learnerId },
      { programId, roleId: ROLE.STUDENT, email }
    ]);

    const result = await claimEmailOnlyProgramMembers(organizationId, email, learnerId);
    const remaining = await emailOnlyProgramRows(organizationId, email);
    const [profileRow] = await db
      .select()
      .from(schema.programMember)
      .where(and(eq(schema.programMember.programId, programId), eq(schema.programMember.profileId, learnerId)))
      .limit(1);

    expect(result).toEqual({ claimed: 0, removedDuplicates: 1 });
    expect(remaining).toHaveLength(0);
    expect(profileRow.profileId).toBe(learnerId);
  });

  it('claims several learners across several groups in one call', async () => {
    const { claimEmailOnlyGroupMembersForGroups } = await import('@cio/db/queries/group');
    const firstGroupId = await createCourseGroup(organizationId, 'multi-group-first');
    const secondGroupId = await createCourseGroup(organizationId, 'multi-group-second');
    const firstEmail = `multi-first-${suffix}@claims.test`;
    const secondEmail = `multi-second-${suffix}@claims.test`;

    await insertEmailOnlyGroupMember(firstGroupId, firstEmail);
    await insertEmailOnlyGroupMember(secondGroupId, secondEmail);

    const result = await claimEmailOnlyGroupMembersForGroups(
      [firstGroupId, secondGroupId],
      [
        { profileId: learnerId, email: firstEmail },
        { profileId: otherLearnerId, email: secondEmail }
      ]
    );

    expect(result).toMatchObject({ claimed: 2, removedDuplicates: 0 });
    expect([...result.claimedGroupIds].sort()).toEqual([firstGroupId, secondGroupId].sort());
    expect((await countGroupMembers(firstGroupId, firstEmail))[0].profileId).toBe(learnerId);
    expect((await countGroupMembers(secondGroupId, secondEmail))[0].profileId).toBe(otherLearnerId);
  });

  it('claims several learners across several cohorts in one call', async () => {
    const { claimEmailOnlyCohortMembersForCohorts } = await import('@cio/db/queries/cohort');
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const firstCohortId = await createCohort(organizationId, 'multi-cohort-first');
    const secondCohortId = await createCohort(organizationId, 'multi-cohort-second');
    const firstEmail = `multi-cohort-first-${suffix}@claims.test`;
    const secondEmail = `multi-cohort-second-${suffix}@claims.test`;

    await db.insert(schema.cohortMember).values([
      { cohortId: firstCohortId, roleId: ROLE.STUDENT, email: firstEmail },
      { cohortId: secondCohortId, roleId: ROLE.STUDENT, email: secondEmail }
    ]);

    const result = await claimEmailOnlyCohortMembersForCohorts(
      [firstCohortId, secondCohortId],
      [
        { profileId: learnerId, email: firstEmail },
        { profileId: otherLearnerId, email: secondEmail }
      ]
    );

    expect(result).toMatchObject({ claimed: 2, removedDuplicates: 0 });
    expect([...result.claimedCohortIds].sort()).toEqual([firstCohortId, secondCohortId].sort());
    expect((await countCohortMembers(firstCohortId, firstEmail))[0].profileId).toBe(learnerId);
    expect((await countCohortMembers(secondCohortId, secondEmail))[0].profileId).toBe(otherLearnerId);
  });

  it('leaves email-only rows in cohorts outside the enrolment untouched', async () => {
    const { claimEmailOnlyCohortMembersForCohorts } = await import('@cio/db/queries/cohort');
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const enrollingCohortId = await createCohort(organizationId, 'scoped-enrolling');
    const otherCohortId = await createCohort(organizationId, 'scoped-other');
    const email = `scoped-cohorts-${suffix}@claims.test`;

    await db.insert(schema.cohortMember).values([
      { cohortId: enrollingCohortId, roleId: ROLE.STUDENT, email },
      { cohortId: otherCohortId, roleId: ROLE.STUDENT, email }
    ]);

    await claimEmailOnlyCohortMembersForCohorts([enrollingCohortId], [{ profileId: learnerId, email }]);

    expect((await countCohortMembers(enrollingCohortId, email))[0].profileId).toBe(learnerId);
    expect((await countCohortMembers(otherCohortId, email))[0].profileId).toBeNull();
  });

  it('treats an email-only row as an existing membership for count checks', async () => {
    const { getExistingGroupMembers } = await import('@cio/db/queries/group');
    const groupId = await createCourseGroup(organizationId, 'existing-check');
    const email = `existing-${suffix}@claims.test`;

    await insertEmailOnlyGroupMember(groupId, email);

    const existing = await getExistingGroupMembers([{ groupId, profileId: learnerId, email }]);

    expect(existing.has(`${groupId}:${learnerId}`)).toBe(true);
  });
});
