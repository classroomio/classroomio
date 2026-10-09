import 'dotenv/config';

import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { ContentType, ROLE } from '@cio/utils/constants';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

type ServiceFixture = {
  orgId: string;
  groupId: string;
  courseId: string;
  sectionId: string;
  lessonOneId: string;
  lessonTwoId: string;
  exerciseId: string;
  studentProfileId: string;
  studentMemberId: string;
  tutorProfileId: string;
  tutorMemberId: string;
};

async function createServiceFixture(
  suffix: string,
  options: { published?: boolean; sequential?: boolean; secondLocked?: boolean } = {}
): Promise<ServiceFixture> {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');
  const { published = true, sequential = false, secondLocked = false } = options;

  const [organization] = await db
    .insert(schema.organization)
    .values({ name: `char-svc-${suffix}` })
    .returning();
  const [group] = await db
    .insert(schema.group)
    .values({ name: `char-svc-${suffix}`, organizationId: organization.id })
    .returning();
  const [course] = await db
    .insert(schema.course)
    .values({
      title: 'Service baseline',
      description: 'Zero-activity service characterization',
      groupId: group.id,
      slug: `char-svc-${suffix}`,
      type: 'SELF_PACED' as never,
      status: 'ACTIVE',
      isPublished: published,
      metadata: sequential ? { progressionMode: 'sequential' } : {}
    })
    .returning();
  const [section] = await db
    .insert(schema.courseSection)
    .values({ title: 'Main', order: 1, courseId: course.id })
    .returning();
  const [lessonOne] = await db
    .insert(schema.lesson)
    .values({ courseId: course.id, sectionId: section.id, title: 'Lesson one', order: 1, note: '<p>One.</p>' })
    .returning();
  const [lessonTwo] = await db
    .insert(schema.lesson)
    .values({
      courseId: course.id,
      sectionId: section.id,
      title: 'Lesson two',
      order: 2,
      note: '<p>Two.</p>',
      isUnlocked: !secondLocked
    })
    .returning();
  const [exercise] = await db
    .insert(schema.exercise)
    .values({ courseId: course.id, sectionId: section.id, title: 'Quiz', order: 3 })
    .returning();

  async function createMember(tag: string, roleId: number) {
    const userId = crypto.randomUUID();
    await db.insert(schema.user).values({
      id: userId,
      name: `Svc ${tag} ${suffix}`,
      email: `svc-${tag}-${suffix}@example.com`
    });
    await db.insert(schema.profile).values({
      id: userId,
      fullname: `Svc ${tag} ${suffix}`,
      username: `svc-${tag}-${suffix}`,
      email: `svc-${tag}-${suffix}@example.com`
    });
    const [member] = await db
      .insert(schema.groupmember)
      .values({ groupId: group.id, roleId, profileId: userId, email: `svc-${tag}-${suffix}@example.com` })
      .returning();
    return { profileId: userId, memberId: member.id };
  }

  const student = await createMember('student', ROLE.STUDENT);
  const tutor = await createMember('tutor', ROLE.TUTOR);

  await db.insert(schema.lessonCompletion).values({
    lessonId: lessonOne.id,
    profileId: student.profileId,
    isComplete: true
  });
  await db.insert(schema.submission).values({
    exerciseId: exercise.id,
    courseId: course.id,
    submittedBy: student.memberId
  });

  return {
    orgId: organization.id,
    groupId: group.id,
    courseId: course.id,
    sectionId: section.id,
    lessonOneId: lessonOne.id,
    lessonTwoId: lessonTwo.id,
    exerciseId: exercise.id,
    studentProfileId: student.profileId,
    studentMemberId: student.memberId,
    tutorProfileId: tutor.profileId,
    tutorMemberId: tutor.memberId
  };
}

