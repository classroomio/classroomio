import { and, asc, count, eq, ilike, inArray, isNotNull, or, sql } from 'drizzle-orm';

import * as schema from '@db/schema';
import { db, type DbOrTxClient } from '@db/drizzle';

export type SkillListFilters = {
  search?: string;
  framework?: string;
};

export type SkillImportWrite = {
  code: string;
  name: string;
  description: string | null;
  framework: string | null;
  parentCode: string | null;
};

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

/**
 * Every skill of the organisation with how many questions use it, ordered by code. `search` matches code, name
 * and description, case-insensitively.
 */
export async function listOrganizationSkills(
  orgId: string,
  filters: SkillListFilters = {},
  dbClient: DbOrTxClient = db
) {
  try {
    const pattern = filters.search ? `%${escapeLike(filters.search)}%` : null;
    const search = pattern
      ? or(
          ilike(schema.skill.code, pattern),
          ilike(schema.skill.name, pattern),
          ilike(schema.skill.description, pattern)
        )
      : undefined;
    const framework = filters.framework ? eq(schema.skill.framework, filters.framework) : undefined;

    return await dbClient
      .select({
        id: schema.skill.id,
        code: schema.skill.code,
        name: schema.skill.name,
        description: schema.skill.description,
        framework: schema.skill.framework,
        parentId: schema.skill.parentId,
        questionCount: count(schema.questionSkill.id),
        createdAt: schema.skill.createdAt,
        updatedAt: schema.skill.updatedAt
      })
      .from(schema.skill)
      .leftJoin(schema.questionSkill, eq(schema.questionSkill.skillId, schema.skill.id))
      .where(and(eq(schema.skill.organizationId, orgId), search, framework))
      .groupBy(schema.skill.id)
      .orderBy(asc(schema.skill.code));
  } catch (error) {
    console.error('listOrganizationSkills error:', error);
    throw new Error('Failed to list skills');
  }
}

export async function getSkillById(orgId: string, skillId: string, dbClient: DbOrTxClient = db) {
  try {
    const [skill] = await dbClient
      .select()
      .from(schema.skill)
      .where(and(eq(schema.skill.organizationId, orgId), eq(schema.skill.id, skillId)))
      .limit(1);

    return skill ?? null;
  } catch (error) {
    console.error('getSkillById error:', error);
    throw new Error('Failed to get skill');
  }
}

export async function findSkillByCode(
  orgId: string,
  code: string,
  dbClient: DbOrTxClient = db,
  excludeSkillId?: string
) {
  try {
    const [skill] = await dbClient
      .select({ id: schema.skill.id })
      .from(schema.skill)
      .where(
        and(
          eq(schema.skill.organizationId, orgId),
          sql`lower(${schema.skill.code}) = lower(${code})`,
          excludeSkillId ? sql`${schema.skill.id} <> ${excludeSkillId}` : undefined
        )
      )
      .limit(1);

    return skill ?? null;
  } catch (error) {
    console.error('findSkillByCode error:', error);
    throw new Error('Failed to look up skill by code');
  }
}

/** The code and parent code of every skill in the organisation, for validating an import. */
export async function listSkillCodeLinks(orgId: string, dbClient: DbOrTxClient = db) {
  try {
    const parent = sql`parent`;
    const rows = await dbClient.execute<{ code: string; parent_code: string | null }>(sql`
      select s.code, parent.code as parent_code
      from skill s
      left join skill ${parent} on ${parent}.id = s.parent_id
      where s.organization_id = ${orgId}
    `);

    return Array.from(rows).map((row) => ({ code: row.code, parentCode: row.parent_code }));
  } catch (error) {
    console.error('listSkillCodeLinks error:', error);
    throw new Error('Failed to list skill codes');
  }
}

export async function createSkill(
  orgId: string,
  data: {
    code: string;
    name: string;
    description?: string | null;
    framework?: string | null;
    parentId?: string | null;
  },
  dbClient: DbOrTxClient = db
) {
  try {
    const [skill] = await dbClient
      .insert(schema.skill)
      .values({
        organizationId: orgId,
        code: data.code,
        name: data.name,
        description: data.description ?? null,
        framework: data.framework ?? null,
        parentId: data.parentId ?? null
      })
      .returning();

    return skill;
  } catch (error) {
    console.error('createSkill error:', error);
    throw new Error('Failed to create skill');
  }
}

