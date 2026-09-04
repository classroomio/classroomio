import { BaseApi, classroomio } from '$lib/utils/services/api';

import type { ComplianceOverviewData, ComplianceOverviewRequest } from '../utils/types';

class ComplianceApi extends BaseApi {
  overview = $state<ComplianceOverviewData | null>(null);
  loading = $state(false);

  async fetchOverview(orgId: string) {
    if (!orgId) return;

    this.loading = true;
    await this.execute<ComplianceOverviewRequest>({
      requestFn: () => classroomio.dash['compliance-overview'].$get({ query: { orgId } }),
      logContext: 'fetching org compliance overview',
      onSuccess: (response) => {
        this.overview = response.data;
      }
    });
    this.loading = false;
  }
}

export const complianceApi = new ComplianceApi();
