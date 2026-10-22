import { afterEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  responses: [] as Array<(input: Record<string, unknown>) => unknown>,
  sent: [] as Array<{ command: string; input: Record<string, unknown> }>,
  marked: [] as string[],
  markFails: false
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

vi.mock('@cio/db/queries', () => ({
  markPackageVersionContentRemoved: async (id: string) => {
    if (state.markFails) throw new Error('db down');
    state.marked.push(id);
  }
}));

import { deletePackageStoragePrefix } from '../../utils/storage';
import { cleanupPackageVersionStorage } from './cleanup-storage';

const version = { id: '323e4567-e89b-12d3-a456-426614174002', contentPrefix: 'scorm/asset-1/v1' };

const listing = (keys: string[], next?: string) => () => ({
  Contents: keys.map((Key) => ({ Key })),
  IsTruncated: next !== undefined,
  NextContinuationToken: next
});

afterEach(() => {
  state.responses = [];
  state.sent = [];
  state.marked = [];
  state.markFails = false;
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
  it('marks the version content removed when every delete succeeds', async () => {
    state.responses = [listing(['a']), () => ({}), () => ({})];

    await cleanupPackageVersionStorage(version);

    expect(state.marked).toEqual([version.id]);
  });

  it('leaves the version for the retention sweep when a delete fails', async () => {
    state.responses = [listing(['a']), () => ({ Errors: [{ Key: 'a', Code: 'InternalError' }] })];

    await expect(cleanupPackageVersionStorage(version)).resolves.toBeUndefined();

    expect(state.marked).toEqual([]);
  });

  it('never throws when recording the cleanup fails', async () => {
    state.markFails = true;

    await expect(cleanupPackageVersionStorage(version)).resolves.toBeUndefined();
  });
});
