import 'dotenv/config';

import { describe, expect, it } from 'vitest';
import { eq, inArray } from 'drizzle-orm';

import { buildCourseOutline, type CourseContent } from '@cio/core/services/course/utils';
import { ContentType } from '@cio/utils/constants';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

describe('course outline', () => {
  it('lists standalone items between sections in course order', () => {
    const content = {
      grouped: true,
      items: [],
      sections: [
        { id: 'basics', title: 'Basics', order: 2, items: [] },
        {
          id: 'ungrouped',
          title: 'Ungrouped',
          order: 4,
          items: [
            { id: 'intro', type: ContentType.Lesson, order: 1 },
            { id: 'quiz', type: ContentType.Exercise, order: 3 }
          ]
        }
      ]
    } as unknown as CourseContent;

    expect(buildCourseOutline(content)).toEqual([
      { kind: 'item', id: 'intro', type: ContentType.Lesson },
      { kind: 'section', id: 'basics' },
      { kind: 'item', id: 'quiz', type: ContentType.Exercise }
    ]);
  });
});

describe.skipIf(!hasDatabase)('top-level content placement', () => {
  async function createCourseWithOutline() {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const [organization] = await db
      .insert(schema.organization)
      .values({ name: `root-order-${Date.now()}` })
      .returning();
    const [group] = await db
      .insert(schema.group)
      .values({ name: 'Root order', organizationId: organization.id })
      .returning();
    const [course] = await db
      .insert(schema.course)
      .values({ title: 'Root order', description: 'Root order', groupId: group.id })
      .returning();
    const [section] = await db
      .insert(schema.courseSection)
      .values({ title: 'Basics', order: 1, courseId: course.id })
      .returning();
    const [lesson] = await db
      .insert(schema.lesson)
      .values({ title: 'Wrap up', slug: 'wrap-up', order: 2, courseId: course.id })
      .returning();

    return { db, schema, organization, group, course, section, lesson };
  }

  async function rootOrders(courseId: string) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const sections = await db
      .select({ title: schema.courseSection.title, order: schema.courseSection.order })
      .from(schema.courseSection)
      .where(eq(schema.courseSection.courseId, courseId));
    const lessons = await db
      .select({ title: schema.lesson.title, order: schema.lesson.order, sectionId: schema.lesson.sectionId })
      .from(schema.lesson)
      .where(eq(schema.lesson.courseId, courseId));

    return Object.fromEntries(
      [...sections, ...lessons.filter((lesson) => !lesson.sectionId)].map((entry) => [entry.title, entry.order])
    );
  }

  async function cleanUp(setup: Awaited<ReturnType<typeof createCourseWithOutline>>) {
    const { db, schema, organization, group, course } = setup;
    await db.delete(schema.lesson).where(eq(schema.lesson.courseId, course.id));
    await db.delete(schema.courseSection).where(eq(schema.courseSection.courseId, course.id));
    await db.delete(schema.course).where(inArray(schema.course.id, [course.id]));
    await db.delete(schema.group).where(eq(schema.group.id, group.id));
    await db.delete(schema.organization).where(eq(schema.organization.id, organization.id));
  }

  it('inserts a standalone lesson at a taken position and moves later entries down', async () => {
    const setup = await createCourseWithOutline();
    try {
      const { createLesson } = await import('@cio/core/services/lesson/lesson');
      await createLesson(setup.course.id, { title: 'Intro', courseId: setup.course.id, order: 1 });

      expect(await rootOrders(setup.course.id)).toEqual({ Intro: 1, Basics: 2, 'Wrap up': 3 });
    } finally {
      await cleanUp(setup);
    }
  });

  it('inserts a standalone exercise at a taken position and moves later entries down', async () => {
    const setup = await createCourseWithOutline();
    try {
      const { createExercise } = await import('@cio/core/services/exercise/exercise');
      await createExercise({ title: 'Quiz', courseId: setup.course.id, order: 2 });

      const { db, schema } = setup;
      const [exercise] = await db
        .select({ order: schema.exercise.order })
        .from(schema.exercise)
        .where(eq(schema.exercise.courseId, setup.course.id));
      expect(exercise.order).toBe(2);
      expect(await rootOrders(setup.course.id)).toEqual({ Basics: 1, 'Wrap up': 3 });
    } finally {
      await setup.db.delete(setup.schema.exercise).where(eq(setup.schema.exercise.courseId, setup.course.id));
      await cleanUp(setup);
    }
  });

  it('gives concurrent standalone lessons at the same position different positions', async () => {
    const setup = await createCourseWithOutline();
    try {
      const { createLesson } = await import('@cio/core/services/lesson/lesson');
      await Promise.all(
        Array.from({ length: 8 }, (_, index) =>
          createLesson(setup.course.id, { title: `Concurrent ${index}`, courseId: setup.course.id, order: 3 })
        )
      );

      const orders = Object.values(await rootOrders(setup.course.id));
      expect(new Set(orders).size).toBe(orders.length);
    } finally {
      await cleanUp(setup);
    }
  });

  it('moves a section into a taken position without sharing it', async () => {
    const setup = await createCourseWithOutline();
    try {
      const { updateCourseSectionService } = await import('@cio/core/services/course/section');
      await updateCourseSectionService(setup.section.id, { order: 2 });

      expect(await rootOrders(setup.course.id)).toEqual({ Basics: 2, 'Wrap up': 3 });
    } finally {
      await cleanUp(setup);
    }
  });

  it('leaves top-level positions alone for a lesson inside a section', async () => {
    const setup = await createCourseWithOutline();
    try {
      const { createLesson } = await import('@cio/core/services/lesson/lesson');
      await createLesson(setup.course.id, {
        title: 'Inside',
        courseId: setup.course.id,
        sectionId: setup.section.id,
        order: 1
      });

      expect(await rootOrders(setup.course.id)).toEqual({ Basics: 1, 'Wrap up': 2 });
    } finally {
      await cleanUp(setup);
    }
  });
});
