import { eq } from 'drizzle-orm';

import * as schema from '@db/schema';
import { db } from '@db/drizzle';

/**
 * AI tutor configuration queries.
 *
 * Org-level defaults live on `organization.aiTutorSettings` (JSONB column,
 * NOT NULL with a default). Per-course overrides live inside
 * `course.metadata.aiTutor` and are partial.
 */

type OrgAiTutorSettings = NonNullable<typeof schema.organization.$inferSelect.aiTutorSettings>;
type CourseMetadata = NonNullable<typeof schema.course.$inferSelect.metadata>;
type CourseAiTutorOverride = NonNullable<CourseMetadata['aiTutor']>;

export async function getOrgAiTutorSettings(orgId: string): Promise<OrgAiTutorSettings | null> {
  try {
    const [row] = await db
      .select({ aiTutorSettings: schema.organization.aiTutorSettings })
      .from(schema.organization)
      .where(eq(schema.organization.id, orgId))
      .limit(1);

    return row?.aiTutorSettings ?? null;
  } catch (error) {
    console.error('getOrgAiTutorSettings error:', error);
    throw new Error('Failed to fetch org AI tutor settings');
  }
}

export async function updateOrgAiTutorSettings(
  orgId: string,
  patch: Partial<OrgAiTutorSettings>
): Promise<OrgAiTutorSettings | null> {
  try {
    const existing = await getOrgAiTutorSettings(orgId);
    if (!existing) return null;

    const next: OrgAiTutorSettings = {
      ...existing,
      ...patch,
      escalation: { ...existing.escalation, ...(patch.escalation ?? {}) }
    };

    const [updated] = await db
      .update(schema.organization)
      .set({ aiTutorSettings: next })
      .where(eq(schema.organization.id, orgId))
      .returning({ aiTutorSettings: schema.organization.aiTutorSettings });

    return updated?.aiTutorSettings ?? null;
  } catch (error) {
    console.error('updateOrgAiTutorSettings error:', error);
    throw new Error('Failed to update org AI tutor settings');
  }
}

export async function getCourseAiTutorOverride(courseId: string): Promise<CourseAiTutorOverride | null> {
  try {
    const [row] = await db
      .select({ metadata: schema.course.metadata })
      .from(schema.course)
      .where(eq(schema.course.id, courseId))
      .limit(1);

    return row?.metadata?.aiTutor ?? null;
  } catch (error) {
    console.error('getCourseAiTutorOverride error:', error);
    throw new Error('Failed to fetch course AI tutor override');
  }
}

export async function updateCourseAiTutorOverride(
  courseId: string,
  patch: Partial<CourseAiTutorOverride>
): Promise<CourseAiTutorOverride | null> {
  try {
    const [row] = await db
      .select({ metadata: schema.course.metadata })
      .from(schema.course)
      .where(eq(schema.course.id, courseId))
      .limit(1);

    if (!row) return null;

    const currentOverride = row.metadata?.aiTutor ?? {};
    const nextOverride: CourseAiTutorOverride = {
      ...currentOverride,
      ...patch,
      escalation: { ...currentOverride.escalation, ...(patch.escalation ?? {}) }
    };

    const nextMetadata = {
      ...(row.metadata ?? { allowNewStudent: true }),
      aiTutor: nextOverride
    };

    const [updated] = await db
      .update(schema.course)
      .set({ metadata: nextMetadata, updatedAt: new Date().toISOString() })
      .where(eq(schema.course.id, courseId))
      .returning({ metadata: schema.course.metadata });

    return updated?.metadata?.aiTutor ?? null;
  } catch (error) {
    console.error('updateCourseAiTutorOverride error:', error);
    throw new Error('Failed to update course AI tutor override');
  }
}
