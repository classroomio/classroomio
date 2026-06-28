import { t } from '$lib/utils/functions/translations';
import type { OrganizationAsset } from './types';

type LessonVideoType = 'upload' | 'youtube' | 'generic' | 'google_drive';

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

/**
 * For values that already render in GB or TB, return the equivalent in the
 * next-smaller unit so users keep a feel for the scale (e.g. `1.50 GB` →
 * `≈ 1,536 MB`). Returns `null` for sub-GB sizes where no extra context is
 * helpful.
 */
export function formatBytesSecondary(bytes: number | null | undefined): string | null {
  if (bytes == null || Number.isNaN(bytes) || bytes <= 0) {
    return null;
  }

  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;
  const TB = GB * 1024;

  if (bytes >= TB) {
    const inGb = bytes / GB;
    return `≈ ${formatNumber(inGb, inGb >= 100 ? 0 : 2)} GB`;
  }

  if (bytes >= GB) {
    const inMb = bytes / MB;
    return `≈ ${formatNumber(inMb, inMb >= 100 ? 0 : 2)} MB`;
  }

  return null;
}

function formatNumber(value: number, fractionDigits: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  });
}

export function mapAssetProviderToLessonVideoType(provider: string): LessonVideoType {
  if (provider === 'youtube') return 'youtube';
  if (provider === 'google_drive') return 'google_drive';
  if (provider === 'generic' || provider === 'external_url') return 'generic';
  return 'upload';
}

/**
 * An HLS asset has no playable `storageKey` — its renditions live behind the
 * `/hls/{assetId}/...` proxy and are streamed via a signed cookie, not a
 * presigned URL. The lesson video stores the relative manifest path + `hls`
 * flag so the player resolves and mints the cookie itself.
 */
export function isHlsAsset(asset: OrganizationAsset): boolean {
  return Boolean(asset.hlsManifestKey);
}

export function getAssetHlsManifestLink(asset: OrganizationAsset): string {
  return `/hls/${asset.id}/master.m3u8`;
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
    hls?: boolean;
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
      createdAt: asset.createdAt ?? undefined,
      ...(isHlsAsset(asset) ? { hls: true } : {})
    }
  };
}

export function getAssetDisplayName(asset: OrganizationAsset): string {
  return asset.title?.trim() || asset.storageKey || asset.id;
}

export function getTargetTypeLabel(targetType: string): string {
  const keyMap: Record<string, string> = {
    lesson: 'media_manager.usage.target.lesson',
    exercise: 'media_manager.usage.target.exercise',
    question: 'media_manager.usage.target.question'
  };
  return t.get(keyMap[targetType] ?? 'media_manager.usage.target.unknown');
}

export function getSlotTypeLabel(slotType: string): string {
  const keyMap: Record<string, string> = {
    lesson_video: 'media_manager.usage.slot_type.lesson_video',
    lesson_document: 'media_manager.usage.slot_type.lesson_document'
  };
  return t.get(keyMap[slotType] ?? 'media_manager.usage.slot_type.unknown');
}

export function formatUsageDate(value: string | null | undefined): string {
  if (!value) {
    return t.get('media_manager.common.not_available');
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return t.get('media_manager.common.not_available');
  }
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}
