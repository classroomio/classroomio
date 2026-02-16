import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  AssetStorageSummary,
  AssetUsage,
  AssetUsageGraph,
  CreateAssetRequest,
  GetAssetUsageRequest,
  GetYouTubeMetadataRequest,
  ListAssetsRequest,
  OrganizationAsset,
  UpdateAssetData,
  UpdateAssetRequest,
  YouTubeMetadata
} from '../utils/types';
import type {
  TAssetAttach,
  TAssetCreateUpload,
  TAssetDetach,
  TAssetListQuery,
  TAssetStorageQuery,
  TAssetUpdate,
  TYouTubeMetadataQuery
} from '@cio/utils/validation/assets';
import {
  ZAssetAttach,
  ZAssetCreateUpload,
  ZAssetDetach,
  ZAssetListQuery,
  ZAssetStorageQuery,
  ZAssetUpdate,
  ZYouTubeMetadataQuery
} from '@cio/utils/validation/assets';
import { mapAssetToLessonVideo } from '../utils/media-manager-utils';

import type { AttachAssetRequest } from '../utils/types';
import type { DetachAssetRequest } from '../utils/types';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { snackbar } from '$features/ui/snackbar/store';

export class MediaManagerApi extends BaseApiWithErrors {
  assets = $state<OrganizationAsset[]>([]);
  storageSummary = $state<AssetStorageSummary | null>(null);
  pagination = $state<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  private normalizeDurationSeconds(value: number | null | undefined): number | undefined {
    if (value == null || !Number.isFinite(value)) {
      return undefined;
    }

    return Math.max(0, Math.round(value));
  }

  async listAssets(query: Partial<TAssetListQuery> = {}) {
    const parsed = ZAssetListQuery.partial().safeParse(query);
    if (!parsed.success) {
      this.errors = mapZodErrorsToTranslations(parsed.error);
      return;
    }

    await this.execute<ListAssetsRequest>({
      requestFn: () => classroomio.organization.assets.$get({ query: parsed.data }),
      logContext: 'listing organization assets',
      onSuccess: (response) => {
        this.assets = response.data;
        this.pagination = response.pagination;
      },
      onError: () => {
        snackbar.error('snackbar.media_manager.list_failed');
      }
    });
  }

  async getStorageSummary(query: Partial<TAssetStorageQuery> = {}) {
    const parsed = ZAssetStorageQuery.partial().safeParse(query);
    if (!parsed.success) {
      this.errors = mapZodErrorsToTranslations(parsed.error);
      return;
    }

    await this.execute<typeof classroomio.organization.assets.storage.$get>({
      requestFn: () => classroomio.organization.assets.storage.$get({ query: parsed.data }),
      logContext: 'fetching media manager storage summary',
      onSuccess: (response) => {
        this.storageSummary = response.data;
      },
      onError: () => {
        snackbar.error('snackbar.media_manager.storage_failed');
      }
    });
  }

