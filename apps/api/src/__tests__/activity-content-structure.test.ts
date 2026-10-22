import 'dotenv/config';

import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { ContentType } from '@cio/utils/constants';
import {
  ZCourseContentDeleteItem,
  ZCourseContentReorderItem,
  ZCourseContentUpdateItem
} from '@cio/utils/validation/course';
import { evaluateCourseGoLiveReadiness } from '@cio/core/services/course/go-live-readiness';
import type { CourseContentItemRow } from '@cio/db/queries/course/content';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

function buildContentItem(overrides: Partial<CourseContentItemRow> = {}): CourseContentItemRow {
  return {
    id: 'lesson-1',
    type: ContentType.Lesson,
    title: 'Introduction',
    order: 1,
    createdAt: null,
    sectionId: null,
    isUnlocked: true,
    isComplete: false,
    lessonAt: null,
    callUrl: null,
    sessionDurationMinutes: null,
    recordingUrl: null,
    hasNoteContent: true,
    hasSlideContent: false,
    videosCount: 0,
    documentsCount: 0,
    questionCount: null,
    dueBy: null,
    slug: null,
    activityKind: null,
    activityStatus: null,
    ...overrides
  };
}

function buildCourse() {
  return {
    id: 'course-1',
    title: 'Course',
    description: 'Description',
    overview: 'Overview of the course',
    slug: 'course',
    bannerImage: 'https://example.com/banner.png',
    logo: 'https://example.com/banner.png',
    metadata: {
      description: 'Landing description',
      goals: 'Landing goals',
      requirements: 'Landing requirements'
    },
    type: 'SELF_PACED',
    cost: 0,
    certificate: {}
  };
}

describe('activity content-structure validation', () => {
  it('accepts ACTIVITY items and still rejects SECTION', () => {
    expect(ZCourseContentUpdateItem.safeParse({ id: 'a', type: ContentType.Activity, order: 1 }).success).toBe(true);
    expect(ZCourseContentUpdateItem.safeParse({ id: 'a', type: ContentType.Section }).success).toBe(false);

    expect(ZCourseContentDeleteItem.safeParse({ id: 'a', type: ContentType.Activity }).success).toBe(true);
    expect(ZCourseContentDeleteItem.safeParse({ id: 'a', type: ContentType.Section }).success).toBe(false);

    expect(ZCourseContentReorderItem.safeParse({ id: 'a', type: ContentType.Activity, order: 1 }).success).toBe(true);
  });
});

describe('go-live readiness with activities', () => {
  it('counts an activity-only course as having content', () => {
    const activity = buildContentItem({
      id: 'activity-1',
      type: ContentType.Activity,
      title: 'Package',
      slug: 'package',
      activityKind: 'scorm'
    });

    const withActivity = evaluateCourseGoLiveReadiness({
      course: buildCourse(),
      contentItems: [activity],
      organization: null
    } as never);

    expect(withActivity.blockers.map((blocker) => blocker.code)).not.toContain('COURSE_CONTENT_MISSING');

    const empty = evaluateCourseGoLiveReadiness({
      course: buildCourse(),
      contentItems: [],
      organization: null
    } as never);

    expect(empty.blockers.map((blocker) => blocker.code)).toContain('COURSE_CONTENT_MISSING');
  });
});

type StructureFixture = {
  orgId: string;
  groupId: string;
  courseId: string;
  sectionId: string;
  lessonId: string;
  exerciseId: string;
  activityId: string;
  profileId: string;
};

async function createStructureFixture(suffix: string): Promise<StructureFixture> {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');
  const userId = crypto.randomUUID();

  const [organization] = await db
    .insert(schema.organization)
    .values({ name: `act-struct-${suffix}` })
    .returning();
  const [group] = await db
    .insert(schema.group)
    .values({ name: `act-struct-${suffix}`, organizationId: organization.id })
    .returning();
  const [course] = await db
    .insert(schema.course)
    .values({
      title: 'Activity structure',
      description: 'Content-structure baseline with one activity',
      groupId: group.id,
      slug: `act-struct-${suffix}`,
      type: 'SELF_PACED' as never,
      status: 'ACTIVE'
    })
    .returning();
  const [section] = await db
    .insert(schema.courseSection)
    .values({ title: 'Main', order: 1, courseId: course.id })
    .returning();
  const [lesson] = await db
    .insert(schema.lesson)
    .values({ courseId: course.id, sectionId: section.id, title: 'Welcome', slug: 'welcome', order: 1 })
    .returning();
  const [exercise] = await db
    .insert(schema.exercise)
    .values({ courseId: course.id, sectionId: section.id, title: 'Quiz', slug: 'quiz', order: 2 })
    .returning();
  const queries = await import('@db/queries/activity/activity');
  const [activity] = await queries.createActivities([
    {
      courseId: course.id,
      sectionId: section.id,
      kind: 'scorm',
      title: 'Package',
      slug: `package-${suffix}`,
      order: 3
    }
  ]);

  await db.insert(schema.user).values({ id: userId, name: `Act ${suffix}`, email: `act-${suffix}@example.com` });
  await db.insert(schema.profile).values({
    id: userId,
    fullname: `Act ${suffix}`,
    username: `act-${suffix}`,
    email: `act-${suffix}@example.com`
  });

  return {
    orgId: organization.id,
    groupId: group.id,
    courseId: course.id,
    sectionId: section.id,
    lessonId: lesson.id,
    exerciseId: exercise.id,
    activityId: activity.id,
    profileId: userId
  };
}

