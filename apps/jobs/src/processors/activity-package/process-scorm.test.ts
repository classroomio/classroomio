import { copyFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fixturesDir = fileURLToPath(new URL('../../../../../packages/activity-packages/test/fixtures', import.meta.url));
const fixturePath = (name: string) => join(fixturesDir, name);

const state = vi.hoisted(() => ({
  currentFixture: '',
  headBytes: 6871 as number | null,
  uploadedKeys: [] as { bucket: string; key: string }[],
  uploadedBuffers: [] as { bucket: string; key: string; body: Buffer }[],
  insertedUnits: [] as Record<string, unknown>[],
  assetUpdates: [] as { assetId: string; patch: Record<string, unknown> }[],
  currentVersion: null as Record<string, unknown> | null,
  versions: new Map<string, Record<string, unknown>>(),
  mediaJobs: new Map<string, Record<string, unknown>>()
}));

const baseVersion = () => ({
  id: payload.packageVersionId,
  assetId: payload.assetId,
  versionNumber: 1,
  status: 'uploading',
  format: null,
  uploadKey: 'scorm/asset-1/v1.zip',
  contentPrefix: 'scorm/asset-1/v1',
  warnings: [],
  error: null
});

const baseAsset = () => ({
  id: payload.assetId,
  organizationId: payload.actorContext.organizationId,
  kind: 'scorm',
  status: 'processing'
});

vi.mock('../../config/storage', () => ({
  getS3Client: () => ({
    send: async () => {
      if (state.headBytes === null) throw { $metadata: { httpStatusCode: 404 }, name: 'NotFound' };
      return { ContentLength: state.headBytes };
    }
  })
}));

vi.mock('../../utils/storage', async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return {
    ...original,
    scormBucket: () => 'scorm',
    downloadObjectToTempFile: async () => {
      const dir = await mkdtemp(join(tmpdir(), 'scorm-test-'));
      const localPath = join(dir, 'package.zip');
      await copyFile(state.currentFixture, localPath);
      return localPath;
    },
    uploadStreamToBucket: async (bucket: string, key: string) => {
      state.uploadedKeys.push({ bucket, key });
    },
    uploadBufferToBucket: async (bucket: string, key: string, body: Buffer) => {
      state.uploadedBuffers.push({ bucket, key, body });
    }
  };
});

vi.mock('../../utils/cancel', () => ({
  JobCanceledError: class JobCanceledError extends Error {},
  errorMessage: (error: unknown) => (error instanceof Error ? error.message : String(error)),
  isMediaJobCancelRequested: async () => false,
  throwIfCancelRequested: async () => {}
}));

vi.mock('../../utils/logger', () => ({
  log: { info: () => {}, warn: () => {}, error: () => {} }
}));

vi.mock('@cio/db/queries', () => ({
  bulkInsertPackageUnits: async (values: Record<string, unknown>[]) => {
    state.insertedUnits = values;
    return values;
  },
  deletePackageUnitsByVersion: async () => 0,
  getAssetById: async () => ({ ...baseAsset() }),
  getCurrentPackageVersion: async () => state.currentVersion,
  getPackageVersionById: async (id: string) => state.versions.get(id) ?? null,
  setCurrentPackageVersion: async (id: string) => {
    const row = { ...(state.versions.get(id) ?? {}), isCurrent: true };
    state.versions.set(id, row);
    state.currentVersion = row;
    return row;
  },
  updateAsset: async (assetId: string, _org: string, patch: Record<string, unknown>) => {
    state.assetUpdates.push({ assetId, patch });
    return { ...baseAsset(), ...patch };
  },
  updateMediaJob: async (id: string, patch: Record<string, unknown>) => {
    const row = { ...(state.mediaJobs.get(id) ?? { id }), ...patch };
    state.mediaJobs.set(id, row);
    return row;
  },
  updatePackageVersion: async (id: string, patch: Record<string, unknown>) => {
    const row = { ...(state.versions.get(id) ?? {}), ...patch };
    state.versions.set(id, row);
    return row;
  }
}));

import { UnrecoverableError } from 'bullmq';
import { hasZipMagicBytes, mapUnitsToRows, processScormPackage, resolveScormLimitMb } from './process-scorm';

const payload = {
  mediaJobId: '123e4567-e89b-12d3-a456-426614174000',
  assetId: '223e4567-e89b-12d3-a456-426614174001',
  packageVersionId: '323e4567-e89b-12d3-a456-426614174002',
  actorContext: {
    userId: '423e4567-e89b-12d3-a456-426614174003',
    organizationId: '523e4567-e89b-12d3-a456-426614174004'
  }
};

