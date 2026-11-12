import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/tag', () => ({ getCourseOrganizationId: vi.fn() }));
vi.mock('@cio/db/queries/organization', () => ({ getOrganizationMemberRoleId: vi.fn() }));
vi.mock('@cio/db/queries/course', () => ({ getCourseById: vi.fn() }));
vi.mock('@cio/core/services/course/course', () => ({}));
vi.mock('@api/services/organization', () => ({ reorderOrgCourses: vi.fn() }));

import { ROLE } from '@cio/utils/constants';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import { getCourseById } from '@cio/db/queries/course';
import { reorderOrgCourses } from '@api/services/organization';
import { setPublicApiFeaturedCoursesService } from '@api/services/v1/organization/landing-page';

const ORG_ID = 'org-1';
const ACTOR_ID = 'actor-1';
const COURSE_ID = 'course-1';
const OTHER_COURSE_ID = 'course-2';

const course = (overrides: Record<string, unknown> = {}) =>
  ({ id: COURSE_ID, isTemplate: false, isPublished: true, status: 'ACTIVE', ...overrides }) as never;

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
  vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
  vi.mocked(getCourseById).mockResolvedValue([course()]);
});

describe('setPublicApiFeaturedCoursesService', () => {
  it('saves the courses in the given order', async () => {
    const payload = { courseIds: [OTHER_COURSE_ID, COURSE_ID] };

    await expect(setPublicApiFeaturedCoursesService(ORG_ID, ACTOR_ID, payload)).resolves.toEqual(payload);
    expect(reorderOrgCourses).toHaveBeenCalledWith(ORG_ID, [
      { id: OTHER_COURSE_ID, order: 0 },
      { id: COURSE_ID, order: 1 }
    ]);
  });

  it('clears the featured courses with an empty list', async () => {
    await setPublicApiFeaturedCoursesService(ORG_ID, ACTOR_ID, { courseIds: [] });

    expect(reorderOrgCourses).toHaveBeenCalledWith(ORG_ID, []);
  });

  it.each([
    ['a tutor', ROLE.TUTOR],
    ['a student', ROLE.STUDENT]
  ])('returns 403 for %s', async (_label, role) => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(role);

    await expect(
      setPublicApiFeaturedCoursesService(ORG_ID, ACTOR_ID, { courseIds: [COURSE_ID] })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(reorderOrgCourses).not.toHaveBeenCalled();
  });

  it('returns 401 without an actor', async () => {
    await expect(setPublicApiFeaturedCoursesService(ORG_ID, null, { courseIds: [] })).rejects.toMatchObject({
      statusCode: 401
    });
  });

  it("returns 404 for another org's course", async () => {
    vi.mocked(getCourseOrganizationId).mockResolvedValue('org-2');

    await expect(
      setPublicApiFeaturedCoursesService(ORG_ID, ACTOR_ID, { courseIds: [COURSE_ID] })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(reorderOrgCourses).not.toHaveBeenCalled();
  });

  it.each([
    ['unpublished', { isPublished: false }],
    ['deleted', { status: 'DELETED' }],
    ['a template', { isTemplate: true }]
  ])('returns 400 when a course is %s', async (_label, overrides) => {
    vi.mocked(getCourseById).mockResolvedValue([course(overrides)]);

    await expect(
      setPublicApiFeaturedCoursesService(ORG_ID, ACTOR_ID, { courseIds: [COURSE_ID] })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(reorderOrgCourses).not.toHaveBeenCalled();
  });
});
