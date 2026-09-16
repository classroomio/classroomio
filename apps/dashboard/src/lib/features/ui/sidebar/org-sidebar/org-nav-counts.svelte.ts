import { BaseApi, classroomio } from '$lib/utils/services/api';
import type { GetOrgNavCountsRequest, OrgNavCountKey, OrgNavCounts } from './types';

export type { OrgNavCountKey, OrgNavCounts };

class OrgNavCountsApi extends BaseApi {
  counts = $state<OrgNavCounts | null>(null);
  loadedOrgId = $state<string | null>(null);
  private inFlightOrgId: string | null = null;

  reset() {
    this.counts = null;
    this.loadedOrgId = null;
    this.inFlightOrgId = null;
  }

  async ensureCounts(orgId: string) {
    if (!orgId) return;

    if (this.loadedOrgId === orgId && this.counts) {
      return;
    }

    if (this.inFlightOrgId === orgId) {
      return;
    }

    if (this.loadedOrgId !== orgId) {
      this.counts = null;
      this.loadedOrgId = null;
    }

    this.inFlightOrgId = orgId;

    await this.execute<GetOrgNavCountsRequest>({
      requestFn: () => classroomio.organization['nav-counts'].$get(),
      logContext: 'fetching organization nav counts',
      onSuccess: (response) => {
        if (this.inFlightOrgId !== orgId) {
          return;
        }

        this.counts = response.data;
        this.loadedOrgId = orgId;
      }
    });

    if (this.inFlightOrgId === orgId) {
      this.inFlightOrgId = null;
    }
  }

  setCount(key: OrgNavCountKey, value: number) {
    if (!this.counts) return;

    this.counts = {
      ...this.counts,
      [key]: Math.max(0, value)
    };
  }

  adjustCount(key: OrgNavCountKey, delta: number) {
    if (!this.counts) return;

    this.setCount(key, this.counts[key] + delta);
  }
}

export const orgNavCountsApi = new OrgNavCountsApi();