describe('processScormPackage (PR 6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.versions.clear();
    state.mediaJobs.clear();
    state.uploadedKeys.length = 0;
    state.uploadedBuffers.length = 0;
    state.insertedUnits = [];
    state.assetUpdates = [];
    state.currentVersion = null;
    state.currentFixture = fixturePath('scorm12-minimal.zip');
    state.headBytes = 6871;
    delete process.env.UPLOAD_MAX_SCORM_MB;
    state.versions.set(payload.packageVersionId, baseVersion());
  });

  it('processes a SCORM 1.2 package to ready with one unit', async () => {
    const result = await processScormPackage(payload);

    expect(result.format).toBe('scorm12');
    expect(result.fileCount).toBe(2);

    const version = state.versions.get(payload.packageVersionId) as Record<string, unknown>;
    expect(version.status).toBe('ready');
    expect(version.format).toBe('scorm12');
    expect(version.zipBytes).toBe(6871);
    expect(version.fileCount).toBe(2);
    expect(version.error).toBeNull();

    expect(state.insertedUnits).toHaveLength(1);
    expect(state.insertedUnits[0]).toMatchObject({ identifier: expect.any(String), unitType: 'sco' });

    const keys = state.uploadedKeys.map((entry) => entry.key);
    expect(keys).toContain('scorm/asset-1/v1/sco.html');
    expect(keys).toContain('scorm/asset-1/v1/imsmanifest.xml');
    const indexUpload = state.uploadedBuffers.find((entry) => entry.key === 'scorm/asset-1/v1/index.json');
    expect(indexUpload).toBeDefined();
    const indexListing: unknown = JSON.parse(indexUpload!.body.toString('utf-8'));
    expect(Array.isArray(indexListing)).toBe(true);
    expect(indexListing).toEqual(expect.arrayContaining(['sco.html', 'imsmanifest.xml']));
    for (const entry of indexListing as unknown[]) expect(typeof entry).toBe('string');

    expect(state.mediaJobs.get(payload.mediaJobId)).toMatchObject({ status: 'completed' });
    expect(state.assetUpdates).toContainEqual({ assetId: payload.assetId, patch: { status: 'active' } });
  });

  it('processes a three-module SCORM 2004 package', async () => {
    state.currentFixture = fixturePath('scorm2004-three-modules.zip');
    state.headBytes = 5692;

    const result = await processScormPackage(payload);

    expect(result.format).toBe('scorm2004_4');
    expect(state.insertedUnits).toHaveLength(3);
    const graded = state.insertedUnits.find((unit) => unit.identifier === 'ITEM-3');
    expect(graded).toMatchObject({ masteryScore: null });
    expect((graded?.formatDetails as Record<string, unknown>)?.scaledPassingScore).toBe(0.8);
  });

  it('rejects an assets-only package without retry', async () => {
    state.currentFixture = fixturePath('reject-assets-only.zip');
    state.headBytes = 1000;

    await expect(processScormPackage(payload)).rejects.toBeInstanceOf(UnrecoverableError);
    expect((state.versions.get(payload.packageVersionId) as Record<string, unknown>).status).toBe('failed');
    expect((state.versions.get(payload.packageVersionId) as Record<string, unknown>).error).toMatchObject({
      code: 'assets_only'
    });
    expect(state.mediaJobs.get(payload.mediaJobId)).toMatchObject({ status: 'failed' });
  });

  it('rejects a package launching from another website', async () => {
    state.currentFixture = fixturePath('reject-external-launch.zip');
    state.headBytes = 1000;

    await expect(processScormPackage(payload)).rejects.toBeInstanceOf(UnrecoverableError);
    expect((state.versions.get(payload.packageVersionId) as Record<string, unknown>).error).toMatchObject({
      code: 'external_launch'
    });
  });

  it('rejects an oversized ZIP against the real object size', async () => {
    process.env.UPLOAD_MAX_SCORM_MB = '0.001';

    await expect(processScormPackage(payload)).rejects.toBeInstanceOf(UnrecoverableError);
    expect((state.versions.get(payload.packageVersionId) as Record<string, unknown>).error).toMatchObject({
      code: 'file_too_large'
    });
  });

  it('rejects a missing upload', async () => {
    state.headBytes = null;

    await expect(processScormPackage(payload)).rejects.toBeInstanceOf(UnrecoverableError);
    expect((state.versions.get(payload.packageVersionId) as Record<string, unknown>).error).toMatchObject({
      code: 'upload_missing'
    });
  });

  it('validates ZIP magic bytes', () => {
    expect(hasZipMagicBytes(new Uint8Array([0x50, 0x4b, 0x03, 0x04]))).toBe(true);
    expect(hasZipMagicBytes(new Uint8Array([0x50, 0x4b, 0x05, 0x06]))).toBe(true);
    expect(hasZipMagicBytes(new Uint8Array([0x25, 0x50, 0x44, 0x46]))).toBe(false);
  });

  it('maps units', () => {
    expect(
      mapUnitsToRows(
        [
          {
            identifier: 'sco-1',
            parentIdentifier: null,
            title: 'Module',
            position: 0,
            unitType: 'sco',
            href: 'sco.html',
            parameters: null,
            masteryScore: 80,
            launchData: null,
            formatDetails: {
              scaledPassingScore: null,
              completionThreshold: null,
              maxTimeAllowed: null,
              timeLimitAction: null
            },
            isVisible: true
          }
        ],
        'version-1'
      )
    ).toEqual([expect.objectContaining({ packageVersionId: 'version-1', masteryScore: '80', href: 'sco.html' })]);
    expect(resolveScormLimitMb({} as NodeJS.ProcessEnv)).toBe(500);
    expect(resolveScormLimitMb({ UPLOAD_MAX_SCORM_MB: '100' } as NodeJS.ProcessEnv)).toBe(100);
  });
});
