/**
 * Path search excludes deleted paths (both searches) and tutor memberships
 * (LMS search).
 *
 * Skipped when no database URL is available.
 */
import { describe, expect, it } from 'vitest';

import { ROLE } from '@cio/utils/constants';

import { searchLmsLearningPaths, searchOrgLearningPaths } from '@cio/db/queries/learning-path/learning-path';

import {
  hasDatabase,
  insertOrganization,
  insertPath,
  insertProfile,
  joinPath,
  withRollback
} from './fixtures/learner-db';

const describeDb = hasDatabase ? describe : describe.skip;
const AT = '2026-01-01T00:00:00.000Z';

describeDb('learning path search', () => {
  it('a deleted path is excluded from both searches', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'search-org');
      const studentId = await insertProfile(tx, 'student');

      const { pathId: livePathId } = await insertPath(tx, orgId, 'Live searchable path');
      await joinPath(tx, livePathId, studentId, AT);

      const { pathId: deletedPathId } = await insertPath(tx, orgId, 'Deleted searchable path', {
        status: 'DELETED'
      });
      await joinPath(tx, deletedPathId, studentId, AT);

      const orgResults = await searchOrgLearningPaths(orgId, 'searchable', 10, tx);
      expect(orgResults.map((row) => row.id)).toEqual([livePathId]);

      const lmsResults = await searchLmsLearningPaths(orgId, studentId, 'searchable', 10, tx);
      expect(lmsResults.map((row) => row.id)).toEqual([livePathId]);
    });
  });

  it('a tutor membership is excluded from LMS results', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'search-org');
      const tutorId = await insertProfile(tx, 'tutor');

      const { pathId } = await insertPath(tx, orgId, 'Tutor searchable path');
      await joinPath(tx, pathId, tutorId, AT, { roleId: ROLE.TUTOR });

      const lmsResults = await searchLmsLearningPaths(orgId, tutorId, 'searchable', 10, tx);
      expect(lmsResults).toEqual([]);

      const orgResults = await searchOrgLearningPaths(orgId, 'searchable', 10, tx);
      expect(orgResults.map((row) => row.id)).toEqual([pathId]);
    });
  });

  it('treats % and _ in the search as literal characters', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'escape-org');
      const { pathId: literal } = await insertPath(tx, orgId, 'Save 50% now');
      await insertPath(tx, orgId, 'Save 500 now');

      const results = await searchOrgLearningPaths(orgId, '50%', 10, tx);

      expect(results.map((row) => row.id)).toEqual([literal]);
    });
  });
});