async function cleanupServiceFixture(fixture: ServiceFixture, extraCourseIds: string[] = []) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');
  const { inArray } = await import('drizzle-orm');

  for (const courseId of [fixture.courseId, ...extraCourseIds]) {
    const feeds = await db
      .select({ id: schema.courseNewsfeed.id })
      .from(schema.courseNewsfeed)
      .where(eq(schema.courseNewsfeed.courseId, courseId));
    if (feeds.length > 0) {
      const feedIds = feeds.map((feed) => feed.id);
      await db
        .delete(schema.courseNewsfeedComment)
        .where(inArray(schema.courseNewsfeedComment.courseNewsfeedId, feedIds));
      await db.delete(schema.courseNewsfeed).where(inArray(schema.courseNewsfeed.id, feedIds));
    }
    await db.delete(schema.submission).where(eq(schema.submission.courseId, courseId));
    await db.delete(schema.exercise).where(eq(schema.exercise.courseId, courseId));
    await db.delete(schema.lesson).where(eq(schema.lesson.courseId, courseId));
    await db.delete(schema.courseSection).where(eq(schema.courseSection.courseId, courseId));
    await db.delete(schema.course).where(eq(schema.course.id, courseId));
  }
  for (const profileId of [fixture.studentProfileId, fixture.tutorProfileId]) {
    await db.delete(schema.lessonCompletion).where(eq(schema.lessonCompletion.profileId, profileId));
    await db.delete(schema.groupmember).where(eq(schema.groupmember.profileId, profileId));
    await db.delete(schema.profile).where(eq(schema.profile.id, profileId));
    await db.delete(schema.user).where(eq(schema.user.id, profileId));
  }
  await db.delete(schema.group).where(eq(schema.group.organizationId, fixture.orgId));
  await db.delete(schema.organization).where(eq(schema.organization.id, fixture.orgId));
}

function suffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

describe.skipIf(!hasDatabase)('characterization: getCourse service (zero activities)', () => {
  it('returns the grouped content tree without a profile', { timeout: 30000 }, async () => {
    const fixture = await createServiceFixture(suffix());
    try {
      const { getCourse } = await import('@cio/core/services/course/course');
      const course = (await getCourse(fixture.courseId)) as unknown as {
        id: string;
        content: { grouped: boolean; sections: { id: string; items: { id: string }[] }[] };
        metadata: { progressionMode: string };
        studentLimitReached: boolean;
      };

      expect(course.id).toBe(fixture.courseId);
      expect(course.content.grouped).toBe(true);
      expect(course.content.sections).toHaveLength(1);
      expect(course.content.sections[0].items.map((item) => item.id)).toEqual([
        fixture.lessonOneId,
        fixture.lessonTwoId,
        fixture.exerciseId
      ]);
      expect(course.metadata.progressionMode).toBe('free');
      expect(course.studentLimitReached).toBe(false);
    } finally {
      await cleanupServiceFixture(fixture);
    }
  });

  it('annotates completion for a student profile', { timeout: 30000 }, async () => {
    const fixture = await createServiceFixture(suffix());
    try {
      const { getCourse } = await import('@cio/core/services/course/course');
      const course = (await getCourse(fixture.courseId, undefined, fixture.studentProfileId)) as unknown as {
        content: { sections: { items: { id: string; isComplete: boolean | null }[] }[] };
      };
      const byId = new Map(course.content.sections[0].items.map((item) => [item.id, item]));

      expect(byId.get(fixture.lessonOneId)?.isComplete).toBe(true);
      expect(byId.get(fixture.lessonTwoId)?.isComplete).toBe(false);
      expect(byId.get(fixture.exerciseId)?.isComplete).toBe(true);
    } finally {
      await cleanupServiceFixture(fixture);
    }
  });

  it('rejects missing identifiers and unknown courses', async () => {
    const { getCourse } = await import('@cio/core/services/course/course');

    await expect(getCourse(undefined, undefined)).rejects.toMatchObject({ statusCode: 400 });
    await expect(getCourse(crypto.randomUUID())).rejects.toMatchObject({ statusCode: 404 });
  });

  it('hides unpublished courses from students but not tutors', async () => {
    const fixture = await createServiceFixture(suffix(), { published: false });
    try {
      const { getCourse } = await import('@cio/core/services/course/course');

      await expect(getCourse(fixture.courseId, undefined, fixture.studentProfileId)).rejects.toMatchObject({
        statusCode: 404
      });
      const tutorView = (await getCourse(fixture.courseId, undefined, fixture.tutorProfileId)) as unknown as {
        id: string;
      };
      expect(tutorView.id).toBe(fixture.courseId);
    } finally {
      await cleanupServiceFixture(fixture);
    }
  });
});

