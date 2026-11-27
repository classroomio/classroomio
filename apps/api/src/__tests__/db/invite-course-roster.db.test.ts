import { eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ROLE } from '@cio/utils/constants';

const shouldRun = Boolean(process.env.TEST_DATABASE_URL);

describe.skipIf(!shouldRun)('invited course roster (database)', () => {
  const suffix = Date.now();
  const organizationIds: string[] = [];
  const groupIds: string[] = [];
  const courseIds: string[] = [];
  const cohortIds: string[] = [];
  const userIds: string[] = [];

  let organizationId = '';
  let courseId = '';
  let otherCourseId = '';

  async function createProfile(label: string) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const email = `${label}-${suffix}@roster.test`;
    const [user] = await db.insert(schema.user).values({ name: label, email, emailVerified: true }).returning();
    await db.insert(schema.profile).values({ id: user.id, fullname: label, username: `${label}-${suffix}`, email });
    userIds.push(user.id);
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
      .values({ title: label, description: label, groupId: group.id, isPublished: true, slug: `${label}-${suffix}` })
      .returning({ id: schema.course.id });
    groupIds.push(group.id);
    courseIds.push(course.id);
    return { groupId: group.id, courseId: course.id };
  }

  function futureExpiry() {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
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
    const organization = await createOrganization({ name: `roster-${suffix}` });
    organizationId = organization.id;
    organizationIds.push(organizationId);
    await createProfile('roster-joined');
    const course = await createCourseGroup(organizationId, 'roster-course');
    courseId = course.courseId;
    const other = await createCourseGroup(organizationId, 'roster-other');
    otherCourseId = other.courseId;
  });

  afterAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    if (groupIds.length > 0) {
      await db.delete(schema.groupmember).where(inArray(schema.groupmember.groupId, groupIds));
      await db.delete(schema.courseInvite).where(inArray(schema.courseInvite.courseId, courseIds));
      await db.delete(schema.course).where(inArray(schema.course.groupId, groupIds));
      await db.delete(schema.group).where(inArray(schema.group.id, groupIds));
    }
    if (cohortIds.length > 0) {
      await db.delete(schema.cohortMember).where(inArray(schema.cohortMember.cohortId, cohortIds));
      await db.delete(schema.cohort).where(inArray(schema.cohort.id, cohortIds));
    }
    if (organizationIds.length > 0) {
      await db
        .delete(schema.organizationInvite)
        .where(inArray(schema.organizationInvite.organizationId, organizationIds));
      await db
        .delete(schema.organizationmember)
        .where(inArray(schema.organizationmember.organizationId, organizationIds));
      await db.delete(schema.organization).where(inArray(schema.organization.id, organizationIds));
    }
    if (userIds.length > 0) {
      await db.delete(schema.profile).where(inArray(schema.profile.id, userIds));
      await db.delete(schema.user).where(inArray(schema.user.id, userIds));
    }
  });

  async function orgMember(email: string, profileId: string | null) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const [row] = await db
      .insert(schema.organizationmember)
      .values({ organizationId, roleId: ROLE.STUDENT, email, profileId, verified: false })
      .returning({ id: schema.organizationmember.id });
    return row.id;
  }

  async function orgInvite(email: string, courseIds: string[], extra: Record<string, unknown> = {}) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const [invite] = await db
      .insert(schema.organizationInvite)
      .values({
        organizationId,
        roleId: ROLE.STUDENT,
        email,
        tokenHash: `hash-${email}-${Math.random()}`,
        createdByProfileId: userIds[0],
        expiresAt: futureExpiry(),
        isRevoked: false,
        metadata: { courseIds, ...extra }
      })
      .returning({ id: schema.organizationInvite.id });
    return invite.id;
  }

  async function courseInvite(courseId: string, email: string | string[] | null, extra: Record<string, unknown> = {}) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const [invite] = await db
      .insert(schema.courseInvite)
      .values({
        courseId,
        roleId: ROLE.STUDENT,
        tokenHash: `chash-${suffix}-${Math.random()}`,
        createdByProfileId: userIds[0],
        expiresAt: futureExpiry(),
        maxUses: 1,
        usedCount: 0,
        isRevoked: false,
        allowedEmails: email === null ? null : Array.isArray(email) ? email : [email],
        ...extra
      })
      .returning({ id: schema.courseInvite.id });
    return invite.id;
  }

  async function emailOnlyGroupMember(groupId: string, email: string) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const [row] = await db.insert(schema.groupmember).values({ groupId, roleId: ROLE.STUDENT, email }).returning();
    return row;
  }

  async function listInvited(search?: string) {
    const { getPaginatedInvitedCourseMembers } = await import('@cio/db/queries/course/people');
    return getPaginatedInvitedCourseMembers(courseId, { page: 1, limit: 50, search });
  }

  it('unions org invites, course invites and legacy email-only rows', async () => {
    const emailA = `union-a-${suffix}@roster.test`;
    const emailB = `union-b-${suffix}@roster.test`;
    const emailC = `union-c-${suffix}@roster.test`;
    await orgMember(emailA, null);
    await orgInvite(emailA, [courseId]);
    await courseInvite(courseId, emailB);

    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const [courseGroup] = await db
      .select({ groupId: schema.course.groupId })
      .from(schema.course)
      .where(eq(schema.course.id, courseId))
      .limit(1);
    await emailOnlyGroupMember(courseGroup.groupId as string, emailC);

    const result = await listInvited();

    const byEmail = new Map(result.items.map((row) => [row.email, row]));
    expect(byEmail.get(emailA)?.kind).toBe('org_invite');
    expect(byEmail.get(emailA)?.courseIds).toContain(courseId);
    expect(byEmail.get(emailB)?.kind).toBe('course_invite');
    expect(byEmail.get(emailC)?.kind).toBe('email_only_member');
  });

  it('dedupes one email to a single row preferring the org invite', async () => {
    const email = `dedupe-${suffix}@roster.test`;
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const [courseGroup] = await db
      .select({ groupId: schema.course.groupId })
      .from(schema.course)
      .where(eq(schema.course.id, courseId))
      .limit(1);
    await orgMember(email, null);
    await orgInvite(email, [courseId]);
    await courseInvite(courseId, email);
    await emailOnlyGroupMember(courseGroup.groupId as string, email);

    const result = await listInvited(email);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].kind).toBe('org_invite');
    expect(result.items[0].orgInviteId).toBeTruthy();
    expect(result.total).toBe(1);
  });

  it('excludes dead, foreign and already-joined rows but keeps expired invites so they can be resent', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const joinedProfileId = await createProfile('roster-member');
    const { groupId } = await createCourseGroup(organizationId, 'roster-exclude-group');

    await db.insert(schema.groupmember).values({ groupId, roleId: ROLE.STUDENT, profileId: joinedProfileId });
    await courseInvite(courseId, `revoked-${suffix}@roster.test`, { isRevoked: true });
    await courseInvite(courseId, `expired-${suffix}@roster.test`, {
      expiresAt: new Date(Date.now() - 1000).toISOString()
    });
    await courseInvite(courseId, `used-${suffix}@roster.test`, { usedCount: 1 });
    await courseInvite(courseId, [`multi-${suffix}@roster.test`, `multi2-${suffix}@roster.test`]);
    await courseInvite(otherCourseId, `othercourse-${suffix}@roster.test`);

    const result = await listInvited();

    const emails = result.items.map((row) => row.email);
    for (const excluded of ['revoked', 'used', 'multi@', 'othercourse@']) {
      expect(emails.some((email) => email?.includes(excluded))).toBe(false);
    }
    expect(emails).toContain(`expired-${suffix}@roster.test`);
    expect(emails).not.toContain(`roster-member-${suffix}@roster.test`);
  });

  it('paginates and searches by email', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const [courseGroup] = await db
      .select({ groupId: schema.course.groupId })
      .from(schema.course)
      .where(eq(schema.course.id, courseId))
      .limit(1);
    const groupId = courseGroup.groupId as string;

    for (const label of ['page-a', 'page-b', 'page-c']) {
      await emailOnlyGroupMember(groupId, `${label}-${suffix}@roster.test`);
    }

    const { getPaginatedInvitedCourseMembers } = await import('@cio/db/queries/course/people');

    const page1 = await getPaginatedInvitedCourseMembers(courseId, { page: 1, limit: 2 });
    const page2 = await getPaginatedInvitedCourseMembers(courseId, { page: 2, limit: 2 });
    expect(page1.items).toHaveLength(2);
    expect(page1.total).toBeGreaterThanOrEqual(3);
    expect(page1.totalPages).toBe(Math.ceil(page1.total / 2));
    expect(page2.items.map((row) => row.email)).not.toEqual(page1.items.map((row) => row.email));

    const searched = await getPaginatedInvitedCourseMembers(courseId, { page: 1, limit: 50, search: 'page-b' });
    expect(searched.items.every((row) => (row.email ?? '').toLowerCase().includes('page-b'))).toBe(true);
  });
});
