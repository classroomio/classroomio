/**
 * Runs getPathJourney and listLearnerPathCertificates against a real
 * database. Every test builds its own fixture inside a transaction and rolls
 * it back, so it needs no seed data and leaves nothing behind. Skipped when no
 * database URL is available.
 *
 * Run (Node 20, Postgres up):
 *   DATABASE_URL="$(grep ^DATABASE_URL= apps/api/.env | cut -d= -f2- | tr -d '"')" \
 *     pnpm --filter @cio/api vitest run src/__tests__/path-journey.integration.test.ts
 */
import { describe, expect, it } from 'vitest';

import type { DbOrTxClient } from '@cio/db/drizzle';
import type { TPathJourneyRows } from '@cio/db/queries/learning-path';

import {
  addPathCourses,
  completeLessons,
  hasDatabase,
  insertCourse,
  insertExercise,
  insertMember,
  insertOrganization,
  insertPath,
  insertProfile,
  issuePathCertificate,
  joinPath,
  submit,
  withRollback
} from './fixtures/learner-db';

type Scenario = Awaited<ReturnType<typeof seedScenario>>;
type Row = [
  position: number,
  title: string,
  status: string,
  isUnlocked: boolean,
  isComplete: boolean,
  progress: number,
  lessons: string,
  exercises: string
];

/**
 * Ada's Data Science path, in order: Excel (3/3 lessons and its exercise, so
 * complete), Python (1/4 lessons, exercise open, so 20%), a deleted course,
 * SQL (untouched), and Blank (no content, so complete but behind SQL). A
 * course removed from the path and Bob's progress never show.
 */
async function seedScenario(tx: DbOrTxClient) {
  const ada = await insertProfile(tx, 'ada');
  const bob = await insertProfile(tx, 'bob');
  const orgId = await insertOrganization(tx, 'Org');

  const excelCourse = await insertCourse(tx, orgId, 'Excel', { lessons: 3 });
  const pythonCourse = await insertCourse(tx, orgId, 'Python', { lessons: 4 });
  const deletedCourse = await insertCourse(tx, orgId, 'Deleted', { lessons: 1, status: 'DELETED' });
  const sqlCourse = await insertCourse(tx, orgId, 'SQL', { lessons: 2 });
  const blankCourse = await insertCourse(tx, orgId, 'Blank', { lessons: 0 });
  const removedCourse = await insertCourse(tx, orgId, 'Removed', { lessons: 1 });

  const courses = {
    excel: excelCourse,
    python: pythonCourse,
    deleted: deletedCourse,
    sql: sqlCourse,
    blank: blankCourse,
    removed: removedCourse
  };

  const excelMember = await insertMember(tx, courses.excel.groupId, ada);
  const pythonMember = await insertMember(tx, courses.python.groupId, ada);
  await completeLessons(tx, courses.excel.lessonIds, ada, '2026-09-10T00:00:00Z');
  const excelExercise = await insertExercise(tx, courses.excel.courseId);
  await submit(tx, { exerciseId: excelExercise, groupMemberId: excelMember, createdAt: '2026-09-12T00:00:00Z' });
  await completeLessons(tx, courses.python.lessonIds.slice(0, 1), ada, '2026-09-20T00:00:00Z');
  const pythonExercise = await insertExercise(tx, courses.python.courseId);

  const bobPython = await insertMember(tx, courses.python.groupId, bob);
  await completeLessons(tx, courses.python.lessonIds, bob, '2026-09-25T00:00:00Z');
  await submit(tx, { exerciseId: pythonExercise, groupMemberId: bobPython, createdAt: '2026-09-25T00:00:00Z' });
  await completeLessons(tx, courses.removed.lessonIds, ada, '2026-09-28T00:00:00Z');

  const dataScience = await insertPath(tx, orgId, 'Data Science');
  const pathCourseIds = [
    courses.excel.courseId,
    courses.python.courseId,
    courses.deleted.courseId,
    courses.sql.courseId,
    courses.blank.courseId
  ];
  await addPathCourses(tx, dataScience.pathId, pathCourseIds);
  await addPathCourses(tx, dataScience.pathId, [courses.removed.courseId], '2026-09-01T00:00:00Z');
  const memberId = await joinPath(tx, dataScience.pathId, ada, '2026-09-01T00:00:00Z', { status: 'IN_PROGRESS' });

  return { ada, bob, orgId, courses, pythonMember, pythonExercise, dataScience, memberId };
}

