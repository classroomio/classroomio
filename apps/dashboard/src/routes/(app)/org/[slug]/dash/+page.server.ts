import type { DashStatsSuccess, LoginActivityData, LoginActivitySuccess } from '$features/org/utils/types';
import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { type ServerApiResult, safeServerApi } from '$lib/utils/services/api/server';

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

  const [statsResult, loginActivityResult] = await Promise.allSettled([
    safeServerApi<DashStatsSuccess>(() =>
      classroomio.dash.stats.$get({ query: { siteName } }, getApiHeaders(cookies, orgId))
    ),
    safeServerApi<LoginActivitySuccess>(() =>
      classroomio.dash['login-activity'].$get({ query: { orgId } }, getApiHeaders(cookies, orgId))
    )
  ]);

  const stats = statsResult.status === 'fulfilled' && statsResult.value.ok ? statsResult.value.body.data : null;

  return {
    orgName: siteName,
    stats,
    loginActivity: loginActivityDataFromSettled(loginActivityResult)
  };
};