describe.skipIf(!hasDatabase)('characterization: reorder/update/delete course content (zero activities)', () => {
  it('reorders lessons and reports counts', async () => {
    const fixture = await createServiceFixture(suffix());
    try {
      const { reorderCourseContent } = await import('@cio/core/services/course/content');
      const { getCourseContentItems } = await import('@db/queries/course/content');

      const result = await reorderCourseContent(fixture.courseId, {
        items: [
          { id: fixture.lessonOneId, type: ContentType.Lesson, order: 2 },
          { id: fixture.lessonTwoId, type: ContentType.Lesson, order: 1 }
        ]
      });

      expect(result).toEqual({
        courseId: fixture.courseId,
        updatedSections: 0,
        updatedItems: 2,
        updatedLessons: 2,
        updatedExercises: 0
      });

      const rows = await getCourseContentItems(fixture.courseId);
      const orders = new Map(rows.map((row) => [row.id, row.order]));
      expect(orders.get(fixture.lessonOneId)).toBe(2);
      expect(orders.get(fixture.lessonTwoId)).toBe(1);
    } finally {
      await cleanupServiceFixture(fixture);
    }
  });

  it('rejects empty reorder payloads and foreign items', async () => {
    const fixture = await createServiceFixture(suffix());
    try {
      const { reorderCourseContent } = await import('@cio/core/services/course/content');

      await expect(reorderCourseContent(fixture.courseId, {})).rejects.toMatchObject({ statusCode: 400 });
      await expect(
        reorderCourseContent(fixture.courseId, {
          items: [{ id: crypto.randomUUID(), type: ContentType.Lesson, order: 1 }]
        })
      ).rejects.toMatchObject({ statusCode: 404 });
    } finally {
      await cleanupServiceFixture(fixture);
    }
  });

  it('locks and unlocks a lesson', async () => {
    const fixture = await createServiceFixture(suffix());
    try {
      const { updateCourseContent } = await import('@cio/core/services/course/content');
      const { getCourseContentItems } = await import('@db/queries/course/content');

      await updateCourseContent(fixture.courseId, [
        { id: fixture.lessonTwoId, type: ContentType.Lesson, isUnlocked: false }
      ]);
      const locked = new Map((await getCourseContentItems(fixture.courseId)).map((row) => [row.id, row]));
      expect(locked.get(fixture.lessonTwoId)?.isUnlocked).toBe(false);

      await updateCourseContent(fixture.courseId, [
        { id: fixture.lessonTwoId, type: ContentType.Lesson, isUnlocked: true }
      ]);
      const unlocked = new Map((await getCourseContentItems(fixture.courseId)).map((row) => [row.id, row]));
      expect(unlocked.get(fixture.lessonTwoId)?.isUnlocked).toBe(true);
    } finally {
      await cleanupServiceFixture(fixture);
    }
  });

  it('rejects updates for items outside the course', async () => {
    const fixture = await createServiceFixture(suffix());
    try {
      const { updateCourseContent } = await import('@cio/core/services/course/content');

      await expect(
        updateCourseContent(fixture.courseId, [
          { id: crypto.randomUUID(), type: ContentType.Lesson, isUnlocked: false }
        ])
      ).rejects.toMatchObject({ statusCode: 404 });
    } finally {
      await cleanupServiceFixture(fixture);
    }
  });

  it('deletes an exercise and keeps the lessons', async () => {
    const fixture = await createServiceFixture(suffix());
    try {
      const { deleteCourseContent } = await import('@cio/core/services/course/content');
      const { getCourseContentItems } = await import('@db/queries/course/content');

      await deleteCourseContent(fixture.courseId, { items: [{ id: fixture.exerciseId, type: ContentType.Exercise }] });

      const rows = await getCourseContentItems(fixture.courseId);
      expect(rows.map((row) => row.type).sort()).toEqual(['LESSON', 'LESSON', 'SECTION']);
      expect(rows.some((row) => row.id === fixture.exerciseId)).toBe(false);
    } finally {
      await cleanupServiceFixture(fixture);
    }
  });
});