export async function updateSkill(
  orgId: string,
  skillId: string,
  data: {
    code?: string;
    name?: string;
    description?: string | null;
    framework?: string | null;
    parentId?: string | null;
  },
  dbClient: DbOrTxClient = db
) {
  try {
    const [skill] = await dbClient
      .update(schema.skill)
      .set({ ...data, updatedAt: sql`timezone('utc'::text, now())` })
      .where(and(eq(schema.skill.organizationId, orgId), eq(schema.skill.id, skillId)))
      .returning();

    return skill ?? null;
  } catch (error) {
    console.error('updateSkill error:', error);
    throw new Error('Failed to update skill');
  }
}

export async function deleteSkill(orgId: string, skillId: string, dbClient: DbOrTxClient = db) {
  try {
    const [skill] = await dbClient
      .delete(schema.skill)
      .where(and(eq(schema.skill.organizationId, orgId), eq(schema.skill.id, skillId)))
      .returning({ id: schema.skill.id });

    return skill ?? null;
  } catch (error) {
    console.error('deleteSkill error:', error);
    throw new Error('Failed to delete skill');
  }
}

/** Ids of the organisation's skills among `skillIds`; ids from another organisation are left out. */
export async function getOrganizationSkillIds(orgId: string, skillIds: string[], dbClient: DbOrTxClient = db) {
  if (skillIds.length === 0) return [];

  try {
    const rows = await dbClient
      .select({ id: schema.skill.id })
      .from(schema.skill)
      .where(and(eq(schema.skill.organizationId, orgId), inArray(schema.skill.id, skillIds)));

    return rows.map((row) => row.id);
  } catch (error) {
    console.error('getOrganizationSkillIds error:', error);
    throw new Error('Failed to look up skills');
  }
}

/**
 * Creates or updates skills by code in the order given, linking each to its parent code. Parents must come first,
 * or already exist.
 */
export async function upsertImportedSkills(orgId: string, rows: SkillImportWrite[], dbClient: DbOrTxClient = db) {
  try {
    const idByCode = new Map<string, string>();
    const existing = await dbClient
      .select({ id: schema.skill.id, code: schema.skill.code })
      .from(schema.skill)
      .where(eq(schema.skill.organizationId, orgId));
    for (const skill of existing) idByCode.set(skill.code, skill.id);

    let created = 0;
    let updated = 0;

    for (const row of rows) {
      const parentId = row.parentCode ? (idByCode.get(row.parentCode) ?? null) : null;
      const existingId = idByCode.get(row.code);

      if (existingId) {
        await dbClient
          .update(schema.skill)
          .set({
            name: row.name,
            description: row.description,
            framework: row.framework,
            parentId,
            updatedAt: sql`timezone('utc'::text, now())`
          })
          .where(eq(schema.skill.id, existingId));
        updated += 1;
        continue;
      }

      const [skill] = await dbClient
        .insert(schema.skill)
        .values({
          organizationId: orgId,
          code: row.code,
          name: row.name,
          description: row.description,
          framework: row.framework,
          parentId
        })
        .returning({ id: schema.skill.id });
      idByCode.set(row.code, skill.id);
      created += 1;
    }

    return { created, updated };
  } catch (error) {
    console.error('upsertImportedSkills error:', error);
    throw new Error('Failed to import skills');
  }
}

export async function replaceQuestionSkills(questionId: number, skillIds: string[], dbClient: DbOrTxClient = db) {
  try {
    await dbClient.delete(schema.questionSkill).where(eq(schema.questionSkill.questionId, questionId));

    if (skillIds.length === 0) return;

    await dbClient
      .insert(schema.questionSkill)
      .values(skillIds.map((skillId) => ({ questionId, skillId })))
      .onConflictDoNothing();
  } catch (error) {
    console.error('replaceQuestionSkills error:', error);
    throw new Error('Failed to set question skills');
  }
}

