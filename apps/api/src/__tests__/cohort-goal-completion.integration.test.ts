/**
 * Runs getRecordedCourseCompletions, the completion source for cohort goals,
 * against a real database. Each test builds its own fixture in a rolled-back
 * transaction. Skipped when no database URL is available.
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
} from './fixtures/learner-db';

const STILL_VALID = '2099-01-01T00:00:00Z';

describe.skipIf(!hasDatabase)('getRecordedCourseCompletions (database)', () => {
  it('counts recorded completion, not lessons ticked off', async () => {
    await withRollback(async (tx) => {
      const { getRecordedCourseCompletions } = await import('@cio/db/queries/cohort/goal');

      const orgId = await insertOrganization(tx, 'Org');
      const course = await insertCourse(tx, orgId, 'Excel', { lessons: 3 });
      const partial = await insertProfile(tx, 'partial');
      const recorded = await insertProfile(tx, 'recorded');
      const unrecorded = await insertProfile(tx, 'unrecorded');
      await insertMember(tx, course.groupId, partial);
      const recordedMember = await insertMember(tx, course.groupId, recorded);
      await insertMember(tx, course.groupId, unrecorded);

      // One of three lessons: the old lessons-only query counted this as done.
      await completeLessons(tx, course.lessonIds.slice(0, 1), partial, '2026-09-01T00:00:00Z');
      await recordCourseCompletion(tx, recordedMember, '2026-09-02T00:00:00Z');
      // Every lesson, but the certification rule never recorded completion.
      await completeLessons(tx, course.lessonIds, unrecorded, '2026-09-03T00:00:00Z');

      const completions = await getRecordedCourseCompletions([partial, recorded, unrecorded], [course.courseId], tx);

      expect([...completions]).toEqual([`${recorded}:${course.courseId}`]);
    });
  }, 30000);

  it("follows a compliance course's current cycle: completed and valid, or waived, whatever lessons are done", async () => {
    await withRollback(async (tx) => {
      const { getRecordedCourseCompletions } = await import('@cio/db/queries/cohort/goal');

      const orgId = await insertOrganization(tx, 'Org');
      const course = await insertCourse(tx, orgId, 'Safety', { lessons: 1, type: 'COMPLIANCE' });
      const cycles = [
        { name: 'compliant', status: 'compliant', completedAt: '2026-09-01T00:00:00Z', validUntil: STILL_VALID },
        { name: 'waived', status: 'waived' },
        { name: 'in-progress', status: 'in_progress' },
        { name: 'due-soon', status: 'expiring_soon' },
        { name: 'warned', status: 'expiring_soon', completedAt: '2025-11-20T00:00:00Z', validUntil: STILL_VALID },
        { name: 'lapsed', status: 'compliant', completedAt: '2025-01-10T00:00:00Z', validUntil: '2026-01-10T00:00:00Z' }
      ];
      const profileByName = new Map<string, string>();

      for (const cycle of cycles) {
        const profileId = await insertProfile(tx, cycle.name);
        const groupMemberId = await insertMember(tx, course.groupId, profileId);
        // Lessons done on every row, so an open cycle can no longer fall back to lesson counts.
        await completeLessons(tx, course.lessonIds, profileId, '2026-09-01T00:00:00Z');
        await insertComplianceCycle(
          tx,
          { courseId: course.courseId, groupMemberId, profileId, cycleNumber: 1, status: cycle.status },
          { completedAt: cycle.completedAt, validUntil: cycle.validUntil }
        );
        profileByName.set(cycle.name, profileId);
      }

      const completions = await getRecordedCourseCompletions([...profileByName.values()], [course.courseId], tx);

      expect([...completions].sort()).toEqual(
        ['compliant', 'waived', 'warned'].map((name) => `${profileByName.get(name)}:${course.courseId}`).sort()
      );
    });
  }, 30000);

  it('only answers for the listed learners and courses', async () => {
    await withRollback(async (tx) => {
      const { getRecordedCourseCompletions } = await import('@cio/db/queries/cohort/goal');

      const orgId = await insertOrganization(tx, 'Org');
      const listed = await insertCourse(tx, orgId, 'Listed', { lessons: 1 });
      const unlisted = await insertCourse(tx, orgId, 'Unlisted', { lessons: 1 });
      const ada = await insertProfile(tx, 'ada');
      const bob = await insertProfile(tx, 'bob');
      await recordCourseCompletion(tx, await insertMember(tx, listed.groupId, ada), '2026-09-01T00:00:00Z');
      await recordCourseCompletion(tx, await insertMember(tx, unlisted.groupId, ada), '2026-09-01T00:00:00Z');
      await recordCourseCompletion(tx, await insertMember(tx, listed.groupId, bob), '2026-09-01T00:00:00Z');

      const completions = await getRecordedCourseCompletions([ada], [listed.courseId], tx);

      expect([...completions]).toEqual([`${ada}:${listed.courseId}`]);
      expect(await getRecordedCourseCompletions([], [listed.courseId], tx)).toEqual(new Set());
    });
  }, 30000);
});
