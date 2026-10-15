/**
 * Runs getEnrolled against a real database. Every test builds its own
 * fixture inside a transaction and rolls it back, so it needs no seed data and
 * leaves nothing behind. Skipped when no database URL is available.
 *
 * Run (Node 20, Postgres up):
 *   DATABASE_URL="$(grep ^DATABASE_URL= apps/api/.env | cut -d= -f2- | tr -d '"')" \
 *     pnpm --filter @cio/api vitest run src/__tests__/enrolled.integration.test.ts
 */
import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import type { DbOrTxClient } from '@cio/db/drizzle';
import type { TEnrolledPage } from '@cio/db/queries/enrolled';

import {
  addPathCourses,
  completeLessons,
  hasDatabase,
  insertComplianceCycle,
  insertCourse,
  insertExercise,
  insertGrant,
  insertMember,
  insertOrganization,
  insertPath,
  insertProfile,
  joinPath,
  recordCourseCompletion,
  submit,
  withRollback
} from './fixtures/learner-db';

type Scenario = Awaited<ReturnType<typeof seedScenario>>;
type Row = [kind: string, name: string, completed: number, total: number, progress: number, isComplete: boolean];

/**
 * Ada's org. Standalone: Excel (8/10), Figma (2/5 via a passed-policy
 * exercise), Live (a live class with a lesson toggled off), Done (100% with
 * its completion recorded), Safety (compliance, 0% but compliant), Removed
 * (dropped from Data Science with its path grant still live). Paths: Basics
 * (Intro at 100% live progress but with no recorded completion, plus an
 * empty course that counts as done), an empty path, and Data Science (Excel
 * and Python) which she joins later. Never shown: a revoked grant, a deleted
 * course, a course that requires a path, another org's course and path, a
 * deleted path. A path course counts as done by its recorded completion, so
 * Basics shows 1 of 2 until Intro's completion is recorded.
 */