describe.skipIf(!hasDatabase)('characterization: sections (zero activities)', () => {
  it('promotes ungrouped content into a new section', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const fixture = await createServiceFixture(suffix());
    const [ungrouped] = await db
      .insert(schema.lesson)
      .values({ courseId: fixture.courseId, sectionId: null, title: 'Stray lesson', order: 9 })
      .returning();
    try {
      const { promoteUngroupedSection } = await import('@cio/core/services/course/section');

      const result = await promoteUngroupedSection(fixture.courseId, { title: 'Gathered' });

      expect(result.movedLessons).toBe(1);
      expect(result.movedExercises).toBe(0);
      expect(result.section.title).toBe('Gathered');

      const [moved] = await db
        .select({ sectionId: schema.lesson.sectionId })
        .from(schema.lesson)
        .where(eq(schema.lesson.id, ungrouped.id));
      expect(moved.sectionId).toBe(result.section.id);
    } finally {
      await cleanupServiceFixture(fixture);
    }
  });

  it('refuses to promote when nothing is ungrouped', async () => {
    const fixture = await createServiceFixture(suffix());
    try {
      const { promoteUngroupedSection } = await import('@cio/core/services/course/section');

      await expect(promoteUngroupedSection(fixture.courseId, { title: 'Gathered' })).rejects.toMatchObject({
        statusCode: 400
      });
    } finally {
      await cleanupServiceFixture(fixture);
    }
  });

  it('deletes an empty section and reports 404 for unknown ids', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const fixture = await createServiceFixture(suffix());
    const [extra] = await db
      .insert(schema.courseSection)
      .values({ title: 'Spare', order: 9, courseId: fixture.courseId })
      .returning();
    try {
      const { deleteCourseSectionService } = await import('@cio/core/services/course/section');

      const deleted = await deleteCourseSectionService(extra.id);
      expect(deleted.id).toBe(extra.id);

      await expect(deleteCourseSectionService(crypto.randomUUID())).rejects.toMatchObject({ statusCode: 404 });
    } finally {
      await cleanupServiceFixture(fixture);
    }
  });
});

