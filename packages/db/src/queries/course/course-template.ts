import * as schema from '@db/schema';

import { and, asc, count, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import { db, type DbOrTxClient } from '@db/drizzle';

import { ROLE } from '@cio/utils/constants';

export async function countOrgTemplates(orgId: string, dbClient: DbOrTxClient = db) {
  try {
    const [row] = await dbClient
      .select({ count: count() })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .where(
        and(
          eq(schema.group.organizationId, orgId),
          eq(schema.course.isTemplate, true),
          ne(schema.course.status, 'DELETED')
        )
      );

    return Number(row?.count ?? 0);
  } catch (error) {
    console.error('countOrgTemplates error:', error);
    throw new Error(`Failed to count templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Soft-deletes every seeded template in the org and clears its seed key so the seed can insert fresh copies.
 */
export async function retireSeededTemplates(orgId: string, dbClient: DbOrTxClient = db) {
  try {
    const orgGroupIds = dbClient
      .select({ id: schema.group.id })
      .from(schema.group)
      .where(eq(schema.group.organizationId, orgId));

    return await dbClient
      .update(schema.course)
      .set({ status: 'DELETED', seedKey: null, updatedAt: new Date().toISOString() })
      .where(and(sql`${schema.course.seedKey} is not null`, inArray(schema.course.groupId, orgGroupIds)))
      .returning({ id: schema.course.id, title: schema.course.title });
  } catch (error) {
    console.error('retireSeededTemplates error:', error);
    throw new Error(`Failed to retire seeded templates for organization "${orgId}"`);
  }
}

export async function countCourseStudents(courseId: string, dbClient: DbOrTxClient = db) {
  try {
    const [row] = await dbClient
      .select({ count: count() })
      .from(schema.groupmember)
      .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
      .where(and(eq(schema.course.id, courseId), eq(schema.groupmember.roleId, ROLE.STUDENT)));

    return Number(row?.count ?? 0);
  } catch (error) {
    console.error('countCourseStudents error:', error);
    throw new Error(`Failed to count course students: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function lastUsedAtSql(orgId: string) {
  return sql<string | null>`(
    SELECT MAX(linked.created_at)
    FROM ${schema.course} AS linked
    INNER JOIN ${schema.group} AS linked_group ON linked_group.id = linked.group_id
    WHERE linked.template_id = ${schema.course.id}
      AND linked_group.organization_id = ${orgId}
      AND linked.status <> 'DELETED'
  )`;
}

export async function listOrgTemplateCards(orgId: string) {
  try {
    const lastUsedAt = lastUsedAtSql(orgId).as('last_used_at');
    const rows = await db
      .select({
        id: schema.course.id,
        title: schema.course.title,
        description: schema.course.description,
        type: schema.course.type,
        bannerImage: schema.course.bannerImage,
        createdAt: schema.course.createdAt,
        lastUsedAt
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .where(
        and(
          eq(schema.group.organizationId, orgId),
          eq(schema.course.isTemplate, true),
          eq(schema.course.status, 'ACTIVE')
        )
      )
      .orderBy(
        sql`${lastUsedAtSql(orgId)} DESC NULLS LAST`,
        sql`${schema.course.updatedAt} DESC NULLS LAST`,
        desc(schema.course.createdAt)
      );

    return rows;
  } catch (error) {
    console.error('listOrgTemplateCards error:', error);
    throw new Error(`Failed to list templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function listGlobalTemplateCards(platformOrgId: string) {
  try {
    return await db
      .select({
        id: schema.course.id,
        title: schema.course.title,
        description: schema.course.description,
        type: schema.course.type,
        bannerImage: schema.course.bannerImage,
        createdAt: schema.course.createdAt,
        lastUsedAt: sql<string | null>`NULL`.as('last_used_at')
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .where(
        and(
          eq(schema.group.organizationId, platformOrgId),
          eq(schema.course.isTemplate, true),
          eq(schema.course.publicForAll, true),
          eq(schema.course.status, 'ACTIVE')
        )
      )
      .orderBy(sql`${schema.course.displayOrder} asc nulls last`, asc(schema.course.createdAt));
  } catch (error) {
    console.error('listGlobalTemplateCards error:', error);
    throw new Error(`Failed to list global templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createTemplateHighlights(
  values: { courseId: string; position: number; title: string; description?: string | null }[],
  dbClient: DbOrTxClient = db
) {
  if (values.length === 0) return [];

  try {
    return await dbClient.insert(schema.templateHighlight).values(values).returning();
  } catch (error) {
    console.error('createTemplateHighlights error:', error);
    throw new Error(
      `Failed to create template highlights: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function listTemplateHighlights(courseIds: string[]) {
  if (courseIds.length === 0) return [];

  try {
    return await db
      .select()
      .from(schema.templateHighlight)
      .where(inArray(schema.templateHighlight.courseId, courseIds))
      .orderBy(asc(schema.templateHighlight.position));
  } catch (error) {
    console.error('listTemplateHighlights error:', error);
    throw new Error(`Failed to list template highlights: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function stampCopiedTemplateUnits(
  input: {
    sectionIds: string[];
    lessonIds: string[];
    exerciseIds: string[];
    syncedAt: string;
  },
  dbClient: DbOrTxClient = db
) {
  const { sectionIds, lessonIds, exerciseIds, syncedAt } = input;

  try {
    if (sectionIds.length > 0) {
      await dbClient
        .update(schema.courseSection)
        .set({ sourceSyncedAt: syncedAt, updatedAt: syncedAt })
        .where(inArray(schema.courseSection.id, sectionIds));
    }

    if (lessonIds.length > 0) {
      await dbClient
        .update(schema.lesson)
        .set({ sourceSyncedAt: syncedAt, updatedAt: syncedAt })
        .where(inArray(schema.lesson.id, lessonIds));
      await dbClient
        .update(schema.lessonLanguage)
        .set({ updatedAt: syncedAt })
        .where(inArray(schema.lessonLanguage.lessonId, lessonIds));
    }

    if (exerciseIds.length === 0) return;

    await dbClient
      .update(schema.exercise)
      .set({ sourceSyncedAt: syncedAt, updatedAt: syncedAt })
      .where(inArray(schema.exercise.id, exerciseIds));
    await dbClient
      .update(schema.exerciseSection)
      .set({ updatedAt: syncedAt })
      .where(inArray(schema.exerciseSection.exerciseId, exerciseIds));

    const questions = await dbClient
      .select({ id: schema.question.id })
      .from(schema.question)
      .where(inArray(schema.question.exerciseId, exerciseIds));
    const questionIds = questions.map((question) => question.id);
    if (questionIds.length === 0) return;

    await dbClient.update(schema.question).set({ updatedAt: syncedAt }).where(inArray(schema.question.id, questionIds));
    await dbClient
      .update(schema.option)
      .set({ updatedAt: syncedAt })
      .where(inArray(schema.option.questionId, questionIds));
  } catch (error) {
    console.error('stampCopiedTemplateUnits error:', error);
    throw new Error(
      `Failed to stamp copied template units: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
