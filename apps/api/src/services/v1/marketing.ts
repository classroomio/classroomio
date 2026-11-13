import type {
  TPublicApiCourseMarketingQuery,
  TPublicApiCourseParam,
  TPublicApiMarketingQuery,
  TPublicApiMarketingSection
} from '@cio/utils/validation/public-api';
import { PUBLIC_API_ANALYTICS_TTL_SECONDS, publicApiAnalyticsKey } from '@api/utils/redis/key-generators';
import {
  assertCourseBelongsToOrganization,
  assertCourseTeamMemberOrOrgAdmin,
  assertOrgTeamMember
} from '@api/services/v1/shared';
import { cachedRead, type CachedRead } from '@api/utils/redis/cached-read';
import {
  getCountryBreakdown,
  getCourseFunnel,
  getLandingStats,
  getPopularTypes,
  getTopCoursesByViews
} from '@api/services/marketing';

const TTL = PUBLIC_API_ANALYTICS_TTL_SECONDS;

/**
 * The public API keeps its own cache entry per section and skips the dashboard's (bustCache), so `generatedAt` is
 * the real compute time. `limit` trims lists after the read, so it never adds cache keys.
 */
function readSection(
  orgId: string,
  section: TPublicApiMarketingSection,
  days: number,
  limit: number
): Promise<CachedRead<unknown>> {
  const key = publicApiAnalyticsKey(section, orgId, days);

  switch (section) {
    case 'traffic':
      return cachedRead(key, TTL, () => getLandingStats(orgId, days, true));
    case 'countries':
      return cachedRead(key, TTL, async () => (await getCountryBreakdown(orgId, days, true)).slice(0, limit));
    case 'funnel':
      return cachedRead(key, TTL, () => getCourseFunnel(orgId, days, undefined, true));
    case 'courseTypes':
      return cachedRead(key, TTL, () => getPopularTypes(orgId, days, true));
    case 'topCourses':
      return cachedRead(key, TTL, async () => (await getTopCoursesByViews(orgId, days, true)).slice(0, limit));
  }
}

/** Marketing analytics, one cached read per requested section. Mirrors `orgTeamMemberMiddleware`. */
export async function getPublicApiMarketingAnalyticsService(
  orgId: string,
  actorId: string | null,
  query: TPublicApiMarketingQuery
) {
  await assertOrgTeamMember(orgId, actorId);

  const include = [...new Set(query.include)];
  const entries = await Promise.all(include.map((section) => readSection(orgId, section, query.days, query.limit)));

  return {
    data: Object.fromEntries(include.map((section, index) => [section, entries[index].data])),
    meta: {
      include,
      days: query.days,
      limit: query.limit,
      generatedAt: entries.map((entry) => entry.generatedAt).sort()[0] ?? null
    }
  };
}

/** One course's funnel. Mirrors `courseTeamMemberMiddleware`. */
export async function getPublicApiCourseMarketingService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  query: TPublicApiCourseMarketingQuery
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertCourseTeamMemberOrOrgAdmin(params.courseId, actorId);

  const entry = await cachedRead(publicApiAnalyticsKey('course-funnel', params.courseId, query.days), TTL, () =>
    getCourseFunnel(orgId, query.days, params.courseId, true)
  );

  return { data: entry.data, meta: { days: query.days, generatedAt: entry.generatedAt } };
}
