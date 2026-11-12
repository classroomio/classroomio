import 'dotenv/config';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ROLE } from '@cio/utils/constants';
import { PLAN, getStudentLimit } from '@cio/utils/plans';

const failInviteInsert = vi.hoisted(() => ({ enabled: false }));

vi.mock('@cio/db/queries/organization', async (importOriginal) => {
  const original = await importOriginal<typeof import('@cio/db/queries/organization')>();

  return {
    ...original,
    createOrganizationInvites: async (...args: Parameters<typeof original.createOrganizationInvites>) => {
      if (failInviteInsert.enabled) throw new Error('invite insert failed');

      return original.createOrganizationInvites(...args);
    }
  };
});

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);
const selfHosted = process.env.PUBLIC_IS_SELFHOSTED === 'true';

describe.skipIf(!hasDatabase || selfHosted)('audience import transaction against the database', () => {
  const suffix = `${Date.now()}`;
  const emailDomain = `import-tx-${suffix}.test`;
  const studentLimit = getStudentLimit(PLAN.BASIC);
  let organizationId = '';
  let courseId = '';
  let groupId = '';
  let adminId = '';

  async function load() {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const drizzle = await import('drizzle-orm');
    const { importAudienceMembers } = await import('@api/services/organization/audience');

    return { db, schema, ...drizzle, importAudienceMembers };
  }

  function emails(prefix: string, count: number) {
    return Array.from({ length: count }, (_, index) => `${prefix}-${index}@${emailDomain}`);
  }

  async function importEmails(list: string[]) {
    const { importAudienceMembers } = await load();

    return importAudienceMembers(
      organizationId,
      { recipients: list.map((email) => ({ email })), courseIds: [courseId], sendEmail: false } as Parameters<
        typeof importAudienceMembers
      >[1],
      adminId
    );
  }

  async function countRows() {
    const { db, schema, and, eq, count, like } = await load();
    const [students] = await db
      .select({ total: count() })
      .from(schema.organizationmember)
      .where(
        and(
          eq(schema.organizationmember.organizationId, organizationId),
          eq(schema.organizationmember.roleId, ROLE.STUDENT)
        )
      );
    const [groupMembers] = await db
      .select({ total: count() })
      .from(schema.groupmember)
      .where(and(eq(schema.groupmember.groupId, groupId), like(schema.groupmember.email, `%@${emailDomain}`)));
    const [invites] = await db
      .select({ total: count() })
      .from(schema.organizationInvite)
      .where(eq(schema.organizationInvite.organizationId, organizationId));

    return { students: students.total, groupMembers: groupMembers.total, invites: invites.total };
  }

  beforeAll(async () => {
    const { db, schema } = await load();
    const { createOrganization } = await import('@db/queries/organization');

    const organization = await createOrganization({ name: `import-tx-${suffix}`, siteName: `import-tx-${suffix}` });
    organizationId = organization.id;

    const adminEmail = `admin@${emailDomain}`;
    const [admin] = await db
      .insert(schema.user)
      .values({ name: 'Admin', email: adminEmail, emailVerified: true })
      .returning();
    adminId = admin.id;
    await db
      .insert(schema.profile)
      .values({ id: adminId, email: adminEmail, fullname: 'Admin', username: `admin-${suffix}` });
    await db
      .insert(schema.organizationmember)
      .values({ organizationId, profileId: adminId, email: adminEmail, roleId: ROLE.ADMIN });

    const [group] = await db
      .insert(schema.group)
      .values({ name: `import-tx-${suffix}`, organizationId })
      .returning();
    groupId = group.id;

    const [course] = await db
      .insert(schema.course)
      .values({ title: 'Import course', description: 'Fixture', groupId, slug: `import-tx-${suffix}` })
      .returning();
    courseId = course.id;

    const learnerEmail = `learner@${emailDomain}`;
    const [learner] = await db
      .insert(schema.user)
      .values({ name: 'Learner', email: learnerEmail, emailVerified: true })
      .returning();
    await db
      .insert(schema.profile)
      .values({ id: learner.id, email: learnerEmail, fullname: 'Learner', username: `learner-${suffix}` });
    await db
      .insert(schema.organizationmember)
      .values({ organizationId, profileId: learner.id, email: learnerEmail, roleId: ROLE.STUDENT, verified: true });
  }, 60_000);

  beforeEach(() => {
    failInviteInsert.enabled = false;
  });

  afterAll(async () => {
    if (!organizationId) return;

    const { db, schema, like } = await load();
    const { deleteOrganization } = await import('@db/scripts/lib/org-deletion');

    await deleteOrganization(db.$client, organizationId);
    await db.delete(schema.profile).where(like(schema.profile.email, `%@${emailDomain}`));
    await db.delete(schema.user).where(like(schema.user.email, `%@${emailDomain}`));
  }, 60_000);

  it('leaves no members, enrolments or invites behind when a later step fails', async () => {
    const before = await countRows();
    failInviteInsert.enabled = true;

    await expect(importEmails([`learner@${emailDomain}`, ...emails('failed', 3)])).rejects.toThrow(
      'invite insert failed'
    );

    expect(await countRows()).toEqual(before);
  });

  it('adds someone who already has an account to the selected cohort straight away', async () => {
    const { db, schema, and, eq, importAudienceMembers } = await load();
    const email = `has-account@${emailDomain}`;
    const [user] = await db.insert(schema.user).values({ name: 'Has account', email, emailVerified: true }).returning();
    await db
      .insert(schema.profile)
      .values({ id: user.id, email, fullname: 'Has account', username: `has-account-${suffix}` });
    const [cohort] = await db
      .insert(schema.cohort)
      .values({ organizationId, name: `import-tx-${suffix}`, createdByProfileId: adminId })
      .returning();

    const result = await importAudienceMembers(
      organizationId,
      { recipients: [{ email }], cohortIds: [cohort.id], sendEmail: false } as Parameters<
        typeof importAudienceMembers
      >[1],
      adminId
    );

    const memberships = await db
      .select({ profileId: schema.cohortMember.profileId })
      .from(schema.cohortMember)
      .where(and(eq(schema.cohortMember.cohortId, cohort.id), eq(schema.cohortMember.profileId, user.id)));

    expect(result.imported).toBe(1);
    expect(memberships).toHaveLength(1);
  });

  it('keeps a pending member on their old email when the replacement invite cannot be created', async () => {
    const { db, schema, eq } = await load();
    const { updatePendingAudienceMemberEmail } = await import('@api/services/organization/audience');
    const oldEmail = `pending-old@${emailDomain}`;
    const [member] = await db
      .insert(schema.organizationmember)
      .values({ organizationId, email: oldEmail, roleId: ROLE.STUDENT, verified: false })
      .returning();
    failInviteInsert.enabled = true;

    await expect(
      updatePendingAudienceMemberEmail(
        organizationId,
        member.id,
        { email: `pending-new@${emailDomain}`, sendEmail: false },
        adminId
      )
    ).rejects.toThrow('invite insert failed');

    const [after] = await db
      .select({ email: schema.organizationmember.email })
      .from(schema.organizationmember)
      .where(eq(schema.organizationmember.id, member.id));
    expect(after.email).toBe(oldEmail);
  });

  it('keeps two concurrent imports within the student limit', async () => {
    const { students, invites } = await countRows();
    const batchSize = studentLimit - students;

    const results = await Promise.allSettled([
      importEmails(emails('first', batchSize)),
      importEmails(emails('second', batchSize))
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.find((result) => result.status === 'rejected')).toMatchObject({
      reason: expect.objectContaining({ code: 'UPGRADE_REQUIRED' })
    });

    const after = await countRows();
    expect(after.students).toBe(studentLimit);
    expect(after.invites).toBe(invites + batchSize);
  }, 60_000);
});
