import { describe, expect, it } from 'vitest';

import { ZPublicApiAssetUploadResponse, ZPublicApiCreateAsset } from '@cio/utils/validation/public-api';

/**
 * Contract tests for the asset upload resource. These exist so a change to an
 * internal asset schema cannot quietly alter the public shape, and so `fileKey`
 * cannot creep back across the boundary.
 */
const valid = {
  kind: 'video',
  fileName: 'lecture-1.mp4',
  mimeType: 'video/mp4',
  byteSize: 52428800
};

describe('ZPublicApiCreateAsset', () => {
  it('accepts a well-formed request', () => {
    expect(ZPublicApiCreateAsset.safeParse(valid).success).toBe(true);
  });

  it('rejects a mimeType outside the supported upload types', () => {
    expect(ZPublicApiCreateAsset.safeParse({ ...valid, mimeType: 'video/webm' }).success).toBe(false);
    expect(ZPublicApiCreateAsset.safeParse({ ...valid, mimeType: 'application/pdf' }).success).toBe(false);
  });

  it('rejects a kind that has no upload path yet', () => {
    for (const kind of ['image', 'document', 'audio']) {
      expect(ZPublicApiCreateAsset.safeParse({ ...valid, kind }).success, kind).toBe(false);
    }
  });

  it.each([
    ['zero', 0],
    ['negative', -1],
    ['fractional', 1.5]
  ])('rejects a %s byteSize', (_label, byteSize) => {
    expect(ZPublicApiCreateAsset.safeParse({ ...valid, byteSize }).success).toBe(false);
  });

  it('requires every field, since none can be defaulted safely', () => {
    for (const field of ['kind', 'fileName', 'mimeType', 'byteSize'] as const) {
      const { [field]: _omitted, ...rest } = valid;
      expect(ZPublicApiCreateAsset.safeParse(rest).success, `${field} should be required`).toBe(false);
    }
  });

  it('rejects an empty or oversized fileName', () => {
    expect(ZPublicApiCreateAsset.safeParse({ ...valid, fileName: '' }).success).toBe(false);
    expect(ZPublicApiCreateAsset.safeParse({ ...valid, fileName: 'a'.repeat(256) }).success).toBe(false);
  });

  it('does not accept a caller-supplied storage key or asset id', () => {
    const result = ZPublicApiCreateAsset.safeParse({ ...valid, fileKey: 'someone/else.mp4', assetId: 'x' });

    expect(result.success).toBe(true);
    expect(result.success && 'fileKey' in result.data).toBe(false);
    expect(result.success && 'assetId' in result.data).toBe(false);
  });
});

describe('ZPublicApiAssetUploadResponse', () => {
  it('exposes only the asset id, upload URL and expiry', () => {
    const result = ZPublicApiAssetUploadResponse.safeParse({
      assetId: '9c858901-8a57-4791-81fe-4c455b099bc9',
      uploadUrl: 'https://storage.example.com/signed?sig=x',
      expiresAt: '2026-09-27T12:00:00.000Z'
    });

    expect(result.success).toBe(true);
    expect(result.success && Object.keys(result.data).sort()).toEqual(['assetId', 'expiresAt', 'uploadUrl']);
  });

  it('never carries a storage key, so the object layout stays internal', () => {
    const result = ZPublicApiAssetUploadResponse.safeParse({
      assetId: '9c858901-8a57-4791-81fe-4c455b099bc9',
      uploadUrl: 'https://storage.example.com/signed?sig=x',
      expiresAt: '2026-09-27T12:00:00.000Z',
      fileKey: '9c858901-8a57-4791-81fe-4c455b099bc9/source.mp4'
    });

    expect(result.success && 'fileKey' in result.data).toBe(false);
  });

  it('requires a uuid asset id', () => {
    const result = ZPublicApiAssetUploadResponse.safeParse({
      assetId: 'not-a-uuid',
      uploadUrl: 'https://storage.example.com/signed?sig=x',
      expiresAt: '2026-09-27T12:00:00.000Z'
    });

    expect(result.success).toBe(false);
  });
});
