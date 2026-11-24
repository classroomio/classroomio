import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: vi.fn(),
  getCourseTagsForOrganization: vi.fn()
}));
vi.mock('@cio/db/queries/organization', () => ({ getOrganizationMemberRoleId: vi.fn() }));
vi.mock('@cio/db/queries/group', () => ({ isCourseTeamMemberOrOrgAdmin: vi.fn() }));
vi.mock('@cio/db/queries/course', () => ({ getCourseById: vi.fn(), isCourseSlugTaken: vi.fn() }));
vi.mock('@cio/core/services/course/course', () => ({ getCourse: vi.fn() }));
vi.mock('@cio/core/services/course/utils', () => ({ buildCourseOutline: vi.fn() }));
vi.mock('@api/services/course-import/course-import', () => ({}));
vi.mock('@api/services/course/people', () => ({}));
vi.mock('@api/services/course/certificate-plan', () => ({}));
vi.mock('@api/services/course/clone', () => ({}));
vi.mock('@api/services/organization', () => ({ getOrganizationCourses: vi.fn() }));

import { ROLE } from '@cio/utils/constants';
import { getCourse } from '@cio/core/services/course/course';
import { buildCourseOutline } from '@cio/core/services/course/utils';
import { getCourseOrganizationId, getCourseTagsForOrganization } from '@cio/db/queries/tag';
import { getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getOrganizationCourses } from '@api/services/organization';
import { getCourseService, listCoursesService } from '@api/services/v1/courses/course';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const ACTOR_ID = '22222222-2222-4222-8222-222222222222';
const COURSE_ID = '33333333-3333-4333-8333-333333333333';

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
  vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
  vi.mocked(getCourseTagsForOrganization).mockResolvedValue([]);
  vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
  vi.mocked(getOrganizationCourses).mockResolvedValue({ items: [], pagination: {}, query: {} } as never);
  vi.mocked(getCourse).mockResolvedValue({ id: COURSE_ID, content: { lessons: [], sections: [] } } as never);
  vi.mocked(buildCourseOutline).mockReturnValue([] as never);
});

describe('listCoursesService', () => {
  const query = { page: 1, limit: 20 };

  it('lists all organization courses when the actor is an org admin', async () => {
    await listCoursesService(ORG_ID, ACTOR_ID, query);

    expect(getOrganizationCourses).toHaveBeenCalledWith(ORG_ID, ACTOR_ID, ROLE.ADMIN, query);
  });

  it('scopes the list to the actor when the actor is an org tutor', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);

    await listCoursesService(ORG_ID, ACTOR_ID, query);

    expect(getOrganizationCourses).toHaveBeenCalledWith(ORG_ID, ACTOR_ID, ROLE.TUTOR, query);
  });

  it('returns 401 without an actor', async () => {
    await expect(listCoursesService(ORG_ID, null, query)).rejects.toMatchObject({ statusCode: 401 });
    expect(getOrganizationCourses).not.toHaveBeenCalled();
  });

  it('returns 403 when the actor is a student', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.STUDENT);

    await expect(listCoursesService(ORG_ID, ACTOR_ID, query)).rejects.toMatchObject({ statusCode: 403 });
    expect(getOrganizationCourses).not.toHaveBeenCalled();
  });
});

describe('getCourseService', () => {
  it('returns the course and its outline for a course team member or org admin', async () => {
    const result = await getCourseService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID });

    expect(result).toEqual({ id: COURSE_ID, tags: [], content: { lessons: [], sections: [], outline: [] } });
    expect(isCourseTeamMemberOrOrgAdmin).toHaveBeenCalledWith(COURSE_ID, ACTOR_ID);
  });

  it('returns 401 without an actor', async () => {
    await expect(getCourseService(ORG_ID, null, { courseId: COURSE_ID })).rejects.toMatchObject({ statusCode: 401 });
    expect(getCourse).not.toHaveBeenCalled();
  });

  it('returns 403 when the actor is neither on the course team nor an org admin', async () => {
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);

    await expect(getCourseService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID })).rejects.toMatchObject({
      statusCode: 403
    });
    expect(getCourse).not.toHaveBeenCalled();
  });

  it("returns 404 for another organization's course", async () => {
    vi.mocked(getCourseOrganizationId).mockResolvedValue('99999999-9999-4999-8999-999999999999');

    await expect(getCourseService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID })).rejects.toMatchObject({
      statusCode: 404
    });
    expect(getCourse).not.toHaveBeenCalled();
  });
});
