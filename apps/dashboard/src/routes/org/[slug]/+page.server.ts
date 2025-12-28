import { classroomio, getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ params, parent, cookies }) => {
  const { orgId } = await parent();
  const siteName = params.slug;

  // Fetch dashboard stats
  const statsResponse = await classroomio.dash.stats.$get({ query: { siteName } }, getApiHeaders(cookies, orgId));

  const statsData = await statsResponse.json();

  return {
    orgName: siteName,
    stats: statsData.success ? statsData.data : null
  };
};
