import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberIdByOrgAndProfile: vi.fn(),
  getOrganizationMemberRoleId: vi.fn(),
  getOrganizationMembersByNormalizedEmails: vi.fn()
}));

vi.mock('@api/services/organization', () => ({
  getUserAnalytics: vi.fn()
}));

vi.mock('@api/utils/redis/cached-read', () => ({
  cachedRead: vi.fn(async (_key: string, _ttl: number, compute: () => Promise<unknown>) => ({
    data: await compute(),
    generatedAt: '2026-09-27T10:00:00.000Z'
  }))
}));

import { getOrganizationMemberIdByOrgAndProfile, getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import { getUserAnalytics } from '@api/services/organization';
import { getPublicApiStudentAnalyticsService } from '@api/services/v1/audience/analytics';
import { cachedRead } from '@api/utils/redis/cached-read';
import { ROLE } from '@cio/utils/constants';

const ORG_ID = 'org-1';
const ACTOR_ID = 'actor-1';
const COURSE_ID = 'course-1';
const PROFILE_ID = 'profile-1';

describe('public API student analytics service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
    vi.mocked(getOrganizationMemberIdByOrgAndProfile).mockResolvedValue(1);
  });

  it('returns 404 for a profile outside the key org', async () => {
    vi.mocked(getOrganizationMemberIdByOrgAndProfile).mockResolvedValue(null);

    await expect(
      getPublicApiStudentAnalyticsService(ORG_ID, ACTOR_ID, { profileId: PROFILE_ID })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(getOrganizationMemberIdByOrgAndProfile).toHaveBeenCalledWith(ORG_ID, PROFILE_ID);
    expect(getUserAnalytics).not.toHaveBeenCalled();
  });

  it('checks the actor before the profile', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.STUDENT);

    await expect(
      getPublicApiStudentAnalyticsService(ORG_ID, ACTOR_ID, { profileId: PROFILE_ID })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(getOrganizationMemberIdByOrgAndProfile).not.toHaveBeenCalled();
  });

  it('maps the dashboard result to the public shape, cached per org and profile', async () => {
    vi.mocked(getUserAnalytics).mockResolvedValue({
      user: { id: PROFILE_ID, fullName: 'Ade', email: 'ade@test.dev', avatarUrl: '', lastSeen: undefined },
      overallCourseProgress: 50,
      overallAverageGrade: null,
      courses: [
        {
          id: COURSE_ID,
          title: 'Safety',
          type: 'SELF_PACED',
          slug: 'internal-field',
          lessons_count: 2,
          lessons_completed: 1,
          exercises_count: 1,
          exercises_completed: 0,
          progress_percentage: 33,
          progress_failed: false,
          average_grade: null,
          certificateEarnedAt: null,
          complianceStatus: null,
          exercises: [
            {
              id: 'ex-1',
              title: 'Quiz',
              lessonId: null,
              lessonTitle: '',
              status: undefined,
              score: 0,
              totalPoints: 10,
              isCompleted: false
            }
          ]
        }
      ]
    } as never);

    const result = await getPublicApiStudentAnalyticsService(ORG_ID, ACTOR_ID, { profileId: PROFILE_ID });

    expect(cachedRead).toHaveBeenCalledWith('public-api:analytics:student:org-1:profile-1', 600, expect.any(Function));
    expect(getUserAnalytics).toHaveBeenCalledWith(PROFILE_ID, ORG_ID);
    expect(result.user.lastSeen).toBeNull();
    expect(result.courses[0]).toEqual({
      id: COURSE_ID,
      title: 'Safety',
      type: 'SELF_PACED',
      lessonsCount: 2,
      lessonsCompleted: 1,
      exercisesCount: 1,
      exercisesCompleted: 0,
      progressPercentage: 33,
      progressFailed: false,
      averageGrade: null,
      certificateEarnedAt: null,
      complianceStatus: null,
      exercises: [
        {
          id: 'ex-1',
          title: 'Quiz',
          lessonId: null,
          lessonTitle: '',
          status: null,
          score: 0,
          totalPoints: 10,
          isCompleted: false
        }
      ]
    });
  });
});
