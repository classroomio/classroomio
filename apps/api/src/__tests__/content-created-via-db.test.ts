import 'dotenv/config';

import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { eq, inArray } from 'drizzle-orm';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

describe.skipIf(!hasDatabase)('content created_via', () => {
  async function createWorkspace() {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const [organization] = await db
      .insert(schema.organization)
      .values({ name: `created-via-${randomUUID()}` })
      .returning();
    const label = `created-via-${randomUUID()}`;
    const [user] = await db
      .insert(schema.user)
      .values({ name: label, email: `${label}@example.com`, emailVerified: true })
      .returning();
    const [profile] = await db
      .insert(schema.profile)
      .values({ id: user.id, fullname: label, username: label })
      .returning();

    return { db, schema, organization, profile };
  }

  it('records the channel on a course and on content created inside it', async () => {
    const { db, schema, organization, profile } = await createWorkspace();
    const { createCourse } = await import('@cio/core/services/course/course');
    const { createCourseSection } = await import('@cio/core/services/course/section');
    const { createLesson } = await import('@cio/core/services/lesson/lesson');
    const { createExercise, createExerciseSectionService } = await import('@cio/core/services/exercise/exercise');

    const { course } = await createCourse(
      profile.id,
      { title: 'Created via', description: 'Created via', organizationId: organization.id, type: 'SELF_PACED' },
      'mcp'
    );
    const section = await createCourseSection(
      course.id,
      { title: 'Section', courseId: course.id, order: 1 },
      'public_api'
    );
    const lesson = await createLesson(
      course.id,
      { title: 'Lesson', courseId: course.id, sectionId: section.id, order: 1 },
      { createdVia: 'agent' }
    );
    const exercise = await createExercise({ title: 'Exercise', courseId: course.id, order: 2 }, 'import');
    const exerciseSection = await createExerciseSectionService(exercise.id, { title: 'Part 1', order: 1 }, 'template');

    const defaultSection = await createCourseSection(course.id, { title: 'Default', courseId: course.id, order: 5 });
    const defaultLesson = await createLesson(course.id, { title: 'Default', courseId: course.id, order: 6 });
    const defaultExercise = await createExercise({ title: 'Default', courseId: course.id, order: 7 });

    const createdVia = async (
      table:
        | typeof schema.course
        | typeof schema.courseSection
        | typeof schema.lesson
        | typeof schema.exercise
        | typeof schema.exerciseSection,
      id: string
    ) => {
      const [row] = await db.select({ createdVia: table.createdVia }).from(table).where(eq(table.id, id));

      return row?.createdVia;
    };

    expect(await createdVia(schema.course, course.id)).toBe('mcp');
    expect(await createdVia(schema.courseSection, section.id)).toBe('public_api');
    expect(await createdVia(schema.lesson, lesson.id)).toBe('agent');
    expect(await createdVia(schema.exercise, exercise.id)).toBe('import');
    expect(await createdVia(schema.exerciseSection, exerciseSection.id)).toBe('template');
    expect(await createdVia(schema.courseSection, defaultSection.id)).toBe('dashboard');
    expect(await createdVia(schema.lesson, defaultLesson.id)).toBe('dashboard');
    expect(await createdVia(schema.exercise, defaultExercise.id)).toBe('dashboard');
  }, 60_000);

  it('marks a clone, and everything copied into it, as cloned or templated', async () => {
    const { db, schema, organization, profile } = await createWorkspace();
    const { createCourse } = await import('@cio/core/services/course/course');
    const { createCourseSection } = await import('@cio/core/services/course/section');
    const { createLesson } = await import('@cio/core/services/lesson/lesson');
    const { createExercise, createExerciseSectionService } = await import('@cio/core/services/exercise/exercise');
    const { cloneCourse } = await import('@api/services/course/clone');

    const { course } = await createCourse(
      profile.id,
      { title: 'Original', description: 'Original', organizationId: organization.id, type: 'SELF_PACED' },
      'dashboard'
    );
    const section = await createCourseSection(course.id, { title: 'Section', courseId: course.id, order: 1 });
    await createLesson(course.id, { title: 'Lesson', courseId: course.id, sectionId: section.id, order: 1 });
    const exercise = await createExercise({ title: 'Exercise', courseId: course.id, order: 2 });
    await createExerciseSectionService(exercise.id, { title: 'Part 1', order: 1 });

    const readChannels = async (courseId: string) => {
      const exercises = await db.select().from(schema.exercise).where(eq(schema.exercise.courseId, courseId));
      const exerciseSections = await db
        .select()
        .from(schema.exerciseSection)
        .where(
          inArray(
            schema.exerciseSection.exerciseId,
            exercises.map((row) => row.id)
          )
        );
      const [courseRow] = await db.select().from(schema.course).where(eq(schema.course.id, courseId));
      const sections = await db.select().from(schema.courseSection).where(eq(schema.courseSection.courseId, courseId));
      const lessons = await db.select().from(schema.lesson).where(eq(schema.lesson.courseId, courseId));

      return new Set(
        [courseRow, ...sections, ...lessons, ...exercises, ...exerciseSections].map((row) => row.createdVia)
      );
    };

    const copy = await cloneCourse(course.id, { title: 'Copy', userId: profile.id });
    const fromTemplate = await cloneCourse(course.id, {
      title: 'From template',
      userId: profile.id,
      templateId: course.id
    });

    expect(await readChannels(course.id)).toEqual(new Set(['dashboard']));
    expect(await readChannels(copy.id)).toEqual(new Set(['clone']));
    expect(await readChannels(fromTemplate.id)).toEqual(new Set(['template']));
  }, 60_000);

  it('leaves created_via null for rows inserted without a channel', async () => {
    const { db, schema, organization } = await createWorkspace();
    const [group] = await db
      .insert(schema.group)
      .values({ name: 'Legacy', organizationId: organization.id })
      .returning();
    const [course] = await db
      .insert(schema.course)
      .values({ title: 'Legacy', description: 'Legacy', groupId: group.id })
      .returning();

    expect(course.createdVia).toBeNull();
  });
});