  async getYouTubeMetadata(url: string): Promise<YouTubeMetadata | null> {
    const query: TYouTubeMetadataQuery = { url };
    const result = ZYouTubeMetadataQuery.safeParse(query);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error);
      return null;
    }

    let metadata: YouTubeMetadata | null = null;
    await this.execute<GetYouTubeMetadataRequest>({
      requestFn: () =>
        classroomio.organization.assets['youtube-metadata'].$get({
          query: result.data
        }),
      logContext: 'resolving YouTube metadata',
      onSuccess: (response) => {
        metadata = response.data;
      }
    });

    return metadata;
  }

  async createAsset(fields: TAssetCreateUpload): Promise<OrganizationAsset | null> {
    const normalizedFields = {
      ...fields,
      durationSeconds: this.normalizeDurationSeconds(fields.durationSeconds)
    };

    const result = ZAssetCreateUpload.safeParse(normalizedFields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error);
      return null;
    }

    let asset: OrganizationAsset | null = null;
    await this.execute<CreateAssetRequest>({
      requestFn: () =>
        classroomio.organization.assets.$post({
          json: result.data
        }),
      logContext: 'creating media asset',
      onSuccess: (response) => {
        asset = response.data;
      },
      onError: () => {
        snackbar.error('snackbar.media_manager.create_failed');
      }
    });

    return asset;
  }

  async updateAsset(assetId: string, fields: TAssetUpdate): Promise<UpdateAssetData | null> {
    const normalizedFields = {
      ...fields,
      durationSeconds: this.normalizeDurationSeconds(fields.durationSeconds)
    };

    const result = ZAssetUpdate.safeParse(normalizedFields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error);
      return null;
    }

    let updated: UpdateAssetData | null = null;
    await this.execute<UpdateAssetRequest>({
      requestFn: () =>
        classroomio.organization.assets[':assetId'].$put({
          param: { assetId },
          json: result.data
        }),
      logContext: 'updating media asset',
      onSuccess: (response) => {
        updated = response.data;
        this.assets = this.assets.map((asset) => (asset.id === response.data.id ? response.data : asset));
      },
      onError: () => {
        snackbar.error('snackbar.media_manager.update_failed');
      }
    });

    return updated;
  }

  async getAssetUsage(assetId: string): Promise<AssetUsageGraph | null> {
    let usage: AssetUsageGraph | null = null;
    await this.execute<GetAssetUsageRequest>({
      requestFn: () =>
        classroomio.organization.assets[':assetId'].usage.$get({
          param: { assetId }
        }),
      logContext: 'fetching media asset usage',
      onSuccess: (response) => {
        usage = response.data;
      },
      onError: () => {
        snackbar.error('snackbar.media_manager.usage_failed');
      }
    });

    return usage;
  }

  async attachAsset(assetId: string, fields: TAssetAttach): Promise<AssetUsage | null> {
    const result = ZAssetAttach.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error);
      return null;
    }

    let usage: AssetUsage | null = null;
    await this.execute<AttachAssetRequest>({
      requestFn: () =>
        classroomio.organization.assets[':assetId'].attach.$post({
          param: { assetId },
          json: result.data
        }),
      logContext: 'attaching media asset',
      onSuccess: (response) => {
        usage = response.data;
      },
      onError: () => {
        snackbar.error('snackbar.media_manager.attach_failed');
      }
    });

    return usage;
  }

  async detachAsset(assetId: string, fields: TAssetDetach): Promise<boolean> {
    const result = ZAssetDetach.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error);
      return false;
    }

    let success = false;
    await this.execute<DetachAssetRequest>({
      requestFn: () =>
        classroomio.organization.assets[':assetId'].detach.$post({
          param: { assetId },
          json: result.data
        }),
      logContext: 'detaching media asset',
      onSuccess: () => {
        success = true;
      },
      onError: () => {
        snackbar.error('snackbar.media_manager.detach_failed');
      }
    });

    return success;
  }

  async getVideoPlaybackUrl(asset: OrganizationAsset): Promise<string | null> {
    return this.getAssetDownloadUrl(asset, { forPlayback: true });
  }

  async getAssetDownloadUrl(
    asset: OrganizationAsset,
    options: {
      forPlayback?: boolean;
    } = {}
  ): Promise<string | null> {
    if (asset.provider !== 'upload' || !asset.storageKey) {
      return asset.sourceUrl ?? null;
    }

    const useDocumentEndpoint =
      !options.forPlayback && (asset.kind === 'document' || asset.mimeType?.startsWith('application/'));
    const endpoint = useDocumentEndpoint
      ? classroomio.course.presign.document.download
      : classroomio.course.presign.video.download;

    const response = await endpoint.$post({
      json: {
        keys: [asset.storageKey]
      }
    });
    const result = await response.json();
    if (!result.success) {
      return null;
    }

    return result.urls[asset.storageKey] ?? null;
  }

  async registerUploadedLessonVideo(params: {
    lessonId: string;
    position: number;
    fileKey: string;
    videoUrl: string;
    fileName: string;
    mimeType: string;
    byteSize: number;
    thumbnailUrl?: string;
    durationSeconds?: number | null;
  }): Promise<OrganizationAsset | null> {
    const asset = await this.createAsset({
      kind: 'video',
      provider: 'upload',
      storageProvider: 's3',
      storageKey: params.fileKey,
      sourceUrl: params.videoUrl,
      mimeType: params.mimeType,
      byteSize: params.byteSize,
      title: params.fileName,
      thumbnailUrl: params.thumbnailUrl,
      durationSeconds: this.normalizeDurationSeconds(params.durationSeconds),
      isExternal: false,
      metadata: {
        fileName: params.fileName,
        createdAt: new Date().toISOString()
      }
    });

    if (!asset) {
      return null;
    }

    await this.attachAsset(asset.id, {
      targetType: 'lesson',
      targetId: params.lessonId,
      slotType: 'lesson_video',
      position: params.position
    });

    return asset;
  }

  async registerUploadedLessonDocument(params: {
    lessonId: string;
    position: number;
    fileKey: string;
    documentUrl: string;
    fileName: string;
    mimeType: string;
    byteSize: number;
  }): Promise<OrganizationAsset | null> {
    const asset = await this.createAsset({
      kind: 'document',
      provider: 'upload',
      storageProvider: 's3',
      storageKey: params.fileKey,
      sourceUrl: params.documentUrl,
      mimeType: params.mimeType,
      byteSize: params.byteSize,
      title: params.fileName,
      isExternal: false,
      metadata: {
        fileName: params.fileName,
        createdAt: new Date().toISOString()
      }
    });

    if (!asset) {
      return null;
    }

    await this.attachAsset(asset.id, {
      targetType: 'lesson',
      targetId: params.lessonId,
      slotType: 'lesson_document',
      position: params.position
    });

    return asset;
  }

  async buildLessonVideoFromAsset(
    asset: OrganizationAsset,
    params: { lessonId?: string; position?: number; slotType?: string } = {}
  ) {
    const url = await this.getVideoPlaybackUrl(asset);
    if (!url) {
      snackbar.error('snackbar.media_manager.resolve_video_failed');
      return null;
    }

    if (params.lessonId) {
      await this.attachAsset(asset.id, {
        targetType: 'lesson',
        targetId: params.lessonId,
        slotType: params.slotType ?? 'lesson_video',
        position: params.position
      });
    }

    return mapAssetToLessonVideo(asset, {
      url,
      key: asset.storageKey
    });
  }
}

export const mediaManagerApi = new MediaManagerApi();
