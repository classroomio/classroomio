import { classroomio, type InferRequestType, type InferResponseType } from '$lib/utils/services/api';

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

export type GetPluginStorageRequest =
  (typeof classroomio.plugins.installations)[':installationId']['storage'][':namespace'][':key']['$get'];
export type SetPluginStorageRequest = (typeof classroomio.plugins.installations)[':installationId']['storage']['$put'];
export type DeletePluginStorageRequest =
  (typeof classroomio.plugins.installations)[':installationId']['storage'][':namespace'][':key']['$delete'];

export type CreateLaunchCodeRequest = (typeof classroomio.plugins.launch)[':installationId']['launch-code']['$post'];
export type CreateLaunchCodeResponse = InferResponseType<CreateLaunchCodeRequest>;

export type ListSubscriptionsRequest =
  (typeof classroomio.plugins.events)['installations'][':installationId']['subscriptions']['$get'];
export type CreateSubscriptionRequest =
  (typeof classroomio.plugins.events)['installations'][':installationId']['subscriptions']['$post'];

export type ListDeliveriesRequest =
  (typeof classroomio.plugins.events)['installations'][':installationId']['deliveries']['$get'];
export type GetWebhookSecretRequest =
  (typeof classroomio.plugins.events)['installations'][':installationId']['webhook-secret']['$get'];
export type ReplayDeliveryRequest = (typeof classroomio.plugins.events)['deliveries'][':deliveryId']['replay']['$post'];
export type TriggerTestEventRequest = typeof classroomio.plugins.events.test.$post;

export type { PluginInstallationStatus, PluginOrgApprovalStatus } from '@cio/utils/validation/plugin';
