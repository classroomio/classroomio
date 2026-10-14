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
  earnCourseCertificate,
  hasDatabase,
  insertCourse,
  insertMember,
  insertOrganization,
  insertPath,
  insertProfile,
  issuePathCertificate,
  joinPath,
  withRollback
} from './fixtures/learner-db';

type CourseCertificateOptions = {
  org?: string;
  profileId?: string;
  courseStatus?: string;
  downloadable?: boolean;
  earnedAt?: string | null;
};

type PathCertificateOptions = {
  org?: string;
  profileId?: string;
  pathStatus?: string;
  downloadable?: boolean;
  memberStatus?: string;
  memberRemovedAt?: string;
  revoked?: boolean;
  issuedAt?: string;
  courseIds?: string[];
};

async function seedOrg(tx: DbOrTxClient) {
  const ada = await insertProfile(tx, 'ada');
  const bob = await insertProfile(tx, 'bob');
  const orgId = await insertOrganization(tx, 'Org');
  const otherOrgId = await insertOrganization(tx, 'Other');

  const earnCourse = async (title: string, options: CourseCertificateOptions = {}) => {
    const course = await insertCourse(tx, options.org ?? orgId, title, {
      lessons: 1,
      status: options.courseStatus,
      certificateDownloadable: options.downloadable ?? true
    });
    const groupMemberId = await insertMember(tx, course.groupId, options.profileId ?? ada);
    const earnedAt = options.earnedAt === undefined ? '2026-09-01T00:00:00Z' : options.earnedAt;

    if (earnedAt) {
      await earnCourseCertificate(tx, groupMemberId, earnedAt);
    }

    return course;
  };

  const certifyPath = async (name: string, options: PathCertificateOptions = {}) => {
    const profileId = options.profileId ?? ada;
    const path = await insertPath(tx, options.org ?? orgId, name, {
      status: options.pathStatus,
      certificateDownloadable: options.downloadable ?? true
    });
    await addPathCourses(tx, path.pathId, options.courseIds ?? []);
    const memberId = await joinPath(tx, path.pathId, profileId, '2026-08-01T00:00:00Z', {
      status: options.memberStatus ?? 'COMPLETED',
      removedAt: options.memberRemovedAt
    });
    const revocation = options.revoked ? { status: 'revoked' as const, revokedAt: '2026-09-20T00:00:00Z' } : {};
    await issuePathCertificate(
      tx,
      { pathId: path.pathId, memberId, profileId, issuedAt: options.issuedAt ?? '2026-09-01T00:00:00Z' },
      revocation
    );

    return path;
  };

  return { ada, bob, orgId, otherOrgId, earnCourse, certifyPath };
}

async function readCertificates(
  tx: DbOrTxClient,
  options: { orgId: string; profileId: string; page?: number; limit?: number; search?: string; paths?: boolean }
) {
  const { getEarnedCertificates } = await import('@cio/db/queries/certificates');

  return getEarnedCertificates(
    {
      orgId: options.orgId,
      profileId: options.profileId,
      page: options.page ?? 1,
      limit: options.limit ?? 12,
      search: options.search,
      includePathCertificates: options.paths ?? true
    },
    tx
  );
}

function toTitles(page: TEarnedCertificatesPage) {
  return page.items.map((item) => (item.kind === 'course' ? `course:${item.data.title}` : `path:${item.data.name}`));
}

describe.skipIf(!hasDatabase)('getEarnedCertificates (database)', () => {
  it('merges downloadable course and path certificates in this org, newest first', async () => {
    await withRollback(async (tx) => {
      const { ada, bob, orgId, otherOrgId, earnCourse, certifyPath } = await seedOrg(tx);

      const excel = await earnCourse('Excel', { earnedAt: '2026-09-05T00:00:00Z' });
      await earnCourse('Python', { earnedAt: '2026-09-20T00:00:00Z' });
      await earnCourse('Not earned', { earnedAt: null });
      await earnCourse('Course download off', { downloadable: false });
      await earnCourse('Deleted course', { courseStatus: 'DELETED' });
      await earnCourse('Other org course', { org: otherOrgId });
      await earnCourse("Bob's course", { profileId: bob });

      await certifyPath('Data Science', { issuedAt: '2026-09-10T00:00:00Z', courseIds: [excel.courseId] });
      await certifyPath('Path download off', { downloadable: false });
      await certifyPath('Left the path', { memberRemovedAt: '2026-09-10T00:00:00Z' });
      await certifyPath('Revoked', { revoked: true });
      await certifyPath('Reopened', { memberStatus: 'IN_PROGRESS' });
      await certifyPath('Deleted path', { pathStatus: 'DELETED' });
      await certifyPath('Other org path', { org: otherOrgId });
      await certifyPath("Bob's path", { profileId: bob });

      const page = await readCertificates(tx, { orgId, profileId: ada });

      expect(toTitles(page)).toEqual(['course:Python', 'path:Data Science', 'course:Excel']);
      expect(page.total).toBe(3);

      const dataScience = page.items.find((item) => item.kind === 'learning_path');
      expect(dataScience?.kind === 'learning_path' && dataScience.data.courseCount).toBe(1);
      expect(dataScience?.kind === 'learning_path' && dataScience.data.certificateId).toMatch(/^CERT-/);
    });
  }, 30000);

  it('keeps the certificate of a course taken inside a path next to the path certificate', async () => {
    await withRollback(async (tx) => {
      const { ada, orgId, earnCourse, certifyPath } = await seedOrg(tx);

      const sqlCourse = await earnCourse('SQL', { earnedAt: '2026-09-02T00:00:00Z' });
      await certifyPath('Data Science', { issuedAt: '2026-09-03T00:00:00Z', courseIds: [sqlCourse.courseId] });

      expect(toTitles(await readCertificates(tx, { orgId, profileId: ada }))).toEqual([
        'path:Data Science',
        'course:SQL'
      ]);
    });
  }, 30000);

  it('drops path certificates when the plan has none, and keeps course certificates', async () => {
    await withRollback(async (tx) => {
      const { ada, orgId, earnCourse, certifyPath } = await seedOrg(tx);

      await earnCourse('Excel');
      await certifyPath('Data Science');

      const page = await readCertificates(tx, { orgId, profileId: ada, paths: false });

      expect(toTitles(page)).toEqual(['course:Excel']);
      expect(page.total).toBe(1);
    });
  }, 30000);

  it('pages without overlap, searches course titles and path names, and reports the total past the end', async () => {
    await withRollback(async (tx) => {
      const { ada, orgId, earnCourse, certifyPath } = await seedOrg(tx);

      await earnCourse('Data Cleaning', { earnedAt: '2026-09-04T00:00:00Z' });
      await earnCourse('Excel', { earnedAt: '2026-09-03T00:00:00Z' });
      await certifyPath('Data Science', { issuedAt: '2026-09-02T00:00:00Z' });
      await earnCourse('100% Python_basics', { earnedAt: '2026-09-01T00:00:00Z' });

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
