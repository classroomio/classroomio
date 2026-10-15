/**
 * Runs the learning-path course helpers against a real database. Each test
 * builds its own fixture in a rolled-back transaction. Skipped when no
 * database URL is available.
 */
import { describe, expect, it } from 'vitest';

import {
  addPathCourses,
  hasDatabase,
  insertCourse,
  insertOrganization,
  insertPath,
  withRollback
} from './fixtures/learner-db';

describe.skipIf(!hasDatabase)('learning-path course helpers (database)', () => {
  it('leave out removed links and deleted courses, in path order', async () => {
    await withRollback(async (tx) => {
      const { getCourseIdsInPath, listLearningPathCourses } = await import('@cio/db/queries/learning-path');

      const orgId = await insertOrganization(tx, 'Org');
      const path = await insertPath(tx, orgId, 'Data Science');
      const first = await insertCourse(tx, orgId, 'First', { lessons: 1 });
      const deleted = await insertCourse(tx, orgId, 'Deleted', { lessons: 1, status: 'DELETED' });
      const last = await insertCourse(tx, orgId, 'Last', { lessons: 1 });
      const removed = await insertCourse(tx, orgId, 'Removed', { lessons: 1 });
      await addPathCourses(tx, path.pathId, [first.courseId, deleted.courseId, last.courseId]);
      await addPathCourses(tx, path.pathId, [removed.courseId], '2026-09-01T00:00:00Z');

      const courseIds = await getCourseIdsInPath(path.pathId, tx);
      const courses = await listLearningPathCourses(path.pathId, tx);

      expect(courseIds).toEqual([first.courseId, last.courseId]);
      expect(courses.map((course) => course.courseId)).toEqual([first.courseId, last.courseId]);
    });
  }, 30000);

  it('reorder the active courses of a path that links a deleted course, and treat it as not in the path', async () => {
    await withRollback(async (tx) => {
      const { getCourseIdsInPath, isCourseInPath, reorderLearningPathCourses } = await import(
        '@cio/db/queries/learning-path'
      );

      const orgId = await insertOrganization(tx, 'Org');
      const path = await insertPath(tx, orgId, 'Data Science');
      const first = await insertCourse(tx, orgId, 'First', { lessons: 1 });
      const deleted = await insertCourse(tx, orgId, 'Deleted', { lessons: 1, status: 'DELETED' });
      const last = await insertCourse(tx, orgId, 'Last', { lessons: 1 });
      await addPathCourses(tx, path.pathId, [first.courseId, deleted.courseId, last.courseId]);

      await reorderLearningPathCourses(path.pathId, [last.courseId, first.courseId], tx);

      expect(await getCourseIdsInPath(path.pathId, tx)).toEqual([last.courseId, first.courseId]);
      expect(await isCourseInPath(path.pathId, first.courseId, tx)).toBe(true);
      expect(await isCourseInPath(path.pathId, deleted.courseId, tx)).toBe(false);
      await expect(
        reorderLearningPathCourses(path.pathId, [last.courseId, deleted.courseId, first.courseId], tx)
      ).rejects.toThrow();
    });
  }, 30000);
});
