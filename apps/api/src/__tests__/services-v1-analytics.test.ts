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
  getOrganizationMemberRoleId: vi.fn(),
  getOrganizationMembersByNormalizedEmails: vi.fn()
}));

vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: vi.fn()
}));

vi.mock('@cio/db/queries/group', () => ({
  isCourseTeamMemberOrOrgAdmin: vi.fn(),
  isUserCourseMemberOrOrgAdmin: vi.fn()
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
  ensureProgramCourseAccess: vi.fn(),
  getCourseAnalytics: vi.fn()
}));

vi.mock('@cio/db/queries/course/people', () => ({ getPaginatedCourseMembers: vi.fn() }));

vi.mock('@api/services/course/compliance', () => ({
  getOrgComplianceOverview: vi.fn()
}));

vi.mock('@api/services/organization', () => ({
  getUserAnalytics: vi.fn()
}));

// Pass-through cache: every read computes, and generatedAt comes from the key so tests can pick the oldest.
vi.mock('@api/utils/redis/cached-read', () => ({
  cachedRead: vi.fn(async (key: string, _ttl: number, compute: () => Promise<unknown>) => ({
    data: await compute(),
    generatedAt: key.includes(':traffic:') ? '2026-09-27T09:00:00.000Z' : '2026-09-27T10:00:00.000Z'
  }))
}));

import { getOrganizationMemberIdByOrgAndProfile, getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import { getCountryBreakdown, getCourseFunnel, getLandingStats, getTopCoursesByViews } from '@api/services/analytics';
import { getOrganisationAnalytics, getStudentLoginActivity } from '@api/services/dash';
import { buildCourseStudentAnalytics, getCourseAnalytics } from '@cio/core/services/course/course';
import { getPaginatedCourseMembers } from '@cio/db/queries/course/people';
import {
  getPublicApiCourseAnalyticsService,
  listPublicApiCourseAnalyticsStudentsService
} from '@api/services/v1/analytics/course';
import {
  getPublicApiOrgAnalyticsService,
  listPublicApiComplianceLearnersService
} from '@api/services/v1/analytics/org';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getOrgComplianceOverview } from '@api/services/course/compliance';
import { getUserAnalytics } from '@api/services/organization';
import { getPublicApiLearnerAnalyticsService } from '@api/services/v1/analytics/learner';
import { cachedRead } from '@api/utils/redis/cached-read';
import { ROLE } from '@cio/utils/constants';

const ORG_ID = 'org-1';
const OTHER_ORG_ID = 'org-2';
const ACTOR_ID = 'actor-1';
const COURSE_ID = 'course-1';
const PROFILE_ID = 'profile-1';
const FIRST_PAGE = { page: 1, limit: 20 };

const orgQuery = (include: string[], overrides: Partial<{ days: number; limit: number }> = {}) =>
  ({ include, days: 30, limit: 5, ...overrides }) as never;

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

