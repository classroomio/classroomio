import { randomUUID } from 'node:crypto';
import { eq, inArray } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';

import { db } from '@cio/db/drizzle';
import * as schema from '@cio/db/schema';
import { createCourse } from '@cio/core/services/course/course';
import { createCourseSection } from '@cio/core/services/course/section';
import {
  createExercise,
  createExerciseSectionService,
  updateExerciseService
} from '@cio/core/services/exercise/exercise';
import { createLesson } from '@cio/core/services/lesson/lesson';

import { cloneCourse } from '@api/services/course/clone';

const shouldRun = Boolean(process.env.TEST_DATABASE_URL);

type Workspace = { organizationId: string; userId: string };

describe.skipIf(!shouldRun)('content created_via (database)', () => {
  const workspaces: Workspace[] = [];

  async function createWorkspace() {
    const label = `created-via-${randomUUID()}`;
    const [organization] = await db.insert(schema.organization).values({ name: label }).returning();
    const [user] = await db
      .insert(schema.user)
      .values({ name: label, email: `${label}@example.com`, emailVerified: true })
      .returning();
    const [profile] = await db
      .insert(schema.profile)
      .values({ id: user.id, fullname: label, username: label })
      .returning();
    workspaces.push({ organizationId: organization.id, userId: user.id });

    return { organization, profile };
  }

  async function createSeededCourse(channel: 'dashboard' | 'mcp') {
    const { organization, profile } = await createWorkspace();
    const { course } = await createCourse(
      profile.id,
      { title: 'Original', description: 'Original', organizationId: organization.id, type: 'SELF_PACED' },
      channel
    );
    const section = await createCourseSection(course.id, { title: 'Section', courseId: course.id, order: 1 }, channel);
    await createLesson(
      course.id,
      { title: 'Lesson', courseId: course.id, sectionId: section.id, order: 1 },
      { createdVia: channel }
    );
    const exercise = await createExercise({ title: 'Exercise', courseId: course.id, order: 2 }, channel);
    await createExerciseSectionService(exercise.id, { title: 'Part 1', order: 1 }, channel);

    return { course, exercise, profile };
  }

  async function readChannels(courseId: string) {
    const [courseRow] = await db.select().from(schema.course).where(eq(schema.course.id, courseId));
    const sections = await db.select().from(schema.courseSection).where(eq(schema.courseSection.courseId, courseId));
    const lessons = await db.select().from(schema.lesson).where(eq(schema.lesson.courseId, courseId));
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

    return [courseRow, ...sections, ...lessons, ...exercises, ...exerciseSections].map((row) => row.createdVia);
  }

  async function removeWorkspace({ organizationId, userId }: Workspace) {
    const groups = await db
      .select({ id: schema.group.id })
      .from(schema.group)
      .where(eq(schema.group.organizationId, organizationId));
    const groupIds = groups.map((row) => row.id);

    if (groupIds.length > 0) {
      const courses = await db
        .select({ id: schema.course.id })
        .from(schema.course)
        .where(inArray(schema.course.groupId, groupIds));
      const courseIds = courses.map((row) => row.id);

      if (courseIds.length > 0) {
        const exercises = await db
          .select({ id: schema.exercise.id })
          .from(schema.exercise)
          .where(inArray(schema.exercise.courseId, courseIds));
        const exerciseIds = exercises.map((row) => row.id);

        if (exerciseIds.length > 0) {
          await db.delete(schema.exerciseSection).where(inArray(schema.exerciseSection.exerciseId, exerciseIds));
        }
        await db.delete(schema.exercise).where(inArray(schema.exercise.courseId, courseIds));
        await db.delete(schema.lesson).where(inArray(schema.lesson.courseId, courseIds));
        await db.delete(schema.courseSection).where(inArray(schema.courseSection.courseId, courseIds));
        await db.delete(schema.courseNewsfeed).where(inArray(schema.courseNewsfeed.courseId, courseIds));
        await db.delete(schema.course).where(inArray(schema.course.id, courseIds));
      }

      await db.delete(schema.groupmember).where(inArray(schema.groupmember.groupId, groupIds));
      await db.delete(schema.group).where(inArray(schema.group.id, groupIds));
    }

    await db.delete(schema.organization).where(eq(schema.organization.id, organizationId));
    await db.delete(schema.profile).where(eq(schema.profile.id, userId));
    await db.delete(schema.user).where(eq(schema.user.id, userId));
  }

  afterEach(async () => {
    while (workspaces.length > 0) {
      await removeWorkspace(workspaces.pop()!);
    }
  });

  it('records the channel on a course and on content created inside it', async () => {
    const { course, exercise } = await createSeededCourse('mcp');
    expect(await readChannels(course.id)).toEqual(Array(5).fill('mcp'));
    const defaultSection = await createCourseSection(course.id, { title: 'Default', courseId: course.id, order: 5 });
    const defaultLesson = await createLesson(course.id, { title: 'Default', courseId: course.id, order: 6 });
    const defaultExercise = await createExercise({ title: 'Default', courseId: course.id, order: 7 });
    const publicApiExerciseSection = await createExerciseSectionService(
      exercise.id,
      { title: 'Part 2', order: 2 },
      'public_api'
    );

    const channelOf = async (
      table: typeof schema.courseSection | typeof schema.lesson | typeof schema.exercise,
      id: string
    ) => {
      const [row] = await db.select({ createdVia: table.createdVia }).from(table).where(eq(table.id, id));

      return row?.createdVia;
    };
    const [exerciseSectionRow] = await db
      .select({ createdVia: schema.exerciseSection.createdVia })
      .from(schema.exerciseSection)
      .where(eq(schema.exerciseSection.id, publicApiExerciseSection.id));

    expect(new Set(await readChannels(course.id))).toEqual(new Set(['mcp', 'dashboard', 'public_api']));
    expect(await channelOf(schema.courseSection, defaultSection.id)).toBe('dashboard');
    expect(await channelOf(schema.lesson, defaultLesson.id)).toBe('dashboard');
    expect(await channelOf(schema.exercise, defaultExercise.id)).toBe('dashboard');
    expect(exerciseSectionRow?.createdVia).toBe('public_api');
  });

  it('stamps only the sections an exercise update adds, with the updating channel', async () => {
    const { course, exercise } = await createSeededCourse('dashboard');
    const [existing] = await db
      .select()
      .from(schema.exerciseSection)
      .where(eq(schema.exerciseSection.exerciseId, exercise.id));

    await updateExerciseService(
      exercise.id,
      {
        sections: [
          { id: existing!.id, title: 'Part 1', order: 1, colorTheme: 'blue', afterBehavior: { action: 'continue' } },
          { title: 'Added by update', order: 2, colorTheme: 'blue', afterBehavior: { action: 'continue' } }
        ]
      },
      'mcp'
    );

    const sections = await db
      .select({ title: schema.exerciseSection.title, createdVia: schema.exerciseSection.createdVia })
      .from(schema.exerciseSection)
      .where(eq(schema.exerciseSection.exerciseId, exercise.id));

    expect(Object.fromEntries(sections.map((row) => [row.title, row.createdVia]))).toEqual({
      'Part 1': 'dashboard',
      'Added by update': 'mcp'
    });
    expect(course.createdVia).toBe('dashboard');
  });

  it('marks a clone, and everything copied into it, as cloned or templated', async () => {
    const { course, profile } = await createSeededCourse('dashboard');

    const copy = await cloneCourse(course.id, { title: 'Copy', userId: profile.id });
    const fromTemplate = await cloneCourse(course.id, {
      title: 'From template',
      userId: profile.id,
      templateId: course.id
    });

    expect(await readChannels(course.id)).toEqual(Array(5).fill('dashboard'));
    expect(await readChannels(copy.id)).toEqual(Array(5).fill('clone'));
    expect(await readChannels(fromTemplate.id)).toEqual(Array(5).fill('template'));
  });

  it('leaves created_via null for rows inserted without a channel', async () => {
    const { organization } = await createWorkspace();
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
