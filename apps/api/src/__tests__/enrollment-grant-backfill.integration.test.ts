/**
 * Backfill ledger coverage: legacy STUDENT rows get IMPORT, cohort-driven rows
 * get COHORT, tutors get nothing, and a second run inserts 0.
 *
 * Skipped when no database URL is available.
 */
import { describe, expect, it } from 'vitest';

import { ROLE } from '@cio/utils/constants';

import {
  backfillCohortCourseEnrollmentGrants,
  backfillMissingCourseEnrollmentGrants,
  countMissingCohortCourseEnrollmentGrants,
  countMissingCourseEnrollmentGrants
} from '@cio/db/queries/learning-path/enrollment-grant';

import { hasDatabase, insertMember, insertOrganization, insertProfile, withRollback } from './fixtures/learner-db';
import type { DbOrTxClient } from '@cio/db/drizzle';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

const describeDb = hasDatabase ? describe : describe.skip;

describeDb('enrollment grant backfill', () => {
  it('legacy student gets IMPORT, cohort student gets COHORT, tutor gets nothing, second run inserts 0', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'backfill-org');
      const studentId = await insertProfile(tx, 'legacy-student');
      const cohortStudentId = await insertProfile(tx, 'cohort-student');
      const tutorId = await insertProfile(tx, 'tutor');

      const { courseId, groupId } = await insertCourseWithGroup(tx, orgId, 'Backfill 101');

      const legacyGm = await insertMember(tx, groupId, studentId);
      const tutorGm = await insertTutorMember(tx, groupId, tutorId);
      const cohortGm = await insertMember(tx, groupId, cohortStudentId);

      const cohortId = randomUUID();
      await tx.execute(sql`INSERT INTO cohort (id, organization_id, name) VALUES (${cohortId}, ${orgId}, 'C1')`);
      await tx.execute(
        sql`INSERT INTO cohort_member (id, cohort_id, profile_id, role_id) VALUES (${randomUUID()}, ${cohortId}, ${cohortStudentId}, ${ROLE.STUDENT})`
      );
      await tx.execute(sql`INSERT INTO cohort_course (cohort_id, course_id) VALUES (${cohortId}, ${courseId})`);

      // Scoped to this org with exact counts, so other data in the database cannot mask a miss.
      const scope = { organizationId: orgId };

      // Two STUDENT rows lack a grant (legacy + cohort); the tutor row is not counted.
      expect(await countMissingCourseEnrollmentGrants(scope, tx)).toBe(2);
      expect(await countMissingCohortCourseEnrollmentGrants(scope, tx)).toBe(1);

      // Cohort first, so the cohort student keeps its true provenance.
      expect(await backfillCohortCourseEnrollmentGrants(scope, tx)).toBe(1);
      expect(await backfillMissingCourseEnrollmentGrants(scope, tx)).toBe(1);

      const sources = async (groupMemberId: string) =>
        toArray(
          await tx.execute(sql`SELECT source FROM course_enrollment_grant WHERE groupmember_id = ${groupMemberId}`)
        )
          .map((row) => row.source)
          .sort();

      expect(await sources(legacyGm)).toEqual(['IMPORT']);
      expect(await sources(cohortGm)).toEqual(['COHORT']);
      expect(await sources(tutorGm)).toEqual([]);

      // A second run inserts nothing and nothing is left missing.
      expect(await backfillCohortCourseEnrollmentGrants(scope, tx)).toBe(0);
      expect(await backfillMissingCourseEnrollmentGrants(scope, tx)).toBe(0);
      expect(await countMissingCourseEnrollmentGrants(scope, tx)).toBe(0);
      expect(await countMissingCohortCourseEnrollmentGrants(scope, tx)).toBe(0);
    });
  });
});

async function insertCourseWithGroup(tx: DbOrTxClient, orgId: string, title: string) {
  const groupId = randomUUID();
  const courseId = randomUUID();
  await tx.execute(sql`INSERT INTO "group" (id, name, organization_id) VALUES (${groupId}, ${title}, ${orgId})`);
  await tx.execute(sql`INSERT INTO course (id, title, description, group_id, type, status)
    VALUES (${courseId}, ${title}, 'x', ${groupId}, 'SELF_PACED', 'ACTIVE')`);

  return { courseId, groupId };
}

async function insertTutorMember(tx: Parameters<typeof insertMember>[0], groupId: string, profileId: string) {
  const id = randomUUID();
  await tx.execute(
    sql`INSERT INTO groupmember (id, group_id, profile_id, role_id) VALUES (${id}, ${groupId}, ${profileId}, ${ROLE.TUTOR})`
  );

  return id;
}

function toArray(result: unknown): Array<{ source: string; group_id?: string } & Record<string, unknown>> {
  if (Array.isArray(result)) return result as never;
  const rows = (result as { rows?: unknown }).rows;

  return Array.isArray(rows) ? (rows as never) : [];
}
