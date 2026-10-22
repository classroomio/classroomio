import 'dotenv/config';

import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

type FixtureIds = {
  orgId: string;
  groupId: string;
  courseId: string;
  profileId: string;
  sections: { id: string; title: string }[];
  lessons: { id: string }[];
  activities: { id: string }[];
  drafts: string[];
};

async function createImportCourse(
  suffix: string,
  shape: { lessons: number; activities: { section: number; order: number }[]; sections?: number }
): Promise<FixtureIds> {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  const [organization] = await db
    .insert(schema.organization)
    .values({ name: `char-import-${suffix}` })
    .returning();
  const [group] = await db
    .insert(schema.group)
    .values({ name: `char-import-${suffix}`, organizationId: organization.id })
    .returning();
  const [course] = await db
    .insert(schema.course)
    .values({
      title: 'Import activity course',
      description: 'Draft round-trip coverage for activities',
      groupId: group.id,
      slug: `char-import-${suffix}`,
      type: 'SELF_PACED' as never,
      status: 'ACTIVE'
    })
    .returning();

  const sectionCount = shape.sections ?? 2;
  const sections: { id: string; title: string }[] = [];
  for (let index = 0; index < sectionCount; index += 1) {
    const [section] = await db
      .insert(schema.courseSection)
      .values({ title: `Section ${index + 1}`, order: index + 1, courseId: course.id })
      .returning();
    sections.push({ id: section.id, title: section.title ?? `Section ${index + 1}` });
  }

  const lessons: { id: string }[] = [];
  for (let index = 0; index < shape.lessons; index += 1) {
    const [lesson] = await db
      .insert(schema.lesson)
      .values({
        courseId: course.id,
        sectionId: sections[0]!.id,
        title: `Lesson ${index + 1}`,
        order: index + 1,
        slug: `import-lesson-${suffix}-${index}`,
        note: '<p>Lesson.</p>'
      })
      .returning();
    lessons.push({ id: lesson.id });
  }

  const activities: { id: string }[] = [];
  for (const placement of shape.activities) {
    const [activity] = await db
      .insert(schema.courseActivity)
      .values({
        courseId: course.id,
        sectionId: sections[placement.section]!.id,
        kind: 'scorm',
        title: 'Package item',
        slug: 'package-item',
        order: placement.order
      })
      .returning();
    activities.push({ id: activity.id });
  }

  const userId = crypto.randomUUID();
  await db.insert(schema.user).values({
    id: userId,
    name: `Char Import ${suffix}`,
    email: `char-import-${suffix}@example.com`
  });
  await db.insert(schema.profile).values({
    id: userId,
    fullname: `Char Import ${suffix}`,
    username: `char-import-${suffix}`,
    email: `char-import-${suffix}@example.com`
  });

  return {
    orgId: organization.id,
    groupId: group.id,
    courseId: course.id,
    profileId: userId,
    sections,
    lessons,
    activities,
    drafts: []
  };
}

async function cleanupImportCourse(ids: FixtureIds, extraCourseIds: string[] = []) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  if (ids.drafts.length > 0) {
    await db.delete(schema.courseImportDraft).where(eq(schema.courseImportDraft.organizationId, ids.orgId));
  }
  for (const courseId of [ids.courseId, ...extraCourseIds]) {
    await db.delete(schema.activityCompletion).where(eq(schema.activityCompletion.profileId, ids.profileId));
    await db.delete(schema.lessonCompletion).where(eq(schema.lessonCompletion.profileId, ids.profileId));
    await db.delete(schema.courseActivity).where(eq(schema.courseActivity.courseId, courseId));
    await db.delete(schema.lesson).where(eq(schema.lesson.courseId, courseId));
    await db.delete(schema.courseSection).where(eq(schema.courseSection.courseId, courseId));
    await db.delete(schema.course).where(eq(schema.course.id, courseId));
  }
  await db.delete(schema.profile).where(eq(schema.profile.id, ids.profileId));
  await db.delete(schema.user).where(eq(schema.user.id, ids.profileId));
  await db.delete(schema.group).where(eq(schema.group.id, ids.groupId));
  await db.delete(schema.organization).where(eq(schema.organization.id, ids.orgId));
}

