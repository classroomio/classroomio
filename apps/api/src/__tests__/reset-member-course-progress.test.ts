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

import { AppError } from '@api/utils/errors';
import { getCourseMember } from '@cio/db/queries/course/people';
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
      profileId: null
    } as Awaited<ReturnType<typeof getCourseMember>>);

    await expect(resetMemberCourseProgress('course-1', 'member-1', 'actor-1')).rejects.toBeInstanceOf(AppError);
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
      communityQuestions: 0,
      communityAnswers: 0,
      courseCertificateIssues: 0,
      courseCompletionRecords: 0,
      aiChatConversations: 0
    };

    vi.mocked(getCourseMember).mockResolvedValue({
      id: 'member-1',
      profileId: 'profile-1'
    } as Awaited<ReturnType<typeof getCourseMember>>);
    vi.mocked(resetStudentCourseProgress).mockResolvedValue(summary);

    const result = await resetMemberCourseProgress('course-1', 'member-1', 'actor-1');

    expect(resetStudentCourseProgress).toHaveBeenCalledWith({
      courseId: 'course-1',
      groupMemberId: 'member-1',
      profileId: 'profile-1'
    });
    expect(result).toEqual(summary);
  });
});
