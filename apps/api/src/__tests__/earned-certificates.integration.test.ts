/**
 * Runs getEarnedCertificates against a real database. Every test builds its
 * own fixture inside a transaction and rolls it back, so it needs no seed data
 * and leaves nothing behind. Skipped when no database URL is available.
 *
 * Run (Node 20, Postgres up):
 *   DATABASE_URL="$(grep ^DATABASE_URL= apps/api/.env | cut -d= -f2- | tr -d '"')" \
 *     pnpm --filter @cio/api vitest run src/__tests__/earned-certificates.integration.test.ts
 */
import { describe, expect, it } from 'vitest';

import type { DbOrTxClient } from '@cio/db/drizzle';
import type { TEarnedCertificatesPage } from '@cio/db/queries/certificates';

import {
  addPathCourses,
  completeLessons,
  earnCourseCertificate,
  hasDatabase,
  insertComplianceCycle,
  insertGrant,
  insertCourse,
  insertMember,
  insertOrgMember,
  insertOrganization,
  insertPath,
  insertProfile,
  issuePathCertificate,
  joinPath,
  recordCourseCompletion,
  withRollback
} from './fixtures/learner-db';

const STILL_VALID = '2099-01-01T00:00:00Z';

type CourseOptions = {
  org?: string;
  profileId?: string;
  type?: string;
  courseStatus?: string;
  downloadable?: boolean;
  completedAt?: string | null;
  grantRevokedAt?: string;
};

type PathOptions = {
  org?: string;
  profileId?: string;
  pathStatus?: string;
  downloadable?: boolean;
  memberStatus?: string;
  memberRemovedAt?: string;
  completedAt?: string;
  certificate?: 'valid' | 'revoked' | 'none';
  courseIds?: string[];
};

async function seedOrg(tx: DbOrTxClient) {
  const ada = await insertProfile(tx, 'ada');
  const bob = await insertProfile(tx, 'bob');
  const orgId = await insertOrganization(tx, 'Org');
  const otherOrgId = await insertOrganization(tx, 'Other');
  await insertOrgMember(tx, orgId, ada);
  await insertOrgMember(tx, orgId, bob);

  const takeCourse = async (title: string, options: CourseOptions = {}) => {
    const course = await insertCourse(tx, options.org ?? orgId, title, {
      lessons: 1,
      type: options.type,
      status: options.courseStatus,
      certificateDownloadable: options.downloadable ?? true
    });
    const profileId = options.profileId ?? ada;
    const groupMemberId = await insertMember(tx, course.groupId, profileId);
    await insertGrant(
      tx,
      { groupMemberId, courseId: course.courseId, profileId, source: 'SELF_ENROLL', grantedAt: '2026-08-01T00:00:00Z' },
      { revokedAt: options.grantRevokedAt }
    );
    const completedAt = options.completedAt === undefined ? '2026-09-01T00:00:00Z' : options.completedAt;

    if (completedAt) {
      await recordCourseCompletion(tx, groupMemberId, completedAt);
    }

    return { ...course, groupMemberId };
  };

  const completePath = async (name: string, options: PathOptions = {}) => {
    const profileId = options.profileId ?? ada;
    const path = await insertPath(tx, options.org ?? orgId, name, {
      status: options.pathStatus,
      certificateDownloadable: options.downloadable ?? true
    });
    await addPathCourses(tx, path.pathId, options.courseIds ?? []);
    const memberStatus = options.memberStatus ?? 'COMPLETED';
    const completedAt = options.completedAt ?? '2026-09-01T00:00:00Z';
    const memberId = await joinPath(tx, path.pathId, profileId, '2026-08-01T00:00:00Z', {
      status: memberStatus,
      completedAt: memberStatus === 'COMPLETED' ? completedAt : undefined,
      removedAt: options.memberRemovedAt
    });
    const certificate = options.certificate ?? 'valid';

    if (certificate !== 'none') {
      const revocation =
        certificate === 'revoked' ? { status: 'revoked' as const, revokedAt: '2026-09-20T00:00:00Z' } : {};
      await issuePathCertificate(tx, { pathId: path.pathId, memberId, profileId, issuedAt: completedAt }, revocation);
    }

    return path;
  };

  return { ada, bob, orgId, otherOrgId, takeCourse, completePath };
}

