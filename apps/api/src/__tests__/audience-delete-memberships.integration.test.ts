/**
 * Deleting a learner from the audience removes every learner membership in
 * the org: cohort/program rows (hard), path rows (soft, progress kept),
 * course memberships and grants (cascade), while submissions stay.
 *
 * NOTE: the delete paths own their own transactions, so fixtures are
 * committed (not rolled back) and cleaned up explicitly in `finally`.
 *
 * Skipped when no database URL is available.
 */
import { describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

import { db } from '@cio/db/drizzle';
import { deleteOrganizationAudienceMember } from '@cio/db/queries/organization/organization';
import { applyAudienceBulkActionToMembers } from '@cio/core/services/organization/audience-bulk';
import { addCourseToCohortService } from '@api/services/cohort/cohort';

import { addPathCourses, hasDatabase, insertOrganization, insertPath, insertProfile } from './fixtures/learner-db';

const describeDb = hasDatabase ? describe : describe.skip;
const AT = '2026-01-01T00:00:00.000Z';

interface SeededLearner {
  tag: string;
  orgId: string;
  profileId: string;
  memberId: number;
  groupId: string;
  courseId: string;
  cohortId: string;
  programId: string;
  pathId: string;
}

function toArray(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) return result as Array<Record<string, unknown>>;
  const rows = (result as { rows?: unknown }).rows;

  return Array.isArray(rows) ? rows : [];
}

async function seedLearner(tag: string, memberStatus = 'ACTIVE'): Promise<SeededLearner> {
  const orgId = await insertOrganization(db, `del-${tag}`);
  const profileId = await insertProfile(db, `${tag}-student`);
  const groupId = randomUUID();
  const courseId = randomUUID();
  await db.execute(sql`INSERT INTO "group" (id, name, organization_id) VALUES (${groupId}, ${tag}, ${orgId})`);
  await db.execute(sql`INSERT INTO course (id, title, description, group_id, type, status)
    VALUES (${courseId}, ${tag}, 'x', ${groupId}, 'SELF_PACED', 'ACTIVE')`);

  const memberRows = toArray(
    await db.execute(
      sql`INSERT INTO organizationmember (organization_id, role_id, profile_id, email, status)
        VALUES (${orgId}, 3, ${profileId}, ${`${tag}@test.dev`}, ${memberStatus}) RETURNING id`
    )
  );
  const memberId = (memberRows[0] as { id: number }).id;

  const gmRows = toArray(
    await db.execute(
      sql`INSERT INTO groupmember (id, group_id, profile_id, role_id)
        VALUES (${randomUUID()}, ${groupId}, ${profileId}, 3) RETURNING id`
    )
  );
  const groupMemberId = (gmRows[0] as { id: string }).id;

  await db.execute(
    sql`INSERT INTO course_enrollment_grant (groupmember_id, course_id, profile_id, source, granted_at)
      VALUES (${groupMemberId}, ${courseId}, ${profileId}, 'SELF_ENROLL', ${AT})`
  );

  const cohortId = randomUUID();
  await db.execute(sql`INSERT INTO cohort (id, organization_id, name) VALUES (${cohortId}, ${orgId}, ${tag})`);
  await db.execute(
    sql`INSERT INTO cohort_member (id, cohort_id, profile_id, role_id)
      VALUES (${randomUUID()}, ${cohortId}, ${profileId}, 3)`
  );
  await db.execute(sql`INSERT INTO cohort_course (cohort_id, course_id) VALUES (${cohortId}, ${courseId})`);

  const programId = randomUUID();
  await db.execute(sql`INSERT INTO program (id, organization_id, name) VALUES (${programId}, ${orgId}, ${tag})`);
  await db.execute(
    sql`INSERT INTO program_member (id, program_id, profile_id, role_id)
      VALUES (${randomUUID()}, ${programId}, ${profileId}, 3)`
  );

  const { pathId } = await insertPath(db, orgId, `${tag} path`);
  await addPathCourses(db, pathId, [courseId]);
  const memberRowId = randomUUID();
  await db.execute(sql`INSERT INTO learning_path_member (id, learning_path_id, profile_id, role_id, enrolled_at, status)
    VALUES (${memberRowId}, ${pathId}, ${profileId}, 3, ${AT}, 'NOT_STARTED')`);

  // Migration 0017 makes submission.submitted_by ON DELETE SET NULL; the
  // work-preservation assertions depend on it, so fail loudly if it is missing.
  if (!(await submissionFkSetsNull())) {
    throw new Error('submission.submitted_by is not ON DELETE SET NULL: run the migrations on this database');
  }

  const exerciseId = randomUUID();
  await db.execute(sql`INSERT INTO exercise (id, title, course_id) VALUES (${exerciseId}, 'Ex', ${courseId})`);
  await db.execute(sql`INSERT INTO submission (exercise_id, submitted_by, total)
    VALUES (${exerciseId}, ${groupMemberId}, 0)`);

  return { tag, orgId, profileId, memberId, groupId, courseId, cohortId, programId, pathId };
}

