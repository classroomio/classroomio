import { BaseApi, classroomio } from '$lib/utils/services/api';
import type { GetOrgNavCountsRequest, OrgNavCountKey, OrgNavCounts } from './types';

export type { OrgNavCountKey, OrgNavCounts };

class OrgNavCountsApi extends BaseApi {
  counts = $state<OrgNavCounts | null>(null);
  loadedOrgId = $state<string | null>(null);
  private inFlightOrgId: string | null = null;
  private overrides: Partial<Record<OrgNavCountKey, number>> = {};

  reset() {
    this.counts = null;
    this.loadedOrgId = null;
    this.inFlightOrgId = null;
    this.overrides = {};
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
      if (this.loadedOrgId !== null) {
        this.overrides = {};
      }
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

        this.counts = {
          ...response.data,
          ...this.overrides
        };
        this.loadedOrgId = orgId;
      }
    });

    if (this.inFlightOrgId === orgId) {
      this.inFlightOrgId = null;
    }
  }

  setCount(key: OrgNavCountKey, value: number) {
    const safeValue = Math.max(0, value);
    this.overrides[key] = safeValue;

    if (this.counts) {
      this.counts = {
        ...this.counts,
        [key]: safeValue
      };
    }
  }

  adjustCount(key: OrgNavCountKey, delta: number) {
    if (!this.counts) return;

    this.setCount(key, this.counts[key] + delta);
  }
}

export const orgNavCountsApi = new OrgNavCountsApi();
