/**
 * Runs getBatchCourseIsComplete against a real database. Each test builds its
 * own fixture inside a transaction and rolls it back. Skipped when no
 * database URL is available.
 *
 * Run (Node 20, Postgres up):
 *   DATABASE_URL="$(grep ^DATABASE_URL= apps/api/.env | cut -d= -f2- | tr -d '"')" \
 *     pnpm --filter @cio/api vitest run src/services/course/__tests__/member-progress.integration.test.ts
 */
import { describe, expect, it } from 'vitest';

import {
  completeLessons,
  hasDatabase,
  insertComplianceCycle,
  insertCourse,
  insertMember,
  insertOrganization,
  insertProfile,
  recordCourseCompletion,
  withRollback
} from '@api/__tests__/fixtures/learner-db';

describe.skipIf(!hasDatabase)('getBatchCourseIsComplete (database)', () => {
  it('uses recorded completion, not live progress', async () => {
    await withRollback(async (tx) => {
      const { getBatchCourseIsComplete } = await import('@cio/db/queries/course/member-progress');

      const orgId = await insertOrganization(tx, 'Org');
      const course = await insertCourse(tx, orgId, 'Excel', { lessons: 5 });
      const doneProfile = await insertProfile(tx, 'done');
      const progressProfile = await insertProfile(tx, 'progress');
      const doneMember = await insertMember(tx, course.groupId, doneProfile);
      await insertMember(tx, course.groupId, progressProfile);

      await completeLessons(tx, course.lessonIds.slice(0, 4), doneProfile, '2026-09-01T00:00:00Z');
      await recordCourseCompletion(tx, doneMember, '2026-09-01T00:00:00Z');
      await completeLessons(tx, course.lessonIds, progressProfile, '2026-09-01T00:00:00Z');

      const completion = await getBatchCourseIsComplete(course.courseId, [doneProfile, progressProfile], tx);

      expect(completion.get(doneProfile)).toBe(true);
      expect(completion.get(progressProfile)).toBe(false);
    });
  }, 30000);

  it('completes a waived or still-valid completed cycle, not one due soon or an earlier one', async () => {
    await withRollback(async (tx) => {
      const { getBatchCourseIsComplete } = await import('@cio/db/queries/course/member-progress');

      const orgId = await insertOrganization(tx, 'Org');
      const course = await insertCourse(tx, orgId, 'Safety', { lessons: 1, type: 'COMPLIANCE' });
      const waivedProfile = await insertProfile(tx, 'waived');
      const staleProfile = await insertProfile(tx, 'stale');
      const expiringProfile = await insertProfile(tx, 'expiring');
      const waivedMember = await insertMember(tx, course.groupId, waivedProfile);
      const staleMember = await insertMember(tx, course.groupId, staleProfile);
      const expiringMember = await insertMember(tx, course.groupId, expiringProfile);
      const warnedProfile = await insertProfile(tx, 'warned');
      const warnedMember = await insertMember(tx, course.groupId, warnedProfile);

      await insertComplianceCycle(
        tx,
        {
          courseId: course.courseId,
          groupMemberId: warnedMember,
          profileId: warnedProfile,
          cycleNumber: 1,
          status: 'expiring_soon'
        },
        { completedAt: '2025-11-20T00:00:00Z', validUntil: '2099-01-01T00:00:00Z' }
      );

      await insertComplianceCycle(tx, {
        courseId: course.courseId,
        groupMemberId: expiringMember,
        profileId: expiringProfile,
        cycleNumber: 1,
        status: 'expiring_soon'
      });

      await insertComplianceCycle(tx, {
        courseId: course.courseId,
        groupMemberId: waivedMember,
        profileId: waivedProfile,
        cycleNumber: 1,
        status: 'waived'
      });
      await insertComplianceCycle(
        tx,
        {
          courseId: course.courseId,
          groupMemberId: staleMember,
          profileId: staleProfile,
          cycleNumber: 1,
          status: 'compliant'
        },
        { completedAt: '2026-01-10T00:00:00Z' }
      );
      await insertComplianceCycle(tx, {
        courseId: course.courseId,
        groupMemberId: staleMember,
        profileId: staleProfile,
        cycleNumber: 2,
        status: 'in_progress'
      });

      const completion = await getBatchCourseIsComplete(
        course.courseId,
        [waivedProfile, staleProfile, expiringProfile, warnedProfile],
        tx
      );

      expect(completion.get(waivedProfile)).toBe(true);
      expect(completion.get(staleProfile)).toBe(false);
      expect(completion.get(expiringProfile)).toBe(false);
      expect(completion.get(warnedProfile)).toBe(true);
    });
  }, 30000);
});
