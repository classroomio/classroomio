import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  CatalogPluginDetails,
  CatalogPluginItem,
  CreateLaunchCodeRequest,
  GetCatalogPluginDetailsRequest,
  GetInstallationRequest,
  InstallationDetails,
  InstalledPluginItem,
  InstallPluginRequest,
  ListCatalogPluginsRequest,
  ListInstallationsRequest,
  ListContributionsRequest,
  ResolvedContributionItem,
  UpdateInstallationSettingsRequest,
  UpdateInstallationStatusRequest,
  UpdateOrgApprovalRequest,
  GetPluginStorageRequest,
  ListPluginStorageRequest,
  SetPluginStorageRequest,
  DeletePluginStorageRequest,
  PluginInstallationStatus,
  PluginOrgApprovalStatus,
  TPluginApiStorageScope
} from '../utils/types';

export class PluginsApi extends BaseApiWithErrors {
  catalog = $state<CatalogPluginItem[]>([]);
  installations = $state<InstalledPluginItem[]>([]);
  selectedPlugin = $state<CatalogPluginDetails | null>(null);
  selectedInstallation = $state<InstallationDetails | null>(null);

  async listCatalog() {
    return this.execute<ListCatalogPluginsRequest>({
      requestFn: () => classroomio.plugins.catalog.$get(),
      logContext: 'fetching plugins catalog',
      onSuccess: (response) => {
        this.catalog = response.data;
      }
    });
  }

  async getCatalogDetails(pluginId: string) {
    return this.execute<GetCatalogPluginDetailsRequest>({
      requestFn: () => classroomio.plugins.catalog[':id'].$get({ param: { id: pluginId } }),
      logContext: 'fetching plugin details',
      onSuccess: (response) => {
        this.selectedPlugin = response.data;
      }
    });
  }

  async listOrgInstallations(orgId: string) {
    return this.execute<ListInstallationsRequest>({
      requestFn: () =>
        classroomio.plugins.installations.$get(undefined, {
          headers: { 'cio-org-id': orgId }
        }),
      logContext: 'fetching organization installations',
      onSuccess: (response) => {
        this.installations = response.data;
      }
    });
  }

  async listOrgContributions(orgId: string, target?: string) {
    const query = target ? { target } : undefined;

    const response = await this.execute<ListContributionsRequest>({
      requestFn: () =>
        classroomio.plugins.installations.contributions.$get(
          { query },
          {
            headers: { 'cio-org-id': orgId }
          }
        ),
      logContext: 'fetching organization plugin contributions'
    });

    return response?.data ?? [];
  }

  async install(pluginId: string, version: string, orgId: string, settings?: Record<string, unknown>) {
    return this.execute<InstallPluginRequest>({
      requestFn: () =>
        classroomio.plugins.installations[':id']['install'].$post(
          {
            param: { id: pluginId },
            json: {
              pluginId,
              version,
              ownerType: 'organization',
              organizationId: orgId,
              settings: settings ?? {}
            }
          },
          {
            headers: { 'cio-org-id': orgId }
          }
        ),
      logContext: 'installing plugin',
      onSuccess: () => {
        void this.listOrgInstallations(orgId);
      }
    });
  }

  async getInstallation(installationId: string, orgId: string) {
    return this.execute<GetInstallationRequest>({
      requestFn: () =>
        classroomio.plugins.installations[':installationId'].$get(
          { param: { installationId } },
          { headers: { 'cio-org-id': orgId } }
        ),
      logContext: 'fetching installation details',
      onSuccess: (response) => {
        this.selectedInstallation = response.data;
      }
    });
  }

  async updateStatus(installationId: string, status: PluginInstallationStatus, orgId: string) {
    return this.execute<UpdateInstallationStatusRequest>({
      requestFn: () =>
        classroomio.plugins.installations[':installationId']['status'].$patch(
          {
            param: { installationId },
            json: { status }
          },
          {
            headers: { 'cio-org-id': orgId }
          }
        ),
      logContext: 'updating plugin installation status',
      onSuccess: () => {
        void this.listOrgInstallations(orgId);
      }
    });
  }

