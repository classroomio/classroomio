import type {
  TPublicApiCreateTag,
  TPublicApiCreateTagGroup,
  TPublicApiTagGroupParam,
  TPublicApiTagParam,
  TPublicApiTagsQuery,
  TPublicApiUpdateTag,
  TPublicApiUpdateTagGroup
} from '@cio/utils/validation/public-api';
import { db } from '@cio/db/drizzle';
import {
  findTagByName,
  findTagGroupByName,
  getCourseTagsForOrganization,
  lockOrganizationTags
} from '@cio/db/queries/tag';
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

  // Names are compared, not slugs: names without a-z or 0-9 all slugify to "tag".
  return db.transaction(async (tx) => {
    await lockOrganizationTags(orgId, tx);

    if (await findTagGroupByName(orgId, payload.name, tx)) {
      throw new AppError('A tag group with this name already exists', ErrorCodes.TAG_GROUP_ALREADY_EXISTS, 409, 'name');
    }

    return createOrganizationTagGroup(orgId, payload, tx);
  });
}

export async function updatePublicApiTagGroupService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiTagGroupParam,
  payload: TPublicApiUpdateTagGroup
) {
  await assertOrgAdmin(orgId, actorId);

  return db.transaction(async (tx) => {
    await lockOrganizationTags(orgId, tx);

    if (payload.name !== undefined && (await findTagGroupByName(orgId, payload.name, tx, params.groupId))) {
      throw new AppError('A tag group with this name already exists', ErrorCodes.TAG_GROUP_ALREADY_EXISTS, 409, 'name');
    }

    return updateOrganizationTagGroup(orgId, params.groupId, payload, tx);
  });
}

export async function createPublicApiTagService(orgId: string, actorId: string | null, payload: TPublicApiCreateTag) {
  await assertOrgAdmin(orgId, actorId);

  return db.transaction(async (tx) => {
    await lockOrganizationTags(orgId, tx);

    if (await findTagByName(orgId, payload.name, tx)) {
      throw new AppError('A tag with this name already exists', ErrorCodes.TAG_ALREADY_EXISTS, 409, 'name');
    }

    return createOrganizationTag(orgId, payload, tx);
  });
}

export async function updatePublicApiTagService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiTagParam,
  payload: TPublicApiUpdateTag
) {
  await assertOrgAdmin(orgId, actorId);

  return db.transaction(async (tx) => {
    await lockOrganizationTags(orgId, tx);

    if (payload.name !== undefined && (await findTagByName(orgId, payload.name, tx, params.tagId))) {
      throw new AppError('A tag with this name already exists', ErrorCodes.TAG_ALREADY_EXISTS, 409, 'name');
    }

    return updateOrganizationTag(orgId, params.tagId, payload, tx);
  });
}
