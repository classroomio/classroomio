import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/core/services/course/course', () => ({
  createCourse: vi.fn(),
  deleteCourse: vi.fn(),
  getCourse: vi.fn(),
  updateCourse: vi.fn()
}));

vi.mock('@api/services/course-import/course-import', () => ({
  createCourseImportDraftService: vi.fn(),
  getCourseImportStructureService: vi.fn(),
  publishCourseImportDraftToExistingCourseService: vi.fn()
}));

vi.mock('@api/services/organization', () => ({ getOrganizationCourses: vi.fn() }));
vi.mock('@api/services/course/people', () => ({ listCourseMembers: vi.fn() }));
vi.mock('@api/services/course/certificate-plan', () => ({ assertCertificateChangeAllowed: vi.fn() }));
vi.mock('@api/services/course/update-course', () => ({ updateCourseWithTags: vi.fn() }));
vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: vi.fn(),
  getCourseTagsForOrganization: vi.fn()
}));

import { updateCourse } from '@cio/core/services/course/course';
import { getCourseOrganizationId, getCourseTagsForOrganization } from '@cio/db/queries/tag';
import { updateCourseWithTags } from '@api/services/course/update-course';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { updatePublicApiCourseService } from '@api/services/v1/courses/course';

const ORG_ID = 'org-1';
const ACTOR_ID = 'actor-1';
const params = { courseId: 'course-1' };
const TAG_ID = '11111111-1111-4111-8111-111111111111';
const fullTag = {
  id: TAG_ID,
  organizationId: ORG_ID,
  groupId: 'group-1',
  name: 'Safety',
  slug: 'safety',
  description: null,
  color: '#EF4444',
  createdAt: '2026-10-15',
  updatedAt: '2026-10-15'
};
const courseTag = { id: TAG_ID, name: 'Safety', slug: 'safety', color: '#EF4444' };

describe('updatePublicApiCourseService tags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(updateCourse).mockResolvedValue({ course: { id: 'course-1' }, conversionOffenders: null } as never);
    vi.mocked(updateCourseWithTags).mockResolvedValue({
      course: { id: 'course-1' },
      conversionOffenders: null,
      tags: [fullTag]
    } as never);
    vi.mocked(getCourseTagsForOrganization).mockResolvedValue([fullTag] as never);
  });

  it('replaces tags in the same transaction as the course update, acting as the key creator', async () => {
    const result = await updatePublicApiCourseService(ORG_ID, ACTOR_ID, params, { title: 'New', tagIds: [TAG_ID] });

    expect(updateCourseWithTags).toHaveBeenCalledWith({
      courseId: 'course-1',
      courseData: { title: 'New' },
      orgId: ORG_ID,
      updatedByUserId: ACTOR_ID,
      tagIds: [TAG_ID]
    });
    expect(updateCourse).not.toHaveBeenCalled();
    expect(result.course.tags).toEqual([courseTag]);
  });

  it('removes every tag with an empty tagIds', async () => {
    await updatePublicApiCourseService(ORG_ID, ACTOR_ID, params, { tagIds: [] });

    expect(updateCourseWithTags).toHaveBeenCalledWith(expect.objectContaining({ courseData: {}, tagIds: [] }));
  });

  it('leaves tags alone without tagIds and still returns them', async () => {
    const result = await updatePublicApiCourseService(ORG_ID, ACTOR_ID, params, { title: 'New' });

    expect(updateCourse).toHaveBeenCalledWith('course-1', { title: 'New' });
    expect(updateCourseWithTags).not.toHaveBeenCalled();
    expect(result.course.tags).toEqual([courseTag]);
  });

  it('returns 404 for a course in another org before touching tags', async () => {
    vi.mocked(getCourseOrganizationId).mockResolvedValue('other-org');

    await expect(updatePublicApiCourseService(ORG_ID, ACTOR_ID, params, { tagIds: [TAG_ID] })).rejects.toMatchObject({
      statusCode: 404
    });
    expect(updateCourseWithTags).not.toHaveBeenCalled();
  });

  it('returns 401 when tagIds is sent without an actor', async () => {
    await expect(updatePublicApiCourseService(ORG_ID, null, params, { tagIds: [TAG_ID] })).rejects.toMatchObject({
      statusCode: 401
    });
    expect(updateCourseWithTags).not.toHaveBeenCalled();
  });

  it('passes through the 403 for a non-admin key creator and the 400 for a tag from another org', async () => {
    vi.mocked(updateCourseWithTags)
      .mockRejectedValueOnce(
        new AppError('Only organization admins can update course tags', ErrorCodes.UNAUTHORIZED, 403)
      )
      .mockRejectedValueOnce(new AppError('One or more tags are invalid', ErrorCodes.VALIDATION_ERROR, 400, 'tagIds'));

    await expect(updatePublicApiCourseService(ORG_ID, ACTOR_ID, params, { tagIds: [TAG_ID] })).rejects.toMatchObject({
      statusCode: 403
    });
    await expect(updatePublicApiCourseService(ORG_ID, ACTOR_ID, params, { tagIds: [TAG_ID] })).rejects.toMatchObject({
      statusCode: 400,
      field: 'tagIds'
    });
  });
});
