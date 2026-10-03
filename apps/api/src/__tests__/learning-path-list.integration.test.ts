/**
 * Server-side path list filters: student-only counts, integer completion
 * buckets, stable paging, and tutor scoping.
 *
 * Skipped when no database URL is available.
 */
import { describe, expect, it } from 'vitest';

import { sql } from 'drizzle-orm';

import type { DbOrTxClient } from '@cio/db/drizzle';
import { countLearningPathsByOrg, listLearningPaths } from '@cio/db/queries/learning-path/learning-path';
import { ROLE } from '@cio/utils/constants';

import {
  addPathCourses,
  hasDatabase,
  insertCourse,
  insertOrganization,
  insertPath,
  insertProfile,
  joinPath,
  withRollback
} from './fixtures/learner-db';

const describeDb = hasDatabase ? describe : describe.skip;
const AT = '2026-01-01T00:00:00.000Z';

describeDb('learning path list filters', () => {
  it('tutor-only path counts as none; 1-of-4 completed is medium', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'list-org');

      const tutorId = await insertProfile(tx, 'tutor');
      const { pathId: tutorOnlyPath } = await insertPath(tx, orgId, 'Tutor only');
      await joinPath(tx, tutorOnlyPath, tutorId, AT, { roleId: ROLE.TUTOR });

      const s1 = await insertProfile(tx, 's1');
      const s2 = await insertProfile(tx, 's2');
      const s3 = await insertProfile(tx, 's3');
      const s4 = await insertProfile(tx, 's4');
      const { pathId: quarterPath } = await insertPath(tx, orgId, 'Quarter done');
      await joinPath(tx, quarterPath, s1, AT, { status: 'COMPLETED' });
      await joinPath(tx, quarterPath, s2, AT);
      await joinPath(tx, quarterPath, s3, AT);
      await joinPath(tx, quarterPath, s4, AT);

      const noneResult = await listLearningPaths(orgId, { enrollment: 'none' }, tx);
      expect(noneResult.data.map((p) => p.name)).toContain('Tutor only');
      expect(noneResult.data.map((p) => p.name)).not.toContain('Quarter done');
      expect(noneResult.data.find((p) => p.name === 'Tutor only')?.memberCount).toBe(0);

      const mediumResult = await listLearningPaths(orgId, { completion: 'medium' }, tx);
      expect(mediumResult.data.map((p) => p.name)).toContain('Quarter done');

      const lowResult = await listLearningPaths(orgId, { completion: 'low' }, tx);
      expect(lowResult.data.map((p) => p.name)).toContain('Tutor only');
    });
  });

  it('49 vs 50 member buckets; total equals filtered row count', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'bucket-org');
      const { pathId: smallPath } = await insertPath(tx, orgId, 'Small');
      const { pathId: largePath } = await insertPath(tx, orgId, 'Large');

      for (let i = 0; i < 49; i++) {
        const profileId = await insertProfile(tx, `small-${i}`);
        await joinPath(tx, smallPath, profileId, AT);
      }

      for (let i = 0; i < 50; i++) {
        const profileId = await insertProfile(tx, `large-${i}`);
        await joinPath(tx, largePath, profileId, AT);
      }

      const small = await listLearningPaths(orgId, { enrollment: '1-49' }, tx);
      expect(small.data.map((p) => p.name)).toContain('Small');
      expect(small.data.map((p) => p.name)).not.toContain('Large');

      const large = await listLearningPaths(orgId, { enrollment: '50+' }, tx);
      expect(large.data.map((p) => p.name)).toContain('Large');
      expect(large.data.map((p) => p.name)).not.toContain('Small');

      const total = await countLearningPathsByOrg(orgId, { enrollment: '50+' }, tx);
      expect(total).toBe(large.data.length);
      expect(large.pagination.total).toBe(total);
    });
  });

  it('stable order across pages; tutor scoping combines with filters', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'paging-org');
      const tutorId = await insertProfile(tx, 'paging-tutor');

      for (let i = 0; i < 5; i++) {
        const { pathId } = await insertPath(tx, orgId, `Path ${i}`);
        const studentId = await insertProfile(tx, `paging-student-${i}`);
        await joinPath(tx, pathId, studentId, AT);

        if (i < 2) {
          await joinPath(tx, pathId, tutorId, AT, { roleId: ROLE.TUTOR });
        }
      }

      // Every path shares the transaction's created_at, so the id tie-breaker
      // alone decides the order: pages must follow it exactly.
      const page1 = await listLearningPaths(orgId, { limit: 2, page: 1 }, tx);
      const page2 = await listLearningPaths(orgId, { limit: 2, page: 2 }, tx);
      const page3 = await listLearningPaths(orgId, { limit: 2, page: 3 }, tx);
      const pagedIds = [...page1.data, ...page2.data, ...page3.data].map((p) => p.id);
      const allIds = (await listLearningPaths(orgId, {}, tx)).data.map((p) => p.id);
      expect(pagedIds).toEqual(allIds);
      expect(allIds).toEqual([...allIds].sort().reverse());

      const scoped = await listLearningPaths(orgId, { tutorProfileId: tutorId, enrollment: '1-49' }, tx);
      expect(scoped.data).toHaveLength(2);
      expect(scoped.pagination.total).toBe(2);
    });
  });

  /** Creates a path with `students` STUDENT members, the first `completed` of them COMPLETED. */
  async function pathWithRate(tx: DbOrTxClient, orgId: string, name: string, students: number, completed: number) {
    const { pathId } = await insertPath(tx, orgId, name);

    for (let i = 0; i < students; i++) {
      const profileId = await insertProfile(tx, `${name}-${i}`);
      await joinPath(tx, pathId, profileId, AT, i < completed ? { status: 'COMPLETED' } : {});
    }

    return pathId;
  }

  it('completion buckets at the exact edges, displayed and filtered the same way', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'edges-org');
      await pathWithRate(tx, orgId, 'r24', 25, 6);
      await pathWithRate(tx, orgId, 'r25', 4, 1);
      await pathWithRate(tx, orgId, 'r75', 4, 3);
      await pathWithRate(tx, orgId, 'r76', 25, 19);
      await pathWithRate(tx, orgId, 'r33', 3, 1);
      await pathWithRate(tx, orgId, 'r58', 40, 23);

      const names = async (completion: 'low' | 'medium' | 'high') =>
        (await listLearningPaths(orgId, { completion }, tx)).data.map((p) => p.name).sort();

      expect(await names('low')).toEqual(['r24']);
      expect(await names('medium')).toEqual(['r25', 'r33', 'r58', 'r75']);
      expect(await names('high')).toEqual(['r76']);

      const rates = Object.fromEntries(
        (await listLearningPaths(orgId, {}, tx)).data.map((p) => [p.name, p.completionRate])
      );
      // 23/40 = 57.5: shown as 58, the same integer the filter buckets.
      expect(rates).toEqual({ r24: 24, r25: 25, r75: 75, r76: 76, r33: 33, r58: 58 });
    });
  });

  it('counts exclude removed students and completed tutors', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'exclusions-org');
      const { pathId } = await insertPath(tx, orgId, 'Mixed');
      const active = await insertProfile(tx, 'active');
      const removed = await insertProfile(tx, 'removed');
      const tutor = await insertProfile(tx, 'tutor');
      await joinPath(tx, pathId, active, AT);
      await joinPath(tx, pathId, removed, AT, { status: 'COMPLETED', removedAt: AT });
      await joinPath(tx, pathId, tutor, AT, { status: 'COMPLETED', roleId: ROLE.TUTOR });

      const [row] = (await listLearningPaths(orgId, {}, tx)).data;

      expect(row).toMatchObject({ memberCount: 1, completionsCount: 0, completionRate: 0 });
    });
  });

  it('status filter and combined filters agree with the total', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'status-org');
      const published = await pathWithRate(tx, orgId, 'Published react', 2, 2);
      await pathWithRate(tx, orgId, 'Draft react', 2, 2);
      await pathWithRate(tx, orgId, 'Published vue', 2, 0);
      await tx.execute(sql`UPDATE learning_path SET is_published = true WHERE id = ${published}`);
      await tx.execute(
        sql`UPDATE learning_path SET is_published = true WHERE name = 'Published vue' AND organization_id = ${orgId}`
      );

      const unpublished = await listLearningPaths(orgId, { status: 'unpublished' }, tx);
      expect(unpublished.data.map((p) => p.name)).toEqual(['Draft react']);

      const combined = { status: 'published', enrollment: '1-49', completion: 'high', search: 'react' } as const;
      const result = await listLearningPaths(orgId, combined, tx);
      expect(result.data.map((p) => p.name)).toEqual(['Published react']);
      expect(await countLearningPathsByOrg(orgId, combined, tx)).toBe(1);
    });
  });

  it('sorts by courses, published and last updated in both directions', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'sort-org');
      const { pathId: one } = await insertPath(tx, orgId, 'One course');
      const { pathId: two } = await insertPath(tx, orgId, 'Two courses');
      const { pathId: none } = await insertPath(tx, orgId, 'No courses');
      const { courseId: c1 } = await insertCourse(tx, orgId, 'C1', { lessons: 0 });
      const { courseId: c2 } = await insertCourse(tx, orgId, 'C2', { lessons: 0 });
      await addPathCourses(tx, one, [c1]);
      await addPathCourses(tx, two, [c1, c2]);
      await tx.execute(sql`UPDATE learning_path SET is_published = true WHERE id = ${one}`);
      await tx.execute(sql`UPDATE learning_path SET updated_at = '2026-05-01T00:00:00Z' WHERE id = ${none}`);
      await tx.execute(sql`UPDATE learning_path SET updated_at = '2026-03-01T00:00:00Z' WHERE id = ${two}`);
      await tx.execute(sql`UPDATE learning_path SET updated_at = '2026-02-01T00:00:00Z' WHERE id = ${one}`);

      const order = async (sort: 'courses' | 'published' | 'last_updated_at', direction: 'asc' | 'desc') =>
        (await listLearningPaths(orgId, { sort, order: direction }, tx)).data.map((p) => p.name);

      expect(await order('courses', 'desc')).toEqual(['Two courses', 'One course', 'No courses']);
      expect(await order('courses', 'asc')).toEqual(['No courses', 'One course', 'Two courses']);
      expect((await order('published', 'desc'))[0]).toBe('One course');
      expect((await order('published', 'asc')).at(-1)).toBe('One course');
      expect(await order('last_updated_at', 'desc')).toEqual(['No courses', 'Two courses', 'One course']);
      expect(await order('last_updated_at', 'asc')).toEqual(['One course', 'Two courses', 'No courses']);
    });
  });
});