describe('public API analytics services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
    vi.mocked(getOrganizationMemberIdByOrgAndProfile).mockResolvedValue(1);
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
    vi.mocked(getLandingStats).mockResolvedValue({ totals: {}, sparkline: [] } as never);
    vi.mocked(getStudentLoginActivity).mockResolvedValue([]);
    vi.mocked(getOrgComplianceOverview).mockResolvedValue(complianceOverview as never);
  });

  describe('GET /analytics', () => {
    it('returns only the requested sections, keyed by section, with the oldest generatedAt', async () => {
      vi.mocked(getOrganisationAnalytics).mockResolvedValue({ topCourses: [], recentCertifications: [] } as never);

      const result = await getPublicApiOrgAnalyticsService(ORG_ID, ACTOR_ID, orgQuery(['overview', 'traffic']));

      expect(Object.keys(result.data)).toEqual(['overview', 'traffic']);
      expect(result.meta).toEqual({
        include: ['overview', 'traffic'],
        days: 30,
        limit: 5,
        omitted: [],
        generatedAt: '2026-09-27T09:00:00.000Z'
      });
    });

    it('lets a tutor read and leaves admin-only sections out, listed in meta.omitted', async () => {
      vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);

      const result = await getPublicApiOrgAnalyticsService(
        ORG_ID,
        ACTOR_ID,
        orgQuery(['traffic', 'loginActivity', 'compliance'])
      );

      expect(Object.keys(result.data)).toEqual(['traffic']);
      expect(result.meta.omitted).toEqual([
        { section: 'loginActivity', reason: 'requires_org_admin' },
        { section: 'compliance', reason: 'requires_org_admin' }
      ]);
      expect(getStudentLoginActivity).not.toHaveBeenCalled();
      expect(getOrgComplianceOverview).not.toHaveBeenCalled();
    });

    it('returns an empty data object with a null generatedAt when every section is omitted', async () => {
      vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);

      const result = await getPublicApiOrgAnalyticsService(ORG_ID, ACTOR_ID, orgQuery(['compliance']));

      expect(result.data).toEqual({});
      expect(result.meta.generatedAt).toBeNull();
    });

    it('gives an admin the admin-only sections, with the compliance summary but not the learner list', async () => {
      const result = await getPublicApiOrgAnalyticsService(ORG_ID, ACTOR_ID, orgQuery(['loginActivity', 'compliance']));

      expect(result.meta.omitted).toEqual([]);
      expect(result.data).toEqual({
        loginActivity: [],
        compliance: { summary: complianceOverview.summary, courses: complianceOverview.courses }
      });
    });

    it.each([
      ['a student', ROLE.STUDENT],
      ['an actor with no active membership', null]
    ])('rejects %s with 403 before reading anything', async (_label, roleId) => {
      vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(roleId);

      await expect(getPublicApiOrgAnalyticsService(ORG_ID, ACTOR_ID, orgQuery(['overview']))).rejects.toMatchObject({
        statusCode: 403
      });
      expect(cachedRead).not.toHaveBeenCalled();
    });

    it('rejects a key without an actor with 401', async () => {
      await expect(getPublicApiOrgAnalyticsService(ORG_ID, null, orgQuery(['overview']))).rejects.toMatchObject({
        statusCode: 401
      });
    });

    it('reads each section once through its own cache key and skips the dashboard cache', async () => {
      await getPublicApiOrgAnalyticsService(
        ORG_ID,
        ACTOR_ID,
        orgQuery(['traffic', 'traffic', 'loginActivity'], { days: 7 })
      );

      expect(cachedRead).toHaveBeenCalledTimes(2);
      expect(cachedRead).toHaveBeenCalledWith('public-api:analytics:traffic:org-1:7', 600, expect.any(Function));
      expect(cachedRead).toHaveBeenCalledWith(
        'public-api:analytics:loginActivity:org-1:7',
        86_400,
        expect.any(Function)
      );
      expect(getLandingStats).toHaveBeenCalledWith(ORG_ID, 7, true);
      expect(getStudentLoginActivity).toHaveBeenCalledWith(ORG_ID, 7, true);
    });

    it('applies limit to list sections after the read, without putting it in the cache key', async () => {
      const rows = (n: number) => Array.from({ length: n }, (_, index) => ({ id: index }));
      vi.mocked(getOrganisationAnalytics).mockResolvedValue({
        totalStudents: 9,
        topCourses: rows(5),
        recentCertifications: rows(5)
      } as never);
      vi.mocked(getCountryBreakdown).mockResolvedValue(rows(20) as never);
      vi.mocked(getTopCoursesByViews).mockResolvedValue(rows(10) as never);

      const result = await getPublicApiOrgAnalyticsService(
        ORG_ID,
        ACTOR_ID,
        orgQuery(['overview', 'countries', 'topCourses'], { limit: 2 })
      );
      const data = result.data as Record<string, any>;

      expect(data.overview).toEqual({ totalStudents: 9, topCourses: rows(2), recentCertifications: rows(2) });
      expect(data.countries).toHaveLength(2);
      expect(data.topCourses).toHaveLength(2);
      expect(cachedRead).toHaveBeenCalledWith('public-api:analytics:countries:org-1:30', 600, expect.any(Function));
    });

    it('builds the org-wide funnel without a course filter', async () => {
      vi.mocked(getCourseFunnel).mockResolvedValue({ steps: [] });

      await getPublicApiOrgAnalyticsService(ORG_ID, ACTOR_ID, orgQuery(['funnel']));

      expect(getCourseFunnel).toHaveBeenCalledWith(ORG_ID, 30, undefined, true);
    });
  });

  describe('compliance learners', () => {
    it('rejects an org tutor with 403, matching orgAdminMiddleware', async () => {
      vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);

      await expect(listPublicApiComplianceLearnersService(ORG_ID, ACTOR_ID, FIRST_PAGE)).rejects.toMatchObject({
        statusCode: 403
      });
      expect(getOrgComplianceOverview).not.toHaveBeenCalled();
    });

    it('paginates from the same cache entry as the compliance section', async () => {
      const result = await listPublicApiComplianceLearnersService(ORG_ID, ACTOR_ID, { page: 2, limit: 2 });

      expect(result.items).toEqual([{ groupMemberId: 'gm-3' }]);
      expect(result.pagination).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
      expect(cachedRead).toHaveBeenCalledWith('public-api:analytics:compliance:org-1', 600, expect.any(Function));
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

      const result = await getPublicApiLearnerAnalyticsService(ORG_ID, ACTOR_ID, { profileId: PROFILE_ID });

      expect(cachedRead).toHaveBeenCalledWith(
        'public-api:analytics:learner:org-1:profile-1',
        600,
        expect.any(Function)
      );
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
    const summaryQuery = { include: ['summary'], days: 30 } as never;

    it('returns 404 for a course in another org before checking the actor', async () => {
      vi.mocked(getCourseOrganizationId).mockResolvedValue(OTHER_ORG_ID);

      await expect(
        getPublicApiCourseAnalyticsService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID }, summaryQuery)
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(isCourseTeamMemberOrOrgAdmin).not.toHaveBeenCalled();
      expect(getCourseAnalytics).not.toHaveBeenCalled();
    });

    it('rejects an actor who is not a course tutor/admin or org admin with 403', async () => {
      vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);

      await expect(
        getPublicApiCourseAnalyticsService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID }, summaryQuery)
      ).rejects.toMatchObject({ statusCode: 403 });
      expect(isCourseTeamMemberOrOrgAdmin).toHaveBeenCalledWith(COURSE_ID, ACTOR_ID);
      expect(getCourseAnalytics).not.toHaveBeenCalled();
    });

    it('returns the summary without the student list, and the course funnel', async () => {
      vi.mocked(getCourseAnalytics).mockResolvedValue({
        totalTutors: 1,
        totalStudents: 3,
        totalLessons: 2,
        totalExercises: 1,
        lessonCompletionRate: 33,
        exerciseCompletionRate: 0,
        averageGrade: 0,
        students: [student('p-a', 'Ade')]
      } as never);
      vi.mocked(getCourseFunnel).mockResolvedValue({ steps: [] });

      const result = await getPublicApiCourseAnalyticsService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID }, {
        include: ['summary', 'funnel'],
        days: 7
      } as never);

      expect(result.data).toEqual({
        summary: {
          totalTutors: 1,
          totalStudents: 3,
          totalLessons: 2,
          totalExercises: 1,
          averageProgress: 33,
          averageExerciseCompletion: 0,
          averageGrade: 0
        },
        funnel: { steps: [] }
      });
      expect(getCourseFunnel).toHaveBeenCalledWith(ORG_ID, 7, COURSE_ID, true);
      expect(cachedRead).toHaveBeenCalledWith(
        'public-api:analytics:course-summary:course-1',
        600,
        expect.any(Function)
      );
      expect(cachedRead).toHaveBeenCalledWith(
        'public-api:analytics:course-funnel:course-1:7',
        600,
        expect.any(Function)
      );
    });

    it('pages students by name in the database and computes stats for that page only', async () => {
      const member = (profileId: string, fullname: string | null) => ({ profileId, profile: { fullname } });
      vi.mocked(getPaginatedCourseMembers).mockResolvedValue({
        items: [member('p-b', 'Bola'), member('p-z', null)],
        page: 2,
        limit: 2,
        total: 4,
        totalPages: 2
      } as never);
      vi.mocked(buildCourseStudentAnalytics).mockImplementation(async (_courseId, pageMembers) =>
        pageMembers.map((pageMember) => student(pageMember.profileId!, pageMember.profile?.fullname || 'Unknown'))
      );

      const secondPage = await listPublicApiCourseAnalyticsStudentsService(
        ORG_ID,
        ACTOR_ID,
        { courseId: COURSE_ID },
        { page: 2, limit: 2 }
      );

      expect(cachedRead).toHaveBeenCalledWith(
        'public-api:analytics:course-students:course-1:2:2',
        600,
        expect.any(Function)
      );
      expect(getCourseAnalytics).not.toHaveBeenCalled();
      expect(getPaginatedCourseMembers).toHaveBeenCalledWith(COURSE_ID, {
        page: 2,
        limit: 2,
        roleId: ROLE.STUDENT,
        membership: 'joined',
        sortBy: 'name',
        sortOrder: 'asc'
      });
      expect(buildCourseStudentAnalytics).toHaveBeenCalledTimes(1);
      expect(vi.mocked(buildCourseStudentAnalytics).mock.calls[0][2]).toEqual({ failOnError: true });
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
      expect(getPaginatedCourseMembers).not.toHaveBeenCalled();
    });

    it('fails the page when a student\x27s stats cannot be loaded', async () => {
      vi.mocked(getPaginatedCourseMembers).mockResolvedValue({
        items: [{ profileId: 'p-a', profile: { fullname: 'Ade' } }],
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1
      } as never);
      vi.mocked(buildCourseStudentAnalytics).mockRejectedValue(new Error('stats failed'));

      await expect(
        listPublicApiCourseAnalyticsStudentsService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID }, FIRST_PAGE)
      ).rejects.toThrow('stats failed');
    });
  });
});
