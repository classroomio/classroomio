/**
 * enrollBulkMember SQL semantics: active rows keep their role, removals from
 * before the enqueue are re-enrolled, removals after it stand (null).
 *
 * Skipped when no database URL is available.
 */
import { describe, expect, it } from 'vitest';

import { enrollBulkMember, enrollMember } from '@cio/db/queries/learning-path/learning-path-member';
import { ROLE } from '@cio/utils/constants';

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

describeDb('enrollBulkMember', () => {
  it('an active tutor keeps their role', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'bulk-member-org');
      const tutorId = await insertProfile(tx, 'tutor');
      const { pathId } = await insertPath(tx, orgId, 'Bulk path');
      await joinPath(tx, pathId, tutorId, AT, { roleId: ROLE.TUTOR });

      const member = await enrollBulkMember(
        { learningPathId: pathId, profileId: tutorId, email: null, roleId: ROLE.STUDENT, status: 'NOT_STARTED' },
        '2026-02-01T00:00:00.000Z',
        tx
      );

      expect(member?.roleId).toBe(ROLE.TUTOR);
      expect(member?.removedAt).toBeNull();
    });
  });

  it('removed before enqueue is re-enrolled with the new role', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'bulk-member-org');
      const studentId = await insertProfile(tx, 'student');
      const { pathId } = await insertPath(tx, orgId, 'Bulk path');
      await joinPath(tx, pathId, studentId, AT, { removedAt: '2026-01-15T00:00:00.000Z' });

      const member = await enrollBulkMember(
        { learningPathId: pathId, profileId: studentId, email: null, roleId: ROLE.STUDENT, status: 'NOT_STARTED' },
        '2026-02-01T00:00:00.000Z',
        tx
      );

      expect(member?.roleId).toBe(ROLE.STUDENT);
      expect(member?.removedAt).toBeNull();
    });
  });

  it('removed after enqueue stands and returns null', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'bulk-member-org');
      const studentId = await insertProfile(tx, 'student');
      const { pathId } = await insertPath(tx, orgId, 'Bulk path');
      await joinPath(tx, pathId, studentId, AT, { removedAt: '2026-03-01T00:00:00.000Z' });

      const member = await enrollBulkMember(
        { learningPathId: pathId, profileId: studentId, email: null, roleId: ROLE.STUDENT, status: 'NOT_STARTED' },
        '2026-02-01T00:00:00.000Z',
        tx
      );

      expect(member).toBeNull();
    });
  });
});

describeDb('re-adding a removed member', () => {
  it('restarts the cached progress instead of reviving an old completion', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'readd-org');
      const studentId = await insertProfile(tx, 'returning');
      const { pathId } = await insertPath(tx, orgId, 'Readd path');
      await joinPath(tx, pathId, studentId, AT, { status: 'COMPLETED', removedAt: '2026-01-15T00:00:00.000Z' });

      const member = await enrollMember(
        { learningPathId: pathId, profileId: studentId, email: null, roleId: ROLE.STUDENT, status: 'NOT_STARTED' },
        tx
      );

      expect(member).toMatchObject({
        removedAt: null,
        status: 'NOT_STARTED',
        progressPercent: 0,
        completedCourseCount: 0,
        completedAt: null
      });
      expect(member.enrolledAt > AT).toBe(true);
    });
  });

  it('keeps the cache of a member who was never removed', async () => {
    await withRollback(async (tx) => {
      const orgId = await insertOrganization(tx, 'readd-org');
      const studentId = await insertProfile(tx, 'active');
      const { pathId } = await insertPath(tx, orgId, 'Readd path');
      await joinPath(tx, pathId, studentId, AT, { status: 'COMPLETED' });

      const member = await enrollMember(
        { learningPathId: pathId, profileId: studentId, email: null, roleId: ROLE.STUDENT, status: 'NOT_STARTED' },
        tx
      );

      expect(member.status).toBe('COMPLETED');
      expect(new Date(member.enrolledAt).toISOString()).toBe(AT);
    });
  });
});