async function readCertificates(
  tx: DbOrTxClient,
  options: {
    orgId: string;
    profileId: string;
    page?: number;
    limit?: number;
    search?: string;
    certificatesEnabled?: boolean;
  }
) {
  const { getEarnedCertificates } = await import('@cio/db/queries/certificates');

  return getEarnedCertificates(
    {
      orgId: options.orgId,
      profileId: options.profileId,
      page: options.page ?? 1,
      limit: options.limit ?? 12,
      search: options.search,
      certificatesEnabled: options.certificatesEnabled ?? true
    },
    tx
  );
}

function toTitles(page: TEarnedCertificatesPage) {
  return page.items.map((item) => (item.kind === 'course' ? `course:${item.data.title}` : `path:${item.data.name}`));
}

function toAvailability(page: TEarnedCertificatesPage) {
  return page.items.map((item) => item.data.certificateAvailable);
}

function toEarnedAt(page: TEarnedCertificatesPage) {
  return page.items.map((item) => item.data.earnedAt && new Date(item.data.earnedAt).toISOString());
}

describe.skipIf(!hasDatabase)('getEarnedCertificates (database)', () => {
  it('merges completed courses and paths in this org, most recently completed first', async () => {
    await withRollback(async (tx) => {
      const { ada, bob, orgId, otherOrgId, takeCourse, completePath } = await seedOrg(tx);

      const excel = await takeCourse('Excel', { completedAt: '2026-09-05T00:00:00Z' });
      await takeCourse('Python', { completedAt: '2026-09-20T00:00:00Z' });
      await takeCourse('Not completed', { completedAt: null });
      await takeCourse('Course download off', { downloadable: false, completedAt: '2026-09-04T00:00:00Z' });
      await takeCourse('Deleted course', { courseStatus: 'DELETED' });
      await takeCourse('Other org course', { org: otherOrgId });
      await takeCourse("Bob's course", { profileId: bob });
      await takeCourse('Access revoked', { grantRevokedAt: '2026-09-10T00:00:00Z' });

      const retired = await takeCourse('Retired course', { courseStatus: 'DELETED', completedAt: null });
      await completePath('Data Science', {
        completedAt: '2026-09-10T00:00:00Z',
        courseIds: [excel.courseId, retired.courseId]
      });
      await completePath('Path download off', { downloadable: false, completedAt: '2026-09-03T00:00:00Z' });
      await completePath('Certificate revoked', { certificate: 'revoked', completedAt: '2026-09-02T00:00:00Z' });
      await completePath('Left the path', { memberRemovedAt: '2026-09-10T00:00:00Z' });
      await completePath('Reopened', { memberStatus: 'IN_PROGRESS' });
      await completePath('Deleted path', { pathStatus: 'DELETED' });
      await completePath('Other org path', { org: otherOrgId });
      await completePath("Bob's path", { profileId: bob });

      const page = await readCertificates(tx, { orgId, profileId: ada });

      expect(toTitles(page)).toEqual([
        'course:Python',
        'path:Data Science',
        'course:Excel',
        'course:Course download off',
        'path:Path download off',
        'path:Certificate revoked'
      ]);
      expect(page.total).toBe(6);
      expect(toAvailability(page)).toEqual([true, true, true, false, false, false]);
      expect(toEarnedAt(page)).toEqual([
        '2026-09-20T00:00:00.000Z',
        '2026-09-10T00:00:00.000Z',
        '2026-09-05T00:00:00.000Z',
        '2026-09-04T00:00:00.000Z',
        '2026-09-03T00:00:00.000Z',
        '2026-09-02T00:00:00.000Z'
      ]);

      const dataScience = page.items.find((item) => item.kind === 'learning_path');
      expect(dataScience?.kind === 'learning_path' && dataScience.data.courseCount).toBe(1);
      expect(dataScience?.kind === 'learning_path' && dataScience.data.certificateId).toMatch(/^CERT-/);
    });
  }, 30000);

  it('reads recorded completion, never live progress', async () => {
    await withRollback(async (tx) => {
      const { ada, orgId, takeCourse, completePath } = await seedOrg(tx);

      // Every lesson done, but the rule (say a failed final exercise) never recorded completion.
      const looksDone = await takeCourse('Looks done', { completedAt: null });
      await completeLessons(tx, looksDone.lessonIds, ada, '2026-09-06T00:00:00Z');
      // No lessons done, but a 0% threshold met the rule and recorded completion.
      await takeCourse('Threshold met', { completedAt: '2026-09-07T00:00:00Z' });
      // Every course done, but progress sync has not marked the path complete.
      const finishedCourse = await takeCourse('Finished course', { completedAt: null });
      await completeLessons(tx, finishedCourse.lessonIds, ada, '2026-09-06T00:00:00Z');
      await completePath('Not marked complete', {
        memberStatus: 'IN_PROGRESS',
        certificate: 'none',
        courseIds: [finishedCourse.courseId]
      });

      expect(toTitles(await readCertificates(tx, { orgId, profileId: ada }))).toEqual(['course:Threshold met']);
    });
  }, 30000);

  it('lists completions on a plan without certificates, with nothing downloadable', async () => {
    await withRollback(async (tx) => {
      const { ada, orgId, takeCourse, completePath } = await seedOrg(tx);

      await takeCourse('Excel', { completedAt: '2026-09-05T00:00:00Z' });
      await completePath('Data Science', { certificate: 'none', completedAt: '2026-09-04T00:00:00Z' });

      const disabled = await readCertificates(tx, { orgId, profileId: ada, certificatesEnabled: false });
      expect(toTitles(disabled)).toEqual(['course:Excel', 'path:Data Science']);
      expect(toAvailability(disabled)).toEqual([false, false]);

      // After an upgrade the course downloads (evaluation earns it on demand); the path waits for its issue.
      const enabled = await readCertificates(tx, { orgId, profileId: ada });
      expect(toAvailability(enabled)).toEqual([true, false]);
    });
  }, 30000);

  it('lists every earned compliance certificate, marking a lapsed one expired, plus a current waiver', async () => {
    await withRollback(async (tx) => {
      const { ada, orgId, takeCourse } = await seedOrg(tx);
      const complianceCourse = async (title: string, completedAt: string | null) => {
        const course = await takeCourse(title, { type: 'COMPLIANCE', completedAt });

        return { courseId: course.courseId, groupMemberId: course.groupMemberId, profileId: ada };
      };

      const current = await complianceCourse('Current', '2026-01-10T00:00:00Z');
      await insertComplianceCycle(
        tx,
        { ...current, cycleNumber: 1, status: 'compliant' },
        { completedAt: '2026-01-10T00:00:00Z', validUntil: '2026-07-10T00:00:00Z' }
      );
      await insertComplianceCycle(
        tx,
        { ...current, cycleNumber: 2, status: 'compliant' },
        { completedAt: '2026-09-08T00:00:00Z', validUntil: STILL_VALID }
      );

      const renewed = await complianceCourse('Renewed', '2026-01-10T00:00:00Z');
      await insertComplianceCycle(
        tx,
        { ...renewed, cycleNumber: 1, status: 'compliant' },
        { completedAt: '2026-01-10T00:00:00Z', validUntil: '2026-07-10T00:00:00Z' }
      );
      await insertComplianceCycle(tx, { ...renewed, cycleNumber: 2, status: 'in_progress' });

      const dueSoon = await complianceCourse('Due soon', null);
      await insertComplianceCycle(tx, { ...dueSoon, cycleNumber: 1, status: 'expiring_soon' });

      // A completed cycle relabelled for a renewal warning is still valid, so still done.
      const warned = await complianceCourse('Warned', '2025-11-20T00:00:00Z');
      await insertComplianceCycle(
        tx,
        { ...warned, cycleNumber: 1, status: 'expiring_soon' },
        { completedAt: '2025-11-20T00:00:00Z', validUntil: STILL_VALID }
      );

      // Validity ran out before the daily expiry check opened the next cycle.
      const lapsed = await complianceCourse('Lapsed', '2025-01-10T00:00:00Z');
      await insertComplianceCycle(
        tx,
        { ...lapsed, cycleNumber: 1, status: 'compliant' },
        { completedAt: '2025-01-10T00:00:00Z', validUntil: '2026-01-10T00:00:00Z' }
      );

      const waived = await complianceCourse('Waived', null);
      await insertComplianceCycle(tx, { ...waived, cycleNumber: 1, status: 'waived' });

      const page = await readCertificates(tx, { orgId, profileId: ada });

      // Renewed and Lapsed are due again in My Learning, but their certificates were earned.
      expect(toTitles(page)).toEqual([
        'course:Current',
        'course:Renewed',
        'course:Warned',
        'course:Lapsed',
        'course:Waived'
      ]);
      expect(toEarnedAt(page)).toEqual([
        '2026-09-08T00:00:00.000Z',
        '2026-01-10T00:00:00.000Z',
        '2025-11-20T00:00:00.000Z',
        '2025-01-10T00:00:00.000Z',
        null
      ]);
      expect(toAvailability(page)).toEqual([true, true, true, true, false]);
      expect(
        page.items.map((item) => item.kind === 'course' && [item.data.isExpired, item.data.validUntil !== null])
      ).toEqual([
        [false, true],
        [true, true],
        [false, true],
        [true, true],
        [false, false]
      ]);
    });
  }, 30000);

  it('keeps a course taken inside a path next to the path', async () => {
    await withRollback(async (tx) => {
      const { ada, orgId, takeCourse, completePath } = await seedOrg(tx);

      const sqlCourse = await takeCourse('SQL', { completedAt: '2026-09-02T00:00:00Z' });
      await completePath('Data Science', { completedAt: '2026-09-03T00:00:00Z', courseIds: [sqlCourse.courseId] });

      expect(toTitles(await readCertificates(tx, { orgId, profileId: ada }))).toEqual([
        'path:Data Science',
        'course:SQL'
      ]);
    });
  }, 30000);

  it('needs the recorded completion that the backfill copies from an earned certificate', async () => {
    await withRollback(async (tx) => {
      const { ada, orgId, takeCourse } = await seedOrg(tx);

      const legacy = await takeCourse('Legacy', { completedAt: null });
      await earnCourseCertificate(tx, legacy.groupMemberId, '2026-09-01T00:00:00Z');

      expect(toTitles(await readCertificates(tx, { orgId, profileId: ada }))).toEqual([]);
    });
  }, 30000);

  it('pages without overlap, searches course titles and path names, and reports the total past the end', async () => {
    await withRollback(async (tx) => {
      const { ada, orgId, takeCourse, completePath } = await seedOrg(tx);

      await takeCourse('Data Cleaning', { completedAt: '2026-09-04T00:00:00Z' });
      await takeCourse('Excel', { completedAt: '2026-09-03T00:00:00Z' });
      await completePath('Data Science', { completedAt: '2026-09-02T00:00:00Z' });
      await takeCourse('100% Python_basics', { completedAt: '2026-09-01T00:00:00Z' });

      const first = await readCertificates(tx, { orgId, profileId: ada, limit: 2, page: 1 });
      const second = await readCertificates(tx, { orgId, profileId: ada, limit: 2, page: 2 });
      const pastEnd = await readCertificates(tx, { orgId, profileId: ada, limit: 2, page: 5 });

      expect(toTitles(first)).toEqual(['course:Data Cleaning', 'course:Excel']);
      expect(toTitles(second)).toEqual(['path:Data Science', 'course:100% Python_basics']);
      expect([first.total, second.total, pastEnd.total, pastEnd.items.length]).toEqual([4, 4, 4, 0]);

      const searched = await readCertificates(tx, { orgId, profileId: ada, search: ' data ' });
      expect(toTitles(searched)).toEqual(['course:Data Cleaning', 'path:Data Science']);
      expect(searched.total).toBe(2);

      const literal = await readCertificates(tx, { orgId, profileId: ada, search: '0% python_' });
      expect(toTitles(literal)).toEqual(['course:100% Python_basics']);
    });
  }, 30000);
});
