import type { OrganizationAsset } from './types';

type LessonVideoType = 'upload' | 'youtube' | 'generic';

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || Number.isNaN(bytes) || bytes < 0) {
    return '-';
  }

  if (bytes === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, exponent);

  return `${size.toFixed(size >= 100 || exponent === 0 ? 0 : 2)} ${units[exponent]}`;
}

export function mapAssetProviderToLessonVideoType(provider: string): LessonVideoType {
  if (provider === 'youtube') return 'youtube';
  if (provider === 'generic' || provider === 'external_url') return 'generic';
  return 'upload';
}

export function mapAssetToLessonVideo(
  asset: OrganizationAsset,
  options: { url: string; key?: string | null }
): {
  type: LessonVideoType;
  link: string;
  key?: string;
  assetId: string;
  fileName?: string;
  metadata?: {
    title?: string;
    description?: string;
    thumbnailUrl?: string;
    duration?: number;
    aspectRatio?: string;
    createdAt?: string;
  };
} {
  return {
    type: mapAssetProviderToLessonVideoType(asset.provider),
    link: options.url,
    key: options.key ?? asset.storageKey ?? undefined,
    assetId: asset.id,
    fileName: asset.title ?? undefined,
    metadata: {
      title: asset.title ?? undefined,
      description: asset.description ?? undefined,
      thumbnailUrl: asset.thumbnailUrl ?? undefined,
      duration: asset.durationSeconds ?? undefined,
      aspectRatio: asset.aspectRatio ?? undefined,
      createdAt: asset.createdAt ?? undefined
    }
  };
}