async function seedScenario(tx: DbOrTxClient) {
  const ada = await insertProfile(tx, 'ada');
  const bob = await insertProfile(tx, 'bob');
  const orgId = await insertOrganization(tx, 'Org');
  const otherOrgId = await insertOrganization(tx, 'Other');

  const excelCourse = await insertCourse(tx, orgId, 'Excel', { lessons: 6 });
  const pythonCourse = await insertCourse(tx, orgId, 'Python', { lessons: 10 });
  const figmaCourse = await insertCourse(tx, orgId, 'Figma', { lessons: 4 });
  const liveCourse = await insertCourse(tx, orgId, 'Live', { type: 'LIVE_CLASS', lessons: 2 });
  const doneCourse = await insertCourse(tx, orgId, 'Done', { lessons: 2 });
  const safetyCourse = await insertCourse(tx, orgId, 'Safety', { type: 'COMPLIANCE', lessons: 1 });
  const introCourse = await insertCourse(tx, orgId, 'Intro', { lessons: 1 });
  const blankCourse = await insertCourse(tx, orgId, 'Blank', { lessons: 0 });
  const removedCourse = await insertCourse(tx, orgId, 'Removed', { lessons: 1 });
  const revokedCourse = await insertCourse(tx, orgId, 'Revoked', { lessons: 1 });
  const deletedCourse = await insertCourse(tx, orgId, 'Deleted', { status: 'DELETED', lessons: 1 });
  const pathOnlyCourse = await insertCourse(tx, orgId, 'Path-only', { enrollOnlyInLearningPath: true, lessons: 1 });
  const foreignCourse = await insertCourse(tx, otherOrgId, 'Foreign', { lessons: 1 });

  const courses = {
    excel: excelCourse,
    python: pythonCourse,
    figma: figmaCourse,
    live: liveCourse,
    done: doneCourse,
    safety: safetyCourse,
    intro: introCourse,
    blank: blankCourse,
    removed: removedCourse,
    revoked: revokedCourse,
    deleted: deletedCourse,
    pathOnly: pathOnlyCourse,
    foreign: foreignCourse
  };
  const members = {} as Record<keyof typeof courses, string>;
  for (const [key, course] of Object.entries(courses) as [keyof typeof courses, (typeof courses)['excel']][]) {
    members[key] = await insertMember(tx, course.groupId, ada);
  }

  const grant = (key: keyof typeof courses, source: string, grantedAt: string) => ({
    groupMemberId: members[key],
    courseId: courses[key].courseId,
    profileId: ada,
    source,
    grantedAt
  });
  await insertGrant(tx, grant('excel', 'SELF_ENROLL', '2026-02-01T00:00:00Z'));
  await insertGrant(tx, grant('figma', 'INVITE', '2026-02-02T00:00:00Z'));
  await insertGrant(tx, grant('live', 'IMPORT', '2026-02-03T00:00:00Z'));
  await insertGrant(tx, grant('done', 'SELF_ENROLL', '2026-02-04T00:00:00Z'));
  await insertGrant(tx, grant('safety', 'ADMIN_ADD', '2026-09-26T00:00:00Z'));
  await insertGrant(tx, grant('revoked', 'SELF_ENROLL', '2026-02-05T00:00:00Z'), { revokedAt: '2026-03-01T00:00:00Z' });
  await insertGrant(tx, grant('deleted', 'SELF_ENROLL', '2026-02-06T00:00:00Z'));
  await insertGrant(tx, grant('pathOnly', 'SELF_ENROLL', '2026-02-07T00:00:00Z'));
  await insertGrant(tx, grant('foreign', 'SELF_ENROLL', '2026-02-08T00:00:00Z'));

  // Excel: 6/6 lessons and 2/4 exercises. Its latest attempt was created on 18 Sep at 15:00;
  // grading it on 26 Sep bumps updated_at, which must not reorder the feed.
  await completeLessons(tx, courses.excel.lessonIds, ada, '2026-09-10T00:00:00Z');
  const excelExercises = [];
  for (let index = 0; index < 4; index++) {
    excelExercises.push(await insertExercise(tx, courses.excel.courseId));
  }
  await submit(tx, { exerciseId: excelExercises[0], groupMemberId: members.excel, createdAt: '2026-09-12T00:00:00Z' });
  await submit(tx, { exerciseId: excelExercises[1], groupMemberId: members.excel, createdAt: '2026-09-18T14:00:00Z' });
  await submit(
    tx,
    {
      exerciseId: excelExercises[1],
      groupMemberId: members.excel,
      createdAt: '2026-09-18T15:00:00Z',
      updatedAt: '2026-09-26T00:00:00Z'
    },
    { state: 'completed', total: 5 }
  );

  // Figma: 1/4 lessons, and a passed-policy exercise (70%) that passed at 8/10 then got a failing
  // retry on 29 Sep. The retry completes nothing but is still the latest learner action.
  // A future call link on a non-live course must not surface as an upcoming session.
  await completeLessons(tx, courses.figma.lessonIds.slice(0, 1), ada, '2026-09-28T16:00:00Z');
  await tx.execute(sql`
    UPDATE lesson SET call_url = 'https://meet.test/figma', lesson_at = now() + interval '7 days'
    WHERE id = ${courses.figma.lessonIds[3]}`);
  const figmaExercise = await insertExercise(tx, courses.figma.courseId, { name: 'passed', passThreshold: 70 });
  await tx.execute(sql`
    INSERT INTO question (title, exercise_id, question_type_id, points) VALUES ('Q', ${figmaExercise}, 1, 10)`);
  await submit(
    tx,
    {
      exerciseId: figmaExercise,
      groupMemberId: members.figma,
      createdAt: '2026-09-21T00:00:00Z',
      updatedAt: '2026-09-27T10:00:00Z'
    },
    { state: 'completed', total: 8 }
  );
  await submit(
    tx,
    {
      exerciseId: figmaExercise,
      groupMemberId: members.figma,
      createdAt: '2026-09-29T09:00:00Z',
      updatedAt: '2026-09-29T10:00:00Z'
    },
    { state: 'completed', total: 5 }
  );

  // Live: an exercise submitted on 5 Sep, and a lesson toggled off on 6 Sep. Its next session is a week out.
  const liveExercise = await insertExercise(tx, courses.live.courseId);
  await submit(tx, { exerciseId: liveExercise, groupMemberId: members.live, createdAt: '2026-09-05T00:00:00Z' });
  await tx.execute(sql`
    INSERT INTO lesson_completion (lesson_id, profile_id, is_complete, created_at, updated_at)
    VALUES (${courses.live.lessonIds[0]}, ${ada}, false, '2026-09-01T00:00:00Z', '2026-09-06T00:00:00Z')`);
  await tx.execute(sql`
    UPDATE lesson SET title = 'Live Q&A', call_url = 'https://meet.test/live', lesson_at = now() + interval '7 days'
    WHERE id = ${courses.live.lessonIds[1]}`);

  await completeLessons(tx, courses.done.lessonIds, ada, '2026-09-01T00:00:00Z');
  await recordCourseCompletion(tx, members.done, '2026-09-01T00:00:00Z');
  await completeLessons(tx, courses.intro.lessonIds, ada, '2026-09-15T00:00:00Z');

  // Safety: the latest compliance cycle is completed and still valid, so it is complete at 0% content.
  await insertComplianceCycle(tx, {
    courseId: courses.safety.courseId,
    groupMemberId: members.safety,
    profileId: ada,
    cycleNumber: 1,
    status: 'in_progress'
  });
  await insertComplianceCycle(
    tx,
    {
      courseId: courses.safety.courseId,
      groupMemberId: members.safety,
      profileId: ada,
      cycleNumber: 2,
      status: 'compliant'
    },
    { completedAt: '2026-09-27T00:00:00Z', validUntil: '2099-01-01T00:00:00Z' }
  );

  // Bob's progress on the same courses never reaches Ada's rows.
  const bobExcel = await insertMember(tx, courses.excel.groupId, bob);
  await submit(tx, { exerciseId: excelExercises[2], groupMemberId: bobExcel, createdAt: '2026-09-29T00:00:00Z' });
  await completeLessons(tx, courses.safety.lessonIds, bob, '2026-09-29T00:00:00Z');

  const dataScience = await insertPath(tx, orgId, 'Data Science');
  const basics = await insertPath(tx, orgId, 'Basics');
  const emptyPath = await insertPath(tx, orgId, 'Empty path');
  const foreignPath = await insertPath(tx, otherOrgId, 'Foreign path');
  const deletedPath = await insertPath(tx, orgId, 'Deleted path', { status: 'DELETED' });
  await addPathCourses(tx, dataScience.pathId, [courses.excel.courseId, courses.python.courseId]);
  await addPathCourses(tx, dataScience.pathId, [courses.removed.courseId], '2026-05-01T00:00:00Z');
  await addPathCourses(tx, basics.pathId, [courses.intro.courseId, courses.blank.courseId]);
  await addPathCourses(tx, foreignPath.pathId, [courses.foreign.courseId]);
  await addPathCourses(tx, deletedPath.pathId, [courses.python.courseId]);
  await joinPath(tx, basics.pathId, ada, '2026-03-01T00:00:00Z', {
    status: 'COMPLETED',
    completedAt: '2026-09-15T00:00:00Z'
  });
  await joinPath(tx, emptyPath.pathId, ada, '2026-09-20T00:00:00Z');
  await joinPath(tx, foreignPath.pathId, ada, '2026-03-01T00:00:00Z');
  await joinPath(tx, deletedPath.pathId, ada, '2026-03-01T00:00:00Z');
  // Removing a course from a path keeps access (no unenrollment), so its live path grant keeps it listed.
  await insertGrant(tx, grant('removed', 'LEARNING_PATH', '2026-04-01T00:00:00Z'), {
    learningPathId: dataScience.pathId
  });

  return { ada, orgId, courses, members, dataScience };
}

