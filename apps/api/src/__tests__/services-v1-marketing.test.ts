import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberRoleId: vi.fn(),
  getOrganizationMemberIdByOrgAndProfile: vi.fn(),
  getOrganizationMembersByNormalizedEmails: vi.fn()
}));

vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: vi.fn()
}));

vi.mock('@cio/db/queries/group', () => ({
  isCourseTeamMemberOrOrgAdmin: vi.fn()
}));

vi.mock('@cio/db/queries/cohort', () => ({
  getCohortMemberByProfileId: vi.fn(),
  getCohortMemberRole: vi.fn(),
  getCohortOrganizationId: vi.fn(),
  isCohortMember: vi.fn(),
  isOrgAdminByCohortId: vi.fn()
}));

vi.mock('@api/services/marketing', () => ({
  getCountryBreakdown: vi.fn(),
  getCourseFunnel: vi.fn(),
  getLandingStats: vi.fn(),
  getPopularTypes: vi.fn(),
  getTopCoursesByViews: vi.fn()
}));

vi.mock('@api/utils/redis/cached-read', () => ({
  cachedRead: vi.fn(async (key: string, _ttl: number, compute: () => Promise<unknown>) => ({
    data: await compute(),
    generatedAt: key.includes(':traffic:') ? '2026-09-27T09:00:00.000Z' : '2026-09-27T10:00:00.000Z'
  }))
}));

import { getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import {
  getCountryBreakdown,
  getCourseFunnel,
  getLandingStats,
  getPopularTypes,
  getTopCoursesByViews
} from '@api/services/marketing';
import { getPublicApiCourseMarketingService, getPublicApiMarketingAnalyticsService } from '@api/services/v1/marketing';
import { cachedRead } from '@api/utils/redis/cached-read';
import { ROLE } from '@cio/utils/constants';

const ORG_ID = 'org-1';
const OTHER_ORG_ID = 'org-2';
const ACTOR_ID = 'actor-1';
const COURSE_ID = 'course-1';

const marketingQuery = (include: string[], overrides: Partial<{ days: number; limit: number }> = {}) =>
  ({ include, days: 30, limit: 5, ...overrides }) as never;

const rows = (count: number) => Array.from({ length: count }, (_, index) => ({ id: index }));

describe('public API marketing services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
    vi.mocked(getLandingStats).mockResolvedValue({ totals: {}, sparkline: [] } as never);
    vi.mocked(getCountryBreakdown).mockResolvedValue([]);
    vi.mocked(getPopularTypes).mockResolvedValue([]);
    vi.mocked(getTopCoursesByViews).mockResolvedValue([]);
    vi.mocked(getCourseFunnel).mockResolvedValue({ steps: [] });
  });

  describe('GET /analytics/marketing', () => {
    it('returns only the requested sections, keyed by section, with the oldest generatedAt', async () => {
      const result = await getPublicApiMarketingAnalyticsService(
        ORG_ID,
        ACTOR_ID,
        marketingQuery(['topCourses', 'traffic'])
      );

      expect(Object.keys(result.data)).toEqual(['topCourses', 'traffic']);
      expect(result.meta).toEqual({
        include: ['topCourses', 'traffic'],
        days: 30,
        limit: 5,
        generatedAt: '2026-09-27T09:00:00.000Z'
      });
      expect(result.meta).not.toHaveProperty('omitted');
    });

    it('lets an org tutor read every section', async () => {
      vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);

      const result = await getPublicApiMarketingAnalyticsService(
        ORG_ID,
        ACTOR_ID,
        marketingQuery(['traffic', 'countries', 'funnel', 'courseTypes', 'topCourses'])
      );

      expect(Object.keys(result.data)).toEqual(['traffic', 'countries', 'funnel', 'courseTypes', 'topCourses']);
    });

    it.each([
      ['a student', ROLE.STUDENT],
      ['an actor with no active membership', null]
    ])('rejects %s with 403 before reading anything', async (_label, roleId) => {
      vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(roleId);

      await expect(
        getPublicApiMarketingAnalyticsService(ORG_ID, ACTOR_ID, marketingQuery(['traffic']))
      ).rejects.toMatchObject({ statusCode: 403 });
      expect(cachedRead).not.toHaveBeenCalled();
    });

    it('rejects a key without an actor with 401', async () => {
      await expect(
        getPublicApiMarketingAnalyticsService(ORG_ID, null, marketingQuery(['traffic']))
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('reads each section once through its own cache key and skips the dashboard cache', async () => {
      await getPublicApiMarketingAnalyticsService(
        ORG_ID,
        ACTOR_ID,
        marketingQuery(['traffic', 'traffic', 'courseTypes'], { days: 7 })
      );

      expect(cachedRead).toHaveBeenCalledTimes(2);
      expect(cachedRead).toHaveBeenCalledWith('public-api:analytics:traffic:org-1:7', 600, expect.any(Function));
      expect(cachedRead).toHaveBeenCalledWith('public-api:analytics:courseTypes:org-1:7', 600, expect.any(Function));
      expect(getLandingStats).toHaveBeenCalledWith(ORG_ID, 7, true);
      expect(getPopularTypes).toHaveBeenCalledWith(ORG_ID, 7, true);
    });

    it('applies limit to list sections after the read, without putting it in the cache key', async () => {
      vi.mocked(getCountryBreakdown).mockResolvedValue(rows(20) as never);
      vi.mocked(getTopCoursesByViews).mockResolvedValue(rows(10) as never);

      const result = await getPublicApiMarketingAnalyticsService(
        ORG_ID,
        ACTOR_ID,
        marketingQuery(['countries', 'topCourses'], { limit: 2 })
      );
      const data = result.data as Record<string, unknown[]>;

      expect(data.countries).toHaveLength(2);
      expect(data.topCourses).toHaveLength(2);
      expect(cachedRead).toHaveBeenCalledWith('public-api:analytics:countries:org-1:30', 600, expect.any(Function));
    });

    it('builds the org-wide funnel without a course filter', async () => {
      await getPublicApiMarketingAnalyticsService(ORG_ID, ACTOR_ID, marketingQuery(['funnel']));

      expect(getCourseFunnel).toHaveBeenCalledWith(ORG_ID, 30, undefined, true);
    });
  });

  describe('GET /analytics/marketing/courses/:courseId', () => {
    const courseQuery = { days: 7 } as never;

    it('returns 404 for a course in another org before checking the actor', async () => {
      vi.mocked(getCourseOrganizationId).mockResolvedValue(OTHER_ORG_ID);

      await expect(
        getPublicApiCourseMarketingService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID }, courseQuery)
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(isCourseTeamMemberOrOrgAdmin).not.toHaveBeenCalled();
      expect(getCourseFunnel).not.toHaveBeenCalled();
    });

    it('rejects an actor who is not a course tutor/admin or org admin with 403', async () => {
      vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);

      await expect(
        getPublicApiCourseMarketingService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID }, courseQuery)
      ).rejects.toMatchObject({ statusCode: 403 });
      expect(isCourseTeamMemberOrOrgAdmin).toHaveBeenCalledWith(COURSE_ID, ACTOR_ID);
      expect(getCourseFunnel).not.toHaveBeenCalled();
    });

    it('returns the course funnel as data with days and generatedAt in meta', async () => {
      const funnel = { steps: [{ name: 'course_page_view', count: 4, conversionFromPrev: null }] };
      vi.mocked(getCourseFunnel).mockResolvedValue(funnel as never);

      const result = await getPublicApiCourseMarketingService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID }, courseQuery);

      expect(result).toEqual({ data: funnel, meta: { days: 7, generatedAt: '2026-09-27T10:00:00.000Z' } });
      expect(getCourseFunnel).toHaveBeenCalledWith(ORG_ID, 7, COURSE_ID, true);
      expect(cachedRead).toHaveBeenCalledWith(
        'public-api:analytics:course-funnel:course-1:7',
        600,
        expect.any(Function)
      );
    });
  });
});
