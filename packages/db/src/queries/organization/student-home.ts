import * as schema from '@db/schema';

import { and, asc, eq, ilike, or } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

export type StudentHomeCourseCandidate = {
  id: string;
  slug: string | null;
  type: string | null;
  status: string;
  isPublished: boolean | null;
  isTemplate: boolean;
  cost: number | null;
  metadata: unknown;
};

export type StudentHomeCourseOption = StudentHomeCourseCandidate & {
  title: string;
};

export type OrganizationStudentHome = {
  studentHomePath: string | null;
  studentHomeCourseId: string | null;
  customization: unknown;
  plans: Array<{ planName: string | null; isActive: boolean | null }>;
};

const STUDENT_HOME_COURSE_OPTION_LIMIT = 50;

/**
 * Loads a course for student-home use when its group belongs to the org, else null.
 */
export async function getStudentHomeCourseCandidate(
  orgId: string,
  courseId: string,
  dbClient: DbOrTxClient = db
): Promise<StudentHomeCourseCandidate | null> {
  try {
    const [row] = await dbClient
      .select({
        id: schema.course.id,
        slug: schema.course.slug,
        type: schema.course.type,
        status: schema.course.status,
        isPublished: schema.course.isPublished,
        isTemplate: schema.course.isTemplate,
        cost: schema.course.cost,
        metadata: schema.course.metadata
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .where(and(eq(schema.course.id, courseId), eq(schema.group.organizationId, orgId)))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getStudentHomeCourseCandidate error:', error);
    throw new Error(`Failed to load student home course: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Lists published courses for the student-home picker, plus the saved course
 * regardless of status so an unavailable choice stays visible.
 */
export async function listStudentHomeCourseOptions(
  orgId: string,
  options: { search?: string; includeCourseId?: string; limit?: number },
  dbClient: DbOrTxClient = db
): Promise<StudentHomeCourseOption[]> {
  try {
    const limit = options.limit ?? STUDENT_HOME_COURSE_OPTION_LIMIT;
    const searchValue = options.search?.trim() ? `%${options.search.trim()}%` : null;

    const rows = await dbClient
      .select({
        id: schema.course.id,
        title: schema.course.title,
        slug: schema.course.slug,
        type: schema.course.type,
        status: schema.course.status,
        isPublished: schema.course.isPublished,
        isTemplate: schema.course.isTemplate,
        cost: schema.course.cost,
        metadata: schema.course.metadata
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .where(
        and(
          eq(schema.group.organizationId, orgId),
          eq(schema.course.status, 'ACTIVE'),
          eq(schema.course.isPublished, true),
          eq(schema.course.isTemplate, false),
          ...(searchValue ? [or(ilike(schema.course.title, searchValue))] : [])
        )
      )
      .orderBy(asc(schema.course.displayOrder), asc(schema.course.title))
      .limit(limit);

    if (!options.includeCourseId || rows.some((row) => row.id === options.includeCourseId)) {
      return rows;
    }

    const [saved] = await dbClient
      .select({
        id: schema.course.id,
        title: schema.course.title,
        slug: schema.course.slug,
        type: schema.course.type,
        status: schema.course.status,
        isPublished: schema.course.isPublished,
        isTemplate: schema.course.isTemplate,
        cost: schema.course.cost,
        metadata: schema.course.metadata
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .where(and(eq(schema.course.id, options.includeCourseId), eq(schema.group.organizationId, orgId)))
      .limit(1);

    return saved ? [...rows, saved] : rows;
  } catch (error) {
    console.error('listStudentHomeCourseOptions error:', error);
    throw new Error(`Failed to list student home courses: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Loads the stored student-home columns with the context the resolver needs.
 */
export async function getOrganizationStudentHome(
  orgId: string,
  dbClient: DbOrTxClient = db
): Promise<OrganizationStudentHome | null> {
  try {
    const [org] = await dbClient
      .select({
        studentHomePath: schema.organization.studentHomePath,
        studentHomeCourseId: schema.organization.studentHomeCourseId,
        customization: schema.organization.customization
      })
      .from(schema.organization)
      .where(eq(schema.organization.id, orgId))
      .limit(1);

    if (!org) {
      return null;
    }

    const plans = await dbClient
      .select({
        planName: schema.organizationPlan.planName,
        isActive: schema.organizationPlan.isActive
      })
      .from(schema.organizationPlan)
      .where(eq(schema.organizationPlan.orgId, orgId));

    return { ...org, plans };
  } catch (error) {
    console.error('getOrganizationStudentHome error:', error);
    throw new Error(
      `Failed to load organization student home: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Persists the resolved student-home column pair. Runs inside the caller's transaction.
 */
export async function setOrganizationStudentHome(
  orgId: string,
  home: { path: string | null; courseId: string | null },
  dbClient: DbOrTxClient = db
): Promise<void> {
  try {
    await dbClient
      .update(schema.organization)
      .set({ studentHomePath: home.path, studentHomeCourseId: home.courseId })
      .where(eq(schema.organization.id, orgId));
  } catch (error) {
    console.error('setOrganizationStudentHome error:', error);
    throw new Error(
      `Failed to update organization student home: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
