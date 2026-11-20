/**
 * Writer contract, against the database: every grant writer the enrollment
 * entry points funnel through leaves a STUDENT with a live grant and gives
 * team members (TUTOR/ADMIN course rows) none. Service-level wiring of each
 * entry point is covered by the unit suites (rejoin-grants, member-role-grants,
 * course-management, cohort-grants, organization-invite-path-acceptance,
 * sso-provisioning-invite, bulk-enroll).
 *
 * Skipped when no database URL is available.
 */
import { randomUUID } from 'node:crypto';

import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import type { DbOrTxClient } from '@cio/db/drizzle';
import {
  bulkInsertDirectCourseGrants,
  grantCourseAccess,
  hasLiveCourseGrant,
  revokeGrantsForGroupmember
} from '@cio/db/queries/learning-path/enrollment-grant';
import { ensureLearningPathCourseGrants } from '@cio/db/queries/learning-path/course-grants';
import { ROLE } from '@cio/utils/constants';

import {
  hasDatabase,
  insertCourse,
  insertMember,
  insertOrganization,
  insertPath,
  insertProfile,
  withRollback
} from './fixtures/learner-db';

const describeDb = hasDatabase ? describe : describe.skip;

async function insertTeamMember(tx: DbOrTxClient, groupId: string, profileId: string) {
  const groupMemberId = randomUUID();
  await tx.execute(sql`
    INSERT INTO groupmember (id, group_id, profile_id, role_id) VALUES (${groupMemberId}, ${groupId}, ${profileId}, ${ROLE.TUTOR})`);

  return groupMemberId;
}

describeDb('grant writer contract (database)', () => {
  it('bulk direct grants reach students and skip team rows', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'contract-org');
      const { courseId, groupId } = await insertCourse(tx, orgId, 'Course', { lessons: 0 });
      const student = await insertProfile(tx, 'student');
      const tutor = await insertProfile(tx, 'tutor');
      await insertMember(tx, groupId, student);
      await insertTeamMember(tx, groupId, tutor);

      await bulkInsertDirectCourseGrants(
        { groupIds: [groupId], profileIds: [student, tutor], courseIds: [courseId], source: 'ORG_AUDIENCE' },
        tx
      );

      expect(await hasLiveCourseGrant(courseId, student, tx)).toBe(true);
      expect(await hasLiveCourseGrant(courseId, tutor, tx)).toBe(false);
    });
  });

  it('path grants enroll a student in every path course and skip a course they already teach', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'contract-org');
      const { pathId } = await insertPath(tx, orgId, 'Path');
      const { courseId: first } = await insertCourse(tx, orgId, 'First', { lessons: 0 });
      const { courseId: taught, groupId: taughtGroup } = await insertCourse(tx, orgId, 'Taught', { lessons: 0 });
      const learner = await insertProfile(tx, 'learner');
      await insertTeamMember(tx, taughtGroup, learner);

      await ensureLearningPathCourseGrants(pathId, learner, undefined, tx, [first, taught]);

      expect(await hasLiveCourseGrant(first, learner, tx)).toBe(true);
      expect(await hasLiveCourseGrant(taught, learner, tx)).toBe(false);
    });
  });

  it('re-granting the same source reactivates a revoked grant', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'contract-org');
      const { courseId, groupId } = await insertCourse(tx, orgId, 'Course', { lessons: 0 });
      const student = await insertProfile(tx, 'student');
      const groupMemberId = await insertMember(tx, groupId, student);

      await grantCourseAccess(
        { groupmemberId: groupMemberId, courseId, profileId: student, source: 'SELF_ENROLL' },
        tx
      );
      await revokeGrantsForGroupmember(groupMemberId, tx);
      expect(await hasLiveCourseGrant(courseId, student, tx)).toBe(false);

      await grantCourseAccess(
        { groupmemberId: groupMemberId, courseId, profileId: student, source: 'SELF_ENROLL' },
        tx
      );
      expect(await hasLiveCourseGrant(courseId, student, tx)).toBe(true);
    });
  });

  it('deleting course memberships cascades their grants, for two self-enrolled students in one course', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'contract-org');
      const { courseId, groupId } = await insertCourse(tx, orgId, 'Course', { lessons: 0 });
      const first = await insertProfile(tx, 'first');
      const second = await insertProfile(tx, 'second');

      for (const profileId of [first, second]) {
        const groupMemberId = await insertMember(tx, groupId, profileId);
        await grantCourseAccess({ groupmemberId: groupMemberId, courseId, profileId, source: 'SELF_ENROLL' }, tx);
      }

      await tx.execute(sql`DELETE FROM groupmember WHERE group_id = ${groupId}`);

      const remaining = await tx.execute(sql`SELECT id FROM course_enrollment_grant WHERE course_id = ${courseId}`);
      expect(Array.from(remaining as unknown as unknown[])).toHaveLength(0);
    });
  });
});
