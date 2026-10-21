import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../config/storage', () => ({
  getS3Client: () => ({ send: async () => ({ ContentLength: 0 }) })
}));

vi.mock('../../utils/storage', async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return { ...original, scormBucket: () => 'scorm' };
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
  bulkInsertPackageUnits: async () => [],
  deletePackageUnitsByVersion: async () => 0,
  getAssetById: async () => null,
  getCurrentPackageVersion: async () => null,
  getPackageVersionById: async () => null,
  setCurrentPackageVersion: async () => null,
  updateAsset: async () => null,
  updateMediaJob: async () => null,
  updatePackageVersion: async () => null
}));

import { SCORM_ZIP_LIMITS, checkZipEntries, contentTypeForFile, zipByteLimit } from '@cio/activity-packages';
import { resolveScormLimitMb } from './process-scorm';

const processorPath = fileURLToPath(new URL('./process-scorm.ts', import.meta.url));

describe('processScormPackage load: 500 MB package with video', () => {
  it('defaults the package limit to 500 MB', () => {
    expect(resolveScormLimitMb({} as NodeJS.ProcessEnv)).toBe(500);
    expect(zipByteLimit(500)).toBe(524288000);
  });

  it('allows many small files like a Rise export without hitting the entry cap', () => {
    const entries = Array.from({ length: 5000 }, (_, index) => ({
      name: `assets/file-${index}.js`,
      size: 2000,
      compressedSize: 1000,
      isDirectory: false
    }));

    expect(() =>
      checkZipEntries(entries, {
        maxEntries: SCORM_ZIP_LIMITS.maxEntries,
        maxTotalBytes: zipByteLimit(500) * 3,
        maxRatio: SCORM_ZIP_LIMITS.maxRatio
      })
    ).not.toThrow();
  });

  it('rejects entry counts above the cap before extraction', () => {
    const entries = Array.from({ length: SCORM_ZIP_LIMITS.maxEntries + 1 }, (_, index) => ({
      name: `f${index}.html`,
      size: 100,
      compressedSize: 50,
      isDirectory: false
    }));

    expect(() =>
      checkZipEntries(entries, {
        maxEntries: SCORM_ZIP_LIMITS.maxEntries,
        maxTotalBytes: zipByteLimit(500) * 3,
        maxRatio: SCORM_ZIP_LIMITS.maxRatio
      })
    ).toThrowError();
  });

  it('rejects an oversized total without reading file contents', () => {
    expect(() =>
      checkZipEntries(
        [
          {
            name: 'package.zip',
            size: zipByteLimit(500) * 3 + 1,
            compressedSize: zipByteLimit(500) * 3 + 1,
            isDirectory: false
          }
        ],
        {
          maxEntries: SCORM_ZIP_LIMITS.maxEntries,
          maxTotalBytes: zipByteLimit(500) * 3,
          maxRatio: SCORM_ZIP_LIMITS.maxRatio
        }
      )
    ).toThrowError();
  });

  it('streams extracted files to storage instead of buffering them', () => {
    const source = readFileSync(processorPath, 'utf8');

    expect(source).toContain('uploadStreamToBucket');
    expect(source).toContain('pipeline(stream, createWriteStream(localPath))');
    expect(source).toContain('public, max-age=604800, immutable');
  });

  it('keeps memory flat while checking a large file listing', () => {
    const entries = Array.from({ length: 8000 }, (_, index) => ({
      name: `videos/segment-${index}.mp4`,
      size: 150000,
      compressedSize: 140000,
      isDirectory: false
    }));
    const before = process.memoryUsage().heapUsed;

    checkZipEntries(entries, {
      maxEntries: SCORM_ZIP_LIMITS.maxEntries,
      maxTotalBytes: zipByteLimit(500) * 3,
      maxRatio: SCORM_ZIP_LIMITS.maxRatio
    });

    const growth = process.memoryUsage().heapUsed - before;

    expect(growth).toBeLessThan(50 * 1024 * 1024);
  });

  it('labels video with the content type range playback requires', () => {
    expect(contentTypeForFile('lecture.mp4')).toBe('video/mp4');
    expect(contentTypeForFile('lecture.webm')).toBe('video/webm');
  });
});
