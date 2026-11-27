import { and, eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ROLE } from '@cio/utils/constants';

const shouldRun = Boolean(process.env.TEST_DATABASE_URL);

describe.skipIf(!shouldRun)('email-only claims and invited lists (database)', () => {
  const suffix = Date.now();
  const organizationIds: string[] = [];
  const groupIds: string[] = [];
  const courseIds: string[] = [];
  const cohortIds: string[] = [];
  const userIds: string[] = [];

  let adminId = '';

  async function createOrganization(label: string) {
    const { createOrganization: create } = await import('@db/queries/organization');
    const organization = await create({ name: `${label}-${suffix}` });
    organizationIds.push(organization.id);

    return organization.id;
  }

  async function createProfile(label: string) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const email = `${label}-${suffix}@lists.test`;
    const [user] = await db.insert(schema.user).values({ name: label, email, emailVerified: true }).returning();
    await db.insert(schema.profile).values({ id: user.id, fullname: label, username: `${label}-${suffix}`, email });
    userIds.push(user.id);

    return { profileId: user.id, email };
  }

  async function createCourse(orgId: string, label: string) {
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

  async function createCohort(orgId: string, label: string, cohortCourseIds: string[] = []) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const [cohort] = await db
      .insert(schema.cohort)
      .values({ organizationId: orgId, name: `${label}-${suffix}` })
      .returning({ id: schema.cohort.id });
    cohortIds.push(cohort.id);
    if (cohortCourseIds.length > 0) {
      await db
        .insert(schema.cohortCourse)
        .values(cohortCourseIds.map((courseId) => ({ cohortId: cohort.id, courseId })));
    }

    return cohort.id;
  }

  async function addOrgMember(
    orgId: string,
    values: { email: string; profileId?: string | null; roleId?: number; status?: 'ACTIVE' | 'ARCHIVED' }
  ) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const [member] = await db
      .insert(schema.organizationmember)
      .values({
        organizationId: orgId,
        email: values.email,
        profileId: values.profileId ?? null,
        roleId: values.roleId ?? ROLE.STUDENT,
        status: values.status ?? 'ACTIVE',
        verified: Boolean(values.profileId)
      })
      .returning();

    return member;
  }

  async function createOrgInvite(
    orgId: string,
    email: string,
    metadata: { courseIds?: string[]; cohortIds?: string[] },
    opts: { revoked?: boolean; expired?: boolean; roleId?: number; createdAt?: string } = {}
  ) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const expiresAt = new Date(Date.now() + (opts.expired ? -1000 : 7 * 24 * 60 * 60 * 1000)).toISOString();
    const [invite] = await db
      .insert(schema.organizationInvite)
      .values({
        organizationId: orgId,
        roleId: opts.roleId ?? ROLE.STUDENT,
        email,
        tokenHash: `lhash-${suffix}-${Math.random().toString(36).slice(2)}`,
        createdByProfileId: adminId,
        expiresAt,
        isRevoked: opts.revoked ?? false,
        metadata,
        ...(opts.createdAt ? { createdAt: opts.createdAt } : {})
      })
      .returning();

    return invite;
  }

  async function createCourseInvite(
    courseId: string,
    allowedEmails: string[] | null,
    opts: { expired?: boolean } = {}
  ) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const [invite] = await db
      .insert(schema.courseInvite)
      .values({
        courseId,
        roleId: ROLE.STUDENT,
        tokenHash: `lchash-${suffix}-${Math.random().toString(36).slice(2)}`,
        createdByProfileId: adminId,
        expiresAt: new Date(Date.now() + (opts.expired ? -1000 : 7 * 24 * 60 * 60 * 1000)).toISOString(),
        maxUses: 1,
        usedCount: 0,
        isRevoked: false,
        allowedEmails
      })
      .returning();

    return invite;
  }

  async function groupRows(groupId: string) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    return db
      .select({ profileId: schema.groupmember.profileId, roleId: schema.groupmember.roleId })
      .from(schema.groupmember)
      .where(eq(schema.groupmember.groupId, groupId));
  }

  beforeAll(async () => {
    const admin = await createProfile('ladmin');
    adminId = admin.profileId;
  });

  afterAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    if (cohortIds.length > 0) {
      await db.delete(schema.cohortCourse).where(inArray(schema.cohortCourse.cohortId, cohortIds));
      await db.delete(schema.cohortMember).where(inArray(schema.cohortMember.cohortId, cohortIds));
      await db.delete(schema.cohort).where(inArray(schema.cohort.id, cohortIds));
    }
    if (groupIds.length > 0) {
      await db.delete(schema.groupmember).where(inArray(schema.groupmember.groupId, groupIds));
      await db.delete(schema.courseInvite).where(inArray(schema.courseInvite.courseId, courseIds));
      await db.delete(schema.course).where(inArray(schema.course.groupId, groupIds));
      await db.delete(schema.group).where(inArray(schema.group.id, groupIds));
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

  describe('claimEmailOnlyMemberships', () => {
    it('enrols a claimed cohort student in the cohort courses and creates compliance records for them', async () => {
      const { claimEmailOnlyMemberships } = await import('@cio/core/services/organization/identity-binding');
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const orgId = await createOrganization('claim-cohort-student');
      const learner = await createProfile('claim-student');
      const { groupId, courseId } = await createCourse(orgId, 'claim-cohort-course');
      const cohortId = await createCohort(orgId, 'claim-cohort', [courseId]);
      await db.insert(schema.cohortMember).values({ cohortId, roleId: ROLE.STUDENT, email: learner.email });
      const complianceCalls: Array<{ courseIds: string[]; profileIds: string[] }> = [];

      const result = await db.transaction((tx) =>
        claimEmailOnlyMemberships(
          tx,
          { orgId, email: learner.email.toUpperCase(), profileId: learner.profileId },
          {
            ensureComplianceEnrollmentRecords: async (calledCourseIds, profileIds) => {
              complianceCalls.push({ courseIds: calledCourseIds, profileIds });

              return { createdRecords: [] };
            }
          }
        )
      );

      expect(result.claimed).toMatchObject({ cohorts: 1, groups: 0, cohortIds: [cohortId], courseIds: [] });
      expect(result.enrollment.enrolledMembers.map((member) => member.groupId)).toEqual([groupId]);
      expect(result.enrollment.cohortMembers).toEqual([]);
      expect(await groupRows(groupId)).toEqual([{ profileId: learner.profileId, roleId: ROLE.STUDENT }]);
      expect(complianceCalls).toEqual([{ courseIds: [courseId], profileIds: [learner.profileId] }]);

      const [cohortRow] = await db
        .select({ profileId: schema.cohortMember.profileId })
        .from(schema.cohortMember)
        .where(eq(schema.cohortMember.cohortId, cohortId));
      expect(cohortRow.profileId).toBe(learner.profileId);
    });

    it('is idempotent: a second claim finds nothing and enrols nobody', async () => {
      const { claimEmailOnlyMemberships } = await import('@cio/core/services/organization/identity-binding');
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const orgId = await createOrganization('claim-twice');
      const learner = await createProfile('claim-twice');
      const { groupId, courseId } = await createCourse(orgId, 'claim-twice-course');
      const cohortId = await createCohort(orgId, 'claim-twice-cohort', [courseId]);
      await db.insert(schema.cohortMember).values({ cohortId, roleId: ROLE.STUDENT, email: learner.email });
      const params = { orgId, email: learner.email, profileId: learner.profileId };

      await db.transaction((tx) => claimEmailOnlyMemberships(tx, params));
      const second = await db.transaction((tx) => claimEmailOnlyMemberships(tx, params));

      expect(second.claimed).toMatchObject({ groups: 0, cohorts: 0, programs: 0, cohortIds: [], courseIds: [] });
      expect(second.enrollment.enrolledMembers).toEqual([]);
      expect(await groupRows(groupId)).toHaveLength(1);
    });

    it('claims staff email-only rows but does not enrol them as students', async () => {
      const { claimEmailOnlyMemberships } = await import('@cio/core/services/organization/identity-binding');
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const orgId = await createOrganization('claim-staff');
      const tutor = await createProfile('claim-tutor');
      const { groupId: cohortGroupId, courseId: cohortCourseId } = await createCourse(
        orgId,
        'claim-staff-cohort-course'
      );
      const { groupId: staffGroupId } = await createCourse(orgId, 'claim-staff-course');
      const cohortId = await createCohort(orgId, 'claim-staff-cohort', [cohortCourseId]);
      await db.insert(schema.cohortMember).values({ cohortId, roleId: ROLE.TUTOR, email: tutor.email });
      await db.insert(schema.groupmember).values({ groupId: staffGroupId, roleId: ROLE.TUTOR, email: tutor.email });
      const complianceCalls: string[][] = [];

      const result = await db.transaction((tx) =>
        claimEmailOnlyMemberships(
          tx,
          { orgId, email: tutor.email, profileId: tutor.profileId },
          {
            ensureComplianceEnrollmentRecords: async (calledCourseIds) => {
              complianceCalls.push(calledCourseIds);

              return { createdRecords: [] };
            }
          }
        )
      );

      expect(result.claimed).toMatchObject({ groups: 1, cohorts: 1, courseIds: [], cohortIds: [] });
      expect(result.enrollment).toEqual({ enrolledMembers: [], complianceRecords: [], cohortMembers: [] });
      expect(complianceCalls).toEqual([]);
      expect(await groupRows(cohortGroupId)).toEqual([]);
      expect(await groupRows(staffGroupId)).toEqual([{ profileId: tutor.profileId, roleId: ROLE.TUTOR }]);
    });
  });

  describe('getPaginatedInvitedCourseMembers', () => {
    it('lists org invitations, course invites and legacy rows once per email, keeping expired ones and dropping dead and joined ones', async () => {
      const { getPaginatedInvitedCourseMembers } = await import('@cio/db/queries/course/people');
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const orgId = await createOrganization('invited-course');
      const { groupId, courseId } = await createCourse(orgId, 'invited-course');
      const { courseId: otherCourseId } = await createCourse(orgId, 'invited-other-course');
      const joined = await createProfile('invited-joined');

      const pendingEmail = `pending-${suffix}@lists.test`;
      await addOrgMember(orgId, { email: pendingEmail });
      const orgInvite = await createOrgInvite(orgId, pendingEmail, { courseIds: [courseId] });
      await createCourseInvite(courseId, [pendingEmail]);

      const courseInviteEmail = `course-only-${suffix}@lists.test`;
      const courseInvite = await createCourseInvite(courseId, [courseInviteEmail]);
      await createCourseInvite(courseId, [`multi-a-${suffix}@lists.test`, `multi-b-${suffix}@lists.test`]);
      await createCourseInvite(courseId, null);

      const legacyEmail = `legacy-${suffix}@lists.test`;
      const [legacyRow] = await db
        .insert(schema.groupmember)
        .values({ groupId, roleId: ROLE.STUDENT, email: legacyEmail })
        .returning();

      const otherCourseEmail = `other-course-${suffix}@lists.test`;
      await addOrgMember(orgId, { email: otherCourseEmail });
      await createOrgInvite(orgId, otherCourseEmail, { courseIds: [otherCourseId] });

      const revokedEmail = `revoked-${suffix}@lists.test`;
      await addOrgMember(orgId, { email: revokedEmail });
      await createOrgInvite(orgId, revokedEmail, { courseIds: [courseId] }, { revoked: true });

      const expiredEmail = `expired-${suffix}@lists.test`;
      await addOrgMember(orgId, { email: expiredEmail });
      const expiredInvite = await createOrgInvite(orgId, expiredEmail, { courseIds: [courseId] }, { expired: true });

      const expiredCourseInviteEmail = `expired-course-${suffix}@lists.test`;
      const expiredCourseInvite = await createCourseInvite(courseId, [expiredCourseInviteEmail], { expired: true });

      const staleEmail = `stale-${suffix}@lists.test`;
      await addOrgMember(orgId, { email: staleEmail });
      await createOrgInvite(
        orgId,
        staleEmail,
        { courseIds: [courseId] },
        { expired: true, createdAt: new Date(Date.now() - 60_000).toISOString() }
      );
      await createOrgInvite(orgId, staleEmail, { courseIds: [otherCourseId] });

      await addOrgMember(orgId, { email: joined.email, profileId: joined.profileId });
      await createOrgInvite(orgId, joined.email, { courseIds: [courseId] });
      await db.insert(schema.groupmember).values({ groupId, roleId: ROLE.STUDENT, profileId: joined.profileId });
      await createCourseInvite(courseId, [joined.email]);

      const result = await getPaginatedInvitedCourseMembers(courseId, { page: 1, limit: 20 });
      const byEmail = new Map(result.items.map((item) => [item.email?.toLowerCase(), item]));

      expect(result.total).toBe(5);
      expect([...byEmail.keys()].sort()).toEqual(
        [courseInviteEmail, expiredCourseInviteEmail, expiredEmail, legacyEmail, pendingEmail].sort()
      );
      expect(byEmail.get(expiredEmail)).toMatchObject({ kind: 'org_invite', orgInviteId: expiredInvite.id });
      expect(byEmail.get(expiredCourseInviteEmail)).toMatchObject({
        kind: 'course_invite',
        courseInviteId: expiredCourseInvite.id
      });
      expect(byEmail.get(pendingEmail)).toMatchObject({
        kind: 'org_invite',
        orgInviteId: orgInvite.id,
        courseInviteId: null,
        courseIds: [courseId]
      });
      expect(byEmail.get(courseInviteEmail)).toMatchObject({ kind: 'course_invite', courseInviteId: courseInvite.id });
      expect(byEmail.get(legacyEmail)).toMatchObject({ kind: 'email_only_member', groupMemberId: legacyRow.id });
    });

    it('filters by search and pages the result', async () => {
      const { getPaginatedInvitedCourseMembers } = await import('@cio/db/queries/course/people');
      const orgId = await createOrganization('invited-course-page');
      const { courseId } = await createCourse(orgId, 'invited-course-page');
      for (const label of ['alpha', 'beta', 'gamma']) {
        await createCourseInvite(courseId, [`${label}-${suffix}@lists.test`]);
      }

      const firstPage = await getPaginatedInvitedCourseMembers(courseId, { page: 1, limit: 2 });
      const secondPage = await getPaginatedInvitedCourseMembers(courseId, { page: 2, limit: 2 });
      const searched = await getPaginatedInvitedCourseMembers(courseId, { page: 1, limit: 20, search: 'BETA' });

      expect(firstPage).toMatchObject({ total: 3, totalPages: 2 });
      expect(firstPage.items).toHaveLength(2);
      expect(secondPage.items).toHaveLength(1);
      expect(searched.total).toBe(1);
      expect(searched.items.map((item) => item.email)).toEqual([`beta-${suffix}@lists.test`]);

      const fromOffset = await getPaginatedInvitedCourseMembers(courseId, { page: 1, limit: 5, offset: 2 });
      const countOnly = await getPaginatedInvitedCourseMembers(courseId, { page: 1, limit: 0, offset: 0 });
      const tutorsOnly = await getPaginatedInvitedCourseMembers(courseId, { page: 1, limit: 20, roleId: ROLE.TUTOR });

      expect(fromOffset.items).toHaveLength(1);
      expect(countOnly).toMatchObject({ total: 3, items: [] });
      expect(tutorsOnly.total).toBe(0);
    });
  });

  describe('getPaginatedInvitedCohortPeople', () => {
    it('lists pending members whose invite carries the cohort and legacy rows, once per email', async () => {
      const { getPaginatedInvitedCohortPeople } = await import('@cio/db/queries/cohort');
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const orgId = await createOrganization('invited-cohort');
      const cohortId = await createCohort(orgId, 'invited-cohort');
      const otherCohortId = await createCohort(orgId, 'invited-other-cohort');
      const joined = await createProfile('invited-cohort-joined');

      const pendingEmail = `cpending-${suffix}@lists.test`;
      await addOrgMember(orgId, { email: pendingEmail });
      const orgInvite = await createOrgInvite(orgId, pendingEmail, { cohortIds: [cohortId] });
      await db.insert(schema.cohortMember).values({ cohortId, roleId: ROLE.STUDENT, email: pendingEmail });

      const legacyEmail = `clegacy-${suffix}@lists.test`;
      const [legacyRow] = await db
        .insert(schema.cohortMember)
        .values({ cohortId, roleId: ROLE.STUDENT, email: legacyEmail })
        .returning();

      const otherEmail = `cother-${suffix}@lists.test`;
      await addOrgMember(orgId, { email: otherEmail });
      await createOrgInvite(orgId, otherEmail, { cohortIds: [otherCohortId] });

      const revokedEmail = `crevoked-${suffix}@lists.test`;
      await addOrgMember(orgId, { email: revokedEmail });
      await createOrgInvite(orgId, revokedEmail, { cohortIds: [cohortId] }, { revoked: true });

      const expiredEmail = `cexpired-${suffix}@lists.test`;
      await addOrgMember(orgId, { email: expiredEmail });
      const expiredInvite = await createOrgInvite(orgId, expiredEmail, { cohortIds: [cohortId] }, { expired: true });

      const staleEmail = `cstale-${suffix}@lists.test`;
      await addOrgMember(orgId, { email: staleEmail });
      await createOrgInvite(
        orgId,
        staleEmail,
        { cohortIds: [cohortId] },
        { expired: true, createdAt: new Date(Date.now() - 60_000).toISOString() }
      );
      await createOrgInvite(orgId, staleEmail, { cohortIds: [otherCohortId] });

      const staffInviteEmail = `cstaff-${suffix}@lists.test`;
      await addOrgMember(orgId, { email: staffInviteEmail, roleId: ROLE.TUTOR });
      await createOrgInvite(orgId, staffInviteEmail, { cohortIds: [cohortId] }, { roleId: ROLE.TUTOR });

      await addOrgMember(orgId, { email: joined.email, profileId: joined.profileId });
      await createOrgInvite(orgId, joined.email, { cohortIds: [cohortId] });
      await db.insert(schema.cohortMember).values({ cohortId, roleId: ROLE.STUDENT, profileId: joined.profileId });

      const result = await getPaginatedInvitedCohortPeople(cohortId, { page: 1, limit: 20 });
      const byEmail = new Map(result.items.map((item) => [item.email?.toLowerCase(), item]));

      expect(result.total).toBe(3);
      expect([...byEmail.keys()].sort()).toEqual([expiredEmail, legacyEmail, pendingEmail].sort());
      expect(byEmail.get(expiredEmail)).toMatchObject({ kind: 'org_invite', orgInviteId: expiredInvite.id });
      expect(byEmail.get(pendingEmail)).toMatchObject({
        kind: 'org_invite',
        orgInviteId: orgInvite.id,
        cohortMemberId: null,
        cohortIds: [cohortId]
      });
      expect(byEmail.get(legacyEmail)).toMatchObject({ kind: 'email_only_member', cohortMemberId: legacyRow.id });

      const searched = await getPaginatedInvitedCohortPeople(cohortId, { page: 1, limit: 20, search: 'clegacy' });
      expect(searched).toMatchObject({ total: 1 });
      expect(searched.items.map((item) => item.email)).toEqual([legacyEmail]);

      const paged = await getPaginatedInvitedCohortPeople(cohortId, { page: 2, limit: 1 });
      expect(paged.total).toBe(3);
      expect(paged.items).toHaveLength(1);
    });
  });

  describe('listEmailOnlyClaimCandidates and countEmailOnlyMemberships', () => {
    it('lists active joined members with claimable rows in their own organization and counts pending rows', async () => {
      const { listEmailOnlyClaimCandidates, countEmailOnlyMemberships } = await import('@cio/db/queries/organization');
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const orgId = await createOrganization('candidates');
      const otherOrgId = await createOrganization('candidates-other');
      const { groupId } = await createCourse(orgId, 'candidates-course');
      const cohortId = await createCohort(orgId, 'candidates-cohort');
      const { groupId: otherGroupId } = await createCourse(otherOrgId, 'candidates-other-course');

      const first = await createProfile('cand-first');
      const second = await createProfile('cand-second');
      const archived = await createProfile('cand-archived');
      const noRows = await createProfile('cand-norows');
      const elsewhere = await createProfile('cand-elsewhere');
      const pendingEmail = `cand-pending-${suffix}@lists.test`;

      const firstMember = await addOrgMember(orgId, { email: first.email.toUpperCase(), profileId: first.profileId });
      const secondMember = await addOrgMember(orgId, { email: second.email, profileId: second.profileId });
      await addOrgMember(orgId, { email: archived.email, profileId: archived.profileId, status: 'ARCHIVED' });
      await addOrgMember(orgId, { email: noRows.email, profileId: noRows.profileId });
      await addOrgMember(orgId, { email: elsewhere.email, profileId: elsewhere.profileId });
      await addOrgMember(orgId, { email: pendingEmail });

      await db.insert(schema.groupmember).values([
        { groupId, roleId: ROLE.STUDENT, email: first.email },
        { groupId, roleId: ROLE.STUDENT, email: archived.email },
        { groupId, roleId: ROLE.STUDENT, email: pendingEmail },
        { groupId: otherGroupId, roleId: ROLE.STUDENT, email: elsewhere.email }
      ]);
      await db.insert(schema.cohortMember).values([
        { cohortId, roleId: ROLE.STUDENT, email: second.email.toUpperCase() },
        { cohortId, roleId: ROLE.STUDENT, email: pendingEmail }
      ]);

      const candidates = await listEmailOnlyClaimCandidates({ orgId, after: null, limit: 10 });

      expect(candidates).toEqual([
        { organizationId: orgId, memberId: firstMember.id, profileId: first.profileId, email: first.email },
        { organizationId: orgId, memberId: secondMember.id, profileId: second.profileId, email: second.email }
      ]);

      const firstPage = await listEmailOnlyClaimCandidates({ orgId, after: null, limit: 1 });
      const nextPage = await listEmailOnlyClaimCandidates({
        orgId,
        after: { organizationId: orgId, memberId: firstPage[0].memberId },
        limit: 1
      });
      expect(firstPage.map((row) => row.memberId)).toEqual([firstMember.id]);
      expect(nextPage.map((row) => row.memberId)).toEqual([secondMember.id]);

      const counts = await countEmailOnlyMemberships(orgId);
      expect(counts).toEqual({
        claimable: { groups: 1, cohorts: 1, programs: 0 },
        pending: { groups: 2, cohorts: 1, programs: 0 }
      });

      const otherCounts = await countEmailOnlyMemberships(otherOrgId);
      expect(otherCounts).toEqual({
        claimable: { groups: 0, cohorts: 0, programs: 0 },
        pending: { groups: 1, cohorts: 0, programs: 0 }
      });

      const { claimEmailOnlyMemberships } = await import('@cio/core/services/organization/identity-binding');
      for (const candidate of candidates) {
        await db.transaction((tx) =>
          claimEmailOnlyMemberships(tx, {
            orgId: candidate.organizationId,
            email: candidate.email,
            profileId: candidate.profileId
          })
        );
      }

      expect(await listEmailOnlyClaimCandidates({ orgId, after: null, limit: 10 })).toEqual([]);
      expect((await countEmailOnlyMemberships(orgId)).claimable).toEqual({ groups: 0, cohorts: 0, programs: 0 });

      const [claimedRow] = await db
        .select({ profileId: schema.groupmember.profileId })
        .from(schema.groupmember)
        .where(and(eq(schema.groupmember.groupId, groupId), eq(schema.groupmember.profileId, first.profileId)));
      expect(claimedRow).toBeDefined();
    });
  });
});
