/**
 * filterOutPathOnlyCourseIds against the database: path-only courses are
 * split out (and reported) while open courses pass through in order.
 *
 * Skipped when no database URL is available.
 */
import { describe, expect, it } from 'vitest';

import { filterOutPathOnlyCourseIds } from '@api/services/course/path-gate';

import { hasDatabase, insertCourse, insertOrganization, withRollback } from './fixtures/learner-db';

const describeDb = hasDatabase ? describe : describe.skip;

describeDb('filterOutPathOnlyCourseIds (database)', () => {
  it('splits path-only courses from open ones', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'path-only-org');
      const { courseId: open } = await insertCourse(tx, orgId, 'Open', { lessons: 0 });
      const { courseId: pathOnly } = await insertCourse(tx, orgId, 'Path only', {
        lessons: 0,
        enrollOnlyInLearningPath: true
      });

      const result = await filterOutPathOnlyCourseIds([pathOnly, open], tx);

      expect(result).toEqual({ allowedCourseIds: [open], skippedPathOnlyCourseIds: [pathOnly] });
    });
  });
});