async function withScenario(test: (tx: DbOrTxClient, scenario: Scenario) => Promise<void>) {
  await withRollback(async (tx) => {
    const scenario = await seedScenario(tx);
    await test(tx, scenario);
  });
}

async function readFeed(
  tx: DbOrTxClient,
  scenario: Scenario,
  query: {
    page?: number;
    limit?: number;
    status?: 'all' | 'not_started' | 'in_progress';
    kind?: 'all' | 'course' | 'learning_path';
    search?: string;
  } = {}
) {
  const { getEnrolled } = await import('@cio/db/queries/enrolled');

  return getEnrolled({ orgId: scenario.orgId, profileId: scenario.ada, page: 1, limit: 20, ...query }, tx);
}

function toRows(page: TEnrolledPage): Row[] {
  return page.items.map((item) => [
    item.kind,
    item.kind === 'course' ? item.data.title : item.data.name,
    item.data.completedItems,
    item.data.totalItems,
    item.data.progress,
    item.data.isComplete
  ]);
}

function lastProgressIso(page: TEnrolledPage) {
  return page.items.map((item) => item.data.lastProgressAt && new Date(item.data.lastProgressAt).toISOString());
}

const outsideDataScience: Row[] = [
  ['course', 'Figma', 2, 5, 40, false],
  ['course', 'Excel', 8, 10, 80, false],
  ['course', 'Live', 1, 3, 33, false],
  ['learning_path', 'Empty path', 0, 0, 0, false],
  ['course', 'Removed', 0, 1, 0, false]
];

