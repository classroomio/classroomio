import { BaseApi, classroomio } from '$lib/utils/services/api';

import type {
  CountryBreakdownData,
  CountryBreakdownRequest,
  CourseFunnelData,
  CourseFunnelRequest,
  LandingStatsData,
  LandingStatsRequest,
  PopularTypesData,
  PopularTypesRequest
} from '../utils/types';

class AnalyticsApi extends BaseApi {
  landing = $state<LandingStatsData | null>(null);
  country = $state<CountryBreakdownData>([]);
  funnel = $state<CourseFunnelData | null>(null);
  popularTypes = $state<PopularTypesData>([]);

  loadingLanding = $state(false);
  loadingCountry = $state(false);
  loadingFunnel = $state(false);
  loadingPopularTypes = $state(false);

  range = $state<7 | 30 | 90>(30);
  lastFetchedOrgId = $state<string | null>(null);
  lastFetchedRange = $state<7 | 30 | 90 | null>(null);

  get loading() {
    return this.loadingLanding || this.loadingCountry || this.loadingFunnel || this.loadingPopularTypes;
  }

  private query(orgId: string, bust: boolean) {
    return { orgId, days: String(this.range), ...(bust && { bust: '1' }) };
  }

  async fetchLanding(orgId: string, bust = false) {
    this.loadingLanding = true;
    await this.execute<LandingStatsRequest>({
      requestFn: () => classroomio.dash['landing-stats'].$get({ query: this.query(orgId, bust) }),
      logContext: 'fetching analytics landing stats',
      onSuccess: (response) => {
        this.landing = response.data;
      }
    });
    this.loadingLanding = false;
  }

  async fetchCountry(orgId: string, bust = false) {
    this.loadingCountry = true;
    await this.execute<CountryBreakdownRequest>({
      requestFn: () => classroomio.dash['country-breakdown'].$get({ query: this.query(orgId, bust) }),
      logContext: 'fetching analytics country breakdown',
      onSuccess: (response) => {
        this.country = response.data;
      }
    });
    this.loadingCountry = false;
  }

  async fetchFunnel(orgId: string, bust = false) {
    this.loadingFunnel = true;
    await this.execute<CourseFunnelRequest>({
      requestFn: () => classroomio.dash['course-funnel'].$get({ query: this.query(orgId, bust) }),
      logContext: 'fetching analytics course funnel',
      onSuccess: (response) => {
        this.funnel = response.data;
      }
    });
    this.loadingFunnel = false;
  }

  async fetchPopularTypes(orgId: string, bust = false) {
    this.loadingPopularTypes = true;
    await this.execute<PopularTypesRequest>({
      requestFn: () => classroomio.dash['popular-types'].$get({ query: this.query(orgId, bust) }),
      logContext: 'fetching analytics popular types',
      onSuccess: (response) => {
        this.popularTypes = response.data;
      }
    });
    this.loadingPopularTypes = false;
  }

  /** Fire all four in parallel; each card shows its own spinner. */
  fetchAll(orgId: string, bust = false) {
    if (!orgId) return Promise.resolve();

    this.lastFetchedOrgId = orgId;
    this.lastFetchedRange = this.range;
    return Promise.all([
      this.fetchLanding(orgId, bust),
      this.fetchCountry(orgId, bust),
      this.fetchFunnel(orgId, bust),
      this.fetchPopularTypes(orgId, bust)
    ]);
  }

  /**
   * Fetch only if data for this (orgId, range) wasn't fetched in this session.
   * Singleton state means navigating away and back reuses prior data.
   */
  ensureFetched(orgId: string) {
    if (this.lastFetchedOrgId === orgId && this.lastFetchedRange === this.range) return;

    this.fetchAll(orgId);
  }

  setRange(days: 7 | 30 | 90, orgId: string) {
    this.range = days;
    return this.fetchAll(orgId);
  }

  refresh(orgId: string) {
    return this.fetchAll(orgId, true);
  }
}

export const analyticsApi = new AnalyticsApi();
