import type { TNewTag, TNewTagGroup, TTag, TTagAssignment, TTagGroup } from '@db/types';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';

import * as schema from '@db/schema';
import { db } from '@db/drizzle';

export interface TTagWithCourseCount extends TTag {
  courseCount: number;
}

export interface TTagGroupWithTags extends TTagGroup {
  tags: TTagWithCourseCount[];
}

export interface TCourseTagPreview {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface GetTagGroupsWithTagsOptions {
  onlyPublishedCourses?: boolean;
}

export function slugifyTagValue(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return slug || 'tag';
}

async function ensureUniqueSlug(baseSlug: string, exists: (slug: string) => Promise<boolean>): Promise<string> {
  let suffix = 0;
  let candidate = baseSlug;

  while (await exists(candidate)) {
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }

  return candidate;
}

export async function generateUniqueTagGroupSlug(orgId: string, name: string): Promise<string> {
  try {
    const baseSlug = slugifyTagValue(name);

    return ensureUniqueSlug(baseSlug, async (slug) => {
      const existing = await findTagGroupBySlug(orgId, slug);
      return Boolean(existing);
    });
  } catch (error) {
    console.error('generateUniqueTagGroupSlug error:', error);
    throw new Error('Failed to generate unique tag group slug');
  }
}

export async function generateUniqueTagSlug(orgId: string, name: string): Promise<string> {
  try {
    const baseSlug = slugifyTagValue(name);

    return ensureUniqueSlug(baseSlug, async (slug) => {
      const existing = await findTagBySlug(orgId, slug);
      return Boolean(existing);
    });
  } catch (error) {
    console.error('generateUniqueTagSlug error:', error);
    throw new Error('Failed to generate unique tag slug');
  }
}

export async function findTagGroupBySlug(orgId: string, slug: string): Promise<TTagGroup | null> {
  try {
    const [result] = await db
      .select()
      .from(schema.tagGroup)
      .where(and(eq(schema.tagGroup.organizationId, orgId), eq(schema.tagGroup.slug, slug)))
      .limit(1);

    return result ?? null;
  } catch (error) {
    console.error('findTagGroupBySlug error:', error);
    throw new Error('Failed to find tag group by slug');
  }
}

export async function findTagBySlug(orgId: string, slug: string): Promise<TTag | null> {
  try {
    const [result] = await db
      .select()
      .from(schema.tag)
      .where(and(eq(schema.tag.organizationId, orgId), eq(schema.tag.slug, slug)))
      .limit(1);

    return result ?? null;
  } catch (error) {
    console.error('findTagBySlug error:', error);
    throw new Error('Failed to find tag by slug');
  }
}

export async function getTagGroupById(orgId: string, groupId: string): Promise<TTagGroup | null> {
  try {
    const [result] = await db
      .select()
      .from(schema.tagGroup)
      .where(and(eq(schema.tagGroup.organizationId, orgId), eq(schema.tagGroup.id, groupId)))
      .limit(1);

    return result ?? null;
  } catch (error) {
    console.error('getTagGroupById error:', error);
    throw new Error('Failed to get tag group by id');
  }
}

export async function getTagById(orgId: string, tagId: string): Promise<TTag | null> {
  try {
    const [result] = await db
      .select()
      .from(schema.tag)
      .where(and(eq(schema.tag.organizationId, orgId), eq(schema.tag.id, tagId)))
      .limit(1);

    return result ?? null;
  } catch (error) {
    console.error('getTagById error:', error);
    throw new Error('Failed to get tag by id');
  }
}

export async function getTagsByIds(orgId: string, tagIds: string[]): Promise<TTag[]> {
  try {
    if (tagIds.length === 0) {
      return [];
    }

    return db
      .select()
      .from(schema.tag)
      .where(and(eq(schema.tag.organizationId, orgId), inArray(schema.tag.id, tagIds)));
  } catch (error) {
    console.error('getTagsByIds error:', error);
    throw new Error('Failed to get tags by ids');
  }
}

export async function createTagGroup(data: TNewTagGroup): Promise<TTagGroup> {
  try {
    const [result] = await db.insert(schema.tagGroup).values(data).returning();

    return result;
  } catch (error) {
    console.error('createTagGroup error:', error);
    throw new Error('Failed to create tag group');
  }
}

export async function updateTagGroup(
  orgId: string,
  groupId: string,
  data: Partial<TTagGroup>
): Promise<TTagGroup | null> {
  try {
    const [result] = await db
      .update(schema.tagGroup)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.tagGroup.organizationId, orgId), eq(schema.tagGroup.id, groupId)))
      .returning();

    return result ?? null;
  } catch (error) {
    console.error('updateTagGroup error:', error);
    throw new Error('Failed to update tag group');
  }
}

