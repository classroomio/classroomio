import { BaseApi, classroomio } from '$lib/utils/services/api';

import type { ComplianceOverviewData, ComplianceOverviewRequest } from '../utils/types';

class ComplianceApi extends BaseApi {
  overview = $state<ComplianceOverviewData | null>(null);
  loading = $state(false);
  lastFetchedOrgId = $state<string | null>(null);

  async fetchOverview(orgId: string) {
    if (!orgId) return;

    this.loading = true;
    this.lastFetchedOrgId = orgId;
    await this.execute<ComplianceOverviewRequest>({
      requestFn: () => classroomio.dash['compliance-overview'].$get({ query: { orgId } }),
      logContext: 'fetching org compliance overview',
      onSuccess: (response) => {
        this.overview = response.data;
      }
    });
    this.loading = false;
  }

  ensureFetched(orgId: string) {
    if (this.lastFetchedOrgId === orgId) return;

    this.fetchOverview(orgId);
  }
}

export const complianceApi = new ComplianceApi();
