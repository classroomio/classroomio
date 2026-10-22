import { afterEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  responses: [] as Array<(input: Record<string, unknown>) => unknown>,
  sent: [] as Array<{ command: string; input: Record<string, unknown> }>,
  enqueued: [] as Record<string, unknown>[],
  enqueueFails: false
}));

vi.mock('../../config/storage', () => ({
  getS3Client: () => ({
    send: async (command: { constructor: { name: string }; input: Record<string, unknown> }) => {
      state.sent.push({ command: command.constructor.name, input: command.input });
      const respond = state.responses.shift();
      if (!respond) return {};

      return respond(command.input);
    }
  }),
  getStorageConfig: () => ({ bucketScorm: 'scorm' })
}));

vi.mock('../../utils/cancel', () => ({
  errorMessage: (error: unknown) => (error instanceof Error ? error.message : String(error))
}));

vi.mock('../../utils/logger', () => ({
  log: { info: () => {}, warn: () => {}, error: () => {} }
}));

vi.mock('@cio/jobs', async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return {
    ...original,
    enqueueActivityPackageStorageCleanup: async (input: Record<string, unknown>) => {
      if (state.enqueueFails) throw new Error('redis down');
      state.enqueued.push(input);
      return { jobId: 'job-1' };
    }
  };
});

import { deletePackageStoragePrefix } from '../../utils/storage';
import { cleanupPackageVersionStorage, processPackageStorageCleanup } from './cleanup-storage';

const cleanupInput = {
  packageVersionId: '323e4567-e89b-12d3-a456-426614174002',
  contentPrefix: 'scorm/asset-1/v1',
  organizationId: '523e4567-e89b-12d3-a456-426614174004'
};

const listing = (keys: string[], next?: string) => () => ({
  Contents: keys.map((Key) => ({ Key })),
  IsTruncated: next !== undefined,
  NextContinuationToken: next
});

afterEach(() => {
  state.responses = [];
  state.sent = [];
  state.enqueued = [];
  state.enqueueFails = false;
});

describe('deletePackageStoragePrefix', () => {
  it('deletes every page under the prefix and then the index', async () => {
    state.responses = [listing(['a', 'b'], 'page-2'), () => ({}), listing(['c']), () => ({}), () => ({})];

    await deletePackageStoragePrefix('scorm', 'scorm/asset-1/v1');

    expect(state.sent.map((entry) => entry.command)).toEqual([
      'ListObjectsV2Command',
      'DeleteObjectsCommand',
      'ListObjectsV2Command',
      'DeleteObjectsCommand',
      'DeleteObjectCommand'
    ]);
    expect(state.sent[4].input).toEqual({ Bucket: 'scorm', Key: 'scorm/asset-1/v1.index.json' });
  });

  it('throws when a batch delete reports per-object errors', async () => {
    state.responses = [
      listing(['a', 'b']),
      () => ({ Errors: [{ Key: 'b', Code: 'AccessDenied', Message: 'denied' }] })
    ];

    await expect(deletePackageStoragePrefix('scorm', 'scorm/asset-1/v1')).rejects.toThrow(
      'Failed to delete 1 object(s) under scorm/asset-1/v1/: b AccessDenied denied'
    );
  });

  it('throws when the listing request fails', async () => {
    state.responses = [
      () => {
        throw new Error('timeout');
      }
    ];

    await expect(deletePackageStoragePrefix('scorm', 'scorm/asset-1/v1')).rejects.toThrow('timeout');
  });

  it('throws when the index delete fails', async () => {
    state.responses = [
      listing([]),
      () => {
        throw new Error('index delete failed');
      }
    ];

    await expect(deletePackageStoragePrefix('scorm', 'scorm/asset-1/v1')).rejects.toThrow('index delete failed');
  });
});

describe('cleanupPackageVersionStorage', () => {
  it('does not schedule a retry when the inline cleanup succeeds', async () => {
    await cleanupPackageVersionStorage(cleanupInput);

    expect(state.enqueued).toEqual([]);
  });

  it('schedules a retried cleanup job when the inline cleanup fails', async () => {
    state.responses = [listing(['a']), () => ({ Errors: [{ Key: 'a', Code: 'InternalError' }] })];

    await cleanupPackageVersionStorage(cleanupInput);

    expect(state.enqueued).toEqual([cleanupInput]);
  });

  it('never throws when the retry cannot be scheduled', async () => {
    state.enqueueFails = true;
    state.responses = [
      () => {
        throw new Error('timeout');
      }
    ];

    await expect(cleanupPackageVersionStorage(cleanupInput)).resolves.toBeUndefined();
  });
});

describe('processPackageStorageCleanup', () => {
  it('throws on a failed delete so the queue retries it', async () => {
    state.responses = [listing(['a']), () => ({ Errors: [{ Key: 'a', Code: 'SlowDown' }] })];

    await expect(processPackageStorageCleanup(cleanupInput)).rejects.toThrow('SlowDown');
  });

  it('rejects an invalid payload', async () => {
    await expect(processPackageStorageCleanup({ contentPrefix: '' })).rejects.toThrow();
  });
});