  async updateSettings(installationId: string, settings: Record<string, unknown>, orgId: string) {
    return this.execute<UpdateInstallationSettingsRequest>({
      requestFn: () =>
        classroomio.plugins.installations[':installationId']['settings'].$patch(
          {
            param: { installationId },
            json: { settings }
          },
          {
            headers: { 'cio-org-id': orgId }
          }
        ),
      logContext: 'updating plugin installation settings'
    });
  }

  async updateApproval(installationId: string, approval: PluginOrgApprovalStatus, orgId: string) {
    return this.execute<UpdateOrgApprovalRequest>({
      requestFn: () =>
        classroomio.plugins.installations[':installationId']['approval'].$patch(
          {
            param: { installationId },
            json: { approval }
          },
          {
            headers: { 'cio-org-id': orgId }
          }
        ),
      logContext: 'updating plugin organization approval',
      onSuccess: () => {
        void this.listOrgInstallations(orgId);
      }
    });
  }

  async getStorage(
    installationId: string,
    namespace: string,
    key: string,
    scope: TPluginApiStorageScope,
    orgId: string
  ) {
    const response = await this.execute<GetPluginStorageRequest>({
      requestFn: () =>
        classroomio.plugins.installations[':installationId'].storage[':namespace'][':key'].$get(
          {
            param: { installationId, namespace, key },
            query: { scope }
          },
          { headers: { 'cio-org-id': orgId } }
        ),
      logContext: 'loading plugin storage'
    });

    if (!response) throw new Error(this.error ?? 'Failed to load plugin storage');

    return response.data.value;
  }

  async listStorage(installationId: string, namespace: string, scope: TPluginApiStorageScope, orgId: string) {
    const response = await this.execute<ListPluginStorageRequest>({
      requestFn: () =>
        classroomio.plugins.installations[':installationId'].storage[':namespace'].$get(
          {
            param: { installationId, namespace },
            query: { scope }
          },
          { headers: { 'cio-org-id': orgId } }
        ),
      logContext: 'listing plugin storage'
    });

    if (!response) throw new Error(this.error ?? 'Failed to list plugin storage');

    return response.data.items;
  }

  async setStorage(
    installationId: string,
    namespace: string,
    key: string,
    value: unknown,
    scope: TPluginApiStorageScope,
    orgId: string
  ) {
    const response = await this.execute<SetPluginStorageRequest>({
      requestFn: () =>
        classroomio.plugins.installations[':installationId'].storage[':namespace'][':key'].$put(
          {
            param: { installationId, namespace, key },
            json: { value, scope }
          },
          { headers: { 'cio-org-id': orgId } }
        ),
      logContext: 'saving plugin storage'
    });

    if (!response) throw new Error(this.error ?? 'Failed to save plugin storage');

    return response.data;
  }

  async deleteStorage(
    installationId: string,
    namespace: string,
    key: string,
    scope: TPluginApiStorageScope,
    orgId: string
  ) {
    const response = await this.execute<DeletePluginStorageRequest>({
      requestFn: () =>
        classroomio.plugins.installations[':installationId'].storage[':namespace'][':key'].$delete(
          {
            param: { installationId, namespace, key },
            query: { scope }
          },
          { headers: { 'cio-org-id': orgId } }
        ),
      logContext: 'deleting plugin storage'
    });

    if (!response) throw new Error(this.error ?? 'Failed to delete plugin storage');

    return response.data.deleted;
  }

  async requestLaunchCode(
    installationId: string,
    orgId: string | undefined,
    target: string,
    audience: string,
    nonce: string,
    resource?: { type: 'lesson' | 'course' | 'certificate' | 'organization'; id: string }
  ) {
    const headers = orgId ? { 'cio-org-id': orgId } : undefined;

    const response = await this.execute<CreateLaunchCodeRequest>({
      requestFn: () =>
        classroomio.plugins.launch[':installationId']['launch-code'].$post(
          {
            param: { installationId },
            json: { target, audience, nonce, resource }
          },
          { headers }
        ),
      logContext: 'requesting plugin launch code'
    });

    return response ? response.data : null;
  }
}

export const pluginsApi = new PluginsApi();
