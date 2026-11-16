import type {
  TPublicApiOrganizationOverviewQuery,
  TPublicApiOrganizationOverviewSection
} from '@cio/utils/validation/public-api';
import {
  PUBLIC_API_ANALYTICS_TTL_SECONDS,
  PUBLIC_API_LOGIN_ACTIVITY_TTL_SECONDS,
  publicApiAnalyticsKey
} from '@api/utils/redis/key-generators';
import { cachedRead, type CachedRead } from '@api/utils/redis/cached-read';
import { getOrganizationOverview, getStudentLoginActivity } from '@api/services/dash';
import { assertOrgTeamMember } from '@api/services/v1/shared';
import { ROLE } from '@cio/utils/constants';

const ADMIN_ONLY_SECTIONS: ReadonlySet<TPublicApiOrganizationOverviewSection> = new Set(['loginActivity']);

/**
 * The public API keeps its own cache entry per section and skips the dashboard's (bustCache), so `generatedAt` is
 * the real compute time. `limit` trims lists after the read, so it never adds cache keys.
 */
async function readSection(
  orgId: string,
  section: TPublicApiOrganizationOverviewSection,
  days: number,
  limit: number
): Promise<CachedRead<unknown>> {
  switch (section) {
    case 'summary': {
      const key = publicApiAnalyticsKey(section, orgId);
      const entry = await cachedRead(key, PUBLIC_API_ANALYTICS_TTL_SECONDS, () =>
        getOrganizationOverview(orgId, undefined, true)
      );
      const { topCourses, recentCertifications, ...totals } = entry.data;

      return {
        ...entry,
        data: {
          ...totals,
          topCourses: topCourses.slice(0, limit),
          recentCertifications: recentCertifications.slice(0, limit)
        }
      };
    }
    case 'loginActivity': {
      const key = publicApiAnalyticsKey(section, orgId, days);

      return cachedRead(key, PUBLIC_API_LOGIN_ACTIVITY_TTL_SECONDS, () => getStudentLoginActivity(orgId, days, true));
    }
  }
}

/**
 * Org overview, one cached read per requested section. Mirrors `orgTeamMemberMiddleware`; the admin-only login
 * activity is left out for tutors and listed in `meta.omitted`.
 */
export async function getPublicApiOrganizationOverviewService(
  orgId: string,
  actorId: string | null,
  query: TPublicApiOrganizationOverviewQuery
) {
  const roleId = await assertOrgTeamMember(orgId, actorId);

  const include = [...new Set(query.include)];
  const allowed = roleId === ROLE.ADMIN ? include : include.filter((section) => !ADMIN_ONLY_SECTIONS.has(section));
  const omitted = include
    .filter((section) => !allowed.includes(section))
    .map((section) => ({ section, reason: 'requires_org_admin' as const }));

  const entries = await Promise.all(allowed.map((section) => readSection(orgId, section, query.days, query.limit)));

  return {
    data: Object.fromEntries(allowed.map((section, index) => [section, entries[index].data])),
    meta: {
      include,
      days: query.days,
      limit: query.limit,
      omitted,
      generatedAt: entries.map((entry) => entry.generatedAt).sort()[0] ?? null
    }
  };
}
