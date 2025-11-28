import { dashStatApi } from '$lib/features/org/api';
import type { OrganisationAnalytics } from '$lib/utils/types/analytics';

interface AnalyticsResponse {
  data: OrganisationAnalytics;
}

export const load = async ({ params }) => {
  let dashAnalytics: OrganisationAnalytics = {
    enrollments: [],
    numberOfCourses: 0,
    revenue: 0,
    totalStudents: 0,
    topCourses: []
  };

  try {
    const dashBackendRes: AnalyticsResponse | undefined = (await dashStatApi.fetchOrgStats(
      '',
      params.slug
    )) as unknown as AnalyticsResponse;

    if (!dashBackendRes) {
      console.error('Failed to fetch analytics data — empty response', dashBackendRes);
    } else {
      dashAnalytics = dashBackendRes.data as OrganisationAnalytics;
    }
  } catch (error) {
    console.error('Failed to fetch analytics data', error);
  }

  return {
    enrollments: dashAnalytics.enrollments,
    numberOfCourses: dashAnalytics.numberOfCourses,
    revenue: dashAnalytics.revenue,
    totalStudents: dashAnalytics.totalStudents,
    topCourses: dashAnalytics.topCourses
  };
};
