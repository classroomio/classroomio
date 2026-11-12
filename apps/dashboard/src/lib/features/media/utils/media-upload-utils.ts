import {
  LESSON_DOCUMENT_ACCEPTED_TYPES,
  getFileUploadAcceptAttribute,
  resolveFileUploadMimeType
} from '@cio/utils/file-upload';

import {
  MEDIA_UPLOAD_MAX_CONCURRENT,
  MEDIA_UPLOAD_MAX_CONCURRENT_VIDEO_ENCODES,
  MEDIA_UPLOAD_MAX_FILE_BYTES,
  MEDIA_UPLOAD_VIDEO_TYPES
} from './constants';
import type { MediaUploadItem, MediaUploadKind, MediaUploadSizeLimits } from './types';

export const MEDIA_UPLOAD_ACCEPT_ATTRIBUTE = getFileUploadAcceptAttribute([
  ...MEDIA_UPLOAD_VIDEO_TYPES,
  ...LESSON_DOCUMENT_ACCEPTED_TYPES
]);

/**
 * Sorts a picked file into the kind of asset it becomes and the MIME type it uploads with.
 * Returns null when the media library does not accept the file.
 */
export function resolveMediaUpload(file: File): { kind: MediaUploadKind; mimeType: string } | null {
  const videoMimeType = resolveFileUploadMimeType(file, MEDIA_UPLOAD_VIDEO_TYPES);
  if (videoMimeType) return { kind: 'video', mimeType: videoMimeType };

  const documentMimeType = resolveFileUploadMimeType(file, LESSON_DOCUMENT_ACCEPTED_TYPES);
  if (documentMimeType) return { kind: 'document', mimeType: documentMimeType };

  return null;
}

/** Per-kind size ceilings: the 1 GB media limit, lowered to the deployment's own limit where that is smaller. */
export function resolveMediaUploadSizeLimits(deployment: {
  videoBytes: number;
  documentBytes: number;
}): MediaUploadSizeLimits {
  return {
    video: Math.min(MEDIA_UPLOAD_MAX_FILE_BYTES, deployment.videoBytes),
    document: Math.min(MEDIA_UPLOAD_MAX_FILE_BYTES, deployment.documentBytes)
  };
}

export function isMediaUploadInFlight(item: MediaUploadItem): boolean {
  return item.status === 'queued' || item.status === 'uploading';
}

/** Average progress across every listed file, from 0 to 100. Reaches 100 only once every file is done. */
export function getMediaUploadOverallProgress(items: MediaUploadItem[]): number {
  if (items.length === 0) return 0;

  const total = items.reduce((sum, item) => sum + (item.status === 'done' ? 100 : item.progress), 0);

  return Math.floor(total / items.length);
}

/**
 * The queued files that may start now. At most `MEDIA_UPLOAD_MAX_CONCURRENT` files transfer at once, and at most
 * `MEDIA_UPLOAD_MAX_CONCURRENT_VIDEO_ENCODES` of them are videos the browser encodes; a waiting video does not
 * hold back the files queued behind it.
 */
export function pickUploadsToStart(
  items: MediaUploadItem[],
  isEncodedVideo: (item: MediaUploadItem) => boolean
): MediaUploadItem[] {
  const active = items.filter((item) => item.status === 'uploading');
  let freeSlots = MEDIA_UPLOAD_MAX_CONCURRENT - active.length;
  let freeEncodes = MEDIA_UPLOAD_MAX_CONCURRENT_VIDEO_ENCODES - active.filter(isEncodedVideo).length;
  const picked: MediaUploadItem[] = [];

  for (const item of items) {
    if (freeSlots <= 0) break;
    if (item.status !== 'queued') continue;

    if (isEncodedVideo(item)) {
      if (freeEncodes <= 0) continue;

      freeEncodes -= 1;
    }

    freeSlots -= 1;
    picked.push(item);
  }

  return picked;
}