async function withScenario(test: (tx: DbOrTxClient, scenario: Scenario) => Promise<void>) {
  await withRollback(async (tx) => {
    const scenario = await seedScenario(tx);
    await test(tx, scenario);
  });
}

async function readJourney(
  tx: DbOrTxClient,
  journey: { pathId: string; memberId: string; profileId: string },
  sequentialUnlock = true
) {
  const { getPathJourney } = await import('@cio/db/queries/learning-path');

  return getPathJourney({ ...journey, sequentialUnlock }, tx);
}

function readScenarioJourney(tx: DbOrTxClient, scenario: Scenario, sequentialUnlock = true) {
  const journey = { pathId: scenario.dataScience.pathId, memberId: scenario.memberId, profileId: scenario.ada };

  return readJourney(tx, journey, sequentialUnlock);
}

function toRows(journey: TPathJourneyRows): Row[] {
  return journey.courses.map((course) => [
    course.position,
    course.title,
    course.status,
    course.isUnlocked,
    course.isComplete,
    course.progress,
    `${course.lessonsCompleted}/${course.lessonsTotal}`,
    `${course.exercisesCompleted}/${course.exercisesTotal}`
  ]);
}

function toIso(timestamp: string | null) {
  return timestamp && new Date(timestamp).toISOString();
}

