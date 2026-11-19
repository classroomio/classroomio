import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/group', () => ({
  isCourseTeamMemberOrOrgAdmin: vi.fn()
}));

vi.mock('@cio/core/services/course/course', () => ({
  getCourseProgress: vi.fn()
}));

import { getCourseProgressForRequester } from '@api/services/course/progress-access';
import { getCourseProgress } from '@cio/core/services/course/course';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';

const COURSE_ID = 'course-1';
const REQUESTER_ID = 'profile-requester';
const OTHER_ID = 'profile-other';

describe('getCourseProgressForRequester', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getCourseProgress).mockResolvedValue({ lessonsCount: 3 } as never);
  });

  it('returns the requester own progress without a team check', async () => {
    await getCourseProgressForRequester({ courseId: COURSE_ID, requesterId: REQUESTER_ID, profileId: REQUESTER_ID });

    expect(isCourseTeamMemberOrOrgAdmin).not.toHaveBeenCalled();
    expect(getCourseProgress).toHaveBeenCalledWith(COURSE_ID, REQUESTER_ID);
  });

  it('rejects a non-team member reading another member progress', async () => {
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);

    await expect(
      getCourseProgressForRequester({ courseId: COURSE_ID, requesterId: REQUESTER_ID, profileId: OTHER_ID })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(getCourseProgress).not.toHaveBeenCalled();
  });

  it('lets a course team member or org admin read another member progress', async () => {
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);

    await getCourseProgressForRequester({ courseId: COURSE_ID, requesterId: REQUESTER_ID, profileId: OTHER_ID });

    expect(isCourseTeamMemberOrOrgAdmin).toHaveBeenCalledWith(COURSE_ID, REQUESTER_ID);
    expect(getCourseProgress).toHaveBeenCalledWith(COURSE_ID, OTHER_ID);
  });
});
