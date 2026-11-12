import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

type InviteFixture = { isRevoked?: boolean; expired?: boolean; createdAt: string };
type MemberFixture = {
  key: string;
  status?: 'ACTIVE' | 'ARCHIVED';
  joined?: boolean;
  invites: InviteFixture[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

const MEMBERS: MemberFixture[] = [
  { key: 'joined', joined: true, invites: [] },
  { key: 'pending', invites: [{ createdAt: '2026-01-01T00:00:00Z' }] },
  { key: 'noInvite', invites: [] },
  { key: 'revoked', invites: [{ isRevoked: true, createdAt: '2026-01-01T00:00:00Z' }] },
  { key: 'expired', invites: [{ expired: true, createdAt: '2026-01-01T00:00:00Z' }] },
  { key: 'archivedRevoked', status: 'ARCHIVED', invites: [{ isRevoked: true, createdAt: '2026-01-01T00:00:00Z' }] },
  {
    key: 'resentAfterRevoke',
    invites: [{ isRevoked: true, createdAt: '2026-01-01T00:00:00Z' }, { createdAt: '2026-01-02T00:00:00Z' }]
  }
];

describe.skipIf(!hasDatabase)('student seat count against the database', () => {
  const suffix = Date.now();
  const memberIdByKey = new Map<string, number>();
  let organizationId = '';
  let adminId = '';

  const emailFor = (key: string) => `${key.toLowerCase()}-${suffix}@seats.test`;

  beforeAll(async () => {
    const { db } = await import('@db/drizzle');
    const { createOrganization } = await import('@db/queries/organization');
    const schema = await import('@db/schema');

    const organization = await createOrganization({ name: `seats-${suffix}` });
    organizationId = organization.id;

    const adminEmail = `admin-${suffix}@seats.test`;
    const [userRow] = await db
      .insert(schema.user)
      .values({ name: 'admin', email: adminEmail, emailVerified: true })
      .returning();
    adminId = userRow.id;
    await db
      .insert(schema.profile)
      .values({ id: adminId, fullname: 'admin', username: `admin-${suffix}`, email: adminEmail });

    for (const member of MEMBERS) {
      const email = emailFor(member.key);
      const [memberRow] = await db
        .insert(schema.organizationmember)
        .values({
          organizationId,
          roleId: ROLE.STUDENT,
          email,
          profileId: member.joined ? adminId : null,
          status: member.status ?? 'ACTIVE',
          verified: Boolean(member.joined)
        })
        .returning({ id: schema.organizationmember.id });
      memberIdByKey.set(member.key, memberRow.id);

      for (const [index, invite] of member.invites.entries()) {
        const expiresAt = new Date(Date.now() + (invite.expired ? -DAY_MS : 7 * DAY_MS)).toISOString();

        await db.insert(schema.organizationInvite).values({
          organizationId,
          roleId: ROLE.STUDENT,
          email,
          tokenHash: `seats-${suffix}-${member.key}-${index}`,
          createdByProfileId: adminId,
          expiresAt,
          isRevoked: Boolean(invite.isRevoked),
          createdAt: invite.createdAt
        });
      }
    }
  });

  afterAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    if (organizationId) {
      await db.delete(schema.organizationInvite).where(eq(schema.organizationInvite.organizationId, organizationId));
      await db.delete(schema.organizationmember).where(eq(schema.organizationmember.organizationId, organizationId));
      await db.delete(schema.organization).where(eq(schema.organization.id, organizationId));
    }
    if (adminId) {
      await db.delete(schema.profile).where(eq(schema.profile.id, adminId));
      await db.delete(schema.user).where(eq(schema.user.id, adminId));
    }
  });

  it('counts joined, pending and never-invited students, but not revoked, expired or archived ones', async () => {
    const { countActiveStudents } = await import('@db/queries/organization');

    expect(await countActiveStudents(organizationId)).toBe(4);
  });

  it('flags only unarchived students whose latest invite was revoked or expired', async () => {
    const { hasLapsedStudentInvite } = await import('@db/queries/organization');

    const lapsedKeys: string[] = [];
    for (const member of MEMBERS) {
      if (await hasLapsedStudentInvite(organizationId, memberIdByKey.get(member.key)!)) {
        lapsedKeys.push(member.key);
      }
    }

    expect(lapsedKeys).toEqual(['revoked', 'expired']);
  });

  it('reports the same lapsed flag on the import lookup', async () => {
    const { getOrganizationMembersByNormalizedEmails } = await import('@db/queries/organization');

    const rows = await getOrganizationMembersByNormalizedEmails(
      organizationId,
      MEMBERS.filter((member) => !member.joined).map((member) => emailFor(member.key))
    );
    const lapsedEmails = rows
      .filter((row) => row.hasLapsedInvite)
      .map((row) => row.normalizedEmail)
      .sort();

    expect(lapsedEmails).toEqual([emailFor('expired'), emailFor('revoked')].sort());
  });
});
