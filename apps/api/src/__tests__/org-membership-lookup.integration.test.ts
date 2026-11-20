/**
 * The shared org-membership and course-org lookups stay status-agnostic so
 * enrollment flows find deactivated/archived learners (and never insert a
 * duplicate org row), while the redirect uses the ACTIVE-only variants.
 *
 * Skipped when no database URL is available.
 */
import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import type { DbOrTxClient } from '@cio/db/drizzle';
import { getCourseOrgAndStatus, getOrgIdByCourseId } from '@cio/db/queries/course/course';
import {
  getActiveOrganizationMemberIdByOrgAndProfile,
  getOrganizationMemberIdByOrgAndProfile
} from '@cio/db/queries/organization/organization';

import {
  hasDatabase,
  insertCourse,
  insertOrganization,
  insertProfile,
  STUDENT,
  withRollback
} from './fixtures/learner-db';

const describeDb = hasDatabase ? describe : describe.skip;

async function insertOrgMember(tx: DbOrTxClient, orgId: string, profileId: string, status: string) {
  await tx.execute(sql`
    INSERT INTO organizationmember (organization_id, profile_id, role_id, verified, status)
    VALUES (${orgId}, ${profileId}, ${STUDENT}, true, ${status})`);
}

describeDb('org membership lookups', () => {
  for (const status of ['DEACTIVATED', 'ARCHIVED']) {
    it(`a ${status} learner is found by the shared lookup but not by the active-only one`, async () => {
      await withRollback(async (tx) => {
        const orgId = await insertOrganization(tx, `lookup-${status}`);
        const profileId = await insertProfile(tx, 'learner');
        await insertOrgMember(tx, orgId, profileId, status);

        const sharedId = await getOrganizationMemberIdByOrgAndProfile(orgId, profileId, tx);
        const activeId = await getActiveOrganizationMemberIdByOrgAndProfile(orgId, profileId, tx);

        expect(sharedId).toEqual(expect.any(Number));
        expect(activeId).toBeNull();
      });
    });
  }

  it('an active learner is found by both lookups', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'lookup-active');
      const profileId = await insertProfile(tx, 'learner');
      await insertOrgMember(tx, orgId, profileId, 'ACTIVE');

      const sharedId = await getOrganizationMemberIdByOrgAndProfile(orgId, profileId, tx);
      const activeId = await getActiveOrganizationMemberIdByOrgAndProfile(orgId, profileId, tx);

      expect(sharedId).toEqual(expect.any(Number));
      expect(activeId).toBe(sharedId);
    });
  });

  it('a non-active course still resolves its org (stats invalidation) and reports its status', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'lookup-course');
      const { courseId } = await insertCourse(tx, orgId, 'Archived course', { lessons: 0, status: 'DELETED' });

      const statsOrgId = await getOrgIdByCourseId(courseId, tx);
      const course = await getCourseOrgAndStatus(courseId, tx);

      expect(statsOrgId).toBe(orgId);
      expect(course).toEqual({ organizationId: orgId, status: 'DELETED' });
    });
  });
});
