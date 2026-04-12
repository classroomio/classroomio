import type { DashStatsSuccess } from '$features/org/utils/types';
import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';

// TODO - Replace with actual cache
const cache: Record<string, DashStatsSuccess['data'] | null> = {};

export const load = async ({ params, parent, cookies }) => {
  const { orgId } = await parent();
  const siteName = params.slug;

  if (!orgId) {
    return {
      orgName: siteName,
      stats: null
    };
  }

  if (orgId in cache) {
    return {
      orgName: siteName,
      stats: cache[orgId]
    };
  }

  try {
    const result = await safeServerApi<DashStatsSuccess>(() =>
      classroomio.dash.stats.$get({ query: { siteName } }, getApiHeaders(cookies, orgId))
    );
    cache[orgId] = result.ok ? result.body.data : null;
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    cache[orgId] = null;
  }

  return {
    orgName: siteName,
    stats: cache[orgId]
  };
};
