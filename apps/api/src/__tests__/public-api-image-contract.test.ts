import { describe, expect, it } from 'vitest';

import { ZPublicApiCreateImageUpload, ZPublicApiImageUploadResponse } from '@cio/utils/validation/public-api';
import { ZPublicApiCreateLessonBlock, ZPublicApiUpdateLessonBlock } from '@cio/utils/validation/public-api';

const valid = {
  purpose: 'cover',
  fileName: 'banner.png',
  mimeType: 'image/png',
  byteSize: 204800
};

describe('ZPublicApiCreateImageUpload', () => {
  it('accepts a well-formed request', () => {
    expect(ZPublicApiCreateImageUpload.safeParse(valid).success).toBe(true);
  });

  it.each(['content', 'cover', 'avatar'])('accepts the %s purpose', (purpose) => {
    expect(ZPublicApiCreateImageUpload.safeParse({ ...valid, purpose }).success).toBe(true);
  });

  it('rejects an unknown purpose', () => {
    expect(ZPublicApiCreateImageUpload.safeParse({ ...valid, purpose: 'banner' }).success).toBe(false);
  });

  it.each(['image/svg+xml', 'text/html', 'image/heic', 'video/mp4'])('rejects the %s content type', (mimeType) => {
    expect(ZPublicApiCreateImageUpload.safeParse({ ...valid, mimeType }).success).toBe(false);
  });

  it.each(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'])('accepts %s', (mimeType) => {
    expect(ZPublicApiCreateImageUpload.safeParse({ ...valid, mimeType }).success).toBe(true);
  });

  it.each([
    ['zero', 0],
    ['negative', -1],
    ['fractional', 1.5]
  ])('rejects a %s byteSize', (_label, byteSize) => {
    expect(ZPublicApiCreateImageUpload.safeParse({ ...valid, byteSize }).success).toBe(false);
  });

  it('requires every field', () => {
    for (const field of ['purpose', 'fileName', 'mimeType', 'byteSize'] as const) {
      const { [field]: _omitted, ...rest } = valid;
      expect(ZPublicApiCreateImageUpload.safeParse(rest).success, `${field} should be required`).toBe(false);
    }
  });

  it('does not accept a caller-supplied storage key', () => {
    const result = ZPublicApiCreateImageUpload.safeParse({ ...valid, fileKey: 'other-org/banner.png' });

    expect(result.success && 'fileKey' in result.data).toBe(false);
  });
});

describe('ZPublicApiImageUploadResponse', () => {
  it('exposes only the public url, upload URL and expiry', () => {
    const result = ZPublicApiImageUploadResponse.safeParse({
      url: 'https://media.example.com/org/banner.png',
      uploadUrl: 'https://storage.example.com/signed?sig=x',
      expiresAt: '2026-11-26T12:00:00.000Z',
      fileKey: 'org/banner.png'
    });

    expect(result.success && Object.keys(result.data).sort()).toEqual(['expiresAt', 'uploadUrl', 'url']);
  });
});

describe('image lesson blocks', () => {
  it('accepts an image block with an https URL', () => {
    const result = ZPublicApiCreateLessonBlock.safeParse({
      type: 'image',
      image: { url: 'https://media.example.com/org/diagram.png', alt: 'Diagram', fit: 'contain' }
    });

    expect(result.success).toBe(true);
  });

  it.each(['javascript:alert(1)', 'data:image/png;base64,AAAA', 'ftp://example.com/a.png'])(
    'rejects a %s image URL',
    (url) => {
      expect(ZPublicApiCreateLessonBlock.safeParse({ type: 'image', image: { url } }).success).toBe(false);
      expect(ZPublicApiUpdateLessonBlock.safeParse({ expectedVersion: 1, image: { url } }).success).toBe(false);
    }
  );
});