/** Best-effort cleanup of everything a seed created, children first. */
async function cleanupLearner(learner: SeededLearner): Promise<void> {
  const { orgId, profileId, courseId, cohortId, programId, pathId } = learner;

  try {
    await db.execute(
      sql`DELETE FROM submission WHERE exercise_id IN (SELECT id FROM exercise WHERE course_id = ${courseId})`
    );
    await db.execute(sql`DELETE FROM course_enrollment_grant WHERE course_id = ${courseId}`);
    await db.execute(sql`DELETE FROM exercise WHERE course_id = ${courseId}`);
    await db.execute(sql`DELETE FROM learning_path_member_course WHERE learning_path_member_id IN
      (SELECT id FROM learning_path_member WHERE learning_path_id = ${pathId})`);
    await db.execute(sql`DELETE FROM learning_path_certificate_issue WHERE learning_path_id = ${pathId}`);
    await db.execute(sql`DELETE FROM learning_path_member WHERE learning_path_id = ${pathId}`);
    await db.execute(sql`DELETE FROM learning_path_course WHERE learning_path_id = ${pathId}`);
    await db.execute(sql`DELETE FROM learning_path WHERE id = ${pathId}`);
    await db.execute(sql`DELETE FROM cohort_course WHERE cohort_id = ${cohortId}`);
    await db.execute(sql`DELETE FROM cohort_member WHERE cohort_id = ${cohortId}`);
    await db.execute(sql`DELETE FROM cohort WHERE id = ${cohortId}`);
    await db.execute(sql`DELETE FROM program_member WHERE program_id = ${programId}`);
    await db.execute(sql`DELETE FROM program WHERE id = ${programId}`);
    await db.execute(sql`DELETE FROM groupmember WHERE profile_id = ${profileId}`);
    await db.execute(sql`DELETE FROM course WHERE id = ${courseId}`);
    await db.execute(sql`DELETE FROM "group" WHERE id = ${learner.groupId}`);
    await db.execute(sql`DELETE FROM organizationmember WHERE organization_id = ${orgId}`);
    await db.execute(sql`DELETE FROM organization WHERE id = ${orgId}`);
    await db.execute(sql`DELETE FROM profile WHERE id = ${profileId}`);
    await db.execute(sql`DELETE FROM "user" WHERE id = ${profileId}`);
  } catch (error) {
    console.error('audience-delete cleanup failed:', error);
  }
}

async function countWhere(table: string, profileId: string): Promise<number> {
  const rows = toArray(
    await db.execute(sql`SELECT COUNT(*)::int AS total FROM ${sql.raw(table)} WHERE profile_id = ${profileId}`)
  );

  return Number((rows[0] as { total: number }).total ?? 0);
}

