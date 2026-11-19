import { beforeEach, describe, expect, it, vi } from 'vitest';

const TX = { tx: true };

vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: vi.fn((run: (tx: unknown) => unknown) => run(TX)) }
}));

vi.mock('@cio/db/queries/tag', () => ({
  findTagByName: vi.fn(),
  findTagGroupByName: vi.fn(),
  getCourseOrganizationId: vi.fn(),
  getCourseTagsForOrganization: vi.fn(),
  lockOrganizationTags: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberRoleId: vi.fn()
}));

vi.mock('@api/services/tag', () => ({
  createOrganizationTag: vi.fn(),
  createOrganizationTagGroup: vi.fn(),
  getOrganizationTagGroups: vi.fn(),
  updateOrganizationTag: vi.fn(),
  updateOrganizationTagGroup: vi.fn()
}));

import {
  findTagByName,
  findTagGroupByName,
  getCourseOrganizationId,
  getCourseTagsForOrganization,
  lockOrganizationTags
} from '@cio/db/queries/tag';
import { getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import {
  createOrganizationTag,
  createOrganizationTagGroup,
  getOrganizationTagGroups,
  updateOrganizationTag,
  updateOrganizationTagGroup
} from '@api/services/tag';
import { ROLE } from '@cio/utils/constants';
import {
  createPublicApiTagGroupService,
  createPublicApiTagService,
  listPublicApiTagGroupsService,
  updatePublicApiTagGroupService,
  updatePublicApiTagService
} from '@api/services/v1/tags';

const ORG_ID = 'org-1';
const ACTOR_ID = 'actor-1';
const GROUP_ID = '11111111-1111-4111-8111-111111111111';
const COURSE_ID = '22222222-2222-4222-8222-222222222222';
const query = { page: 1, limit: 20 };

const tag = (id: string) => ({ id, slug: id, name: id, color: '#EF4444', courseCount: 0 });
const groups = [
  { id: 'g1', slug: 'topics', tags: [tag('safety'), tag('fire')] },
  { id: 'g2', slug: 'levels', tags: [tag('beginner')] }
];

describe('v1 tags service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
    vi.mocked(getOrganizationTagGroups).mockResolvedValue(groups as never);
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
  });

  describe('listPublicApiTagGroupsService', () => {
    it('pages every group for an org member', async () => {
      vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.STUDENT);

      const result = await listPublicApiTagGroupsService(ORG_ID, ACTOR_ID, query);

      expect(getOrganizationTagGroups).toHaveBeenCalledWith(ORG_ID);
      expect(result.items).toHaveLength(2);
      expect(result.pagination).toEqual({ page: 1, limit: 20, total: 2, totalPages: 1 });
    });

    it('keeps only the course tags, and drops groups left empty, when courseId is set', async () => {
      vi.mocked(getCourseTagsForOrganization).mockResolvedValue([{ id: 'fire' }] as never);

      const result = await listPublicApiTagGroupsService(ORG_ID, ACTOR_ID, { ...query, courseId: COURSE_ID });

      expect(getCourseTagsForOrganization).toHaveBeenCalledWith(ORG_ID, COURSE_ID);
      expect(result.items).toEqual([{ ...groups[0], tags: [tag('fire')] }]);
      expect(result.pagination.total).toBe(1);
    });

    it('returns 404 for a course in another org', async () => {
      vi.mocked(getCourseOrganizationId).mockResolvedValue('other-org');

      await expect(
        listPublicApiTagGroupsService(ORG_ID, ACTOR_ID, { ...query, courseId: COURSE_ID })
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(getCourseTagsForOrganization).not.toHaveBeenCalled();
    });

    it('returns 403 when the key creator is not in the org', async () => {
      vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(null);

      await expect(listPublicApiTagGroupsService(ORG_ID, ACTOR_ID, query)).rejects.toMatchObject({ statusCode: 403 });
    });

    it('returns 401 without an actor', async () => {
      await expect(listPublicApiTagGroupsService(ORG_ID, null, query)).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe('writes', () => {
    it('creates a tag group and tag through the dashboard services, under the org tag lock', async () => {
      await createPublicApiTagGroupService(ORG_ID, ACTOR_ID, { name: 'Topics' });
      await createPublicApiTagService(ORG_ID, ACTOR_ID, { name: 'Safety', groupId: GROUP_ID, color: '#EF4444' });

      expect(lockOrganizationTags).toHaveBeenCalledTimes(2);
      expect(lockOrganizationTags).toHaveBeenCalledWith(ORG_ID, TX);
      expect(findTagGroupByName).toHaveBeenCalledWith(ORG_ID, 'Topics', TX);
      expect(createOrganizationTagGroup).toHaveBeenCalledWith(ORG_ID, { name: 'Topics' }, TX);
      expect(findTagByName).toHaveBeenCalledWith(ORG_ID, 'Safety', TX);
      expect(createOrganizationTag).toHaveBeenCalledWith(
        ORG_ID,
        { name: 'Safety', groupId: GROUP_ID, color: '#EF4444' },
        TX
      );
    });

    it('creates tags whose names share the fallback slug, since only names are compared', async () => {
      await createPublicApiTagService(ORG_ID, ACTOR_ID, { name: '物理', groupId: GROUP_ID, color: '#EF4444' });

      expect(findTagByName).toHaveBeenCalledWith(ORG_ID, '物理', TX);
      expect(createOrganizationTag).toHaveBeenCalled();
    });

    it('returns 409 instead of creating a second tag or group with the same name', async () => {
      vi.mocked(findTagGroupByName).mockResolvedValue({ id: 'g1' } as never);
      vi.mocked(findTagByName).mockResolvedValue({ id: 'safety' } as never);

      await expect(createPublicApiTagGroupService(ORG_ID, ACTOR_ID, { name: 'Topics' })).rejects.toMatchObject({
        statusCode: 409,
        code: 'TAG_GROUP_ALREADY_EXISTS'
      });
      await expect(
        createPublicApiTagService(ORG_ID, ACTOR_ID, { name: ' SAFETY ', groupId: GROUP_ID, color: '#EF4444' })
      ).rejects.toMatchObject({ statusCode: 409, code: 'TAG_ALREADY_EXISTS' });
      expect(createOrganizationTagGroup).not.toHaveBeenCalled();
      expect(createOrganizationTag).not.toHaveBeenCalled();
    });

    it('updates a tag group and tag scoped to the org, under the org tag lock', async () => {
      await updatePublicApiTagGroupService(ORG_ID, ACTOR_ID, { groupId: GROUP_ID }, { order: 2 });
      await updatePublicApiTagService(ORG_ID, ACTOR_ID, { tagId: 'tag-1' }, { color: '#F97316' });

      expect(lockOrganizationTags).toHaveBeenCalledTimes(2);
      expect(findTagGroupByName).not.toHaveBeenCalled();
      expect(findTagByName).not.toHaveBeenCalled();
      expect(updateOrganizationTagGroup).toHaveBeenCalledWith(ORG_ID, GROUP_ID, { order: 2 }, TX);
      expect(updateOrganizationTag).toHaveBeenCalledWith(ORG_ID, 'tag-1', { color: '#F97316' }, TX);
    });

    it('checks a new name against the other tags and groups, leaving out the one being renamed', async () => {
      vi.mocked(findTagGroupByName).mockResolvedValue(null);
      vi.mocked(findTagByName).mockResolvedValue(null);

      await updatePublicApiTagGroupService(ORG_ID, ACTOR_ID, { groupId: GROUP_ID }, { name: 'Topics' });
      await updatePublicApiTagService(ORG_ID, ACTOR_ID, { tagId: 'tag-1' }, { name: 'Safety' });

      expect(findTagGroupByName).toHaveBeenCalledWith(ORG_ID, 'Topics', TX, GROUP_ID);
      expect(findTagByName).toHaveBeenCalledWith(ORG_ID, 'Safety', TX, 'tag-1');
      expect(updateOrganizationTagGroup).toHaveBeenCalledWith(ORG_ID, GROUP_ID, { name: 'Topics' }, TX);
      expect(updateOrganizationTag).toHaveBeenCalledWith(ORG_ID, 'tag-1', { name: 'Safety' }, TX);
    });

    it('returns 409 when renaming to a name another tag or group already has', async () => {
      vi.mocked(findTagGroupByName).mockResolvedValue({ id: 'g2' } as never);
      vi.mocked(findTagByName).mockResolvedValue({ id: 'tag-2' } as never);

      await expect(
        updatePublicApiTagGroupService(ORG_ID, ACTOR_ID, { groupId: GROUP_ID }, { name: 'levels' })
      ).rejects.toMatchObject({ statusCode: 409, code: 'TAG_GROUP_ALREADY_EXISTS' });
      await expect(
        updatePublicApiTagService(ORG_ID, ACTOR_ID, { tagId: 'tag-1' }, { name: 'FIRE' })
      ).rejects.toMatchObject({ statusCode: 409, code: 'TAG_ALREADY_EXISTS' });
      expect(updateOrganizationTagGroup).not.toHaveBeenCalled();
      expect(updateOrganizationTag).not.toHaveBeenCalled();
    });

    it.each([ROLE.TUTOR, ROLE.STUDENT, null])(
      'rejects a key creator with role %s, as the dashboard does',
      async (role) => {
        vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(role);

        await expect(createPublicApiTagGroupService(ORG_ID, ACTOR_ID, { name: 'Topics' })).rejects.toMatchObject({
          statusCode: 403
        });
        await expect(
          updatePublicApiTagService(ORG_ID, ACTOR_ID, { tagId: 'tag-1' }, { name: 'x' })
        ).rejects.toMatchObject({ statusCode: 403 });
        expect(createOrganizationTagGroup).not.toHaveBeenCalled();
        expect(updateOrganizationTag).not.toHaveBeenCalled();
      }
    );

    it('returns 401 without an actor', async () => {
      await expect(createPublicApiTagGroupService(ORG_ID, null, { name: 'Topics' })).rejects.toMatchObject({
        statusCode: 401
      });
    });
  });
});
