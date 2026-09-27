import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import type { GetOrgCapabilitiesRequest, OrgCapabilityItem, UpdateOrgCapabilityRequest } from '../utils/types';
import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { snackbar } from '$features/ui/snackbar/store';
import { configuredPlugins } from '@plugins';
import { resolvePluginCapabilities } from '@cio/sdk';

const configuredCapabilities = resolvePluginCapabilities(configuredPlugins);

class OrgCapabilitiesApi extends BaseApiWithErrors {
  enabledCapabilityIdsByOrg = new SvelteMap<string, SvelteSet<string>>();
  isLoadingByOrg = new SvelteMap<string, boolean>();
  loadedOrgIds = new SvelteSet<string>();
  activeOrgId = $state<string | null>(null);

  private requestSequenceByOrg = new Map<string, number>();

  setActiveOrgId(orgId: string | null) {
    this.activeOrgId = orgId;
  }

  get capabilities(): OrgCapabilityItem[] {
    const enabledSet = this.activeOrgId ? this.enabledCapabilityIdsByOrg.get(this.activeOrgId) : null;

    return configuredCapabilities.map((capability) => ({
      ...capability,
      isEnabled: enabledSet ? enabledSet.has(capability.id) : false
    }));
  }

  isOrgLoading(orgId?: string): boolean {
    const targetOrgId = orgId || this.activeOrgId;
    if (!targetOrgId) {
      return false;
    }

    return this.isLoadingByOrg.get(targetOrgId) ?? false;
  }

  hasLoaded(orgId?: string): boolean {
    const targetOrgId = orgId || this.activeOrgId;
    if (!targetOrgId) {
      return false;
    }

    return this.loadedOrgIds.has(targetOrgId);
  }

  get enabledCapabilityIds(): Set<string> {
    if (!this.activeOrgId) {
      return new Set();
    }

    return this.enabledCapabilityIdsByOrg.get(this.activeOrgId) ?? new Set();
  }

  isEnabled(capabilityId: string, orgId?: string): boolean {
    const targetOrgId = orgId || this.activeOrgId;
    if (!targetOrgId) {
      return false;
    }

    return this.enabledCapabilityIdsByOrg.get(targetOrgId)?.has(capabilityId) ?? false;
  }

  async ensureCapabilities(orgId: string) {
    this.activeOrgId = orgId;

    if (this.loadedOrgIds.has(orgId) || this.isOrgLoading(orgId)) {
      return;
    }

    await this.fetchCapabilities(orgId);
  }

  async fetchCapabilities(orgId: string) {
    if (!orgId) {
      return;
    }

    this.activeOrgId = orgId;
    this.isLoadingByOrg.set(orgId, true);

    const requestSequence = (this.requestSequenceByOrg.get(orgId) ?? 0) + 1;
    this.requestSequenceByOrg.set(orgId, requestSequence);

    try {
      await this.execute<GetOrgCapabilitiesRequest>({
        requestFn: () => classroomio.plugins.capabilities.$get({}, { headers: { 'cio-org-id': orgId } }),
        logContext: 'fetching org capabilities',
        onSuccess: (response) => {
          if (this.requestSequenceByOrg.get(orgId) !== requestSequence) {
            return;
          }

          this.enabledCapabilityIdsByOrg.set(orgId, new SvelteSet(response.data));
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
    if (!targetOrgId) {
      return;
    }

    let orgSet = this.enabledCapabilityIdsByOrg.get(targetOrgId);
    if (!orgSet) {
      orgSet = new SvelteSet();
      this.enabledCapabilityIdsByOrg.set(targetOrgId, orgSet);
    }

    const wasEnabled = orgSet.has(capabilityId);
    if (isEnabled) {
      orgSet.add(capabilityId);
    } else {
      orgSet.delete(capabilityId);
    }

    await this.execute<UpdateOrgCapabilityRequest>({
      requestFn: () =>
        classroomio.plugins.capabilities[':capabilityId'].$put(
          { param: { capabilityId }, json: { isEnabled } },
          { headers: { 'cio-org-id': targetOrgId } }
        ),
      logContext: 'toggling org capability',
      onSuccess: (response) => {
        const isNowEnabled = response.data.isEnabled;
        if (isNowEnabled) {
          orgSet.add(capabilityId);
        } else {
          orgSet.delete(capabilityId);
        }

        const messageKey = isNowEnabled ? 'plugins.snackbar_enabled' : 'plugins.snackbar_disabled';
        snackbar.success(messageKey);
      },
      onError: () => {
        if (wasEnabled) {
          orgSet.add(capabilityId);
        } else {
          orgSet.delete(capabilityId);
        }
      }
    });
  }
}

export const orgCapabilitiesApi = new OrgCapabilitiesApi();
