import type { DashStatsSuccess, LoginActivityData, LoginActivitySuccess } from '$features/org/utils/types';
import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { type ServerApiResult, safeServerApi } from '$lib/utils/services/api/server';

// TODO - Replace with actual cache
const cache: Record<string, DashStatsSuccess['data'] | null> = {};

function loginActivityDataFromSettled(
  result: PromiseSettledResult<ServerApiResult<LoginActivitySuccess>>
): LoginActivityData {
  if (result.status === 'rejected') return [];
  if (!result.value.ok) return [];

  return result.value.body.data;
}

export const load = async ({ params, parent, cookies }) => {
  const { orgId } = await parent();
  const siteName = params.slug;

  if (!orgId) {
    return {
      orgName: siteName,
      stats: null,
      loginActivity: [] as LoginActivityData
    };
  }

  if (orgId in cache) {
    const loginActivityResult = await safeServerApi<LoginActivitySuccess>(() =>
      classroomio.dash['login-activity'].$get({ query: { orgId } }, getApiHeaders(cookies, orgId))
    );

    return {
      orgName: siteName,
      stats: cache[orgId],
      loginActivity: loginActivityResult.ok ? loginActivityResult.body.data : []
    };
  }

  const [statsResult, loginActivityResult] = await Promise.allSettled([
    safeServerApi<DashStatsSuccess>(() =>
      classroomio.dash.stats.$get({ query: { siteName } }, getApiHeaders(cookies, orgId))
    ),
    safeServerApi<LoginActivitySuccess>(() =>
      classroomio.dash['login-activity'].$get({ query: { orgId } }, getApiHeaders(cookies, orgId))
    )
  ]);

  cache[orgId] = statsResult.status === 'fulfilled' && statsResult.value.ok ? statsResult.value.body.data : null;

  return {
    orgName: siteName,
    stats: cache[orgId],
    loginActivity: loginActivityDataFromSettled(loginActivityResult)
  };
};
