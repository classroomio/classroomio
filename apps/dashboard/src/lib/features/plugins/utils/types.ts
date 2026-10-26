import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type ListCatalogPluginsRequest = typeof classroomio.plugins.catalog.$get;
export type ListCatalogPluginsResponse = InferResponseType<ListCatalogPluginsRequest>;
export type ListCatalogPluginsSuccess = Extract<ListCatalogPluginsResponse, { success: true }>;
export type CatalogPluginItem = ListCatalogPluginsSuccess['data'][number];

export type GetCatalogPluginDetailsRequest = (typeof classroomio.plugins.catalog)[':id']['$get'];
export type GetCatalogPluginDetailsResponse = InferResponseType<GetCatalogPluginDetailsRequest>;
export type GetCatalogPluginDetailsSuccess = Extract<GetCatalogPluginDetailsResponse, { success: true }>;
export type CatalogPluginDetails = GetCatalogPluginDetailsSuccess['data'];

export type ListInstallationsRequest = typeof classroomio.plugins.installations.$get;
export type ListInstallationsResponse = InferResponseType<ListInstallationsRequest>;
export type ListInstallationsSuccess = Extract<ListInstallationsResponse, { success: true }>;
export type InstalledPluginItem = ListInstallationsSuccess['data'][number];

export type ListContributionsRequest = typeof classroomio.plugins.installations.contributions.$get;
export type ListContributionsResponse = InferResponseType<ListContributionsRequest>;
export type ListContributionsSuccess = Extract<ListContributionsResponse, { success: true }>;
export type ResolvedContributionItem = ListContributionsSuccess['data'][number];

export type InstallPluginRequest = (typeof classroomio.plugins.installations)[':id']['install']['$post'];
export type InstallPluginResponse = InferResponseType<InstallPluginRequest>;

export type GetInstallationRequest = (typeof classroomio.plugins.installations)[':installationId']['$get'];
export type GetInstallationResponse = InferResponseType<GetInstallationRequest>;
export type GetInstallationSuccess = Extract<GetInstallationResponse, { success: true }>;
export type InstallationDetails = GetInstallationSuccess['data'];

export type UpdateInstallationStatusRequest =
  (typeof classroomio.plugins.installations)[':installationId']['status']['$patch'];
export type UpdateInstallationSettingsRequest =
  (typeof classroomio.plugins.installations)[':installationId']['settings']['$patch'];
export type UpdateOrgApprovalRequest =
  (typeof classroomio.plugins.installations)[':installationId']['approval']['$patch'];

export type { PluginInstallationStatus, PluginOrgApprovalStatus } from '@cio/utils/validation/plugin';
