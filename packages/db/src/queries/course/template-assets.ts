import * as schema from '@db/schema';

import { and, eq, like, or, sql } from 'drizzle-orm';
import { db, type DbOrTxClient } from '@db/drizzle';

function globalTemplateCourse(platformOrgId: string) {
  return and(
    eq(schema.group.organizationId, platformOrgId),
    eq(schema.course.isTemplate, true),
    eq(schema.course.publicForAll, true),
    eq(schema.course.status, 'ACTIVE')
  );
}

export async function assetReferencedByGlobalTemplate(
  assetId: string,
  platformOrgId: string,
  dbClient: DbOrTxClient = db
) {
  const needle = `%${assetId}%`;
  const globalCourse = globalTemplateCourse(platformOrgId);

  try {
    const [courseHit] = await dbClient
      .select({ id: schema.course.id })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .where(and(globalCourse, or(like(schema.course.bannerImage, needle), like(schema.course.logo, needle))))
      .limit(1);

    if (courseHit) return true;

    const [lessonBodyHit] = await dbClient
      .select({ id: schema.lesson.id })
      .from(schema.lessonLanguage)
      .innerJoin(schema.lesson, eq(schema.lessonLanguage.lessonId, schema.lesson.id))
      .innerJoin(schema.course, eq(schema.lesson.courseId, schema.course.id))
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .where(and(globalCourse, like(schema.lessonLanguage.content, needle)))
      .limit(1);

    if (lessonBodyHit) return true;

    const [lessonMediaHit] = await dbClient
      .select({ id: schema.lesson.id })
      .from(schema.lesson)
      .innerJoin(schema.course, eq(schema.lesson.courseId, schema.course.id))
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .where(
        and(
          globalCourse,
          or(
            sql`${schema.lesson.videos}::text like ${needle}`,
            sql`${schema.lesson.documents}::text like ${needle}`,
            sql`${schema.lesson.slides}::text like ${needle}`,
            like(schema.lesson.slideUrl, needle)
          )
        )
      )
      .limit(1);

    if (lessonMediaHit) return true;

    const [certificateHit] = await dbClient
      .select({ id: schema.course.id })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .where(and(globalCourse, sql`${schema.course.certificate}::text like ${needle}`))
      .limit(1);

    if (certificateHit) return true;

    const [exerciseHit] = await dbClient
      .select({ id: schema.exercise.id })
      .from(schema.exercise)
      .innerJoin(schema.course, eq(schema.exercise.courseId, schema.course.id))
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .where(and(globalCourse, like(schema.exercise.description, needle)))
      .limit(1);

    if (exerciseHit) return true;

    const [questionHit] = await dbClient
      .select({ id: schema.question.id })
      .from(schema.question)
      .innerJoin(schema.exercise, eq(schema.question.exerciseId, schema.exercise.id))
      .innerJoin(schema.course, eq(schema.exercise.courseId, schema.course.id))
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .where(
        and(
          globalCourse,
          or(like(schema.question.title, needle), sql`${schema.question.settings}::text like ${needle}`)
        )
      )
      .limit(1);

    return Boolean(questionHit);
  } catch (error) {
    console.error('assetReferencedByGlobalTemplate error:', error);
    throw new Error(
      `Failed to check global template asset usage: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