describe.skipIf(!hasDatabase)('course import activities', () => {
  it('snapshots activities as references in the shared order space', { timeout: 30000 }, async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const ids = await createImportCourse(suffix, { lessons: 1, activities: [{ section: 0, order: 2 }] });
    try {
      const { getCourseImportStructureService } = await import('@api/services/course-import/course-import');

      const snapshot = await getCourseImportStructureService(ids.orgId, ids.courseId);

      expect(snapshot.draft.activities).toEqual([
        {
          existingActivityId: ids.activities[0]!.id,
          sectionExternalId: ids.sections[0]!.id,
          order: 2
        }
      ]);
      expect(snapshot.draft.lessons).toHaveLength(1);
    } finally {
      await cleanupImportCourse(ids);
    }
  });

  it('keeps root activities at their course order', { timeout: 30000 }, async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const ids = await createImportCourse(suffix, { lessons: 0, activities: [], sections: 0 });
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const [activity] = await db
        .insert(schema.courseActivity)
        .values({ courseId: ids.courseId, kind: 'scorm', title: 'Package', slug: 'package', order: 1 })
        .returning();
      const [lesson] = await db
        .insert(schema.lesson)
        .values({
          courseId: ids.courseId,
          title: 'Lesson',
          slug: `root-lesson-${suffix}`,
          note: '<p>Lesson.</p>',
          order: 2
        })
        .returning();

      const { getCourseImportStructureService } = await import('@api/services/course-import/course-import');
      const snapshot = await getCourseImportStructureService(ids.orgId, ids.courseId);
      const syntheticSection = snapshot.draft.sections[0];

      expect(snapshot.draft.sections).toHaveLength(1);
      expect(syntheticSection).toMatchObject({ title: 'Ungrouped', order: 1 });
      expect(snapshot.draft.lessons).toEqual([expect.objectContaining({ externalId: lesson!.id, order: 2 })]);
      expect(snapshot.draft.activities).toEqual([
        {
          existingActivityId: activity!.id,
          sectionExternalId: syntheticSection!.externalId,
          order: 1
        }
      ]);
    } finally {
      await cleanupImportCourse(ids);
    }
  });

  it('snapshots an activity-only course without lessons', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const ids = await createImportCourse(suffix, { lessons: 0, activities: [{ section: 0, order: 1 }] });
    try {
      const { getCourseImportStructureService } = await import('@api/services/course-import/course-import');

      const snapshot = await getCourseImportStructureService(ids.orgId, ids.courseId);

      expect(snapshot.draft.lessons).toHaveLength(0);
      expect(snapshot.draft.lessonLanguages).toHaveLength(0);
      expect(snapshot.draft.activities).toHaveLength(1);
    } finally {
      await cleanupImportCourse(ids);
    }
  });

  it('places moved activities at the end of the shared order in merge mode', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const ids = await createImportCourse(suffix, {
      lessons: 1,
      activities: [
        { section: 0, order: 2 },
        { section: 0, order: 5 }
      ]
    });
    try {
      const { createCourseImportDraftService, publishCourseImportDraftToExistingCourseService } = await import(
        '@api/services/course-import/course-import'
      );
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');

      const draft = await createCourseImportDraftService(ids.orgId, ids.profileId, {
        sourceType: 'course',
        draft: {
          warnings: [],
          tags: [],
          course: { title: 'Import activity course', description: 'Draft', type: 'SELF_PACED', locale: 'en' },
          sections: ids.sections.map((section, index) => ({
            externalId: section.id,
            title: section.title,
            order: index + 1
          })),
          lessons: [
            {
              externalId: ids.lessons[0]!.id,
              sectionExternalId: ids.sections[0]!.id,
              title: 'Lesson 1',
              order: 1
            }
          ],
          lessonLanguages: [{ lessonExternalId: ids.lessons[0]!.id, locale: 'en', content: '<p>Lesson.</p>' }],
          activities: [
            { existingActivityId: ids.activities[0]!.id, sectionExternalId: ids.sections[1]!.id, order: 1 },
            { existingActivityId: ids.activities[1]!.id, sectionExternalId: ids.sections[0]!.id, order: 2 }
          ]
        }
      });
      ids.drafts.push(draft.id);

      const result = await publishCourseImportDraftToExistingCourseService(ids.orgId, draft.id, {
        courseId: ids.courseId,
        syncMode: 'merge'
      });

      expect(result.updatedActivities).toBe(2);

      const [moved] = await db
        .select()
        .from(schema.courseActivity)
        .where(eq(schema.courseActivity.id, ids.activities[0]!.id));
      expect(moved?.sectionId).toBe(ids.sections[1]!.id);
      expect(moved?.order).toBe(1);

      const [kept] = await db
        .select()
        .from(schema.courseActivity)
        .where(eq(schema.courseActivity.id, ids.activities[1]!.id));
      expect(kept?.sectionId).toBe(ids.sections[0]!.id);
      expect(kept?.order).toBe(5);
    } finally {
      await cleanupImportCourse(ids);
    }
  });

  it('keeps unreferenced activities and deletes other content in replace mode', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const ids = await createImportCourse(suffix, {
      lessons: 1,
      activities: [
        { section: 0, order: 2 },
        { section: 0, order: 3 }
      ],
      sections: 2
    });
    try {
      const { createCourseImportDraftService, publishCourseImportDraftToExistingCourseService } = await import(
        '@api/services/course-import/course-import'
      );
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');

      const [secondLesson] = await db
        .insert(schema.lesson)
        .values({
          courseId: ids.courseId,
          sectionId: ids.sections[1]!.id,
          title: 'Second',
          order: 1,
          slug: `import-second-${suffix}`,
          note: '<p>Second.</p>'
        })
        .returning();

      const draft = await createCourseImportDraftService(ids.orgId, ids.profileId, {
        sourceType: 'course',
        draft: {
          warnings: [],
          tags: [],
          course: { title: 'Import activity course', description: 'Draft', type: 'SELF_PACED', locale: 'en' },
          sections: [{ externalId: ids.sections[0]!.id, title: ids.sections[0]!.title, order: 1 }],
          lessons: [
            {
              externalId: ids.lessons[0]!.id,
              sectionExternalId: ids.sections[0]!.id,
              title: 'Lesson 1',
              order: 1
            }
          ],
          lessonLanguages: [{ lessonExternalId: ids.lessons[0]!.id, locale: 'en', content: '<p>Lesson.</p>' }],
          activities: [{ existingActivityId: ids.activities[0]!.id, sectionExternalId: ids.sections[0]!.id, order: 2 }]
        }
      });
      ids.drafts.push(draft.id);

      const result = await publishCourseImportDraftToExistingCourseService(ids.orgId, draft.id, {
        courseId: ids.courseId,
        syncMode: 'replace'
      });

      expect(result.updatedActivities).toBe(1);
      expect(result.untouchedActivities).toBe(1);
      expect(result.deletedLessons).toBe(1);
      expect(result.deletedSections).toBe(1);

      const [kept] = await db
        .select()
        .from(schema.courseActivity)
        .where(eq(schema.courseActivity.id, ids.activities[1]!.id));
      expect(kept?.id).toBe(ids.activities[1]!.id);

      const droppedLessons = await db.select().from(schema.lesson).where(eq(schema.lesson.id, secondLesson.id));
      expect(droppedLessons).toHaveLength(0);
    } finally {
      await cleanupImportCourse(ids);
    }
  });

  it('refuses replace mode when a dropped section still holds packages', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const ids = await createImportCourse(suffix, { lessons: 1, activities: [{ section: 1, order: 1 }] });
    try {
      const { createCourseImportDraftService, publishCourseImportDraftToExistingCourseService } = await import(
        '@api/services/course-import/course-import'
      );

      const draft = await createCourseImportDraftService(ids.orgId, ids.profileId, {
        sourceType: 'course',
        draft: {
          warnings: [],
          tags: [],
          course: { title: 'Import activity course', description: 'Draft', type: 'SELF_PACED', locale: 'en' },
          sections: [{ externalId: ids.sections[0]!.id, title: ids.sections[0]!.title, order: 1 }],
          lessons: [
            {
              externalId: ids.lessons[0]!.id,
              sectionExternalId: ids.sections[0]!.id,
              title: 'Lesson 1',
              order: 1
            }
          ],
          lessonLanguages: [{ lessonExternalId: ids.lessons[0]!.id, locale: 'en', content: '<p>Lesson.</p>' }]
        }
      });
      ids.drafts.push(draft.id);

      await expect(
        publishCourseImportDraftToExistingCourseService(ids.orgId, draft.id, {
          courseId: ids.courseId,
          syncMode: 'replace'
        })
      ).rejects.toMatchObject({ code: 'ACTIVITY_SECTION_REMOVED', statusCode: 409 });
    } finally {
      await cleanupImportCourse(ids);
    }
  });

  it('refuses drafts on single-activity courses and cross-course references', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const ids = await createImportCourse(suffix, { lessons: 1, activities: [{ section: 0, order: 2 }] });
    const other = await createImportCourse(`other-${suffix}`, { lessons: 1, activities: [] });
    try {
      const {
        createCourseImportDraftService,
        publishCourseImportDraftToExistingCourseService,
        publishCourseImportDraftService
      } = await import('@api/services/course-import/course-import');
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');

      await db.update(schema.course).set({ format: 'single_activity' }).where(eq(schema.course.id, other.courseId));

      const singleActivityDraft = await createCourseImportDraftService(other.orgId, other.profileId, {
        sourceType: 'course',
        draft: {
          warnings: [],
          tags: [],
          course: { title: 'Other', description: 'Draft', type: 'SELF_PACED', locale: 'en' },
          sections: other.sections.map((section, index) => ({
            externalId: section.id,
            title: section.title,
            order: index + 1
          })),
          lessons: [
            {
              externalId: other.lessons[0]!.id,
              sectionExternalId: other.sections[0]!.id,
              title: 'Lesson',
              order: 1
            }
          ],
          lessonLanguages: [{ lessonExternalId: other.lessons[0]!.id, locale: 'en', content: '<p>Hi.</p>' }]
        }
      });
      other.drafts.push(singleActivityDraft.id);

      await expect(
        publishCourseImportDraftToExistingCourseService(other.orgId, singleActivityDraft.id, {
          courseId: other.courseId,
          syncMode: 'merge'
        })
      ).rejects.toMatchObject({ statusCode: 400 });

      const crossDraft = await createCourseImportDraftService(other.orgId, other.profileId, {
        sourceType: 'course',
        draft: {
          warnings: [],
          tags: [],
          course: { title: 'Other', description: 'Draft', type: 'SELF_PACED', locale: 'en' },
          sections: other.sections.map((section, index) => ({
            externalId: section.id,
            title: section.title,
            order: index + 1
          })),
          lessons: [
            {
              externalId: other.lessons[0]!.id,
              sectionExternalId: other.sections[0]!.id,
              title: 'Lesson',
              order: 1
            }
          ],
          lessonLanguages: [{ lessonExternalId: other.lessons[0]!.id, locale: 'en', content: '<p>Hi.</p>' }],
          activities: [
            { existingActivityId: ids.activities[0]!.id, sectionExternalId: other.sections[0]!.id, order: 2 }
          ]
        }
      });
      other.drafts.push(crossDraft.id);

      await db.update(schema.course).set({ format: 'standard' }).where(eq(schema.course.id, other.courseId));

      await expect(
        publishCourseImportDraftToExistingCourseService(other.orgId, crossDraft.id, {
          courseId: other.courseId,
          syncMode: 'merge'
        })
      ).rejects.toMatchObject({ statusCode: 400 });

      const freshDraft = await createCourseImportDraftService(ids.orgId, ids.profileId, {
        sourceType: 'course',
        draft: {
          warnings: [],
          tags: [],
          course: { title: 'Import activity course', description: 'Draft', type: 'SELF_PACED', locale: 'en' },
          sections: [{ externalId: ids.sections[0]!.id, title: ids.sections[0]!.title, order: 1 }],
          lessons: [
            {
              externalId: ids.lessons[0]!.id,
              sectionExternalId: ids.sections[0]!.id,
              title: 'Lesson 1',
              order: 1
            }
          ],
          lessonLanguages: [{ lessonExternalId: ids.lessons[0]!.id, locale: 'en', content: '<p>Lesson.</p>' }],
          activities: [{ existingActivityId: ids.activities[0]!.id, sectionExternalId: ids.sections[0]!.id, order: 2 }]
        }
      });
      ids.drafts.push(freshDraft.id);

      await expect(publishCourseImportDraftService(ids.orgId, ids.profileId, freshDraft.id, {})).rejects.toMatchObject({
        statusCode: 400
      });
    } finally {
      await cleanupImportCourse(ids);
      await cleanupImportCourse(other);
    }
  });
});
