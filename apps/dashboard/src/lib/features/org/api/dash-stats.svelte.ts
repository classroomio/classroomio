import { BaseApi, classroomio } from '$lib/utils/services/api';

import type { DashStatsSuccess } from '$lib/features/org/utils/types';

/**
 * API class for organization dashboard analytics
 */
class DashStatApi extends BaseApi {
  stats = $state<DashStatsSuccess['data']>({
    enrollments: [],
    numberOfCourses: 0,
    revenue: 0,
    totalStudents: 0,
    topCourses: []
  });

  /**
   * Fetches dashboard statistics for an organization
   * @param orgId Optional organization ID
   * @param siteName Optional site name
   * @returns Organization analytics data (enrollments, courses, revenue, students, top courses)
   */
  async fetchOrgStats({ orgId, siteName }: { orgId?: string; siteName?: string }) {
    console.log('orgId', orgId);
    console.log('siteName', siteName);
    await this.execute<typeof classroomio.dash.stats.$post>({
      requestFn: () => classroomio.dash.stats.$post({ json: { orgId, siteName } }),
      logContext: 'fetching organization stats',
      onSuccess: (response) => {
        this.stats = response.data;
      }
    });
  }
}

export const dashStatApi = new DashStatApi();
