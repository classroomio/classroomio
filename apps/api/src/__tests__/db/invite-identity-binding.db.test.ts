import { eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ROLE } from '@cio/utils/constants';

const shouldRun = Boolean(process.env.TEST_DATABASE_URL);

describe.skipIf(!shouldRun)('invite primitives and identity binding (database)', () => {
  const suffix = Date.now();
  const organizationIds: string[] = [];
  const groupIds: string[] = [];
  const courseIds: string[] = [];
  const cohortIds: string[] = [];
  const profileIds: string[] = [];
  const userIds: string[] = [];

  let organizationId = '';
  let otherOrganizationId = '';
  let learnerId = '';
  let otherLearnerId = '';
  let adminId = '';

  async function createProfile(label: string) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const email = `${label}-${suffix}@bind.test`;
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
      .values({ title: label, description: label, groupId: group.id, isPublished: true, slug: `${label}-${suffix}` })
      .returning({ id: schema.course.id });
    groupIds.push(group.id);
    courseIds.push(course.id);
    return { groupId: group.id, courseId: course.id };
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

  function futureExpiry() {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  }

  async function createOrgInvite(
    orgId: string,
    email: string,
    opts: { roleId?: number; courseIds?: string[]; revoked?: boolean; expired?: boolean; accepted?: boolean } = {}
  ) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const [invite] = await db
      .insert(schema.organizationInvite)
      .values({
        organizationId: orgId,
        roleId: opts.roleId ?? ROLE.STUDENT,
        email,
        tokenHash: `hash-${suffix}-${Math.random().toString(36).slice(2)}`,
        createdByProfileId: adminId,
        expiresAt: opts.expired ? new Date(Date.now() - 1000).toISOString() : futureExpiry(),
        isRevoked: opts.revoked ?? false,
        acceptedAt: opts.accepted ? new Date().toISOString() : null,
        metadata: { courseIds: opts.courseIds ?? [] }
      })
      .returning();
    return invite;
  }

  async function createCourseInvite(
    courseId: string,
    email: string | string[] | null,
    opts: { expired?: boolean; usedUp?: boolean; otherOrg?: boolean } = {}
  ) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const [invite] = await db
      .insert(schema.courseInvite)
      .values({
        courseId,
        roleId: ROLE.STUDENT,
        tokenHash: `chash-${suffix}-${Math.random().toString(36).slice(2)}`,
        createdByProfileId: adminId,
        expiresAt: opts.expired ? new Date(Date.now() - 1000).toISOString() : futureExpiry(),
        maxUses: 1,
        usedCount: opts.usedUp ? 1 : 0,
        isRevoked: false,
        allowedEmails: email === null ? null : Array.isArray(email) ? email : [email]
      })
      .returning();
    return invite;
  }

  beforeAll(async () => {
    const { createOrganization } = await import('@db/queries/organization');
    const organization = await createOrganization({ name: `bind-${suffix}` });
    const otherOrganization = await createOrganization({ name: `bind-other-${suffix}` });
    organizationId = organization.id;
    otherOrganizationId = otherOrganization.id;
    organizationIds.push(organizationId, otherOrganizationId);
    learnerId = await createProfile('blearner');
    otherLearnerId = await createProfile('bother');
    adminId = await createProfile('badmin');
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
      const inviteIds = await db
        .select({ id: schema.organizationInvite.id })
        .from(schema.organizationInvite)
        .where(inArray(schema.organizationInvite.organizationId, organizationIds));
      if (inviteIds.length > 0) {
        await db.delete(schema.organizationInviteAudit).where(
          inArray(
            schema.organizationInviteAudit.inviteId,
            inviteIds.map((r) => r.id)
          )
        );
      }
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

  it('lists only live student org invites for the email', async () => {
    const { listLiveStudentOrgInvitesForEmail } = await import('@cio/db/queries/organization');
    const email = `live-${suffix}@bind.test`;
    const live = await createOrgInvite(organizationId, email);
    await createOrgInvite(organizationId, email, { revoked: true });
    await createOrgInvite(organizationId, email, { expired: true });
    await createOrgInvite(organizationId, email, { accepted: true });
    await createOrgInvite(organizationId, email, { roleId: ROLE.TUTOR });

    const listed = await listLiveStudentOrgInvitesForEmail(organizationId, email);
    expect(listed.map((i) => i.id)).toEqual([live.id]);
  });

  it('lists only exact-email live course invites in the org', async () => {
    const { listLiveEmailBoundCourseInvitesInOrg } = await import('@cio/db/queries/course/invite');
    const { courseId } = await createCourseGroup(organizationId, 'invite-list');
    const email = `clist-${suffix}@bind.test`;
    const live = await createCourseInvite(courseId, email);
    await createCourseInvite(courseId, [email, `other-${suffix}@bind.test`]);
    await createCourseInvite(courseId, null);
    await createCourseInvite(courseId, email, { expired: true });
    await createCourseInvite(courseId, email, { usedUp: true });

    const listed = await listLiveEmailBoundCourseInvitesInOrg(organizationId, email);
    const ours = listed.filter((i) => i.courseId === courseId);
    expect(ours.map((i) => i.id)).toEqual([live.id]);
  });

  it('consumes one course-invite use and refuses a stale second consume', async () => {
    const { fulfillCourseInvite } = await import('@cio/db/queries/course/invite');
    const { db } = await import('@db/drizzle');
    const { courseId } = await createCourseGroup(organizationId, 'invite-consume');
    const email = `consume-${suffix}@bind.test`;
    const invite = await createCourseInvite(courseId, email);

    const first = await fulfillCourseInvite(invite.id, 0, db);
    const second = await fulfillCourseInvite(invite.id, 0, db);

    expect(first?.id).toBe(invite.id);
    expect(second).toBeUndefined();
  });

  it('retires every single-recipient invite for the email and course, marking the organization invite that replaced it', async () => {
    const { listLiveEmailBoundCourseInvitesInOrg, revokeLiveEmailBoundCourseInvitesForCourse } = await import(
      '@cio/db/queries/course/invite'
    );
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { courseId } = await createCourseGroup(organizationId, 'invite-supersede');
    const { courseId: otherCourseId } = await createCourseGroup(organizationId, 'invite-supersede-other');
    const email = `supersede-${suffix}@bind.test`;

    const first = await createCourseInvite(courseId, email);
    const second = await createCourseInvite(courseId, email.toUpperCase());
    const multi = await createCourseInvite(courseId, [email, `other-${suffix}@bind.test`]);
    const link = await createCourseInvite(courseId, null);
    const otherCourse = await createCourseInvite(otherCourseId, email);
    const replacement = await createOrgInvite(organizationId, email, { courseIds: [courseId] });

    const revoked = await db.transaction(async (tx) =>
      revokeLiveEmailBoundCourseInvitesForCourse(courseId, ` ${email} `, adminId, replacement.id, tx)
    );

    expect(revoked.map((row) => row.id).sort()).toEqual([first.id, second.id].sort());
    for (const row of revoked) {
      expect(row.metadata).toMatchObject({ supersededBy: replacement.id });
      expect(row.revokedByProfileId).toBe(adminId);
    }

    const remaining = await listLiveEmailBoundCourseInvitesInOrg(organizationId, email);
    expect(remaining.map((row) => row.id)).toEqual([otherCourse.id]);

    const untouched = await db
      .select({ id: schema.courseInvite.id, isRevoked: schema.courseInvite.isRevoked })
      .from(schema.courseInvite)
      .where(inArray(schema.courseInvite.id, [multi.id, link.id]));
    expect(untouched.every((row) => row.isRevoked === false)).toBe(true);
  });

  it('supersede merges course ids into one live invite and revokes the old', async () => {
    const { supersedeStudentOrgInvites } = await import('@cio/core/services/organization/supersede-invites');
    const { db } = await import('@db/drizzle');
    const { courseId: firstCourseId } = await createCourseGroup(organizationId, 'sup-first');
    const { courseId: secondCourseId } = await createCourseGroup(organizationId, 'sup-second');
    const email = `sup-${suffix}@bind.test`;

    await createOrgInvite(organizationId, email, { courseIds: [firstCourseId] });
    const result = await db.transaction(async (tx) =>
      supersedeStudentOrgInvites(tx, {
        orgId: organizationId,
        emails: [email],
        courseIds: [secondCourseId],
        invitedByProfileId: adminId,
        source: 'AUDIENCE_IMPORT'
      })
    );

    expect(result.created).toHaveLength(1);
    expect(result.revoked).toHaveLength(1);
    const metadata = result.created[0].metadata as { courseIds?: string[] };
    expect([...(metadata.courseIds ?? [])].sort()).toEqual([firstCourseId, secondCourseId].sort());

    const { listLiveStudentOrgInvitesForEmail } = await import('@cio/db/queries/organization');
    const live = await listLiveStudentOrgInvitesForEmail(organizationId, email);
    expect(live).toHaveLength(1);
    expect(live[0].id).toBe(result.created[0].id);
  });

  it('supersede skips staff emails', async () => {
    const { supersedeStudentOrgInvites } = await import('@cio/core/services/organization/supersede-invites');
    const { db } = await import('@db/drizzle');
    const { courseId } = await createCourseGroup(organizationId, 'sup-staff');
    const staffEmail = `supstaff-${suffix}@bind.test`;
    await createOrgInvite(organizationId, staffEmail, { roleId: ROLE.TUTOR });

    const result = await db.transaction(async (tx) =>
      supersedeStudentOrgInvites(tx, {
        orgId: organizationId,
        emails: [staffEmail],
        courseIds: [courseId],
        invitedByProfileId: adminId
      })
    );

    expect(result.skippedStaff).toEqual([staffEmail]);
    expect(result.created).toHaveLength(0);
  });

  it('binding claims email-only rows and fulfils the org invite courses', async () => {
    const { bindProfileToOrgEmail } = await import('@cio/core/services/organization/identity-binding');
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { courseId, groupId } = await createCourseGroup(organizationId, 'bind-fulfil');
    const email = `fulfil-${suffix}@bind.test`;

    await db.insert(schema.groupmember).values({ groupId, roleId: ROLE.STUDENT, email });
    const invite = await createOrgInvite(organizationId, email, { courseIds: [courseId] });

    const result = await db.transaction(async (tx) =>
      bindProfileToOrgEmail(tx, {
        orgId: organizationId,
        profileId: learnerId,
        email,
        trigger: 'org-invite',
        identityProven: true,
        skipInviteIds: []
      })
    );

    expect(result.fulfilled.orgInvites.map((row) => row.inviteId)).toContain(invite.id);
    expect(result.fulfilled.courseIds).toContain(courseId);
    expect(result.claimed.groups).toBeGreaterThanOrEqual(1);

    const members = await db.select().from(schema.groupmember).where(eq(schema.groupmember.groupId, groupId));
    expect(members).toHaveLength(1);
    expect(members[0].profileId).toBe(learnerId);
  });

  it('binding does not fulfil when identity is not proven', async () => {
    const { bindProfileToOrgEmail } = await import('@cio/core/services/organization/identity-binding');
    const { db } = await import('@db/drizzle');
    const { courseId } = await createCourseGroup(organizationId, 'bind-unproven');
    const email = `unproven-${suffix}@bind.test`;
    const invite = await createOrgInvite(organizationId, email, { courseIds: [courseId] });

    const result = await db.transaction(async (tx) =>
      bindProfileToOrgEmail(tx, {
        orgId: organizationId,
        profileId: otherLearnerId,
        email,
        trigger: 'invite-link',
        identityProven: false
      })
    );

    expect(result.fulfilled.orgInvites).toHaveLength(0);
    const { listLiveStudentOrgInvitesForEmail } = await import('@cio/db/queries/organization');
    const stillLive = await listLiveStudentOrgInvitesForEmail(organizationId, email);
    expect(stillLive.map((i) => i.id)).toContain(invite.id);
  });

  it('binding never fulfils staff invites and never changes a staff role', async () => {
    const { bindProfileToOrgEmail } = await import('@cio/core/services/organization/identity-binding');
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const staffProfileId = await createProfile('bstaffmember');
    const email = `bstaff-${suffix}@bind.test`;
    await db.insert(schema.organizationmember).values({
      organizationId,
      email,
      profileId: staffProfileId,
      roleId: ROLE.TUTOR,
      verified: true
    });
    const staffInvite = await createOrgInvite(organizationId, email, { roleId: ROLE.TUTOR });

    const result = await db.transaction(async (tx) =>
      bindProfileToOrgEmail(tx, {
        orgId: organizationId,
        profileId: staffProfileId,
        email,
        trigger: 'org-invite',
        identityProven: true
      })
    );

    expect(result.fulfilled.orgInvites).toHaveLength(0);
    expect(Number(result.member.roleId)).toBe(ROLE.TUTOR);
    const { listLiveStudentOrgInvitesForEmail } = await import('@cio/db/queries/organization');
    void staffInvite;
    const studentLive = await listLiveStudentOrgInvitesForEmail(organizationId, email);
    expect(studentLive).toHaveLength(0);
  });

  it('fulfils other same-org invitations together while skipping the trigger', async () => {
    const { bindProfileToOrgEmail } = await import('@cio/core/services/organization/identity-binding');
    const { db } = await import('@db/drizzle');
    const { courseId: triggerCourseId } = await createCourseGroup(organizationId, 'bind-trigger');
    const { courseId: otherCourseId } = await createCourseGroup(organizationId, 'bind-other');
    const email = `multi-${suffix}@bind.test`;

    const trigger = await createOrgInvite(organizationId, email, { courseIds: [triggerCourseId] });
    const otherInvite = await createOrgInvite(organizationId, email, { courseIds: [otherCourseId] });
    const { courseId: linkedCourseId } = await createCourseGroup(organizationId, 'bind-linked');
    await createCourseInvite(linkedCourseId, email);

    const result = await db.transaction(async (tx) =>
      bindProfileToOrgEmail(tx, {
        orgId: organizationId,
        profileId: learnerId,
        email,
        trigger: 'org-invite',
        identityProven: true,
        skipInviteIds: [trigger.id]
      })
    );

    expect(result.fulfilled.orgInvites.map((row) => row.inviteId)).toEqual([otherInvite.id]);
    expect(result.fulfilled.courseIds).toEqual(expect.arrayContaining([otherCourseId, linkedCourseId]));
    expect(result.fulfilled.courseIds).not.toContain(triggerCourseId);

    const { listLiveStudentOrgInvitesForEmail } = await import('@cio/db/queries/organization');
    const stillLive = await listLiveStudentOrgInvitesForEmail(organizationId, email);
    expect(stillLive.map((row) => row.id)).toEqual([trigger.id]);
  });

  it('binding refuses an email linked to another profile', async () => {
    const { bindProfileToOrgEmail } = await import('@cio/core/services/organization/identity-binding');
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const holderProfileId = await createProfile('btakenholder');
    const intruderProfileId = await createProfile('btakenintruder');
    const email = `taken-${suffix}@bind.test`;
    await db.insert(schema.organizationmember).values({
      organizationId,
      email,
      profileId: holderProfileId,
      roleId: ROLE.STUDENT,
      verified: true
    });

    await expect(
      db.transaction(async (tx) =>
        bindProfileToOrgEmail(tx, {
          orgId: organizationId,
          profileId: intruderProfileId,
          email,
          trigger: 'sso',
          identityProven: true
        })
      )
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('binding never touches another organization', async () => {
    const { bindProfileToOrgEmail } = await import('@cio/core/services/organization/identity-binding');
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { groupId } = await createCourseGroup(organizationId, 'bind-scoped');
    const otherGroup = await createCourseGroup(otherOrganizationId, 'bind-scoped-other');
    const email = `scoped-${suffix}@bind.test`;
    await db.insert(schema.groupmember).values({ groupId, roleId: ROLE.STUDENT, email });
    await db.insert(schema.groupmember).values({ groupId: otherGroup.groupId, roleId: ROLE.STUDENT, email });
    await createOrgInvite(organizationId, email);
    await createOrgInvite(otherOrganizationId, email);

    const result = await db.transaction(async (tx) =>
      bindProfileToOrgEmail(tx, {
        orgId: organizationId,
        profileId: learnerId,
        email,
        trigger: 'sso',
        identityProven: true
      })
    );

    expect(result.fulfilled.orgInvites).toHaveLength(1);
    const otherRows = await db
      .select({ profileId: schema.groupmember.profileId })
      .from(schema.groupmember)
      .where(eq(schema.groupmember.groupId, otherGroup.groupId));
    expect(otherRows).toEqual([{ profileId: null }]);
    const { listLiveStudentOrgInvitesForEmail } = await import('@cio/db/queries/organization');
    expect(await listLiveStudentOrgInvitesForEmail(otherOrganizationId, email)).toHaveLength(1);
  });
});