describe.skipIf(!hasDatabase)('characterization: progression and access (zero activities)', () => {
  it('blocks sequential items until prior content completes', async () => {
    const fixture = await createServiceFixture(suffix(), { sequential: true, secondLocked: true });
    try {
      const { annotateCourseContentWithProgression } = await import('@cio/core/services/course/progression');
      const { getCourseContentItems } = await import('@db/queries/course/content');

      const rows = await getCourseContentItems(fixture.courseId, fixture.studentProfileId);
      const annotated = await annotateCourseContentWithProgression({
        courseId: fixture.courseId,
        profileId: fixture.studentProfileId,
        roleId: ROLE.STUDENT,
        progressionMode: 'sequential',
        contentRows: rows,
        isContentGroupingEnabled: true
      });

      const byId = new Map(annotated.sections[0].items.map((item) => [item.id, item]));
      expect(byId.get(fixture.lessonOneId)).toMatchObject({ accessible: true, lockReason: null });
      expect(byId.get(fixture.lessonTwoId)?.accessible).toBe(false);
      expect(byId.get(fixture.lessonTwoId)?.lockReason).not.toBeNull();
    } finally {
      await cleanupServiceFixture(fixture);
    }
  });

  it('marks everything accessible for team roles', async () => {
    const fixture = await createServiceFixture(suffix(), { sequential: true, secondLocked: true });
    try {
      const { annotateCourseContentWithProgression } = await import('@cio/core/services/course/progression');
      const { getCourseContentItems } = await import('@db/queries/course/content');

      const rows = await getCourseContentItems(fixture.courseId, fixture.tutorProfileId);
      const annotated = await annotateCourseContentWithProgression({
        courseId: fixture.courseId,
        profileId: fixture.tutorProfileId,
        roleId: ROLE.TUTOR,
        progressionMode: 'sequential',
        contentRows: rows,
        isContentGroupingEnabled: true
      });

      for (const item of annotated.sections[0].items) {
        expect(item).toMatchObject({ accessible: true, lockReason: null });
      }
    } finally {
      await cleanupServiceFixture(fixture);
    }
  });

  it('enforces published and lock gates for student content access', async () => {
    const fixture = await createServiceFixture(suffix(), { sequential: true, secondLocked: true });
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const [unpublished] = await db
      .insert(schema.course)
      .values({
        title: 'Draft',
        description: 'Unpublished',
        groupId: fixture.groupId,
        slug: `char-svc-draft-${Date.now()}`,
        type: 'SELF_PACED' as never,
        status: 'ACTIVE',
        isPublished: false
      })
      .returning();
    try {
      const { assertEnrolledStudentContentAccess } = await import('@api/services/course/access');

      await expect(
        assertEnrolledStudentContentAccess({
          courseId: unpublished.id,
          profileId: fixture.studentProfileId,
          contentId: fixture.lessonOneId,
          type: ContentType.Lesson
        })
      ).rejects.toMatchObject({ statusCode: 404 });

      await expect(
        assertEnrolledStudentContentAccess({
          courseId: fixture.courseId,
          profileId: fixture.studentProfileId,
          contentId: fixture.lessonTwoId,
          type: ContentType.Lesson
        })
      ).rejects.toMatchObject({ statusCode: 403 });

      await expect(
        assertEnrolledStudentContentAccess({
          courseId: fixture.courseId,
          profileId: fixture.studentProfileId,
          contentId: fixture.lessonOneId,
          type: ContentType.Lesson
        })
      ).resolves.toBeUndefined();

      await expect(
        assertEnrolledStudentContentAccess({
          courseId: unpublished.id,
          profileId: fixture.tutorProfileId,
          contentId: fixture.lessonOneId,
          type: ContentType.Lesson
        })
      ).resolves.toBeUndefined();
    } finally {
      await cleanupServiceFixture(fixture, [unpublished.id]);
    }
  });
});

describe.skipIf(!hasDatabase)('characterization: clone and templates (zero activities)', () => {
  it('clones sections, lessons and exercises without learner state', { timeout: 30000 }, async () => {
    const tag = suffix();
    const fixture = await createServiceFixture(tag);
    const copySlug = `char-svc-copy-${tag}`;
    let copyId = '';
    try {
      const { db } = await import('@db/drizzle');
      const { cloneCourse } = await import('@api/services/course/clone');
      const { getCourseContentItems } = await import('@db/queries/course/content');
      const schema = await import('@db/schema');

      const copy = await cloneCourse(
        fixture.courseId,
        { title: 'Cloned baseline', userId: fixture.tutorProfileId, slug: copySlug, organizationId: fixture.orgId },
        db
      );
      copyId = copy.id;

      expect(copy.id).not.toBe(fixture.courseId);
      expect(copy.title).toBe('Cloned baseline');

      const rows = await getCourseContentItems(copy.id);
      expect(rows.map((row) => row.type).sort()).toEqual(['EXERCISE', 'LESSON', 'LESSON', 'SECTION']);
      expect(rows.some((row) => row.id === fixture.lessonOneId)).toBe(false);

      const completions = await db
        .select({ id: schema.lessonCompletion.id })
        .from(schema.lessonCompletion)
        .innerJoin(schema.lesson, eq(schema.lessonCompletion.lessonId, schema.lesson.id))
        .where(eq(schema.lesson.courseId, copy.id));
      expect(completions).toHaveLength(0);
    } finally {
      await cleanupServiceFixture(fixture, copyId ? [copyId] : []);
    }
  });

  it('previews a template outline and rejects unknown templates', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const fixture = await createServiceFixture(suffix());
    const [template] = await db
      .insert(schema.course)
      .values({
        title: 'Baseline template',
        description: 'Template outline',
        groupId: fixture.groupId,
        slug: `char-svc-template-${Date.now()}`,
        type: 'SELF_PACED' as never,
        status: 'ACTIVE',
        isTemplate: true
      })
      .returning();
    const [templateSection] = await db
      .insert(schema.courseSection)
      .values({ title: 'Main', order: 1, courseId: template.id })
      .returning();
    await db.insert(schema.lesson).values({
      courseId: template.id,
      sectionId: templateSection.id,
      title: 'Template lesson',
      order: 1
    });
    await db.insert(schema.exercise).values({
      courseId: template.id,
      sectionId: templateSection.id,
      title: 'Template quiz',
      order: 2
    });
    try {
      const { getCourseTemplatePreview } = await import('@api/services/course/course-template');

      const preview = await getCourseTemplatePreview(template.id, fixture.orgId);
      expect(preview.counts).toEqual({ sections: 1, lessons: 1, exercises: 1 });
      expect(preview.outline).toHaveLength(1);
      expect(preview.outline[0]).toMatchObject({ id: templateSection.id, title: 'Main' });
      expect(preview.outline[0].lessons.map((lesson) => lesson.title)).toEqual(['Template lesson']);
      expect(preview.outline[0].exercises.map((exercise) => exercise.title)).toEqual(['Template quiz']);

      await expect(getCourseTemplatePreview(crypto.randomUUID(), fixture.orgId)).rejects.toMatchObject({
        statusCode: 404
      });
    } finally {
      await cleanupServiceFixture(fixture, [template.id]);
    }
  });
});

