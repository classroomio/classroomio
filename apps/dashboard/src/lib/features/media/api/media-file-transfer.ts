import axios from 'axios';
import { env as publicEnv } from '$env/dynamic/public';

import { presignApi } from '$features/course/api';
import { cleanupAbortedHlsUpload, encodeAndUploadHls } from '$features/course/components/lesson/video/hls-encoder';
import { MediaUploader } from '$features/course/components/lesson/video/media-uploader';

import type { MediaFileTransferOptions, MediaUploadKind } from '../utils/types';
import { mediaApi } from './media-manager.svelte';

const MAX_PROGRESS_BEFORE_REGISTRATION = 99;

export function encodesVideoInBrowser(): boolean {
  return publicEnv.PUBLIC_IS_SELFHOSTED !== 'true';
}

/**
 * Uploads one file into the organization's media library without attaching it to a lesson.
 * Throws when the upload fails or `signal` aborts.
 */
export async function uploadMediaFile(
  file: File,
  kind: MediaUploadKind,
  options: MediaFileTransferOptions
): Promise<void> {
  if (kind === 'document') {
    await uploadDocument(file, options);
    return;
  }

  if (encodesVideoInBrowser()) {
    await uploadEncodedVideo(file, options);
    return;
  }

  await uploadSourceVideo(file, options);
}

async function putToPresignedUrl(url: string, file: File, options: MediaFileTransferOptions): Promise<void> {
  await axios.put(url, file, {
    headers: { 'Content-Type': file.type },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    signal: options.signal,
    onUploadProgress: (event) => {
      const percent = Math.round((event.loaded * 100) / (event.total || file.size || 1));
      options.onProgress(Math.min(percent, MAX_PROGRESS_BEFORE_REGISTRATION));
    }
  });
}

async function uploadDocument(file: File, options: MediaFileTransferOptions): Promise<void> {
  const presigned = await presignApi.getDocumentUploadUrl(file.name, file.type, file.size);
  if (!presigned) throw new Error('Failed to get presigned upload URL');

  options.signal.throwIfAborted();
  await putToPresignedUrl(presigned.url, file, options);

  const downloadUrls = await presignApi.getDocumentDownloadUrls([presigned.fileKey]);
  options.signal.throwIfAborted();

  const documentUrl = downloadUrls[presigned.fileKey];
  if (!documentUrl) throw new Error('Failed to get the uploaded document URL');

  const asset = await mediaApi.registerUploadedDocument({
    fileKey: presigned.fileKey,
    documentUrl,
    fileName: file.name,
    mimeType: file.type,
    byteSize: file.size
  });
  if (!asset) throw new Error('Failed to save the uploaded document');
}

async function uploadEncodedVideo(file: File, options: MediaFileTransferOptions): Promise<void> {
  let reservedAssetId: string | null = null;

  try {
    await encodeAndUploadHls({
      file,
      title: file.name,
      signal: options.signal,
      onAssetReserved: (assetId) => {
        reservedAssetId = assetId;
      },
      onProgress: (progress) => options.onProgress(Math.min(progress.percent, 100))
    });
  } catch (error) {
    if (options.signal.aborted && reservedAssetId) {
      void cleanupAbortedHlsUpload(reservedAssetId);
    }

    throw error;
  }
}

async function uploadSourceVideo(file: File, options: MediaFileTransferOptions): Promise<void> {
  const presigned = await presignApi.getVideoUploadUrl(file.name, file.type, file.size);
  if (!presigned) throw new Error('Failed to get presigned upload URL');

  options.signal.throwIfAborted();

  const mediaUploader = new MediaUploader();
  const [, thumbnail] = await Promise.all([
    putToPresignedUrl(presigned.url, file, options),
    mediaUploader.uploadVideoThumbnail(file)
  ]);

  const downloadUrls = await presignApi.getVideoDownloadUrls([presigned.fileKey]);
  options.signal.throwIfAborted();

  const videoUrl = downloadUrls[presigned.fileKey];
  if (!videoUrl) throw new Error('Failed to get the uploaded video URL');

  const asset = await mediaApi.registerUploadedVideo({
    fileKey: presigned.fileKey,
    videoUrl,
    fileName: file.name,
    mimeType: file.type,
    byteSize: file.size,
    thumbnailUrl: thumbnail?.url,
    durationSeconds: thumbnail?.durationSeconds
  });
  if (!asset) throw new Error('Failed to save the uploaded video');
}