export async function createTag(data: TNewTag): Promise<TTag> {
  try {
    const [result] = await db.insert(schema.tag).values(data).returning();

    return result;
  } catch (error) {
    console.error('createTag error:', error);
    throw new Error('Failed to create tag');
  }
}

export async function updateTag(orgId: string, tagId: string, data: Partial<TTag>): Promise<TTag | null> {
  try {
    const [result] = await db
      .update(schema.tag)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.tag.organizationId, orgId), eq(schema.tag.id, tagId)))
      .returning();

    return result ?? null;
  } catch (error) {
    console.error('updateTag error:', error);
    throw new Error('Failed to update tag');
  }
}

export async function getTagGroupsWithTags(
  orgId: string,
  options: GetTagGroupsWithTagsOptions = {}
): Promise<TTagGroupWithTags[]> {
  try {
    const { onlyPublishedCourses = false } = options;

    const courseJoinConditions = [
      eq(schema.tagAssignment.courseId, schema.course.id),
      eq(schema.course.status, 'ACTIVE')
    ];
    if (onlyPublishedCourses) {
      courseJoinConditions.push(eq(schema.course.isPublished, true));
    }

    const [groups, tags] = await Promise.all([
      db
        .select()
        .from(schema.tagGroup)
        .where(eq(schema.tagGroup.organizationId, orgId))
        .orderBy(asc(schema.tagGroup.order), asc(schema.tagGroup.name)),
      db
        .select({
          tag: schema.tag,
          courseCount: sql<number>`COUNT(DISTINCT ${schema.course.id})`.as('course_count')
        })
        .from(schema.tag)
        .leftJoin(schema.tagAssignment, eq(schema.tag.id, schema.tagAssignment.tagId))
        .leftJoin(schema.course, and(...courseJoinConditions))
        .where(eq(schema.tag.organizationId, orgId))
        .groupBy(schema.tag.id)
        .orderBy(asc(schema.tag.name))
    ]);

    const groupedTags = new Map<string, TTagWithCourseCount[]>();

    for (const row of tags) {
      const tagWithCount: TTagWithCourseCount = {
        ...row.tag,
        courseCount: Number(row.courseCount)
      };

      const existing = groupedTags.get(row.tag.groupId) ?? [];
      existing.push(tagWithCount);
      groupedTags.set(row.tag.groupId, existing);
    }

    return groups.map((group) => ({
      ...group,
      tags: groupedTags.get(group.id) ?? []
    }));
  } catch (error) {
    console.error('getTagGroupsWithTags error:', error);
    throw new Error('Failed to get tag groups with tags');
  }
}

