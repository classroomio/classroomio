import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  createPluginSubmission: vi.fn(),
  getPluginVersion: vi.fn(),
  listPluginSubmissions: vi.fn()
}));
const storageMocks = vi.hoisted(() => ({
  generateUploadPresignedUrl: vi.fn()
}));

vi.mock('@cio/db/queries/plugin', () => dbMocks);
vi.mock('@cio/core/utils/s3', () => storageMocks);

import { createSubmissionIntent } from '@api/services/plugin/submission';

describe('Plugin Submission Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PLUGIN_QUARANTINE_BUCKET = 'plugin-quarantine';
    dbMocks.listPluginSubmissions.mockResolvedValue([]);
    dbMocks.getPluginVersion.mockResolvedValue(null);
    storageMocks.generateUploadPresignedUrl.mockResolvedValue('https://storage.example/upload');
  });

  it('uses a presigned quarantine upload URL without an API upload endpoint', async () => {
    dbMocks.createPluginSubmission.mockResolvedValue({
      id: 'sub-123',
      pluginId: 'com.example.course-insights',
      version: '1.0.0',
      artifactDigest: `sha256-${'a'.repeat(64)}`,
      status: 'pending_upload'
    });

    const result = await createSubmissionIntent({
      pluginId: 'com.example.course-insights',
      version: '1.0.0',
      releaseLane: 'community',
      artifactDigest: `sha256-${'a'.repeat(64)}`,
      profileId: 'profile-1'
    });

    expect(result.uploadUrl).toBe('https://storage.example/upload');
    expect(storageMocks.generateUploadPresignedUrl).toHaveBeenCalledWith(
      `submissions/com.example.course-insights/1.0.0/sha256-${'a'.repeat(64)}.tar.gz`,
      'plugin-quarantine',
      'application/gzip'
    );
  });

  it('rejects community submissions in the ClassroomIO namespace', async () => {
    await expect(
      createSubmissionIntent({
        pluginId: 'com.classroomio.hacked',
        version: '1.0.0',
        releaseLane: 'community',
        artifactDigest: `sha256-${'a'.repeat(64)}`,
        profileId: 'profile-1'
      })
    ).rejects.toThrow('reserved for trusted publishers');
  });
});
