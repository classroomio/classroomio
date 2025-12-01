import { BaseApi, classroomio } from '$lib/utils/services/api';

/**
 * API class for organization dashboard analytics
 */
class DashStatApi extends BaseApi {
  /**
   * Fetches dashboard statistics for an organization
   * @param orgId Optional organization ID
   * @param siteName Optional site name
   * @returns Organization analytics data (enrollments, courses, revenue, students, top courses)
   */
  async fetchOrgStats(orgId?: string, siteName?: string) {
    return this.execute<typeof classroomio.dash.stats.$post>({
      requestFn: () => classroomio.dash.stats.$post({ json: { orgId, siteName } }),
      logContext: 'fetching organization stats'
    });
  }
}

export const dashStatApi = new DashStatApi();