describe.skipIf(!hasDatabase)('characterization: assets (zero activities)', () => {
  it('deletes an unused asset and shows an empty usage graph', async () => {
    const fixture = await createServiceFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { deleteAssetService, getAssetUsageGraphService } = await import('@cio/core/services/assets/assets');

      const [asset] = await db
        .insert(schema.asset)
        .values({ organizationId: fixture.orgId, kind: 'image', title: 'Spare image' })
        .returning();

      const graph = await getAssetUsageGraphService(fixture.orgId, asset.id);
      expect(graph).toMatchObject({ usageCount: 0, usages: [] });

      const deleted = await deleteAssetService(fixture.orgId, asset.id);
      expect(deleted.id).toBe(asset.id);
    } finally {
      await cleanupServiceFixture(fixture);
    }
  });

  it('refuses to delete an asset attached to a lesson', async () => {
    const fixture = await createServiceFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { deleteAssetService, getAssetUsageGraphService } = await import('@cio/core/services/assets/assets');

      const [asset] = await db
        .insert(schema.asset)
        .values({ organizationId: fixture.orgId, kind: 'image', title: 'Lesson cover' })
        .returning();
      await db.insert(schema.assetUsage).values({
        organizationId: fixture.orgId,
        assetId: asset.id,
        targetType: 'lesson',
        targetId: fixture.lessonOneId,
        slotType: 'lesson_cover'
      });

      const graph = await getAssetUsageGraphService(fixture.orgId, asset.id);
      expect(graph.usageCount).toBe(1);
      expect(graph.usages).toHaveLength(1);
      expect(graph.usages[0]).toMatchObject({ targetId: fixture.lessonOneId });

      await expect(deleteAssetService(fixture.orgId, asset.id)).rejects.toMatchObject({ statusCode: 409 });

      await db.delete(schema.assetUsage).where(eq(schema.assetUsage.assetId, asset.id));
      await db.delete(schema.asset).where(eq(schema.asset.id, asset.id));
    } finally {
      await cleanupServiceFixture(fixture);
    }
  });
});

