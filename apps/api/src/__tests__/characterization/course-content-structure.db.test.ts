import 'dotenv/config';

import { describe, expect, it } from 'vitest';
import { eq, inArray } from 'drizzle-orm';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

type FixtureIds = {
  orgId: string;
  groupId: string;
  courseId: string;
  sectionId: string;
  lessonOneId: string;
  lessonTwoId: string;
  exerciseId: string;
  profileId: string;
  groupMemberId: string;
};

async function createStructureFixture(suffix: string): Promise<FixtureIds> {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  const [organization] = await db
    .insert(schema.organization)
    .values({ name: `char-structure-${suffix}` })
    .returning();
  const [group] = await db
    .insert(schema.group)
    .values({ name: `char-structure-${suffix}`, organizationId: organization.id })
    .returning();
  const [course] = await db
    .insert(schema.course)
    .values({
      title: 'Grouped characterization course',
      description: 'Zero-activity baseline for structure queries',
      groupId: group.id,
      slug: `char-structure-${suffix}`,
      type: 'SELF_PACED' as never,
      status: 'ACTIVE'
    })
    .returning();

  const [section] = await db
    .insert(schema.courseSection)
    .values({ title: 'Getting started', order: 1, courseId: course.id })
    .returning();

  const [lessonOne] = await db
    .insert(schema.lesson)
    .values({
      courseId: course.id,
      sectionId: section.id,
      title: 'Welcome',
      order: 1,
      slug: `welcome-${suffix}`,
      note: '<p>Welcome.</p>'
    })
    .returning();

  const [lessonTwo] = await db
    .insert(schema.lesson)
    .values({
      courseId: course.id,
      sectionId: section.id,
      title: 'Core lesson',
      order: 2,
      slug: `core-${suffix}`,
      note: '<p>Core.</p>'
    })
    .returning();

  const [exercise] = await db
    .insert(schema.exercise)
    .values({
      courseId: course.id,
      sectionId: section.id,
      title: 'Starter quiz',
      order: 3,
      slug: `quiz-${suffix}`
    })
    .returning();

  const userId = crypto.randomUUID();
  await db.insert(schema.user).values({
    id: userId,
    name: `Char Structure ${suffix}`,
    email: `char-structure-${suffix}@example.com`
  });
  await db.insert(schema.profile).values({
    id: userId,
    fullname: `Char Structure ${suffix}`,
    username: `char-structure-${suffix}`,
    email: `char-structure-${suffix}@example.com`
  });
  const [member] = await db
    .insert(schema.groupmember)
    .values({
      groupId: group.id,
      roleId: 3,
      profileId: userId,
      email: `char-structure-${suffix}@example.com`
    })
    .returning();

  await db.insert(schema.lessonCompletion).values({
    lessonId: lessonOne.id,
    profileId: userId,
    isComplete: true
  });
  await db.insert(schema.submission).values({
    exerciseId: exercise.id,
    courseId: course.id,
    submittedBy: member.id
  });

  return {
    orgId: organization.id,
    groupId: group.id,
    courseId: course.id,
    sectionId: section.id,
    lessonOneId: lessonOne.id,
    lessonTwoId: lessonTwo.id,
    exerciseId: exercise.id,
    profileId: userId,
    groupMemberId: member.id
  };
}

async function cleanupStructureFixture(ids: FixtureIds) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  await db.delete(schema.submission).where(eq(schema.submission.courseId, ids.courseId));
  await db.delete(schema.lessonCompletion).where(eq(schema.lessonCompletion.profileId, ids.profileId));
  await db.delete(schema.exercise).where(eq(schema.exercise.courseId, ids.courseId));
  await db.delete(schema.lesson).where(eq(schema.lesson.courseId, ids.courseId));
  await db.delete(schema.courseSection).where(eq(schema.courseSection.courseId, ids.courseId));
  await db.delete(schema.course).where(eq(schema.course.id, ids.courseId));
  await db.delete(schema.groupmember).where(eq(schema.groupmember.id, ids.groupMemberId));
  await db.delete(schema.profile).where(eq(schema.profile.id, ids.profileId));
  await db.delete(schema.user).where(eq(schema.user.id, ids.profileId));
  await db.delete(schema.group).where(eq(schema.group.id, ids.groupId));
  await db.delete(schema.organization).where(eq(schema.organization.id, ids.orgId));
}