describeDb('audience delete removes all learner memberships', () => {
  it('single delete clears cohort, program, path, course and grant rows but keeps submissions', async () => {
    const learner = await seedLearner(`gone-${randomUUID().slice(0, 8)}`);

    try {
      const deleted = await deleteOrganizationAudienceMember(learner.orgId, learner.memberId);
      expect(deleted).not.toBeNull();

      expect(await countWhere('cohort_member', learner.profileId)).toBe(0);
      expect(await countWhere('program_member', learner.profileId)).toBe(0);
      expect(await countWhere('groupmember', learner.profileId)).toBe(0);
      expect(await countWhere('course_enrollment_grant', learner.profileId)).toBe(0);

      const pathRows = toArray(
        await db.execute(
          sql`SELECT removed_at FROM learning_path_member WHERE learning_path_id = ${learner.pathId} AND profile_id = ${learner.profileId}`
        )
      );
      expect(pathRows).toHaveLength(1);
      expect(pathRows[0].removed_at).not.toBeNull();

      // The learner's work stays as evidence; only the membership link goes.
      expect(await submissionsFor(learner.courseId)).toEqual([{ submitted_by: null }]);
    } finally {
      await cleanupLearner(learner);
    }
  });

  it('bulk delete clears the same rows', async () => {
    const learner = await seedLearner(`bulk-gone-${randomUUID().slice(0, 8)}`, 'ARCHIVED');

    try {
      const outcome = await applyAudienceBulkActionToMembers(
        learner.orgId,
        [learner.memberId],
        { action: 'delete' },
        learner.profileId
      );
      expect(outcome.succeeded).toBe(1);
      expect(await submissionsFor(learner.courseId)).toEqual([{ submitted_by: null }]);

      expect(await countWhere('cohort_member', learner.profileId)).toBe(0);
      expect(await countWhere('program_member', learner.profileId)).toBe(0);
      expect(await countWhere('groupmember', learner.profileId)).toBe(0);
      expect(await countWhere('course_enrollment_grant', learner.profileId)).toBe(0);

      const pathRows = toArray(
        await db.execute(
          sql`SELECT removed_at FROM learning_path_member WHERE learning_path_id = ${learner.pathId} AND profile_id = ${learner.profileId}`
        )
      );
      expect(pathRows).toHaveLength(1);
      expect(pathRows[0].removed_at).not.toBeNull();
    } finally {
      await cleanupLearner(learner);
    }
  });

  it('adding a course to the cohort afterwards does not re-add the deleted learner', async () => {
    const learner = await seedLearner(`readded-${randomUUID().slice(0, 8)}`, 'ARCHIVED');
    const laterGroupId = randomUUID();
    const laterCourseId = randomUUID();

    try {
      await deleteOrganizationAudienceMember(learner.orgId, learner.memberId);

      await db.execute(
        sql`INSERT INTO "group" (id, name, organization_id) VALUES (${laterGroupId}, 'Later', ${learner.orgId})`
      );
      await db.execute(
        sql`INSERT INTO course (id, title, description, group_id, type, status)
          VALUES (${laterCourseId}, 'Later', 'x', ${laterGroupId}, 'SELF_PACED', 'ACTIVE')`
      );

      // The real service fans the new course out to current STUDENT cohort
      // members; the deleted learner must not come back through it.
      await addCourseToCohortService(learner.cohortId, { courseId: laterCourseId });

      expect(await countWhere('organizationmember', learner.profileId)).toBe(0);
      expect(await countWhere('course_enrollment_grant', learner.profileId)).toBe(0);
      const laterMemberships = toArray(
        await db.execute(
          sql`SELECT id FROM groupmember WHERE group_id = ${laterGroupId} AND profile_id = ${learner.profileId}`
        )
      );
      expect(laterMemberships).toHaveLength(0);
    } finally {
      await db.execute(sql`DELETE FROM cohort_course WHERE course_id = ${laterCourseId}`);
      await db.execute(sql`DELETE FROM groupmember WHERE group_id = ${laterGroupId}`);
      await db.execute(sql`DELETE FROM course WHERE id = ${laterCourseId}`);
      await db.execute(sql`DELETE FROM "group" WHERE id = ${laterGroupId}`);
      await cleanupLearner(learner);
    }
  });

  it("leaves the same person's memberships in another organization untouched", async () => {
    const learner = await seedLearner(`scoped-${randomUUID().slice(0, 8)}`);
    const other = await seedOtherOrgMemberships(learner.profileId);

    try {
      await deleteOrganizationAudienceMember(learner.orgId, learner.memberId);

      const count = async (query: ReturnType<typeof sql>) =>
        Number((toArray(await db.execute(query))[0] as { total: number }).total);

      expect(
        await count(sql`SELECT COUNT(*)::int AS total FROM cohort_member WHERE cohort_id = ${other.cohortId}`)
      ).toBe(1);
      expect(
        await count(sql`SELECT COUNT(*)::int AS total FROM program_member WHERE program_id = ${other.programId}`)
      ).toBe(1);
      expect(await count(sql`SELECT COUNT(*)::int AS total FROM groupmember WHERE group_id = ${other.groupId}`)).toBe(
        1
      );
      expect(
        await count(
          sql`SELECT COUNT(*)::int AS total FROM learning_path_member
            WHERE learning_path_id = ${other.pathId} AND removed_at IS NULL`
        )
      ).toBe(1);
    } finally {
      await cleanupOtherOrg(other);
      await cleanupLearner(learner);
    }
  });
});