async function cleanupStructureFixture(fixture: StructureFixture) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  await db.delete(schema.activityCompletion).where(eq(schema.activityCompletion.profileId, fixture.profileId));
  await db.delete(schema.courseActivity).where(eq(schema.courseActivity.courseId, fixture.courseId));
  await db.delete(schema.exercise).where(eq(schema.exercise.courseId, fixture.courseId));
  await db.delete(schema.lesson).where(eq(schema.lesson.courseId, fixture.courseId));
  await db.delete(schema.courseSection).where(eq(schema.courseSection.courseId, fixture.courseId));
  await db.delete(schema.course).where(eq(schema.course.id, fixture.courseId));
  await db.delete(schema.groupmember).where(eq(schema.groupmember.profileId, fixture.profileId));
  await db.delete(schema.profile).where(eq(schema.profile.id, fixture.profileId));
  await db.delete(schema.user).where(eq(schema.user.id, fixture.profileId));
  await db.delete(schema.group).where(eq(schema.group.id, fixture.groupId));
  await db.delete(schema.organization).where(eq(schema.organization.id, fixture.orgId));
}

describe.skipIf(!hasDatabase)('activity content structure (database)', () => {
  it('lists activities with kind, slug and completion state', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createStructureFixture(suffix);
    try {
      const { getCourseContentItems } = await import('@db/queries/course/content');
      const queries = await import('@db/queries/activity/activity');

      const rows = await getCourseContentItems(fixture.courseId, fixture.profileId);
      const activity = rows.find((row) => row.id === fixture.activityId);

      expect(rows.map((row) => row.type).sort()).toEqual(['ACTIVITY', 'EXERCISE', 'LESSON', 'SECTION']);
      expect(activity).toMatchObject({
        type: ContentType.Activity,
        activityKind: 'scorm',
        slug: `package-${suffix}`,
        isUnlocked: true,
        isComplete: false,
        sectionId: fixture.sectionId
      });

      expect(await queries.markActivityCompleteOnce(fixture.activityId, fixture.profileId)).toBe(true);

      const relisted = await getCourseContentItems(fixture.courseId, fixture.profileId);
      expect(relisted.find((row) => row.id === fixture.activityId)?.isComplete).toBe(true);
    } finally {
      await cleanupStructureFixture(fixture);
    }
  });

  it('bulk-updates activities alongside lessons and exercises', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createStructureFixture(suffix);
    try {
      const { db } = await import('@db/drizzle');
      const { applyCourseContentBulkUpdates } = await import('@db/queries/course/content-batch');
      const { updateCourseContent, reorderCourseContent } = await import('@cio/core/services/course/content');

      const result = await db.transaction((tx) =>
        applyCourseContentBulkUpdates(tx, [
          { id: fixture.activityId, type: ContentType.Activity, order: 1, isUnlocked: false }
        ])
      );

      expect(result).toMatchObject({ updatedItems: 1, updatedLessons: 0, updatedExercises: 0, updatedActivities: 1 });

      await updateCourseContent(fixture.courseId, [
        { id: fixture.activityId, type: ContentType.Activity, isUnlocked: true }
      ]);
      const reordered = await reorderCourseContent(fixture.courseId, {
        items: [
          { id: fixture.activityId, type: ContentType.Activity, order: 1 },
          { id: fixture.lessonId, type: ContentType.Lesson, order: 2 },
          { id: fixture.exerciseId, type: ContentType.Exercise, order: 3 }
        ]
      });

      expect(reordered.updatedActivities).toBe(1);
    } finally {
      await cleanupStructureFixture(fixture);
    }
  });

  it('moves ungrouped activities and counts section membership', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createStructureFixture(suffix);
    try {
      const queries = await import('@db/queries/activity/activity');
      const { getTakenItemSlugs } = await import('@db/queries/course/public-course');
      const { promoteUngroupedSection } = await import('@cio/core/services/course/section');

      expect(await queries.countActivitiesInSection(fixture.sectionId)).toBe(1);
      expect(await queries.getActivitiesBySectionId(fixture.sectionId)).toMatchObject([
        { id: fixture.activityId, title: 'Package' }
      ]);

      const slugs = await getTakenItemSlugs(fixture.courseId);
      expect(slugs.has(`package-${suffix}`)).toBe(true);

      const [ungrouped] = await queries.createActivities([
        { courseId: fixture.courseId, sectionId: null, kind: 'scorm', title: 'Loose', slug: 'loose', order: 1 }
      ]);
      expect(await queries.updateActivitiesSectionId(fixture.courseId, fixture.sectionId)).toBeGreaterThanOrEqual(1);

      const [second] = await queries.createActivities([
        { courseId: fixture.courseId, sectionId: null, kind: 'scorm', title: 'Loose two', slug: 'loose-two', order: 1 }
      ]);
      const promoted = await promoteUngroupedSection(fixture.courseId, { title: 'Second' });

      expect(promoted.movedActivities).toBeGreaterThanOrEqual(1);
      expect(await queries.countActivitiesInSection(promoted.section.id)).toBeGreaterThanOrEqual(1);

      await queries.deleteActivity(ungrouped.id);
      await queries.deleteActivity(second.id);
    } finally {
      await cleanupStructureFixture(fixture);
    }
  });

  it('refuses to delete a section that holds activities', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createStructureFixture(suffix);
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { deleteCourseSectionService } = await import('@cio/core/services/course/section');
      const queries = await import('@db/queries/activity/activity');

      const failure = await deleteCourseSectionService(fixture.sectionId).catch((error: Error) => error);

      expect(failure).toMatchObject({ code: 'SECTION_HAS_ACTIVITIES', statusCode: 409 });
      expect((failure as Error).message).toContain('Package');

      const [soloSection] = await db
        .insert(schema.courseSection)
        .values({ title: 'Solo', order: 2, courseId: fixture.courseId })
        .returning();
      const [solo] = await queries.createActivities([
        {
          courseId: fixture.courseId,
          sectionId: soloSection.id,
          kind: 'scorm',
          title: 'Solo',
          slug: 'solo',
          order: 1
        }
      ]);

      await expect(deleteCourseSectionService(soloSection.id)).rejects.toMatchObject({
        code: 'SECTION_HAS_ACTIVITIES',
        statusCode: 409
      });

      await queries.deleteActivity(solo.id);
      const deleted = await deleteCourseSectionService(soloSection.id);

      expect(deleted.id).toBe(soloSection.id);
    } finally {
      await cleanupStructureFixture(fixture);
    }
  });

  it('refuses PUBLIC conversion and PUBLIC activity creation while activities exist', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createStructureFixture(suffix);
    try {
      const { updateCourse } = await import('@cio/core/services/course/course');
      const { assertCourseAllowsActivities } = await import('@cio/core/services/course/public-course-guard');
      const { createActivity } = await import('@cio/core/services/activity/activity');

      const failure = await updateCourse(fixture.courseId, { type: 'PUBLIC' } as never).catch((error: Error) => error);

      expect(failure).toMatchObject({ statusCode: 400 });
      expect((failure as Error).message).toContain('Package');

      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const [publicCourse] = await db
        .insert(schema.course)
        .values({
          title: 'Public target',
          description: 'Public course guard',
          groupId: fixture.groupId,
          slug: `act-public-${suffix}`,
          type: 'PUBLIC' as never,
          status: 'ACTIVE'
        })
        .returning();

      await expect(assertCourseAllowsActivities(publicCourse.id)).rejects.toMatchObject({ statusCode: 400 });
      await expect(createActivity(publicCourse.id, { kind: 'scorm', title: 'Blocked' })).rejects.toMatchObject({
        statusCode: 400
      });

      await db.delete(schema.course).where(eq(schema.course.id, publicCourse.id));
    } finally {
      await cleanupStructureFixture(fixture);
    }
  });

  it('creates, reads, updates and deletes activities through the service', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createStructureFixture(suffix);
    try {
      const service = await import('@cio/core/services/activity/activity');

      const created = await service.createActivity(
        fixture.courseId,
        { kind: 'scorm', sectionId: fixture.sectionId, title: 'Second package' },
        fixture.profileId
      );

      expect(created.slug).toBeTruthy();
      expect(await service.listCourseActivities(fixture.courseId)).toHaveLength(2);

      const read = await service.getActivity(fixture.courseId, created.id);
      expect(read.title).toBe('Second package');

      await expect(service.getActivity(crypto.randomUUID(), created.id)).rejects.toMatchObject({ statusCode: 404 });

      const updated = await service.updateActivityService(fixture.courseId, created.id, {
        title: 'Renamed',
        isUnlocked: false
      });
      expect(updated).toMatchObject({ title: 'Renamed', isUnlocked: false });

      const deleted = await service.deleteActivityService(fixture.courseId, created.id);
      expect(deleted.id).toBe(created.id);
      expect(await service.listCourseActivities(fixture.courseId)).toHaveLength(1);
    } finally {
      await cleanupStructureFixture(fixture);
    }
  });
});
