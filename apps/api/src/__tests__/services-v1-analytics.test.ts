import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/cohort', () => ({
  getCohortMemberByProfileId: vi.fn(),
  getCohortMemberRole: vi.fn(),
  getCohortOrganizationId: vi.fn(),
  isCohortMember: vi.fn(),
  isOrgAdminByCohortId: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberIdByOrgAndProfile: vi.fn(),
  getOrganizationMemberRoleId: vi.fn()
}));

vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: vi.fn()
}));

vi.mock('@cio/db/queries/group', () => ({
  isCourseTeamMemberOrOrgAdmin: vi.fn()
}));

vi.mock('@api/services/analytics', () => ({
  getCountryBreakdown: vi.fn(),
  getCourseFunnel: vi.fn(),
  getLandingStats: vi.fn(),
  getPopularTypes: vi.fn(),
  getTopCoursesByViews: vi.fn()
}));

vi.mock('@api/services/dash', () => ({
  getOrganisationAnalytics: vi.fn(),
  getStudentLoginActivity: vi.fn()
}));

vi.mock('@cio/core/services/course/course', () => ({
  buildCourseStudentAnalytics: vi.fn(),
  getCourseAnalytics: vi.fn(),
  listCourseAnalyticsStudents: vi.fn()
}));

vi.mock('@api/services/course/compliance', () => ({
  getOrgComplianceOverview: vi.fn()
}));

vi.mock('@api/services/organization', () => ({
  getUserAnalytics: vi.fn()
}));

import { getOrganizationMemberIdByOrgAndProfile, getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getCourseFunnel, getLandingStats } from '@api/services/analytics';
import { getOrganisationAnalytics, getStudentLoginActivity } from '@api/services/dash';
import {
  buildCourseStudentAnalytics,
  getCourseAnalytics,
  listCourseAnalyticsStudents
} from '@cio/core/services/course/course';
import { getOrgComplianceOverview } from '@api/services/course/compliance';
import { getUserAnalytics } from '@api/services/organization';
import { ROLE } from '@cio/utils/constants';
import {
  getPublicApiAnalyticsFunnelService,
  getPublicApiAnalyticsOverviewService,
  getPublicApiAnalyticsTrafficService,
  getPublicApiComplianceOverviewService,
  getPublicApiCourseAnalyticsService,
  getPublicApiLearnerAnalyticsService,
  getPublicApiLoginActivityService,
  listPublicApiComplianceLearnersService,
  listPublicApiCourseAnalyticsStudentsService
} from '@api/services/v1/analytics';

const ORG_ID = 'org-1';
const OTHER_ORG_ID = 'org-2';
const ACTOR_ID = 'actor-1';
const COURSE_ID = 'course-1';
const PROFILE_ID = 'profile-1';
const FIRST_PAGE = { page: 1, limit: 20 };

const complianceOverview = {
  summary: { totalLearners: 2, totalCourses: 1, counts: {} },
  courses: [{ courseId: COURSE_ID, courseTitle: 'Safety', learnerCount: 2, counts: {} }],
  learners: [{ groupMemberId: 'gm-1' }, { groupMemberId: 'gm-2' }, { groupMemberId: 'gm-3' }]
};

const student = (id: string, fullname: string) => ({
  id,
  profile: { fullname, email: `${id}@test.dev`, avatar_url: '' },
  lessonsCompleted: 1,
  totalLessons: 2,
  exercisesSubmitted: 0,
  totalExercises: 1,
  averageGrade: 0,
  lastSeen: undefined,
  progressPercentage: 33
});

const courseAnalytics = {
  totalTutors: 1,
  totalStudents: 3,
  totalLessons: 2,
  totalExercises: 1,
  lessonCompletionRate: 33,
  exerciseCompletionRate: 0,
  averageGrade: 0,
  students: [student('p-b', 'Bola'), student('p-a2', 'Ade'), student('p-a1', 'Ade')]
};

