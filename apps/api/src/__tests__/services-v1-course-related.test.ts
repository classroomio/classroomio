import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: vi.fn(),
  getCourseTagsByCourseIdsForOrganization: vi.fn(),
  getCourseTagsForOrganization: vi.fn(),
  getRelatedCourses: vi.fn()
}));
vi.mock('@cio/db/queries/organization', () => ({ getOrganizationMemberIdByOrgAndProfile: vi.fn() }));
vi.mock('@cio/db/queries/course', () => ({ getCourseById: vi.fn(), isCourseSlugTaken: vi.fn() }));
vi.mock('@cio/core/services/course/course', () => ({ getCourse: vi.fn() }));
vi.mock('@cio/core/services/course/utils', () => ({ buildCourseOutline: vi.fn(() => []) }));
vi.mock('@api/services/course-import/course-import', () => ({}));
vi.mock('@api/services/course/people', () => ({}));
vi.mock('@api/services/course/certificate-plan', () => ({}));
vi.mock('@api/services/course/clone', () => ({}));
vi.mock('@api/services/organization', () => ({ getOrganizationCourses: vi.fn() }));

import {
  getCourseOrganizationId,
  getCourseTagsByCourseIdsForOrganization,
  getCourseTagsForOrganization,
  getRelatedCourses
} from '@cio/db/queries/tag';
import { getOrganizationMemberIdByOrgAndProfile } from '@cio/db/queries/organization';
import { getCourse } from '@cio/core/services/course/course';
import { getCourseService, listRelatedCoursesService } from '@api/services/v1/courses/course';

const ORG_ID = 'org-1';
const COURSE_ID = 'course-1';
const PROFILE_ID = 'profile-1';

const tag = (id: string) => ({ id, name: `Tag ${id}`, slug: id, color: '#000', organizationId: ORG_ID, groupId: 'g' });
const preview = (id: string) => ({ id, name: `Tag ${id}`, slug: id, color: '#000' });
const relatedRow = (id: string) =>
  ({ id, title: id, slug: id, type: 'SELF_PACED', cost: 0, currency: 'USD', bannerImage: null }) as never;

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
  vi.mocked(getOrganizationMemberIdByOrgAndProfile).mockResolvedValue('org-member-1' as never);
  vi.mocked(getCourseTagsForOrganization).mockResolvedValue([tag('a'), tag('b')] as never);
  vi.mocked(getRelatedCourses).mockResolvedValue([relatedRow('course-2')]);
  vi.mocked(getCourseTagsByCourseIdsForOrganization).mockResolvedValue({ 'course-2': [preview('a'), preview('z')] });
});

describe('listRelatedCoursesService', () => {
  it('returns each course with its tags and the tags it shares with the course', async () => {
    await expect(listRelatedCoursesService(ORG_ID, { courseId: COURSE_ID }, { limit: 4 })).resolves.toEqual([
      expect.objectContaining({ id: 'course-2', tags: [preview('a'), preview('z')], sharedTags: [preview('a')] })
    ]);
    expect(getRelatedCourses).toHaveBeenCalledWith(ORG_ID, COURSE_ID, ['a', 'b'], {
      excludeProfileId: undefined,
      pricing: undefined,
      limit: 4
    });
  });

  it('passes the learner, pricing and limit to the query', async () => {
    await listRelatedCoursesService(
      ORG_ID,
      { courseId: COURSE_ID },
      { profileId: PROFILE_ID, pricing: 'paid', limit: 2 }
    );

    expect(getOrganizationMemberIdByOrgAndProfile).toHaveBeenCalledWith(ORG_ID, PROFILE_ID);
    expect(getRelatedCourses).toHaveBeenCalledWith(ORG_ID, COURSE_ID, ['a', 'b'], {
      excludeProfileId: PROFILE_ID,
      pricing: 'paid',
      limit: 2
    });
  });

  it('returns an empty list when the course has no tags', async () => {
    vi.mocked(getCourseTagsForOrganization).mockResolvedValue([]);

    await expect(listRelatedCoursesService(ORG_ID, { courseId: COURSE_ID }, { limit: 4 })).resolves.toEqual([]);
    expect(getRelatedCourses).not.toHaveBeenCalled();
  });

  it('returns 404 for a course in another organization', async () => {
    vi.mocked(getCourseOrganizationId).mockResolvedValue('org-2');

    await expect(listRelatedCoursesService(ORG_ID, { courseId: COURSE_ID }, { limit: 4 })).rejects.toMatchObject({
      statusCode: 404
    });
    expect(getRelatedCourses).not.toHaveBeenCalled();
  });

  it('returns 404 for a profileId from another organization', async () => {
    vi.mocked(getOrganizationMemberIdByOrgAndProfile).mockResolvedValue(null as never);

    await expect(
      listRelatedCoursesService(ORG_ID, { courseId: COURSE_ID }, { profileId: PROFILE_ID, limit: 4 })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(getRelatedCourses).not.toHaveBeenCalled();
  });
});

describe('getCourseService', () => {
  it("returns the course's tags", async () => {
    vi.mocked(getCourse).mockResolvedValue({ id: COURSE_ID, content: {} } as never);

    await expect(getCourseService(ORG_ID, { courseId: COURSE_ID })).resolves.toMatchObject({
      tags: [preview('a'), preview('b')]
    });
    expect(getCourseTagsForOrganization).toHaveBeenCalledWith(ORG_ID, COURSE_ID);
  });
});