describe.skipIf(!hasDatabase)('characterization: course content structure (zero activities)', () => {
  it('lists sections, lessons and exercises with completion state', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const ids = await createStructureFixture(suffix);
    try {
      const { getCourseContentItems } = await import('@db/queries/course/content');

      const rows = await getCourseContentItems(ids.courseId, ids.profileId);
      const byId = new Map(rows.map((row) => [row.id, row]));

      // One section + two lessons + one exercise, no activities.
      expect(rows).toHaveLength(4);
      expect([...byId.values()].map((row) => row.type).sort()).toEqual(['EXERCISE', 'LESSON', 'LESSON', 'SECTION']);

      const lessonOne = byId.get(ids.lessonOneId);
      const lessonTwo = byId.get(ids.lessonTwoId);
      const exercise = byId.get(ids.exerciseId);
      const section = byId.get(ids.sectionId);

      expect(section?.type).toBe('SECTION');
      expect(section?.isComplete).toBeNull();
      expect(lessonOne?.isComplete).toBe(true);
      expect(lessonTwo?.isComplete).toBe(false);
      // Default exercise policy is `submitted`: one submission counts.
      expect(exercise?.isComplete).toBe(true);
      expect(exercise?.questionCount).toBe(0);
      expect(lessonOne?.sectionId).toBe(ids.sectionId);
      expect(exercise?.sectionId).toBe(ids.sectionId);
    } finally {
      await cleanupStructureFixture(ids);
    }
  });

  it('reports taken slugs across lessons and exercises', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const ids = await createStructureFixture(suffix);
    try {
      const { getTakenItemSlugs } = await import('@db/queries/course/public-course');

      const slugs = await getTakenItemSlugs(ids.courseId);

      expect(slugs.has(`welcome-${suffix}`)).toBe(true);
      expect(slugs.has(`core-${suffix}`)).toBe(true);
      expect(slugs.has(`quiz-${suffix}`)).toBe(true);
      expect(slugs.size).toBe(3);
    } finally {
      await cleanupStructureFixture(ids);
    }
  });

  it('exposes a public tree for PUBLIC courses with lessons and exercises', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

    const [organization] = await db
      .insert(schema.organization)
      .values({ name: `char-public-${suffix}` })
      .returning();
    const [group] = await db
      .insert(schema.group)
      .values({ name: `char-public-${suffix}`, organizationId: organization.id })
      .returning();
    const slug = `char-public-${suffix}`;
    const [course] = await db
      .insert(schema.course)
      .values({
        title: 'Public baseline',
        description: 'Public course with no activities',
        groupId: group.id,
        slug,
        type: 'PUBLIC' as never,
        status: 'ACTIVE',
        isPublished: true
      })
      .returning();
    const [section] = await db
      .insert(schema.courseSection)
      .values({ title: 'Intro', order: 1, courseId: course.id })
      .returning();
    await db.insert(schema.lesson).values({
      courseId: course.id,
      sectionId: section.id,
      title: 'Public lesson',
      order: 1,
      slug: `public-lesson-${suffix}`
    });
    await db.insert(schema.exercise).values({
      courseId: course.id,
      sectionId: section.id,
      title: 'Public quiz',
      order: 2,
      slug: `public-quiz-${suffix}`
    });

    try {
      const { getPublicCourseTreeBySlug } = await import('@db/queries/course/public-course');
      const tree = await getPublicCourseTreeBySlug(slug);

      expect(tree).not.toBeNull();
      expect(tree?.course.slug).toBe(slug);
      expect(tree?.sections).toHaveLength(1);
      expect(tree?.items.map((item) => item.kind).sort()).toEqual(['exercise', 'lesson']);
      expect(tree?.items.map((item) => item.slug).sort()).toEqual(
        [`public-lesson-${suffix}`, `public-quiz-${suffix}`].sort()
      );
    } finally {
      const lessons = await db
        .select({ id: schema.lesson.id })
        .from(schema.lesson)
        .where(eq(schema.lesson.courseId, course.id));
      if (lessons.length > 0) {
        await db.delete(schema.lesson).where(eq(schema.lesson.courseId, course.id));
      }
      await db.delete(schema.exercise).where(eq(schema.exercise.courseId, course.id));
      await db.delete(schema.courseSection).where(eq(schema.courseSection.courseId, course.id));
      await db.delete(schema.course).where(eq(schema.course.id, course.id));
      await db.delete(schema.group).where(eq(schema.group.id, group.id));
      await db.delete(schema.organization).where(eq(schema.organization.id, organization.id));
    }
  });

  it('counts impact and resets learner progress in one transaction', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const ids = await createStructureFixture(suffix);
    try {
      const { getStudentCourseProgressImpactCounts, resetStudentCourseProgress } = await import(
        '@db/queries/course/reset-progress'
      );

      const before = await getStudentCourseProgressImpactCounts({
        courseId: ids.courseId,
        groupMemberId: ids.groupMemberId,
        profileId: ids.profileId
      });

      expect(before).toEqual({
        completedLessons: 1,
        totalLessons: 2,
        exerciseSubmissions: 1,
        lessonComments: 0,
        courseNewsfeedActivity: 0,
        videoProgressLessons: 0,
        attendanceEntries: 0,
        hasCertificationRecords: false
      });

      const summary = await resetStudentCourseProgress({
        courseId: ids.courseId,
        groupMemberId: ids.groupMemberId,
        profileId: ids.profileId
      });

      expect(summary).toMatchObject({
        lessonCompletion: 1,
        submissions: 1,
        lessonComments: 0,
        courseNewsfeed: 0,
        courseCompletionRecords: 0
      });

      const after = await getStudentCourseProgressImpactCounts({
        courseId: ids.courseId,
        groupMemberId: ids.groupMemberId,
        profileId: ids.profileId
      });

      expect(after.completedLessons).toBe(0);
      expect(after.totalLessons).toBe(2);
      expect(after.exerciseSubmissions).toBe(0);
    } finally {
      await cleanupStructureFixture(ids);
    }
  });

  it('stamps copied template units without changing content', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const ids = await createStructureFixture(suffix);
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { stampCopiedTemplateUnits } = await import('@db/queries/course/course-template');

      const syncedAt = '2026-10-09T00:00:00.000Z';
      await stampCopiedTemplateUnits(
        {
          sectionIds: [ids.sectionId],
          lessonIds: [ids.lessonOneId, ids.lessonTwoId],
          exerciseIds: [ids.exerciseId],
          syncedAt
        },
        db
      );

      const [section] = await db
        .select({ syncedAt: schema.courseSection.sourceSyncedAt })
        .from(schema.courseSection)
        .where(eq(schema.courseSection.id, ids.sectionId));
      const lessons = await db
        .select({ id: schema.lesson.id, syncedAt: schema.lesson.sourceSyncedAt })
        .from(schema.lesson)
        .where(inArray(schema.lesson.id, [ids.lessonOneId, ids.lessonTwoId]));
      const [exercise] = await db
        .select({ syncedAt: schema.exercise.sourceSyncedAt })
        .from(schema.exercise)
        .where(eq(schema.exercise.id, ids.exerciseId));

      // Timestamptz columns come back in Postgres display format; normalize.
      expect(new Date(section.syncedAt as string).toISOString()).toBe(syncedAt);
      expect(lessons).toHaveLength(2);
      for (const lesson of lessons) expect(new Date(lesson.syncedAt as string).toISOString()).toBe(syncedAt);
      expect(new Date(exercise.syncedAt as string).toISOString()).toBe(syncedAt);
    } finally {
      await cleanupStructureFixture(ids);
    }
  });

  it('shifts section, lesson and exercise orders in the shared order space', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const ids = await createStructureFixture(suffix);
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { shiftCourseSectionOrders, shiftLessonOrders, shiftExerciseOrders } = await import(
        '@db/queries/course/template-sync'
      );

      await shiftLessonOrders(ids.courseId, ids.sectionId, 2, db);
      const lessons = await db
        .select({ id: schema.lesson.id, order: schema.lesson.order })
        .from(schema.lesson)
        .where(eq(schema.lesson.courseId, ids.courseId));
      const orders = new Map(lessons.map((lesson) => [lesson.id, lesson.order]));

      // Lesson at order 1 stays, lesson at order 2 moves to 3.
      expect(orders.get(ids.lessonOneId)).toBe(1);
      expect(orders.get(ids.lessonTwoId)).toBe(3);

      await shiftExerciseOrders(ids.courseId, { sectionId: ids.sectionId }, 3, db);
      const [exercise] = await db
        .select({ order: schema.exercise.order })
        .from(schema.exercise)
        .where(eq(schema.exercise.id, ids.exerciseId));
      expect(exercise.order).toBe(4);

      await shiftCourseSectionOrders(ids.courseId, 1, db);
      const [section] = await db
        .select({ order: schema.courseSection.order })
        .from(schema.courseSection)
        .where(eq(schema.courseSection.id, ids.sectionId));
      expect(section.order).toBe(2);
    } finally {
      await cleanupStructureFixture(ids);
    }
  });
});
