import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

describe.skipIf(!hasDatabase)('getLatestOrganizationInviteMetadataByEmails against the database', () => {
  const suffix = `${Date.now()}`;
  let organizationId = '';
  let creatorId = '';

  async function createInvite(email: string, createdAt: string, isRevoked: boolean, fullname?: string) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    await db.insert(schema.organizationInvite).values({
      organizationId,
      roleId: ROLE.STUDENT,
      email,
      tokenHash: `${email}-${createdAt}-${suffix}`,
      createdByProfileId: creatorId,
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      createdAt,
      isRevoked,
      metadata: { source: 'AUDIENCE_IMPORT', fullname }
    });
  }

  beforeAll(async () => {
    const { db } = await import('@db/drizzle');
    const { createOrganization } = await import('@db/queries/organization');
    const schema = await import('@db/schema');

    const organization = await createOrganization({ name: `invite-names-${suffix}` });
    organizationId = organization.id;

    const email = `creator-${suffix}@invite-names.test`;
    const [user] = await db.insert(schema.user).values({ name: 'Creator', email, emailVerified: true }).returning();
    creatorId = user.id;
    await db
      .insert(schema.profile)
      .values({ id: creatorId, fullname: 'Creator', username: `creator-${suffix}`, email });
  });

  afterAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    await db.delete(schema.organizationInvite).where(eq(schema.organizationInvite.organizationId, organizationId));
    await db.delete(schema.organization).where(eq(schema.organization.id, organizationId));
    await db.delete(schema.profile).where(eq(schema.profile.id, creatorId));
    await db.delete(schema.user).where(eq(schema.user.id, creatorId));
  });

  it('returns the newest invite per email, revoked ones included', async () => {
    const { getLatestOrganizationInviteMetadataByEmails } = await import('@db/queries/organization');
    const ada = `ada-${suffix}@invite-names.test`;
    const grace = `grace-${suffix}@invite-names.test`;

    await createInvite(ada, '2026-01-01T00:00:00.000Z', true, 'Ada Old');
    await createInvite(ada, '2026-02-01T00:00:00.000Z', true, 'Ada Lovelace');
    await createInvite(grace, '2026-01-01T00:00:00.000Z', false, 'Grace Hopper');

    const rows = await getLatestOrganizationInviteMetadataByEmails(organizationId, [
      ada.toUpperCase(),
      grace,
      `nobody-${suffix}@invite-names.test`
    ]);
    const byEmail = Object.fromEntries(
      rows.map((row) => [row.email, (row.metadata as { fullname?: string }).fullname])
    );

    expect(byEmail).toEqual({ [ada]: 'Ada Lovelace', [grace]: 'Grace Hopper' });
  });

  it('returns nothing for an empty list', async () => {
    const { getLatestOrganizationInviteMetadataByEmails } = await import('@db/queries/organization');

    expect(await getLatestOrganizationInviteMetadataByEmails(organizationId, [])).toEqual([]);
  });
});
