import { BaseApi, classroomio } from '$lib/utils/services/api';
import type { GetDashStatsResponse } from '../utils/types';

/**
 * API class for organization plan operations
 */
class DashStatApi extends BaseApi {
  /**
   * Creates a new organization plan
   * @param params Organization plan creation parameters
   * @returns Created organization plan
   */
  async fetchOrgStats(orgId?: string, siteName?: string) {
    return this.execute<GetDashStatsResponse>({
      requestFn: () => classroomio.dash.stats.$post({ json: { orgId, siteName } }),
      logContext: 'fetching organization stats'
    });
  }
}

export const dashStatApi = new DashStatApi();
