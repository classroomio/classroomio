import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAssetById: vi.fn(),
  finalizeServerHls: vi.fn(),
  touchConvertingAsset: vi.fn(),
  failConvertingAsset: vi.fn(),
  generateUploadPresignedUrl: vi.fn(),
  getStorageConfig: vi.fn()
}));

vi.mock('@cio/db/queries/assets', () => ({
  getAssetById: mocks.getAssetById,
  finalizeServerHls: mocks.finalizeServerHls,
  touchConvertingAsset: mocks.touchConvertingAsset,
  failConvertingAsset: mocks.failConvertingAsset
}));

vi.mock('@cio/core/utils/s3', () => ({
  generateUploadPresignedUrl: mocks.generateUploadPresignedUrl
}));

vi.mock('@cio/core/config/storage', () => ({
  getStorageConfig: mocks.getStorageConfig
}));

import {
  failEncoderJobService,
  finalizeEncoderOutputService,
  presignEncoderOutputsService,
  recordEncoderProgressService
} from '@api/services/internal/encoder';

const ORG_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const ASSET_ID = '9c858901-8a57-4791-81fe-4c455b099bc9';

const finalizePayload = {
  manifestPath: 'master.m3u8',
  audioPath: 'audio/stream.m3u8',
  renditions: ['p360', 'p720'],
  sourceWidth: 1280,
  sourceHeight: 720,
  durationSeconds: 42
};

describe('internal encoder callbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAssetById.mockResolvedValue({ id: ASSET_ID, hlsManifestKey: null });
    mocks.finalizeServerHls.mockResolvedValue({ id: ASSET_ID });
    mocks.touchConvertingAsset.mockResolvedValue(true);
    mocks.failConvertingAsset.mockResolvedValue(true);
    mocks.getStorageConfig.mockReturnValue({ bucketVideos: 'videos' });
    mocks.generateUploadPresignedUrl.mockResolvedValue('https://storage.example.com/signed');
  });

  describe('finalize', () => {
    it('leaves the converting guard to decide, rather than forcing the status first', async () => {
      await finalizeEncoderOutputService(ASSET_ID, ORG_ID, finalizePayload);

      expect(mocks.finalizeServerHls).toHaveBeenCalledOnce();
      expect(mocks.touchConvertingAsset).not.toHaveBeenCalled();
    });

    it('rejects a superseded job whose asset is no longer converting', async () => {
      mocks.finalizeServerHls.mockResolvedValue(null);

      await expect(finalizeEncoderOutputService(ASSET_ID, ORG_ID, finalizePayload)).rejects.toMatchObject({
        statusCode: 409
      });
    });

    it('refuses to overwrite an asset that already has a manifest', async () => {
      mocks.getAssetById.mockResolvedValue({ id: ASSET_ID, hlsManifestKey: `${ASSET_ID}/master.m3u8` });

      await expect(finalizeEncoderOutputService(ASSET_ID, ORG_ID, finalizePayload)).rejects.toMatchObject({
        statusCode: 409
      });
      expect(mocks.finalizeServerHls).not.toHaveBeenCalled();
    });

    it('prefixes every output path with the asset id', async () => {
      await finalizeEncoderOutputService(ASSET_ID, ORG_ID, finalizePayload);

      expect(mocks.finalizeServerHls).toHaveBeenCalledWith(
        ASSET_ID,
        ORG_ID,
        expect.objectContaining({
          manifestKey: `${ASSET_ID}/master.m3u8`,
          audioKey: `${ASSET_ID}/audio/stream.m3u8`
        })
      );
    });
  });

  describe('progress', () => {
    it('refreshes the claim so a long encode is not reclaimed as stale', async () => {
      await recordEncoderProgressService(ASSET_ID, ORG_ID, { stage: 'encode', percent: 40 });

      expect(mocks.touchConvertingAsset).toHaveBeenCalledWith(ASSET_ID, ORG_ID);
    });

    it('cannot move a failed asset back to converting', async () => {
      mocks.touchConvertingAsset.mockResolvedValue(false);

      await expect(
        recordEncoderProgressService(ASSET_ID, ORG_ID, { stage: 'encode', percent: 40 })
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('fail', () => {
    it('records the failure while the job still owns the asset', async () => {
      await failEncoderJobService(ASSET_ID, ORG_ID, { reason: 'ffmpeg exited 1' });

      expect(mocks.failConvertingAsset).toHaveBeenCalledWith(ASSET_ID, ORG_ID);
    });

    it('cannot un-ready an asset another job already finalized', async () => {
      mocks.failConvertingAsset.mockResolvedValue(false);

      await expect(failEncoderJobService(ASSET_ID, ORG_ID, { reason: 'stale job' })).rejects.toMatchObject({
        statusCode: 409
      });
    });

    it('reports a missing asset rather than a conflict', async () => {
      mocks.getAssetById.mockResolvedValue(null);

      await expect(failEncoderJobService(ASSET_ID, ORG_ID, { reason: 'whatever' })).rejects.toMatchObject({
        statusCode: 404
      });
      expect(mocks.failConvertingAsset).not.toHaveBeenCalled();
    });
  });

  describe('output presigning', () => {
    it('confines every path to the asset prefix', async () => {
      await presignEncoderOutputsService(ASSET_ID, ORG_ID, { paths: ['master.m3u8', 'p720/segment0.ts'] });

      const keys = mocks.generateUploadPresignedUrl.mock.calls.map(([key]) => key);
      expect(keys).toEqual([`${ASSET_ID}/master.m3u8`, `${ASSET_ID}/p720/segment0.ts`]);
    });

    it('refuses a file type an encoder has no reason to write', async () => {
      await expect(presignEncoderOutputsService(ASSET_ID, ORG_ID, { paths: ['payload.sh'] })).rejects.toMatchObject({
        statusCode: 400
      });
    });
  });
});