/** Every skill tag on the exercise's questions. */
export async function getExerciseQuestionSkills(exerciseId: string, dbClient: DbOrTxClient = db) {
  try {
    return await dbClient
      .select({
        questionId: schema.questionSkill.questionId,
        skillId: schema.skill.id,
        code: schema.skill.code,
        name: schema.skill.name
      })
      .from(schema.questionSkill)
      .innerJoin(schema.question, eq(schema.question.id, schema.questionSkill.questionId))
      .innerJoin(schema.skill, eq(schema.skill.id, schema.questionSkill.skillId))
      .where(eq(schema.question.exerciseId, exerciseId))
      .orderBy(asc(schema.skill.code));
  } catch (error) {
    console.error('getExerciseQuestionSkills error:', error);
    throw new Error('Failed to get question skills');
  }
}

/** Distinct skills tagged on any question of the course's exercises. */
export async function getCourseTaggedSkills(courseId: string, dbClient: DbOrTxClient = db) {
  try {
    const rows = await dbClient.execute<{ id: string; code: string; name: string }>(sql`
      select distinct s.id, s.code, s.name
      from question_skill qs
      join skill s on s.id = qs.skill_id
      join question q on q.id = qs.question_id
      join exercise e on e.id = q.exercise_id
      left join course_section cs on cs.id = e.section_id
      where coalesce(e.course_id, cs.course_id) = ${courseId}
      order by s.code
    `);

    return Array.from(rows);
  } catch (error) {
    console.error('getCourseTaggedSkills error:', error);
    throw new Error('Failed to get course skills');
  }
}

export async function getQuestionExerciseId(questionId: number, dbClient: DbOrTxClient = db) {
  try {
    const [row] = await dbClient
      .select({ exerciseId: schema.question.exerciseId })
      .from(schema.question)
      .where(and(eq(schema.question.id, questionId), isNotNull(schema.question.exerciseId)))
      .limit(1);

    return row?.exerciseId ?? null;
  } catch (error) {
    console.error('getQuestionExerciseId error:', error);
    throw new Error('Failed to get the question exercise');
  }
}

export type SkillAttemptRow = {
  profileId: string;
  skillId: string;
  ratio: number;
  attemptedAt: string;
};

/**
 * Graded attempts on skill-tagged questions in a course, one row per answer. Mastery is computed from these in the
 * service. Limit with `profileIds` and `skillIds`.
 */
export async function getSkillAttemptsForCourse(
  courseId: string,
  filters: { profileIds?: string[]; skillIds?: string[] } = {},
  dbClient: DbOrTxClient = db
): Promise<SkillAttemptRow[]> {
  try {
    const rows = await dbClient
      .select({
        profileId: schema.groupmember.profileId,
        skillId: schema.questionSkill.skillId,
        point: schema.questionAnswer.point,
        points: schema.question.points,
        attemptedAt: schema.submission.createdAt
      })
      .from(schema.questionAnswer)
      .innerJoin(schema.submission, eq(schema.submission.id, schema.questionAnswer.submissionId))
      .innerJoin(schema.question, eq(schema.question.id, schema.questionAnswer.questionId))
      .innerJoin(schema.questionSkill, eq(schema.questionSkill.questionId, schema.question.id))
      .innerJoin(schema.groupmember, eq(schema.groupmember.id, schema.submission.submittedBy))
      .where(
        and(
          eq(schema.submission.courseId, courseId),
          eq(schema.submission.gradingState, 'completed'),
          sql`coalesce(${schema.question.points}, 0) > 0`,
          filters.profileIds?.length ? inArray(schema.groupmember.profileId, filters.profileIds) : undefined,
          filters.skillIds?.length ? inArray(schema.questionSkill.skillId, filters.skillIds) : undefined
        )
      );

    return rows.flatMap((row) =>
      row.profileId && row.attemptedAt
        ? [
            {
              profileId: row.profileId,
              skillId: row.skillId,
              ratio: Number(row.point ?? 0) / Number(row.points),
              attemptedAt: row.attemptedAt
            }
          ]
        : []
    );
  } catch (error) {
    console.error('getSkillAttemptsForCourse error:', error);
    throw new Error('Failed to get skill attempts');
  }
}
