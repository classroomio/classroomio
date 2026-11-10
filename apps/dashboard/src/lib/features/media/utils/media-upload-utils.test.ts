import { describe, expect, it } from 'vitest';

import { MEDIA_UPLOAD_MAX_FILE_BYTES } from './constants';
import {
  getMediaUploadOverallProgress,
  pickUploadsToStart,
  resolveMediaUpload,
  resolveMediaUploadSizeLimits
} from './media-upload-utils';
import type { MediaUploadItem } from './types';

function uploadItem(overrides: Partial<MediaUploadItem>): MediaUploadItem {
  return {
    id: crypto.randomUUID(),
    file: new File(['x'], 'lesson.mp4', { type: 'video/mp4' }),
    kind: 'video',
    status: 'uploading',
    progress: 0,
    errorMessage: null,
    ...overrides
  };
}

describe('resolveMediaUpload', () => {
  it('sorts videos and documents into their asset kind', () => {
    expect(resolveMediaUpload(new File(['x'], 'lesson.mp4', { type: 'video/mp4' }))).toEqual({
      kind: 'video',
      mimeType: 'video/mp4'
    });
    expect(resolveMediaUpload(new File(['x'], 'handbook.pdf', { type: 'application/pdf' }))).toEqual({
      kind: 'document',
      mimeType: 'application/pdf'
    });
  });

  it('resolves the type from the extension when the browser reports none', () => {
    expect(resolveMediaUpload(new File(['x'], 'recording.mkv', { type: '' }))).toEqual({
      kind: 'video',
      mimeType: 'video/x-matroska'
    });
  });

  it('rejects files the media library does not accept', () => {
    expect(resolveMediaUpload(new File(['x'], 'archive.zip', { type: 'application/zip' }))).toBeNull();
  });
});

describe('resolveMediaUploadSizeLimits', () => {
  it('uses the deployment limits when they are below 1 GB', () => {
    const deployment = { videoBytes: 800 * 1024 * 1024, documentBytes: 5 * 1024 * 1024 };

    expect(resolveMediaUploadSizeLimits(deployment)).toEqual({
      video: deployment.videoBytes,
      document: deployment.documentBytes
    });
  });

  it('never exceeds 1 GB', () => {
    const limits = resolveMediaUploadSizeLimits({
      videoBytes: 4 * MEDIA_UPLOAD_MAX_FILE_BYTES,
      documentBytes: 4 * MEDIA_UPLOAD_MAX_FILE_BYTES
    });

    expect(limits).toEqual({ video: MEDIA_UPLOAD_MAX_FILE_BYTES, document: MEDIA_UPLOAD_MAX_FILE_BYTES });
  });
});

describe('getMediaUploadOverallProgress', () => {
  it('averages every file and counts finished ones as complete', () => {
    const items = [
      uploadItem({ status: 'done', progress: 100 }),
      uploadItem({ progress: 50 }),
      uploadItem({ status: 'queued' })
    ];

    expect(getMediaUploadOverallProgress(items)).toBe(50);
  });

  it('stays below 100 until every file is done', () => {
    const items = [uploadItem({ status: 'done', progress: 100 }), uploadItem({ progress: 99 })];

    expect(getMediaUploadOverallProgress(items)).toBe(99);
  });

  it('is 0 for an empty list', () => {
    expect(getMediaUploadOverallProgress([])).toBe(0);
  });
});

describe('pickUploadsToStart', () => {
  const isEncodedVideo = (item: MediaUploadItem) => item.kind === 'video';
  const queuedVideo = () => uploadItem({ status: 'queued', kind: 'video' });
  const queuedDocument = () => uploadItem({ status: 'queued', kind: 'document' });

  it('starts at most two encoded videos at once', () => {
    const items = [queuedVideo(), queuedVideo(), queuedVideo(), queuedVideo(), queuedVideo()];

    expect(pickUploadsToStart(items, isEncodedVideo)).toEqual(items.slice(0, 2));
  });

  it('lets documents start behind videos that are waiting for an encode slot', () => {
    const items = [queuedVideo(), queuedVideo(), queuedVideo(), queuedDocument(), queuedDocument()];

    const picked = pickUploadsToStart(items, isEncodedVideo);

    expect(picked).toEqual([items[0], items[1], items[3], items[4]]);
  });

  it('counts videos that are already uploading against the encode cap', () => {
    const items = [uploadItem({ status: 'uploading', kind: 'video' }), queuedVideo(), queuedVideo(), queuedDocument()];

    expect(pickUploadsToStart(items, isEncodedVideo)).toEqual([items[1], items[3]]);
  });

  it('never exceeds five transfers in total', () => {
    const items = [
      uploadItem({ status: 'uploading', kind: 'document' }),
      uploadItem({ status: 'uploading', kind: 'document' }),
      uploadItem({ status: 'uploading', kind: 'document' }),
      queuedDocument(),
      queuedDocument(),
      queuedDocument()
    ];

    expect(pickUploadsToStart(items, isEncodedVideo)).toEqual([items[3], items[4]]);
  });

  it('does not cap videos that are not encoded in the browser', () => {
    const items = [queuedVideo(), queuedVideo(), queuedVideo(), queuedVideo(), queuedVideo()];

    expect(pickUploadsToStart(items, () => false)).toEqual(items);
  });
});
