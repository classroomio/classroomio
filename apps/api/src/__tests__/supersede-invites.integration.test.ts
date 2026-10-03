/**
 * Database-backed checks for invite superseding: the active-invite filter
 * really excludes expired, accepted and revoked rows, and two concurrent
 * first-time supersedes for the same address leave exactly one live invite.
 *
 * Skipped when no database URL is available.
 */
import { randomUUID } from 'node:crypto';

import { sql } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';

import type { DbOrTxClient } from '@cio/db/drizzle';
import { getActiveOrganizationInvitesByEmails } from '@cio/db/queries/organization/invite';
import { supersedeStudentOrgInvites } from '@cio/core/services/organization/supersede-invites';
import { ROLE } from '@cio/utils/constants';

import { hasDatabase, insertOrganization, insertProfile, withRollback } from './fixtures/learner-db';

const describeDb = hasDatabase ? describe : describe.skip;

async function insertInvite(
  tx: DbOrTxClient,
  orgId: string,
  createdBy: string,
  email: string,
  overrides: { expiresAt?: string; acceptedAt?: string | null; isRevoked?: boolean } = {}
) {
  const id = randomUUID();
  const expiresAt = overrides.expiresAt ?? new Date(Date.now() + 86_400_000).toISOString();

  await tx.execute(sql`
    INSERT INTO organization_invite
      (id, organization_id, role_id, email, token_hash, created_by_profile_id, expires_at, accepted_at, is_revoked, metadata)
    VALUES (${id}, ${orgId}, ${ROLE.STUDENT}, ${email}, ${randomUUID()}, ${createdBy}, ${expiresAt},
      ${overrides.acceptedAt ?? null}, ${overrides.isRevoked ?? false}, '{}'::jsonb)`);

  return id;
}

describeDb('getActiveOrganizationInvitesByEmails (database)', () => {
  it('returns only unrevoked, unaccepted, unexpired invites', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'invite-filter-org');
      const adminId = await insertProfile(tx, 'admin');
      const live = await insertInvite(tx, orgId, adminId, 'live@test.dev');
      await insertInvite(tx, orgId, adminId, 'expired@test.dev', {
        expiresAt: new Date(Date.now() - 60_000).toISOString()
      });
      await insertInvite(tx, orgId, adminId, 'accepted@test.dev', { acceptedAt: new Date().toISOString() });
      await insertInvite(tx, orgId, adminId, 'revoked@test.dev', { isRevoked: true });

      const active = await getActiveOrganizationInvitesByEmails(
        orgId,
        ['live@test.dev', 'expired@test.dev', 'accepted@test.dev', 'revoked@test.dev'],
        tx
      );

      expect(active.map((invite) => invite.id)).toEqual([live]);
    });
  });
});

describeDb('supersedeStudentOrgInvites (database, concurrent)', () => {
  // Concurrency needs two real transactions, so rows are committed and the
  // org (which cascades its invites) is deleted afterwards.
  const created: { orgId?: string; adminId?: string } = {};

  afterAll(async () => {
    const { db } = await import('@cio/db/drizzle');

    if (created.orgId) await db.execute(sql`DELETE FROM organization WHERE id = ${created.orgId}`);
    if (created.adminId) {
      await db.execute(sql`DELETE FROM profile WHERE id = ${created.adminId}`);
      await db.execute(sql`DELETE FROM "user" WHERE id = ${created.adminId}`);
    }
  });

  it('two first-time supersedes for the same address leave one live invite', async () => {
    const { db } = await import('@cio/db/drizzle');

    created.orgId = await insertOrganization(db, 'invite-race-org');
    created.adminId = await insertProfile(db, 'race-admin');

    const supersede = (pathId: string) =>
      db.transaction((tx) =>
        supersedeStudentOrgInvites(tx, {
          orgId: created.orgId!,
          emails: ['race@test.dev'],
          actorProfileId: created.adminId!,
          source: 'TEST',
          add: { courseIds: [], cohortIds: [], pathIds: [pathId] }
        })
      );

    await Promise.all([supersede(randomUUID()), supersede(randomUUID())]);

    const active = await getActiveOrganizationInvitesByEmails(created.orgId, ['race@test.dev']);

    expect(active).toHaveLength(1);
    // The second run merged the first run's path into its own invite.
    expect((active[0].metadata as { pathIds?: string[] }).pathIds).toHaveLength(2);
  });
});