export async function getCourseIdsByTagSlugs(orgId: string, tagSlugs: string[]): Promise<string[]> {
  try {
    const normalizedTagSlugs = Array.from(new Set(tagSlugs.map((slug) => slug.trim()).filter(Boolean)));

    if (normalizedTagSlugs.length === 0) {
      return [];
    }

    const rows = await db
      .selectDistinct({
        courseId: schema.tagAssignment.courseId
      })
      .from(schema.tagAssignment)
      .innerJoin(schema.tag, eq(schema.tagAssignment.tagId, schema.tag.id))
      .innerJoin(schema.course, eq(schema.tagAssignment.courseId, schema.course.id))
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .where(
        and(
          eq(schema.tag.organizationId, orgId),
          eq(schema.group.organizationId, orgId),
          eq(schema.course.status, 'ACTIVE'),
          inArray(schema.tag.slug, normalizedTagSlugs)
        )
      );

    return rows.map((row) => row.courseId);
  } catch (error) {
    console.error('getCourseIdsByTagSlugs error:', error);
    throw new Error('Failed to get course ids by tag slugs');
  }
}

export async function getCourseOrganizationId(courseId: string): Promise<string | null> {
  try {
    const [row] = await db
      .select({
        organizationId: schema.group.organizationId
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .where(eq(schema.course.id, courseId))
      .limit(1);

    return row?.organizationId ?? null;
  } catch (error) {
    console.error('getCourseOrganizationId error:', error);
    throw new Error('Failed to get course organization id');
  }
}

export async function getCourseTagsForOrganization(orgId: string, courseId: string): Promise<TTag[]> {
  try {
    const rows = await db
      .select({ tag: schema.tag })
      .from(schema.tagAssignment)
      .innerJoin(schema.tag, eq(schema.tagAssignment.tagId, schema.tag.id))
      .where(and(eq(schema.tag.organizationId, orgId), eq(schema.tagAssignment.courseId, courseId)))
      .orderBy(asc(schema.tag.name));

    return rows.map((row) => row.tag);
  } catch (error) {
    console.error('getCourseTagsForOrganization error:', error);
    throw new Error('Failed to get course tags for organization');
  }
}

export async function getCourseTagsByCourseIdsForOrganization(
  orgId: string,
  courseIds: string[]
): Promise<Record<string, TCourseTagPreview[]>> {
  try {
    const normalizedCourseIds = Array.from(new Set(courseIds.map((id) => id.trim()).filter(Boolean)));
    if (normalizedCourseIds.length === 0) {
      return {};
    }

    const rows = await db
      .select({
        courseId: schema.tagAssignment.courseId,
        tagId: schema.tag.id,
        tagName: schema.tag.name,
        tagSlug: schema.tag.slug,
        tagColor: schema.tag.color
      })
      .from(schema.tagAssignment)
      .innerJoin(schema.tag, eq(schema.tagAssignment.tagId, schema.tag.id))
      .where(and(eq(schema.tag.organizationId, orgId), inArray(schema.tagAssignment.courseId, normalizedCourseIds)))
      .orderBy(asc(schema.tag.name));

    const grouped: Record<string, TCourseTagPreview[]> = {};
    for (const row of rows) {
      grouped[row.courseId] ??= [];
      grouped[row.courseId].push({
        id: row.tagId,
        name: row.tagName,
        slug: row.tagSlug,
        color: row.tagColor
      });
    }

    return grouped;
  } catch (error) {
    console.error('getCourseTagsByCourseIdsForOrganization error:', error);
    throw new Error('Failed to get course tags by course ids for organization');
  }
}

export async function replaceCourseTagAssignments(courseId: string, tagIds: string[]): Promise<TTagAssignment[]> {
  try {
    const normalizedTagIds = Array.from(new Set(tagIds));

    return db.transaction(async (tx) => {
      await tx.delete(schema.tagAssignment).where(eq(schema.tagAssignment.courseId, courseId));

      if (normalizedTagIds.length === 0) {
        return [];
      }

      return tx
        .insert(schema.tagAssignment)
        .values(
          normalizedTagIds.map((tagId) => ({
            courseId,
            tagId
          }))
        )
        .returning();
    });
  } catch (error) {
    console.error('replaceCourseTagAssignments error:', error);
    throw new Error('Failed to replace course tag assignments');
  }
}
