import type { DashStatsSuccess } from '$features/org/utils/types';
import { classroomio, getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ params, parent, cookies }) => {
  const { orgId } = await parent();
  const siteName = params.slug;

  if (!orgId) {
    return {
      orgName: siteName,
      stats: null
    };
  }
  console.log('orgId', orgId);
  console.log('siteName', siteName);

  let stats: DashStatsSuccess['data'] | null = null;

  try {
    console.log('fetching stats');
    const statsResponse = await classroomio.dash.stats.$get({ query: { siteName } }, getApiHeaders(cookies, orgId));
    const statsData = await statsResponse.json();
    stats = statsData.success ? statsData.data : null;
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
  }

  return {
    orgName: siteName,
    stats
  };
};
