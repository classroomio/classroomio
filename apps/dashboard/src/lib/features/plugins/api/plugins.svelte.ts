import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  CatalogPluginDetails,
  CatalogPluginItem,
  CreateLaunchCodeRequest,
  DeletePluginStorageRequest,
  GetCatalogPluginDetailsRequest,
  GetInstallationRequest,
  GetPluginStorageRequest,
  InstallationDetails,
  InstalledPluginItem,
  InstallPluginRequest,
  ListCatalogPluginsRequest,
  ListInstallationsRequest,
  ListContributionsRequest,
  ResolvedContributionItem,
  SetPluginStorageRequest,
  UpdateInstallationSettingsRequest,
  UpdateInstallationStatusRequest,
  UpdateOrgApprovalRequest,
  PluginInstallationStatus,
  PluginOrgApprovalStatus
} from '../utils/types';

export class PluginsApi extends BaseApiWithErrors {
  catalog = $state<CatalogPluginItem[]>([]);
  installations = $state<InstalledPluginItem[]>([]);
  contributions = $state<ResolvedContributionItem[]>([]);
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

    return this.execute<ListContributionsRequest>({
      requestFn: () =>
        classroomio.plugins.installations.contributions.$get(
          { query },
          {
            headers: { 'cio-org-id': orgId }
          }
        ),
      logContext: 'fetching organization plugin contributions',
      onSuccess: (response) => {
        this.contributions = response.data;
      }
    });
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

  async getInstallation(installationId: string) {
    return this.execute<GetInstallationRequest>({
      requestFn: () =>
        classroomio.plugins.installations[':installationId'].$get({
          param: { installationId }
        }),
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

  async getStorage(installationId: string, namespace: string, key: string) {
    const response = await this.execute<GetPluginStorageRequest>({
      requestFn: () =>
        classroomio.plugins.installations[':installationId']['storage'][':namespace'][':key'].$get({
          param: { installationId, namespace, key }
        }),
      logContext: 'getting plugin storage'
    });

    return response ? response.data : null;
  }

  async setStorage(installationId: string, namespace: string, key: string, value: unknown) {
    await this.execute<SetPluginStorageRequest>({
      requestFn: () =>
        classroomio.plugins.installations[':installationId']['storage'].$put({
          param: { installationId },
          json: { namespace, key, value }
        }),
      logContext: 'setting plugin storage'
    });
  }

  async deleteStorage(installationId: string, namespace: string, key: string) {
    const response = await this.execute<DeletePluginStorageRequest>({
      requestFn: () =>
        classroomio.plugins.installations[':installationId']['storage'][':namespace'][':key'].$delete({
          param: { installationId, namespace, key }
        }),
      logContext: 'deleting plugin storage'
    });

    return response ? response.data.deleted : false;
  }

  async requestLaunchCode(installationId: string, orgId?: string, target?: string) {
    const headers = orgId ? { 'cio-org-id': orgId } : undefined;

    const response = await this.execute<CreateLaunchCodeRequest>({
      requestFn: () =>
        classroomio.plugins.launch[':installationId']['launch-code'].$post(
          {
            param: { installationId },
            json: { target }
          },
          { headers }
        ),
      logContext: 'requesting plugin launch code'
    });

    return response ? response.data : null;
  }
}

export const pluginsApi = new PluginsApi();