describe.skipIf(!hasDatabase)('characterization: agent course tools (zero activities)', () => {
  it('reads structure and reorders through the agent tools', { timeout: 30000 }, async () => {
    const fixture = await createServiceFixture(suffix());
    try {
      const { buildAgentTools } = await import('@cio/core/services/agent/chat-tools');
      const { getCourseContentItems } = await import('@db/queries/course/content');

      const tools = buildAgentTools(fixture.orgId, fixture.tutorProfileId, fixture.courseId, []);

      const structure = (await tools.get_course_structure.execute(undefined, {
        toolCallId: 'char-1',
        messages: []
      })) as unknown as { sections: unknown[]; items: { id: string; type: string }[] };
      expect(structure.sections).toHaveLength(1);
      expect(structure.items.map((item) => item.type).sort()).toEqual(['EXERCISE', 'LESSON', 'LESSON', 'SECTION']);

      const result = (await tools.reorder_content.execute(
        {
          items: [
            { id: fixture.lessonOneId, type: ContentType.Lesson, order: 2 },
            { id: fixture.lessonTwoId, type: ContentType.Lesson, order: 1 }
          ]
        },
        { toolCallId: 'char-2', messages: [] }
      )) as unknown as { courseId: string; updatedLessons: number };

      expect(result).toMatchObject({ courseId: fixture.courseId, updatedLessons: 2 });

      const rows = await getCourseContentItems(fixture.courseId);
      const orders = new Map(rows.map((row) => [row.id, row.order]));
      expect(orders.get(fixture.lessonOneId)).toBe(2);
      expect(orders.get(fixture.lessonTwoId)).toBe(1);
    } finally {
      await cleanupServiceFixture(fixture);
    }
  });
});

describe.skipIf(!hasDatabase)('characterization: course-import structure, drafts and publish (zero activities)', () => {
  it('snapshots structure, rejects lesson-less courses, and round-trips a draft', { timeout: 30000 }, async () => {
    const tag = suffix();
    const fixture = await createServiceFixture(tag);
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const [emptyCourse] = await db
      .insert(schema.course)
      .values({
        title: 'Empty',
        description: 'No lessons',
        groupId: fixture.groupId,
        slug: `char-svc-empty-${tag}`,
        type: 'SELF_PACED' as never,
        status: 'ACTIVE'
      })
      .returning();
    const publishedIds: string[] = [];
    let draftId = '';
    try {
      const {
        createCourseImportDraftFromCourseService,
        getCourseImportStructureService,
        publishCourseImportDraftService,
        publishCourseImportDraftToExistingCourseService
      } = await import('@api/services/course-import/course-import');

      const snapshot = await getCourseImportStructureService(fixture.orgId, fixture.courseId);
      expect(snapshot.draft.course.title).toBe('Service baseline');
      expect(snapshot.draft.sections).toHaveLength(1);
      expect(snapshot.draft.lessons).toHaveLength(2);

      await expect(getCourseImportStructureService(fixture.orgId, emptyCourse.id)).rejects.toMatchObject({
        statusCode: 400
      });

      const draft = await createCourseImportDraftFromCourseService(fixture.orgId, fixture.tutorProfileId, {
        courseId: fixture.courseId
      });
      draftId = draft.id;
      expect(draft.status).toBe('DRAFT');
      expect(draft.title).toBe('Service baseline');

      const published = await publishCourseImportDraftService(fixture.orgId, fixture.tutorProfileId, draft.id, {});
      publishedIds.push(published.courseId);
      expect(published.courseId).not.toBe(fixture.courseId);
      expect(published.createdLessons).toBe(2);
      expect(published.createdSections).toBe(1);

      const republished = await publishCourseImportDraftService(fixture.orgId, fixture.tutorProfileId, draft.id, {});
      expect(republished.courseId).toBe(published.courseId);
      expect(republished.createdLessons).toBe(0);

      const [target] = await db
        .insert(schema.course)
        .values({
          title: 'Merge target',
          description: 'Existing course',
          groupId: fixture.groupId,
          slug: `char-svc-target-${tag}`,
          type: 'SELF_PACED' as never,
          status: 'ACTIVE'
        })
        .returning();
      publishedIds.push(target.id);

      const merged = await publishCourseImportDraftToExistingCourseService(fixture.orgId, draft.id, {
        courseId: target.id,
        syncMode: 'merge'
      });
      expect(merged.courseId).toBe(target.id);
      expect(merged.createdLessons).toBe(2);
    } finally {
      const { db: cleanDb } = await import('@db/drizzle');
      const cleanSchema = await import('@db/schema');
      if (draftId) {
        await cleanDb.delete(cleanSchema.courseImportDraft).where(eq(cleanSchema.courseImportDraft.id, draftId));
      }
      await cleanupServiceFixture(fixture, [emptyCourse.id, ...publishedIds]);
    }
  });
});