describe('public API analytics services', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
    vi.mocked(getOrganizationMemberIdByOrgAndProfile).mockResolvedValue(1);
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
  });

  describe('org team reads (overview, traffic, countries, funnel, course types, top courses)', () => {
    it('lets an org tutor read, scoped to the key org', async () => {
      vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);
      vi.mocked(getLandingStats).mockResolvedValue({ totals: {}, sparkline: [] } as never);

      await getPublicApiAnalyticsTrafficService(ORG_ID, ACTOR_ID, { days: 7 });

      expect(getOrganizationMemberRoleId).toHaveBeenCalledWith(ORG_ID, ACTOR_ID);
      expect(getLandingStats).toHaveBeenCalledWith(ORG_ID, 7);
    });

    it('never forces a cache bust', async () => {
      vi.mocked(getOrganisationAnalytics).mockResolvedValue({} as never);

      await getPublicApiAnalyticsOverviewService(ORG_ID, ACTOR_ID);

      expect(getOrganisationAnalytics).toHaveBeenCalledWith(ORG_ID);
    });

    it('rejects a student actor with 403, stricter than the dashboard route', async () => {
      vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.STUDENT);

      await expect(getPublicApiAnalyticsOverviewService(ORG_ID, ACTOR_ID)).rejects.toMatchObject({ statusCode: 403 });
      expect(getOrganisationAnalytics).not.toHaveBeenCalled();
    });

    it('rejects an actor outside the org with 403', async () => {
      vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(null);

      await expect(getPublicApiAnalyticsTrafficService(ORG_ID, ACTOR_ID, { days: 30 })).rejects.toMatchObject({
        statusCode: 403
      });
    });

    it('rejects a key without an actor with 401', async () => {
      await expect(getPublicApiAnalyticsOverviewService(ORG_ID, null)).rejects.toMatchObject({ statusCode: 401 });
    });

    it('returns 404 for a funnel courseId from another org', async () => {
      vi.mocked(getCourseOrganizationId).mockResolvedValue(OTHER_ORG_ID);

      await expect(
        getPublicApiAnalyticsFunnelService(ORG_ID, ACTOR_ID, { days: 30, courseId: COURSE_ID })
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(getCourseFunnel).not.toHaveBeenCalled();
    });

    it('builds the org-wide funnel without a course check', async () => {
      vi.mocked(getCourseFunnel).mockResolvedValue({ steps: [] });

      await getPublicApiAnalyticsFunnelService(ORG_ID, ACTOR_ID, { days: 30 });

      expect(getCourseOrganizationId).not.toHaveBeenCalled();
      expect(getCourseFunnel).toHaveBeenCalledWith(ORG_ID, 30, undefined);
    });
  });

  describe('org admin reads (login activity, compliance)', () => {
    it('rejects an org tutor with 403, matching orgAdminMiddleware', async () => {
      vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);

      await expect(getPublicApiLoginActivityService(ORG_ID, ACTOR_ID, { days: 90 })).rejects.toMatchObject({
        statusCode: 403
      });
      await expect(getPublicApiComplianceOverviewService(ORG_ID, ACTOR_ID)).rejects.toMatchObject({
        statusCode: 403
      });
      expect(getStudentLoginActivity).not.toHaveBeenCalled();
      expect(getOrgComplianceOverview).not.toHaveBeenCalled();
    });

    it('returns the compliance summary without the learner list', async () => {
      vi.mocked(getOrgComplianceOverview).mockResolvedValue(complianceOverview as never);

      const result = await getPublicApiComplianceOverviewService(ORG_ID, ACTOR_ID);

      expect(result).toEqual({ summary: complianceOverview.summary, courses: complianceOverview.courses });
    });

    it('paginates compliance learners', async () => {
      vi.mocked(getOrgComplianceOverview).mockResolvedValue(complianceOverview as never);

      const result = await listPublicApiComplianceLearnersService(ORG_ID, ACTOR_ID, { page: 2, limit: 2 });

      expect(result.items).toEqual([{ groupMemberId: 'gm-3' }]);
      expect(result.pagination).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
    });
  });

  describe('learner analytics', () => {
    it('returns 404 for a profile outside the key org', async () => {
      vi.mocked(getOrganizationMemberIdByOrgAndProfile).mockResolvedValue(null);

      await expect(
        getPublicApiLearnerAnalyticsService(ORG_ID, ACTOR_ID, { profileId: PROFILE_ID })
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(getOrganizationMemberIdByOrgAndProfile).toHaveBeenCalledWith(ORG_ID, PROFILE_ID);
      expect(getUserAnalytics).not.toHaveBeenCalled();
    });

    it('checks the actor before the profile', async () => {
      vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.STUDENT);

      await expect(
        getPublicApiLearnerAnalyticsService(ORG_ID, ACTOR_ID, { profileId: PROFILE_ID })
      ).rejects.toMatchObject({ statusCode: 403 });
      expect(getOrganizationMemberIdByOrgAndProfile).not.toHaveBeenCalled();
    });

    it('maps the dashboard result to the public shape', async () => {
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

      const result = await getPublicApiLearnerAnalyticsService(ORG_ID, ACTOR_ID, { profileId: PROFILE_ID });

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

  describe('course analytics', () => {
    it('returns 404 for a course in another org before checking the actor', async () => {
      vi.mocked(getCourseOrganizationId).mockResolvedValue(OTHER_ORG_ID);

      await expect(getPublicApiCourseAnalyticsService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID })).rejects.toMatchObject(
        {
          statusCode: 404
        }
      );
      expect(isCourseTeamMemberOrOrgAdmin).not.toHaveBeenCalled();
      expect(getCourseAnalytics).not.toHaveBeenCalled();
    });

    it('rejects an actor who is not a course tutor/admin or org admin with 403', async () => {
      vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);

      await expect(getPublicApiCourseAnalyticsService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID })).rejects.toMatchObject(
        {
          statusCode: 403
        }
      );
      expect(isCourseTeamMemberOrOrgAdmin).toHaveBeenCalledWith(COURSE_ID, ACTOR_ID);
      expect(getCourseAnalytics).not.toHaveBeenCalled();
    });

    it('returns aggregates without the student list', async () => {
      vi.mocked(getCourseAnalytics).mockResolvedValue(courseAnalytics as never);

      const result = await getPublicApiCourseAnalyticsService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID });

      expect(result).toEqual({
        totalTutors: 1,
        totalStudents: 3,
        totalLessons: 2,
        totalExercises: 1,
        averageProgress: 33,
        averageExerciseCompletion: 0,
        averageGrade: 0
      });
    });

    it('orders students by name then profile id and computes stats for the requested page only', async () => {
      const member = (profileId: string, fullname: string | null) => ({ profileId, profile: { fullname } });
      vi.mocked(listCourseAnalyticsStudents).mockResolvedValue([
        member('p-b', 'Bola'),
        member('p-a2', 'Ade'),
        member('p-a1', 'Ade'),
        member('p-z', null)
      ] as never);
      vi.mocked(buildCourseStudentAnalytics).mockImplementation(async (_courseId, pageMembers) =>
        pageMembers.map((pageMember) => student(pageMember.profileId!, pageMember.profile?.fullname || 'Unknown'))
      );

      const secondPage = await listPublicApiCourseAnalyticsStudentsService(
        ORG_ID,
        ACTOR_ID,
        { courseId: COURSE_ID },
        { page: 2, limit: 2 }
      );

      expect(getCourseAnalytics).not.toHaveBeenCalled();
      expect(buildCourseStudentAnalytics).toHaveBeenCalledTimes(1);
      expect(vi.mocked(buildCourseStudentAnalytics).mock.calls[0][1].map((row) => row.profileId)).toEqual([
        'p-b',
        'p-z'
      ]);
      expect(secondPage.items.map((row) => row.profileId)).toEqual(['p-b', 'p-z']);
      expect(secondPage.pagination).toEqual({ page: 2, limit: 2, total: 4, totalPages: 2 });
      expect(secondPage.items[0]).toMatchObject({ fullname: 'Bola', avatarUrl: '', lastSeen: null });
    });

    it('checks course access before listing students', async () => {
      vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);

      await expect(
        listPublicApiCourseAnalyticsStudentsService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID }, FIRST_PAGE)
      ).rejects.toMatchObject({ statusCode: 403 });
      expect(listCourseAnalyticsStudents).not.toHaveBeenCalled();
    });
  });
});
