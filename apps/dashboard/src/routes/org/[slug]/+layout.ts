import { dashStatApi } from '$lib/features/org/api';
import type { DashStatsSuccess } from '$lib/features/org/utils/types';

export const load = async ({ params }) => {
  let dashAnalytics: DashStatsSuccess['data'] = {
    enrollments: [],
    numberOfCourses: 0,
    revenue: 0,
    totalStudents: 0,
    topCourses: []
  };

  try {
    const dashBackendRes = await dashStatApi.fetchOrgStats('', params.slug);

    if (!dashBackendRes) {
      console.error('Failed to fetch analytics data — empty response', dashBackendRes);
    } else {
      dashAnalytics = dashBackendRes.data;
    }
  } catch (error) {
    console.error('Failed to fetch analytics data', error);
  }

  return dashAnalytics;
};
