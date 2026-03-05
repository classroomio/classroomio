import type {
  TCourseTagAssignment,
  TTagCreate,
  TTagGroupCreate,
  TTagGroupUpdate,
  TTagUpdate
} from '@cio/utils/validation/tag';
import {
  createTag,
  createTagGroup,
  generateUniqueTagGroupSlug,
  generateUniqueTagSlug,
  getCourseOrganizationId,
  getCourseTagsForOrganization,
  getTagById,
  getTagGroupById,
  getTagGroupsWithTags,
  getTagsByIds,
  replaceCourseTagAssignments,
  updateTag,
  updateTagGroup
} from '@cio/db/queries/tag';
import { getOrgIdBySiteName, isUserOrgAdmin } from '@cio/db/queries/organization';

import { AppError, ErrorCodes } from '@api/utils/errors';

function normalizeOptionalText(value: string | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}

export async function getOrganizationTagGroups(orgId: string) {
  try {
    return getTagGroupsWithTags(orgId);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch tag groups',
      ErrorCodes.TAG_FETCH_FAILED,
      500
    );
  }
}

export async function getPublicOrganizationTagGroups(siteName: string) {
  try {
    const orgResult = await getOrgIdBySiteName(siteName);
    const org = orgResult[0];

    if (!org) {
      throw new AppError('Organization not found', ErrorCodes.ORG_NOT_FOUND, 404);
    }

    const groups = await getTagGroupsWithTags(org.id, {
      onlyPublishedCourses: true
    });

    const tagsByGroupId = new Map<string, (typeof groups)[number]['tags']>();

    for (const group of groups) {
      for (const tag of group.tags) {
        const groupId = tag.groupId || group.id;
        const existing = tagsByGroupId.get(groupId) ?? [];

        if (!existing.some((item) => item.id === tag.id)) {
          existing.push(tag);
          tagsByGroupId.set(groupId, existing);
        }
      }
    }

    return groups.map((group) => ({
      ...group,
      tags: tagsByGroupId.get(group.id) ?? []
    }));
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch public tag groups',
      ErrorCodes.TAG_FETCH_FAILED,
      500
    );
  }
}

export async function createOrganizationTagGroup(orgId: string, data: TTagGroupCreate) {
  try {
    const slug = await generateUniqueTagGroupSlug(orgId, data.name);

    return createTagGroup({
      organizationId: orgId,
      name: data.name.trim(),
      slug,
      description: normalizeOptionalText(data.description),
      order: data.order ?? 0
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create tag group',
      ErrorCodes.TAG_CREATE_FAILED,
      500
    );
  }
}

export async function updateOrganizationTagGroup(orgId: string, groupId: string, data: TTagGroupUpdate) {
  try {
    const existing = await getTagGroupById(orgId, groupId);

    if (!existing) {
      throw new AppError('Tag group not found', ErrorCodes.TAG_GROUP_NOT_FOUND, 404);
    }

    const nextName = data.name?.trim();
    const slug = nextName && nextName !== existing.name ? await generateUniqueTagGroupSlug(orgId, nextName) : undefined;

    const updated = await updateTagGroup(orgId, groupId, {
      ...(nextName ? { name: nextName } : {}),
      ...(slug ? { slug } : {}),
      ...(data.description !== undefined ? { description: normalizeOptionalText(data.description) } : {}),
      ...(data.order !== undefined ? { order: data.order } : {})
    });

    if (!updated) {
      throw new AppError('Tag group not found', ErrorCodes.TAG_GROUP_NOT_FOUND, 404);
    }

    return updated;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update tag group',
      ErrorCodes.TAG_UPDATE_FAILED,
      500
    );
  }
}

export async function createOrganizationTag(orgId: string, data: TTagCreate) {
  try {
    const group = await getTagGroupById(orgId, data.groupId);

    if (!group) {
      throw new AppError('Tag group not found', ErrorCodes.TAG_GROUP_NOT_FOUND, 404, 'groupId');
    }

    const slug = await generateUniqueTagSlug(orgId, data.name);

    return createTag({
      organizationId: orgId,
      groupId: data.groupId,
      name: data.name.trim(),
      slug,
      description: normalizeOptionalText(data.description),
      color: data.color
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create tag',
      ErrorCodes.TAG_CREATE_FAILED,
      500
    );
  }
}

export async function updateOrganizationTag(orgId: string, tagId: string, data: TTagUpdate) {
  try {
    const existing = await getTagById(orgId, tagId);

    if (!existing) {
      throw new AppError('Tag not found', ErrorCodes.TAG_NOT_FOUND, 404);
    }

    if (data.groupId) {
      const group = await getTagGroupById(orgId, data.groupId);
      if (!group) {
        throw new AppError('Tag group not found', ErrorCodes.TAG_GROUP_NOT_FOUND, 404, 'groupId');
      }
    }

    const nextName = data.name?.trim();
    const slug = nextName && nextName !== existing.name ? await generateUniqueTagSlug(orgId, nextName) : undefined;

    const updated = await updateTag(orgId, tagId, {
      ...(nextName ? { name: nextName } : {}),
      ...(slug ? { slug } : {}),
      ...(data.description !== undefined ? { description: normalizeOptionalText(data.description) } : {}),
      ...(data.groupId ? { groupId: data.groupId } : {}),
      ...(data.color ? { color: data.color } : {})
    });

    if (!updated) {
      throw new AppError('Tag not found', ErrorCodes.TAG_NOT_FOUND, 404);
    }

    return updated;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update tag',
      ErrorCodes.TAG_UPDATE_FAILED,
      500
    );
  }
}

export async function getCourseTags(orgId: string, courseId: string) {
  try {
    const courseOrgId = await getCourseOrganizationId(courseId);

    if (!courseOrgId) {
      throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
    }

    if (courseOrgId !== orgId) {
      throw new AppError('Invalid permissions', ErrorCodes.UNAUTHORIZED, 403);
    }

    return getCourseTagsForOrganization(orgId, courseId);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch course tags',
      ErrorCodes.TAG_FETCH_FAILED,
      500
    );
  }
}

export async function replaceCourseTags(
  orgId: string,
  courseId: string,
  data: TCourseTagAssignment,
  options: {
    updatedByUserId?: string;
  } = {}
) {
  try {
    if (options.updatedByUserId) {
      const isAdmin = await isUserOrgAdmin(orgId, options.updatedByUserId);
      if (!isAdmin) {
        throw new AppError('Only organization admins can update course tags', ErrorCodes.UNAUTHORIZED, 403);
      }
    }

    const courseOrgId = await getCourseOrganizationId(courseId);

    if (!courseOrgId) {
      throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
    }

    if (courseOrgId !== orgId) {
      throw new AppError('Invalid permissions', ErrorCodes.UNAUTHORIZED, 403);
    }

    const uniqueTagIds = Array.from(new Set(data.tagIds));

    if (uniqueTagIds.length > 0) {
      const validTags = await getTagsByIds(orgId, uniqueTagIds);
      if (validTags.length !== uniqueTagIds.length) {
        throw new AppError('One or more tags are invalid', ErrorCodes.VALIDATION_ERROR, 400, 'tagIds');
      }
    }

    await replaceCourseTagAssignments(courseId, uniqueTagIds);

    return getCourseTagsForOrganization(orgId, courseId);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to assign course tags',
      ErrorCodes.TAG_ASSIGNMENT_FAILED,
      500
    );
  }
}