/** Whether deleting a groupmember nulls submission.submitted_by on this database. */
async function submissionFkSetsNull(): Promise<boolean> {
  const rows = toArray(
    await db.execute(sql`SELECT c.confdeltype AS deltype FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      WHERE c.conname = 'submission_submitted_by_fkey' AND t.relname = 'submission'`)
  );

  return (rows[0] as { deltype?: string } | undefined)?.deltype === 'n';
}

/** The learner's submissions in a course, showing only the membership link. */
async function submissionsFor(courseId: string) {
  return toArray(
    await db.execute(
      sql`SELECT s.submitted_by FROM submission s JOIN exercise e ON e.id = s.exercise_id WHERE e.course_id = ${courseId}`
    )
  );
}

interface OtherOrgMemberships {
  orgId: string;
  groupId: string;
  courseId: string;
  cohortId: string;
  programId: string;
  pathId: string;
}

/** Gives an existing profile a full set of memberships in a second organization. */
async function seedOtherOrgMemberships(profileId: string): Promise<OtherOrgMemberships> {
  const orgId = await insertOrganization(db, `other-${randomUUID().slice(0, 8)}`);
  const groupId = randomUUID();
  const courseId = randomUUID();
  const cohortId = randomUUID();
  const programId = randomUUID();

  await db.execute(sql`INSERT INTO organizationmember (organization_id, role_id, profile_id, status)
    VALUES (${orgId}, 3, ${profileId}, 'ACTIVE')`);
  await db.execute(sql`INSERT INTO "group" (id, name, organization_id) VALUES (${groupId}, 'Other', ${orgId})`);
  await db.execute(sql`INSERT INTO course (id, title, description, group_id, type, status)
    VALUES (${courseId}, 'Other', 'x', ${groupId}, 'SELF_PACED', 'ACTIVE')`);
  await db.execute(sql`INSERT INTO groupmember (id, group_id, profile_id, role_id)
    VALUES (${randomUUID()}, ${groupId}, ${profileId}, 3)`);
  await db.execute(sql`INSERT INTO cohort (id, organization_id, name) VALUES (${cohortId}, ${orgId}, 'Other')`);
  await db.execute(sql`INSERT INTO cohort_member (id, cohort_id, profile_id, role_id)
    VALUES (${randomUUID()}, ${cohortId}, ${profileId}, 3)`);
  await db.execute(sql`INSERT INTO program (id, organization_id, name) VALUES (${programId}, ${orgId}, 'Other')`);
  await db.execute(sql`INSERT INTO program_member (id, program_id, profile_id, role_id)
    VALUES (${randomUUID()}, ${programId}, ${profileId}, 3)`);
  const { pathId } = await insertPath(db, orgId, 'Other path');
  await db.execute(sql`INSERT INTO learning_path_member (id, learning_path_id, profile_id, role_id, enrolled_at, status)
    VALUES (${randomUUID()}, ${pathId}, ${profileId}, 3, ${AT}, 'NOT_STARTED')`);

  return { orgId, groupId, courseId, cohortId, programId, pathId };
}

/** Removes everything `seedOtherOrgMemberships` created; the org delete cascades the rest. */
async function cleanupOtherOrg(other: OtherOrgMemberships): Promise<void> {
  try {
    await db.execute(sql`DELETE FROM learning_path_member WHERE learning_path_id = ${other.pathId}`);
    await db.execute(sql`DELETE FROM learning_path WHERE id = ${other.pathId}`);
    await db.execute(sql`DELETE FROM cohort_member WHERE cohort_id = ${other.cohortId}`);
    await db.execute(sql`DELETE FROM cohort WHERE id = ${other.cohortId}`);
    await db.execute(sql`DELETE FROM program_member WHERE program_id = ${other.programId}`);
    await db.execute(sql`DELETE FROM program WHERE id = ${other.programId}`);
    await db.execute(sql`DELETE FROM groupmember WHERE group_id = ${other.groupId}`);
    await db.execute(sql`DELETE FROM course WHERE id = ${other.courseId}`);
    await db.execute(sql`DELETE FROM "group" WHERE id = ${other.groupId}`);
    await db.execute(sql`DELETE FROM organizationmember WHERE organization_id = ${other.orgId}`);
    await db.execute(sql`DELETE FROM organization WHERE id = ${other.orgId}`);
  } catch (error) {
    console.error('audience-delete other-org cleanup failed:', error);
  }
}
