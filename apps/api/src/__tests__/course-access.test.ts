import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/group', () => ({
  getCourseProgramAccess: vi.fn(),
  isUserCourseMemberOrOrgAdmin: vi.fn()
}));

vi.mock('@cio/core/services/course/course', () => ({
  ensureProgramCourseAccess: vi.fn()
}));

vi.mock('@cio/core/services/course/progression', () => ({
  assertStudentCanAccessContent: vi.fn()
}));

vi.mock('@cio/db/queries/course/course', () => ({
  getCourseById: vi.fn(),
  getCourseProgress: vi.fn()
}));

vi.mock('@cio/db/queries/course/content', () => ({
  getCourseContentItems: vi.fn()
}));

import { canProfileReachCourse } from '@api/services/course/access';
import { ensureProgramCourseAccess } from '@cio/core/services/course/course';
import { getCourseProgramAccess, isUserCourseMemberOrOrgAdmin } from '@cio/db/queries/group';

const COURSE_ID = 'course-1';
const PROFILE_ID = 'profile-1';

function programAccess(organizationId: string | null) {
  return {
    courseId: COURSE_ID,
    courseGroupId: 'group-1',
    organizationId,
    profileEmail: 'student@example.com',
    roleId: 3
  };
}

describe('canProfileReachCourse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts course members and org admins without checking programs', async () => {
    vi.mocked(isUserCourseMemberOrOrgAdmin).mockResolvedValue(true);

    await expect(canProfileReachCourse(COURSE_ID, PROFILE_ID)).resolves.toBe(true);
    expect(getCourseProgramAccess).not.toHaveBeenCalled();
  });

  it('accepts members of a program that includes the course', async () => {
    vi.mocked(isUserCourseMemberOrOrgAdmin).mockResolvedValue(false);
    vi.mocked(getCourseProgramAccess).mockResolvedValue(programAccess('org-1'));

    await expect(canProfileReachCourse(COURSE_ID, PROFILE_ID)).resolves.toBe(true);
  });

  it('rejects profiles with no course or program access', async () => {
    vi.mocked(isUserCourseMemberOrOrgAdmin).mockResolvedValue(false);
    vi.mocked(getCourseProgramAccess).mockResolvedValue(null);

    await expect(canProfileReachCourse(COURSE_ID, PROFILE_ID)).resolves.toBe(false);
  });

  it('rejects program access whose course group has no organization', async () => {
    vi.mocked(isUserCourseMemberOrOrgAdmin).mockResolvedValue(false);
    vi.mocked(getCourseProgramAccess).mockResolvedValue(programAccess(null));

    await expect(canProfileReachCourse(COURSE_ID, PROFILE_ID)).resolves.toBe(false);
  });

  it('never backfills program members into the course', async () => {
    vi.mocked(isUserCourseMemberOrOrgAdmin).mockResolvedValue(false);
    vi.mocked(getCourseProgramAccess).mockResolvedValue(programAccess('org-1'));

    await canProfileReachCourse(COURSE_ID, PROFILE_ID);

    expect(ensureProgramCourseAccess).not.toHaveBeenCalled();
  });
});
