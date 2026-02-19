import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type ListAssetsRequest = (typeof classroomio.organization)['assets']['$get'];
export type ListAssetsResponse = InferResponseType<ListAssetsRequest>;
export type ListAssetsSuccess = Extract<ListAssetsResponse, { success: true }>;
export type OrganizationAssets = ListAssetsSuccess['data'];

export type CreateAssetRequest = (typeof classroomio.organization)['assets']['$post'];
export type CreateAssetResponse = InferResponseType<CreateAssetRequest>;
export type CreateAssetSuccess = Extract<CreateAssetResponse, { success: true }>;
export type OrganizationAsset = CreateAssetSuccess['data'];

export type GetAssetRequest = (typeof classroomio.organization)['assets'][':assetId']['$get'];
export type GetAssetResponse = InferResponseType<GetAssetRequest>;
export type GetAssetSuccess = Extract<GetAssetResponse, { success: true }>;

export type UpdateAssetRequest = (typeof classroomio.organization)['assets'][':assetId']['$put'];
export type UpdateAssetResponse = InferResponseType<UpdateAssetRequest>;
export type UpdateAssetSuccess = Extract<UpdateAssetResponse, { success: true }>;
export type UpdateAssetData = UpdateAssetSuccess['data'];

export type DeleteAssetRequest = (typeof classroomio.organization)['assets'][':assetId']['$delete'];
export type DeleteAssetResponse = InferResponseType<DeleteAssetRequest>;
export type DeleteAssetSuccess = Extract<DeleteAssetResponse, { success: true }>;

export type GetAssetUsageRequest = (typeof classroomio.organization)['assets'][':assetId']['usage']['$get'];
export type GetAssetUsageResponse = InferResponseType<GetAssetUsageRequest>;
export type GetAssetUsageSuccess = Extract<GetAssetUsageResponse, { success: true }>;
export type AssetUsageGraph = GetAssetUsageSuccess['data'];
export type OrganizationAssetUsage = AssetUsageGraph['usages'][number];

export type AttachAssetRequest = (typeof classroomio.organization)['assets'][':assetId']['attach']['$post'];
export type AttachAssetResponse = InferResponseType<AttachAssetRequest>;
export type AttachAssetSuccess = Extract<AttachAssetResponse, { success: true }>;
export type AssetUsage = AttachAssetSuccess['data'];

export type DetachAssetRequest = (typeof classroomio.organization)['assets'][':assetId']['detach']['$post'];
export type DetachAssetResponse = InferResponseType<DetachAssetRequest>;
export type DetachAssetSuccess = Extract<DetachAssetResponse, { success: true }>;

export type ExportAssetsRequest = (typeof classroomio.organization)['assets']['export']['$get'];
export type ExportAssetsResponse = InferResponseType<ExportAssetsRequest>;
export type ExportAssetsSuccess = Extract<ExportAssetsResponse, { success: true }>;

export type GetAssetStorageRequest = (typeof classroomio.organization)['assets']['storage']['$get'];
export type GetAssetStorageResponse = InferResponseType<GetAssetStorageRequest>;
export type GetAssetStorageSuccess = Extract<GetAssetStorageResponse, { success: true }>;
export type AssetStorageSummary = GetAssetStorageSuccess['data'];

export type GetYouTubeMetadataRequest = (typeof classroomio.organization)['assets']['youtube-metadata']['$get'];
export type GetYouTubeMetadataResponse = InferResponseType<GetYouTubeMetadataRequest>;
export type GetYouTubeMetadataSuccess = Extract<GetYouTubeMetadataResponse, { success: true }>;
export type YouTubeMetadata = GetYouTubeMetadataSuccess['data'];
