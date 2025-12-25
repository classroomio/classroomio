import { classroomio, getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ params, parent, cookies }) => {
  const { org } = await parent();
  const siteName = params.slug;

  // Fetch dashboard stats
  const statsResponse = await classroomio.dash.stats.$get({ query: { siteName } }, getApiHeaders(cookies, org?.id));

  const statsData = await statsResponse.json();

  return {
    orgName: siteName,
    org,
    stats: statsData.success ? statsData.data : null
  };
};