async function joinDataScience(tx: DbOrTxClient, scenario: Scenario) {
  await joinPath(tx, scenario.dataScience.pathId, scenario.ada, '2026-09-29T00:00:00Z');
  for (const key of ['excel', 'python'] as const) {
    await insertGrant(
      tx,
      {
        groupMemberId: scenario.members[key],
        courseId: scenario.courses[key].courseId,
        profileId: scenario.ada,
        source: 'LEARNING_PATH',
        grantedAt: '2026-09-29T00:00:00Z'
      },
      { learningPathId: scenario.dataScience.pathId }
    );
  }
}

describe.skipIf(!hasDatabase)('getEnrolled (database)', () => {
  it('lists paths and standalone courses, most recently active first', async () => {
    await withScenario(async (tx, scenario) => {
      const page = await readFeed(tx, scenario);

      expect(toRows(page)).toEqual(outsideDataScience);
      expect(lastProgressIso(page)).toEqual([
        '2026-09-29T09:00:00.000Z',
        '2026-09-18T15:00:00.000Z',
        '2026-09-06T00:00:00.000Z',
        null,
        null
      ]);
      expect(page.total).toBe(5);
      expect(page.counts).toEqual({ notStarted: 2, inProgress: 3 });

      const [figma, , live] = page.items;
      expect(figma.kind === 'course' && figma.data.upcomingSession).toBeNull();
      expect(figma.kind === 'course' && [figma.data.progressRate, figma.data.exercisesCompleted]).toEqual([1, 1]);
      expect(live.kind === 'course' && live.data.upcomingSession?.lessonTitle).toBe('Live Q&A');
    });
  }, 30000);

  it('folds a course into the path once the student joins, and back out when they leave', async () => {
    await withScenario(async (tx, scenario) => {
      await joinDataScience(tx, scenario);

      // Excel (8/10) and Python (0/10) are both unfinished, so the path is 0 of 2 courses.
      const joined = await readFeed(tx, scenario);
      expect(toRows(joined)).toEqual([
        outsideDataScience[0],
        ['learning_path', 'Data Science', 0, 2, 0, false],
        ...outsideDataScience.slice(1).filter((row) => row[1] !== 'Excel')
      ]);
      expect(lastProgressIso(joined)[1]).toBe('2026-09-18T15:00:00.000Z');

      await tx.execute(sql`
        UPDATE learning_path_member SET removed_at = now()
        WHERE learning_path_id = ${scenario.dataScience.pathId} AND profile_id = ${scenario.ada}`);
      await tx.execute(sql`
        UPDATE course_enrollment_grant SET revoked_at = now()
        WHERE learning_path_id = ${scenario.dataScience.pathId} AND profile_id = ${scenario.ada}
          AND course_id IN (${scenario.courses.excel.courseId}, ${scenario.courses.python.courseId})`);

      expect(toRows(await readFeed(tx, scenario))).toEqual(outsideDataScience);
    });
  }, 30000);

  it('keeps finished-looking work in the feed until its completion is recorded', async () => {
    await withScenario(async (tx, scenario) => {
      await tx.execute(sql`UPDATE groupmember SET completed_at = NULL WHERE id = ${scenario.members.done}`);
      await tx.execute(sql`
        UPDATE learning_path_member SET status = 'IN_PROGRESS', completed_at = NULL
        WHERE profile_id = ${scenario.ada} AND status = 'COMPLETED'`);

      const page = await readFeed(tx, scenario);

      expect(toRows(page).map((row) => row[1])).toEqual([
        'Figma',
        'Excel',
        'Basics',
        'Live',
        'Done',
        'Empty path',
        'Removed'
      ]);
      expect(toRows(page).filter((row) => ['Basics', 'Done'].includes(row[1]))).toEqual([
        ['learning_path', 'Basics', 1, 2, 50, false],
        ['course', 'Done', 2, 2, 100, false]
      ]);
    });
  }, 30000);

  it('filters by status and kind', async () => {
    await withScenario(async (tx, scenario) => {
      const notStarted = await readFeed(tx, scenario, { status: 'not_started' });
      expect(toRows(notStarted).map((row) => row[1])).toEqual(['Empty path', 'Removed']);
      expect(notStarted.total).toBe(2);

      const inProgress = await readFeed(tx, scenario, { status: 'in_progress' });
      expect(toRows(inProgress).map((row) => row[1])).toEqual(['Figma', 'Excel', 'Live']);
      expect(inProgress.total).toBe(3);

      const courses = await readFeed(tx, scenario, { kind: 'course' });
      expect(toRows(courses).map((row) => row[1])).toEqual(['Figma', 'Excel', 'Live', 'Removed']);
      expect(courses.total).toBe(4);

      const paths = await readFeed(tx, scenario, { kind: 'learning_path' });
      expect(toRows(paths).map((row) => row[1])).toEqual(['Empty path']);
      expect(paths.total).toBe(1);

      const inProgressCourses = await readFeed(tx, scenario, { status: 'in_progress', kind: 'course' });
      expect(toRows(inProgressCourses).map((row) => row[1])).toEqual(['Figma', 'Excel', 'Live']);
      expect(inProgressCourses.total).toBe(3);
    });
  }, 30000);

  it('searches across paths and courses', async () => {
    await withScenario(async (tx, scenario) => {
      await joinDataScience(tx, scenario);

      // A course folded into a path is found through the path.
      const search = await readFeed(tx, scenario, { search: 'EXCEL' });
      expect(toRows(search).map((row) => row[1])).toEqual(['Data Science']);
      expect(search.total).toBe(1);

      expect((await readFeed(tx, scenario, { search: '100%' })).total).toBe(0);
    });
  }, 30000);

  it('pages in a stable order and reports totals past the end', async () => {
    await withScenario(async (tx, scenario) => {
      const pages = [];
      for (const pageNumber of [1, 2, 3]) {
        pages.push(...toRows(await readFeed(tx, scenario, { page: pageNumber, limit: 3 })));
      }
      expect(pages).toEqual(outsideDataScience);

      const pastEnd = await readFeed(tx, scenario, { page: 9, limit: 3 });
      expect([pastEnd.items, pastEnd.total, pastEnd.counts]).toEqual([[], 5, { notStarted: 2, inProgress: 3 }]);
    });
  }, 30000);
});
