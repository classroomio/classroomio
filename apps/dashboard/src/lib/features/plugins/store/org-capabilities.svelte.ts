import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import type { GetOrgCapabilitiesRequest, OrgCapabilityItem, UpdateOrgCapabilityRequest } from '../utils/types';
import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { snackbar } from '$features/ui/snackbar/store';

class OrgCapabilitiesApi extends BaseApiWithErrors {
  capabilitiesByOrg = new SvelteMap<string, OrgCapabilityItem[]>();
  isLoadingByOrg = new SvelteMap<string, boolean>();
  loadedOrgIds = new SvelteSet<string>();
  activeOrgId = $state<string | null>(null);

  private requestSequenceByOrg = new Map<string, number>();

  setActiveOrgId(orgId: string | null) {
    this.activeOrgId = orgId;
  }

  get capabilities(): OrgCapabilityItem[] {
    if (!this.activeOrgId) return [];

    return this.capabilitiesByOrg.get(this.activeOrgId) ?? [];
  }

  isOrgLoading(orgId?: string): boolean {
    const targetOrgId = orgId || this.activeOrgId;
    if (!targetOrgId) return false;

    return this.isLoadingByOrg.get(targetOrgId) ?? false;
  }

  hasLoaded(orgId?: string): boolean {
    const targetOrgId = orgId || this.activeOrgId;
    if (!targetOrgId) return false;

    return this.loadedOrgIds.has(targetOrgId);
  }

  get enabledCapabilityIds(): Set<string> {
    return new Set(this.capabilities.filter((capability) => capability.isEnabled).map((capability) => capability.id));
  }

  isEnabled(capabilityId: string, orgId?: string): boolean {
    const targetOrgId = orgId || this.activeOrgId;
    if (!targetOrgId) return false;

    return (
      this.capabilitiesByOrg
        .get(targetOrgId)
        ?.some((capability) => capability.id === capabilityId && capability.isEnabled) ?? false
    );
  }

  async ensureCapabilities(orgId: string) {
    this.activeOrgId = orgId;

    if (this.loadedOrgIds.has(orgId) || this.isOrgLoading(orgId)) return;

    await this.fetchCapabilities(orgId);
  }

  async fetchCapabilities(orgId: string) {
    if (!orgId) return;

    this.activeOrgId = orgId;
    this.isLoadingByOrg.set(orgId, true);

    const requestSequence = (this.requestSequenceByOrg.get(orgId) ?? 0) + 1;
    this.requestSequenceByOrg.set(orgId, requestSequence);

    try {
      await this.execute<GetOrgCapabilitiesRequest>({
        requestFn: () => classroomio.plugins.capabilities.$get({}, { headers: { 'cio-org-id': orgId } }),
        logContext: 'fetching org capabilities',
        onSuccess: (response) => {
          if (this.requestSequenceByOrg.get(orgId) !== requestSequence) return;

          this.capabilitiesByOrg.set(orgId, response.data);
          this.loadedOrgIds.add(orgId);
        }
      });
    } finally {
      if (this.requestSequenceByOrg.get(orgId) === requestSequence) {
        this.isLoadingByOrg.set(orgId, false);
      }
    }
  }

  async toggleCapability(capabilityId: string, isEnabled: boolean, orgId?: string) {
    const targetOrgId = orgId || this.activeOrgId;
    if (!targetOrgId) return;

    const previousCapabilities = this.capabilitiesByOrg.get(targetOrgId) ?? [];
    const optimisticCapabilities = previousCapabilities.map((capability) =>
      capability.id === capabilityId ? { ...capability, isEnabled } : capability
    );
    this.capabilitiesByOrg.set(targetOrgId, optimisticCapabilities);

    await this.execute<UpdateOrgCapabilityRequest>({
      requestFn: () =>
        classroomio.plugins.capabilities[':capabilityId'].$put(
          { param: { capabilityId }, json: { isEnabled } },
          { headers: { 'cio-org-id': targetOrgId } }
        ),
      logContext: 'toggling org capability',
      onSuccess: (response) => {
        const updatedCapabilities = optimisticCapabilities.map((capability) =>
          capability.id === capabilityId ? response.data : capability
        );
        this.capabilitiesByOrg.set(targetOrgId, updatedCapabilities);

        const messageKey = isEnabled ? 'plugins.snackbar_enabled' : 'plugins.snackbar_disabled';
        snackbar.success(messageKey);
      },
      onError: () => {
        this.capabilitiesByOrg.set(targetOrgId, previousCapabilities);
      }
    });
  }
}

export const orgCapabilitiesApi = new OrgCapabilitiesApi();