describe.skipIf(!hasDatabase)('getPathJourney (database)', () => {
  it('lists active path courses in order with live progress, locking behind the first unfinished one', async () => {
    await withScenario(async (tx, scenario) => {
      const journey = await readScenarioJourney(tx, scenario);

      expect(toRows(journey)).toEqual([
        [1, 'Excel', 'COMPLETED', true, true, 100, '3/3', '1/1'],
        [2, 'Python', 'IN_PROGRESS', true, false, 20, '1/4', '0/1'],
        [3, 'SQL', 'LOCKED', false, false, 0, '0/2', '0/0'],
        [4, 'Blank', 'COMPLETED', false, true, 100, '0/0', '0/0']
      ]);
      expect(journey.courses.map((course) => toIso(course.lastProgressAt))).toEqual([
        '2026-09-12T00:00:00.000Z',
        '2026-09-20T00:00:00.000Z',
        null,
        null
      ]);
      expect(toIso(journey.lastProgressAt)).toBe('2026-09-20T00:00:00.000Z');
      expect(journey.certificate).toBeNull();
    });
  }, 30000);

  it('unlocks every course when the path is not sequential', async () => {
    await withScenario(async (tx, scenario) => {
      const journey = await readScenarioJourney(tx, scenario, false);

      expect(toRows(journey).map(([, title, status, isUnlocked]) => [title, status, isUnlocked])).toEqual([
        ['Excel', 'COMPLETED', true],
        ['Python', 'IN_PROGRESS', true],
        ['SQL', 'NOT_STARTED', true],
        ['Blank', 'COMPLETED', true]
      ]);
    });
  }, 30000);

  it('opens the next course once the one before it is finished', async () => {
    await withScenario(async (tx, scenario) => {
      await completeLessons(tx, scenario.courses.python.lessonIds.slice(1), scenario.ada, '2026-09-29T00:00:00Z');
      await submit(tx, {
        exerciseId: scenario.pythonExercise,
        groupMemberId: scenario.pythonMember,
        createdAt: '2026-09-29T08:00:00Z'
      });

      const journey = await readScenarioJourney(tx, scenario);

      expect(toRows(journey).map(([, title, status, isUnlocked]) => [title, status, isUnlocked])).toEqual([
        ['Excel', 'COMPLETED', true],
        ['Python', 'COMPLETED', true],
        ['SQL', 'NOT_STARTED', true],
        ['Blank', 'COMPLETED', false]
      ]);
      expect(toIso(journey.lastProgressAt)).toBe('2026-09-29T08:00:00.000Z');
    });
  }, 30000);

  it("returns the member's valid certificate, and still answers for a path with no courses", async () => {
    await withScenario(async (tx, scenario) => {
      const emptyPath = await insertPath(tx, scenario.orgId, 'Empty');
      const emptyMemberId = await joinPath(tx, emptyPath.pathId, scenario.ada, '2026-09-01T00:00:00Z');
      const certificateId = await issuePathCertificate(tx, {
        pathId: emptyPath.pathId,
        memberId: emptyMemberId,
        profileId: scenario.ada,
        issuedAt: '2026-09-15T00:00:00Z'
      });

      const empty = await readJourney(tx, {
        pathId: emptyPath.pathId,
        memberId: emptyMemberId,
        profileId: scenario.ada
      });
      expect(empty.courses).toEqual([]);
      expect(empty.lastProgressAt).toBeNull();
      expect([empty.certificate?.certificateId, toIso(empty.certificate?.issuedAt ?? null)]).toEqual([
        certificateId,
        '2026-09-15T00:00:00.000Z'
      ]);

      await issuePathCertificate(
        tx,
        {
          pathId: scenario.dataScience.pathId,
          memberId: scenario.memberId,
          profileId: scenario.ada,
          issuedAt: '2026-09-15T00:00:00Z'
        },
        { status: 'revoked', revokedAt: '2026-09-20T00:00:00Z' }
      );
      expect((await readScenarioJourney(tx, scenario)).certificate).toBeNull();
    });
  }, 30000);
});

describe.skipIf(!hasDatabase)('listLearnerPathCertificates (database)', () => {
  it('lists only the certificates the learner can download in this org, newest first', async () => {
    await withRollback(async (tx) => {
      const { listLearnerPathCertificates } = await import('@cio/db/queries/learning-path');
      const ada = await insertProfile(tx, 'ada');
      const bob = await insertProfile(tx, 'bob');
      const orgId = await insertOrganization(tx, 'Org');
      const otherOrgId = await insertOrganization(tx, 'Other');

      const certify = async (
        name: string,
        options: {
          org?: string;
          profileId?: string;
          pathStatus?: string;
          downloadable?: boolean;
          memberStatus?: string;
          memberRemovedAt?: string;
          revoked?: boolean;
          issuedAt?: string;
        } = {}
      ) => {
        const profileId = options.profileId ?? ada;
        const path = await insertPath(tx, options.org ?? orgId, name, {
          status: options.pathStatus,
          certificateDownloadable: options.downloadable ?? true
        });
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
      };

      await certify('Older', { issuedAt: '2026-09-01T00:00:00Z' });
      await certify('Newer', { issuedAt: '2026-09-15T00:00:00Z' });
      await certify('Not downloadable', { downloadable: false });
      await certify('Left the path', { memberRemovedAt: '2026-09-10T00:00:00Z' });
      await certify('Revoked', { revoked: true });
      await certify('Reopened', { memberStatus: 'IN_PROGRESS' });
      await certify('Deleted path', { pathStatus: 'DELETED' });
      await certify('Other org', { org: otherOrgId });
      await certify("Bob's", { profileId: bob });

      const certificates = await listLearnerPathCertificates(orgId, ada, tx);

      expect(certificates.map((certificate) => certificate.name)).toEqual(['Newer', 'Older']);
    });
  }, 30000);
});
