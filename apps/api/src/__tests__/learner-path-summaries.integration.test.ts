/**
 * getLearnerPathSummaries leaves out tutor memberships, removed memberships,
 * other-org memberships, and inactive courses.
 *
 * Skipped when no database URL is available.
 */
import { describe, expect, it } from 'vitest';

import { ROLE } from '@cio/utils/constants';

import { sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

import { getLearnerPathSummaries, getPathJourney } from '@cio/db/queries/learning-path/journey';
import { summarizeJourney } from '@api/services/learning-path/journey';
import type { DbOrTxClient } from '@cio/db/drizzle';

import {
  addPathCourses,
  completeLessons,
  hasDatabase,
  insertCourse,
  insertMember,
  insertOrganization,
  insertPath,
  insertProfile,
  joinPath,
  withRollback
} from './fixtures/learner-db';

const describeDb = hasDatabase ? describe : describe.skip;
const AT = '2026-01-01T00:00:00.000Z';

describeDb('getLearnerPathSummaries', () => {
  it('excludes tutor, removed and other-org memberships plus inactive courses', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'summaries-org');
      const otherOrgId = await insertOrganization(tx, 'summaries-other-org');

      const studentId = await insertProfile(tx, 'student');
      const tutorId = await insertProfile(tx, 'tutor');

      const active = await insertBareCourse(tx, orgId, 'Active course', 'ACTIVE');
      const inactive = await insertBareCourse(tx, orgId, 'Inactive course', 'DRAFT');
      const otherOrgCourse = await insertBareCourse(tx, otherOrgId, 'Other org course', 'ACTIVE');

      const { pathId } = await insertPath(tx, orgId, 'Student path');
      await addPathCourses(tx, pathId, [active.courseId, inactive.courseId]);

      await joinPath(tx, pathId, studentId, AT);
      await joinPath(tx, pathId, tutorId, AT, { roleId: ROLE.TUTOR });

      const { pathId: removedPathId } = await insertPath(tx, orgId, 'Removed path');
      await joinPath(tx, removedPathId, studentId, AT, { removedAt: '2026-02-01T00:00:00.000Z' });

      const { pathId: otherOrgPathId } = await insertPath(tx, otherOrgId, 'Other org path');
      await addPathCourses(tx, otherOrgPathId, [otherOrgCourse.courseId]);
      await joinPath(tx, otherOrgPathId, studentId, AT);

      const summaries = await getLearnerPathSummaries({ orgId, profileId: studentId, limit: 10 }, tx);

      expect(summaries.map((summary) => summary.name)).toEqual(['Student path']);
      expect(summaries[0].courses.map((course) => course.courseId)).toEqual([active.courseId]);

      const tutorSummaries = await getLearnerPathSummaries({ orgId, profileId: tutorId, limit: 10 }, tx);
      expect(tutorSummaries).toEqual([]);
    });
  });

  it('agrees with the path journey for every path, including a course shared by two paths', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'parity-org');
      const studentId = await insertProfile(tx, 'parity-student');
      const shared = await insertCourse(tx, orgId, 'Shared', { lessons: 2 });
      const onlyA = await insertCourse(tx, orgId, 'Only A', { lessons: 1 });
      const onlyB = await insertCourse(tx, orgId, 'Only B', { lessons: 1 });

      const { pathId: pathA } = await insertPath(tx, orgId, 'Path A');
      const { pathId: pathB } = await insertPath(tx, orgId, 'Path B');
      await addPathCourses(tx, pathA, [shared.courseId, onlyA.courseId]);
      await addPathCourses(tx, pathB, [onlyB.courseId, shared.courseId]);
      const memberA = await joinPath(tx, pathA, studentId, AT);
      const memberB = await joinPath(tx, pathB, studentId, AT);

      for (const course of [shared, onlyA, onlyB]) {
        await insertMember(tx, course.groupId, studentId);
      }
      await completeLessons(tx, shared.lessonIds, studentId, AT);

      const summaries = await getLearnerPathSummaries({ orgId, profileId: studentId, limit: 10 }, tx);

      for (const [pathId, memberId] of [
        [pathA, memberA],
        [pathB, memberB]
      ]) {
        const summary = summaries.find((entry) => entry.pathId === pathId)!;
        const journey = await getPathJourney({ pathId, memberId, profileId: studentId, sequentialUnlock: true }, tx);

        // The shared course appears once per path, not once per path that holds it.
        expect(summary.courses.map((course) => course.courseId)).toEqual(
          journey.courses.map((course) => course.courseId)
        );
        expect(summarizeJourney(summary.courses)).toEqual(summarizeJourney(journey.courses));
      }

      expect(summarizeJourney(summaries.find((entry) => entry.pathId === pathA)!.courses)).toMatchObject({
        progressPercent: 50,
        currentCourseId: onlyA.courseId
      });
    });
  });

  it('applies the limit to paths, not to course rows', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'limit-org');
      const studentId = await insertProfile(tx, 'limit-student');
      const courses = [];

      for (let index = 0; index < 3; index++) {
        courses.push((await insertCourse(tx, orgId, `C${index}`, { lessons: 0 })).courseId);
      }

      const { pathId: first } = await insertPath(tx, orgId, 'First');
      const { pathId: second } = await insertPath(tx, orgId, 'Second');
      await addPathCourses(tx, first, courses);
      await addPathCourses(tx, second, courses);
      await joinPath(tx, first, studentId, '2026-01-02T00:00:00.000Z');
      await joinPath(tx, second, studentId, AT);

      const summaries = await getLearnerPathSummaries({ orgId, profileId: studentId, limit: 1 }, tx);

      expect(summaries).toHaveLength(1);
      expect(summaries[0].name).toBe('First');
      expect(summaries[0].courses).toHaveLength(3);
    });
  });
});

/** Minimal course insert avoiding columns the test database may not have yet. */
async function insertBareCourse(tx: DbOrTxClient, orgId: string, title: string, status: string) {
  const groupId = randomUUID();
  const courseId = randomUUID();
  await tx.execute(sql`INSERT INTO "group" (id, name, organization_id) VALUES (${groupId}, ${title}, ${orgId})`);
  await tx.execute(sql`INSERT INTO course (id, title, description, group_id, type, status)
    VALUES (${courseId}, ${title}, 'x', ${groupId}, 'SELF_PACED', ${status})`);

  return { courseId, groupId };
}
