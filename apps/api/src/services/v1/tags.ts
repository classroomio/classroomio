import type {
  TPublicApiCreateTag,
  TPublicApiCreateTagGroup,
  TPublicApiTagGroupParam,
  TPublicApiTagParam,
  TPublicApiTagsQuery,
  TPublicApiUpdateTag,
  TPublicApiUpdateTagGroup
} from '@cio/utils/validation/public-api';
import { slugifyTagValue } from '@cio/utils/validation/tag';
import { findTagBySlug, findTagGroupBySlug, getCourseTagsForOrganization } from '@cio/db/queries/tag';
import {
  createOrganizationTag,
  createOrganizationTagGroup,
  getOrganizationTagGroups,
  updateOrganizationTag,
  updateOrganizationTagGroup
} from '@api/services/tag';
import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  assertCourseBelongsToOrganization,
  assertOrgAdmin,
  assertOrgMember,
  paginateInMemory
} from '@api/services/v1/shared';

export async function listPublicApiTagGroupsService(orgId: string, actorId: string | null, query: TPublicApiTagsQuery) {
  await assertOrgMember(orgId, actorId);

  const groups = await getOrganizationTagGroups(orgId);

  if (!query.courseId) {
    return paginateInMemory(groups, query);
  }

  await assertCourseBelongsToOrganization(orgId, query.courseId);

  const courseTagIds = new Set((await getCourseTagsForOrganization(orgId, query.courseId)).map((tag) => tag.id));
  const courseGroups = groups
    .map((group) => ({ ...group, tags: group.tags.filter((tag) => courseTagIds.has(tag.id)) }))
    .filter((group) => group.tags.length > 0);

  return paginateInMemory(courseGroups, query);
}

export async function createPublicApiTagGroupService(
  orgId: string,
  actorId: string | null,
  payload: TPublicApiCreateTagGroup
) {
  await assertOrgAdmin(orgId, actorId);

  if (await findTagGroupBySlug(orgId, slugifyTagValue(payload.name))) {
    throw new AppError('A tag group with this name already exists', ErrorCodes.TAG_GROUP_ALREADY_EXISTS, 409, 'name');
  }

  return createOrganizationTagGroup(orgId, payload);
}

export async function updatePublicApiTagGroupService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiTagGroupParam,
  payload: TPublicApiUpdateTagGroup
) {
  await assertOrgAdmin(orgId, actorId);

  return updateOrganizationTagGroup(orgId, params.groupId, payload);
}

export async function createPublicApiTagService(orgId: string, actorId: string | null, payload: TPublicApiCreateTag) {
  await assertOrgAdmin(orgId, actorId);

  if (await findTagBySlug(orgId, slugifyTagValue(payload.name))) {
    throw new AppError('A tag with this name already exists', ErrorCodes.TAG_ALREADY_EXISTS, 409, 'name');
  }

  return createOrganizationTag(orgId, payload);
}

export async function updatePublicApiTagService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiTagParam,
  payload: TPublicApiUpdateTag
) {
  await assertOrgAdmin(orgId, actorId);

  return updateOrganizationTag(orgId, params.tagId, payload);
}
