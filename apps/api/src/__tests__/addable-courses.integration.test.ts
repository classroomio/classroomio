/**
 * getAddableOrgCourses against the database: the add-courses pickers page
 * only courses the matching add call accepts, with every exclusion in SQL.
 *
 * Skipped when no database URL is available.
 */
import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import type { DbOrTxClient } from '@cio/db/drizzle';
import { getAddableOrgCourses } from '@cio/db/queries/course';

import {
  addPathCourses,
  hasDatabase,
  insertCourse,
  insertMember,
  insertOrganization,
  insertPath,
  insertProfile,
  withRollback
} from './fixtures/learner-db';

const describeDb = hasDatabase ? describe : describe.skip;

async function insertCohortWithCourses(tx: DbOrTxClient, orgId: string, courseIds: string[]) {
  const cohortId = randomUUID();
  await tx.execute(sql`INSERT INTO cohort (id, organization_id, name) VALUES (${cohortId}, ${orgId}, 'Cohort')`);

  for (const courseId of courseIds) {
    await tx.execute(sql`INSERT INTO cohort_course (cohort_id, course_id) VALUES (${cohortId}, ${courseId})`);
  }

  return cohortId;
}

const titlesOf = (result: { items: Array<{ title: string }> }) => result.items.map((course) => course.title);

describeDb('getAddableOrgCourses (database)', () => {
  it('leaves out courses already in the cohort, path-only, inactive and other-org courses', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'addable-cohort-org');
      const otherOrgId = await insertOrganization(tx, 'addable-other-org');
      const { courseId: inCohort } = await insertCourse(tx, orgId, 'B in cohort', { lessons: 0 });
      await insertCourse(tx, orgId, 'A open', { lessons: 0 });
      await insertCourse(tx, orgId, 'C path only', { lessons: 0, enrollOnlyInLearningPath: true });
      await insertCourse(tx, orgId, 'D deleted', { lessons: 0, status: 'DELETED' });
      await insertCourse(tx, otherOrgId, 'E other org', { lessons: 0 });
      const cohortId = await insertCohortWithCourses(tx, orgId, [inCohort]);

      const result = await getAddableOrgCourses(
        { orgId, excludePathOnly: true, excludeCohortId: cohortId, page: 1, limit: 20 },
        tx
      );

      expect(titlesOf(result)).toEqual(['A open']);
      expect(result.total).toBe(1);
    });
  });

  it('keeps path-only courses for a path and re-offers courses whose path link was removed', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'addable-path-org');
      const { courseId: linked } = await insertCourse(tx, orgId, 'A linked', { lessons: 0 });
      const { courseId: removed } = await insertCourse(tx, orgId, 'B removed link', { lessons: 0 });
      await insertCourse(tx, orgId, 'C path only', { lessons: 0, enrollOnlyInLearningPath: true });
      const { pathId } = await insertPath(tx, orgId, 'Path');
      await addPathCourses(tx, pathId, [linked]);
      await addPathCourses(tx, pathId, [removed], new Date().toISOString());

      const result = await getAddableOrgCourses({ orgId, excludeLearningPathId: pathId, page: 1, limit: 20 }, tx);

      expect(titlesOf(result)).toEqual(['B removed link', 'C path only']);
    });
  });

  it('limits a non-admin to courses they belong to', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'addable-member-org');
      const tutorId = await insertProfile(tx, 'addable-tutor');
      const { groupId: taughtGroupId } = await insertCourse(tx, orgId, 'A taught', { lessons: 0 });
      await insertCourse(tx, orgId, 'B not taught', { lessons: 0 });
      await insertMember(tx, taughtGroupId, tutorId);

      const result = await getAddableOrgCourses({ orgId, memberProfileId: tutorId, page: 1, limit: 20 }, tx);

      expect(titlesOf(result)).toEqual(['A taught']);
    });
  });

  it('pages in title order with a total of all matches, and treats LIKE wildcards literally', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'addable-paging-org');
      for (const title of ['Course 3', 'Course 1', 'Course 2', '100% SQL', 'Course_x']) {
        await insertCourse(tx, orgId, title, { lessons: 0 });
      }

      const secondPage = await getAddableOrgCourses({ orgId, search: 'course', page: 2, limit: 2 }, tx);
      const percentSearch = await getAddableOrgCourses({ orgId, search: '100%', page: 1, limit: 20 }, tx);
      const underscoreSearch = await getAddableOrgCourses({ orgId, search: 'e_', page: 1, limit: 20 }, tx);

      expect(titlesOf(secondPage)).toEqual(['Course 3', 'Course_x']);
      expect(secondPage.total).toBe(4);
      expect(titlesOf(percentSearch)).toEqual(['100% SQL']);
      expect(titlesOf(underscoreSearch)).toEqual(['Course_x']);
    });
  });
});
