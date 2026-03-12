import { classroomio, getApiHeaders } from '$lib/utils/services/api';

// TODO - Replace with actual cache
const cache = {};

export const load = async ({ params, parent, cookies }) => {
  const { orgId } = await parent();
  const siteName = params.slug;

  if (!orgId) {
    return {
      orgName: siteName,
      stats: null
    };
  }
  console.log('cache', cache);
  console.log('orgId', orgId);
  console.log('siteName', siteName);

  if (cache[orgId]) {
    return {
      orgName: siteName,
      stats: cache[orgId]
    };
  }

  try {
    console.log('fetching stats');
    const statsResponse = await classroomio.dash.stats.$get({ query: { siteName } }, getApiHeaders(cookies, orgId));
    const statsData = await statsResponse.json();
    cache[orgId] = statsData.success ? statsData.data : null;
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    cache[orgId] = null;
  }

  return {
    orgName: siteName,
    stats: cache[orgId]
  };
};
