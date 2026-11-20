import { eq } from 'drizzle-orm';

import * as schema from '@db/schema';
import { db } from '@db/drizzle';

export async function getOrgMathNotation(orgId: string): Promise<Record<string, unknown> | null> {
  try {
    const [row] = await db
      .select({ settings: schema.organization.settings })
      .from(schema.organization)
      .where(eq(schema.organization.id, orgId))
      .limit(1);

    return row ? (row.settings?.math ?? {}) : null;
  } catch (error) {
    console.error('getOrgMathNotation error:', error);
    throw new Error('Failed to fetch org math notation');
  }
}

export async function updateOrgMathNotation(
  orgId: string,
  math: Record<string, unknown>
): Promise<Record<string, unknown> | null> {
  try {
    const [row] = await db
      .select({ settings: schema.organization.settings })
      .from(schema.organization)
      .where(eq(schema.organization.id, orgId))
      .limit(1);
    if (!row) return null;

    const [updated] = await db
      .update(schema.organization)
      .set({ settings: { ...(row.settings ?? {}), math } })
      .where(eq(schema.organization.id, orgId))
      .returning({ settings: schema.organization.settings });

    return updated?.settings?.math ?? null;
  } catch (error) {
    console.error('updateOrgMathNotation error:', error);
    throw new Error('Failed to update org math notation');
  }
}

export async function getCourseMathNotationOverride(courseId: string): Promise<Record<string, unknown> | null> {
  try {
    const [row] = await db
      .select({ metadata: schema.course.metadata })
      .from(schema.course)
      .where(eq(schema.course.id, courseId))
      .limit(1);

    return row?.metadata?.math ?? null;
  } catch (error) {
    console.error('getCourseMathNotationOverride error:', error);
    throw new Error('Failed to fetch course math notation override');
  }
}

export async function updateCourseMathNotationOverride(
  courseId: string,
  math: Record<string, unknown>
): Promise<Record<string, unknown> | null> {
  try {
    const [row] = await db
      .select({ metadata: schema.course.metadata })
      .from(schema.course)
      .where(eq(schema.course.id, courseId))
      .limit(1);
    if (!row) return null;

    const [updated] = await db
      .update(schema.course)
      .set({ metadata: { ...(row.metadata ?? {}), math }, updatedAt: new Date().toISOString() })
      .where(eq(schema.course.id, courseId))
      .returning({ metadata: schema.course.metadata });

    return updated?.metadata?.math ?? null;
  } catch (error) {
    console.error('updateCourseMathNotationOverride error:', error);
    throw new Error('Failed to update course math notation override');
  }
}
