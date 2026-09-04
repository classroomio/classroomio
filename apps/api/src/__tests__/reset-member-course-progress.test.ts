import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/course/compliance', () => ({
  ensureComplianceEnrollmentRecordsForProfiles: vi.fn()
}));

vi.mock('@cio/db/queries/course/people', () => ({
  getCourseMember: vi.fn(),
  getCourseMembers: vi.fn(),
  addCourseMember: vi.fn(),
  deleteCourseMember: vi.fn(),
  updateCourseMember: vi.fn(),
  getCourseTeachers: vi.fn()
}));

vi.mock('@cio/db/queries/course/reset-progress', () => ({
  resetStudentCourseProgress: vi.fn()
}));

// Resetting progress busts the org stats cache after the reset commits; without
// these the service reaches a real database and Redis.
vi.mock('@cio/db/queries/course', () => ({
  getCourseWithOrgData: vi.fn(),
  getOrgIdByCourseId: vi.fn().mockResolvedValue('org-1')
}));

vi.mock('@cio/core/utils/redis/org-stats-cache', () => ({
  invalidateOrgStats: vi.fn()
}));

import { AppError } from '@api/utils/errors';
import { ROLE } from '@cio/utils/constants';
import { getCourseMember } from '@cio/db/queries/course/people';
import { getOrgIdByCourseId } from '@cio/db/queries/course';
import { invalidateOrgStats } from '@cio/core/utils/redis/org-stats-cache';
import { resetStudentCourseProgress } from '@cio/db/queries/course/reset-progress';
import { resetMemberCourseProgress } from '@api/services/course/people';

describe('resetMemberCourseProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 when the member is missing', async () => {
    vi.mocked(getCourseMember).mockResolvedValue(null);

    await expect(resetMemberCourseProgress('course-1', 'member-1', 'actor-1')).rejects.toMatchObject({
      statusCode: 404
    });
  });

  it('returns 404 when the member has no profileId', async () => {
    vi.mocked(getCourseMember).mockResolvedValue({
      id: 'member-1',
      profileId: null,
      roleId: ROLE.STUDENT
    } as Awaited<ReturnType<typeof getCourseMember>>);

    await expect(resetMemberCourseProgress('course-1', 'member-1', 'actor-1')).rejects.toBeInstanceOf(AppError);
  });

  it('returns 400 when the member is not a student', async () => {
    vi.mocked(getCourseMember).mockResolvedValue({
      id: 'member-1',
      profileId: 'profile-1',
      roleId: ROLE.TUTOR
    } as Awaited<ReturnType<typeof getCourseMember>>);

    await expect(resetMemberCourseProgress('course-1', 'member-1', 'actor-1')).rejects.toMatchObject({
      statusCode: 400
    });
    expect(resetStudentCourseProgress).not.toHaveBeenCalled();
  });

  it('resets progress and returns the summary', async () => {
    const summary = {
      lessonCompletion: 2,
      lessonVideoProgress: 1,
      submissions: 3,
      groupAttendance: 0,
      lessonComments: 1,
      courseNewsfeed: 0,
      courseNewsfeedComments: 0,
      courseCertificateIssues: 0,
      courseCompletionRecords: 0,
      aiChatConversations: 0
    };

    vi.mocked(getCourseMember).mockResolvedValue({
      id: 'member-1',
      profileId: 'profile-1',
      roleId: ROLE.STUDENT
    } as Awaited<ReturnType<typeof getCourseMember>>);
    vi.mocked(resetStudentCourseProgress).mockResolvedValue(summary);
    vi.mocked(getOrgIdByCourseId).mockResolvedValue('org-1');

    const result = await resetMemberCourseProgress('course-1', 'member-1', 'actor-1');

    expect(resetStudentCourseProgress).toHaveBeenCalledWith({
      courseId: 'course-1',
      groupMemberId: 'member-1',
      profileId: 'profile-1'
    });
    expect(result).toEqual(summary);
    expect(invalidateOrgStats).toHaveBeenCalledWith('org-1');
  });
});
