import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createMediaJob: vi.fn(),
  getAssetById: vi.fn(),
  getMediaJobById: vi.fn(),
  hasActiveMediaJobForAsset: vi.fn(),
  isRedisConfigured: vi.fn(() => false),
  logRedisUnavailableOnce: vi.fn()
}));

vi.mock('@cio/db/queries', () => ({
  createMediaJob: mocks.createMediaJob,
  getMediaJobById: mocks.getMediaJobById,
  hasActiveMediaJobForAsset: mocks.hasActiveMediaJobForAsset
}));

vi.mock('@cio/db/queries/assets', () => ({
  getAssetById: mocks.getAssetById
}));

vi.mock('@cio/jobs', () => ({
  isRedisConfigured: mocks.isRedisConfigured
}));

vi.mock('@cio/core/utils/redis/redis', () => ({
  logRedisUnavailableOnce: mocks.logRedisUnavailableOnce
}));

import { getMediaJobEnvelope, startMediaJob, startTranscriptionOnlyMediaJob } from '@api/services/jobs/media-jobs';
import {
  getMediaJobEnvelope as getCoreMediaJobEnvelope,
  startMediaJob as startCoreMediaJob,
  startTranscriptionOnlyMediaJob as startCoreTranscriptionOnlyMediaJob
} from '@cio/core/services/jobs/media-jobs';

const organizationId = 'a0ed903e-5fc2-4426-a5f3-8573bd36d154';
const assetId = 'd7efc006-e133-4aee-9944-0bce676407bc';

describe.each([
  {
    name: 'API service',
    start: startMediaJob,
    startTranscriptionOnly: startTranscriptionOnlyMediaJob,
    getEnvelope: getMediaJobEnvelope
  },
  {
    name: 'core service',
    start: startCoreMediaJob,
    startTranscriptionOnly: startCoreTranscriptionOnlyMediaJob,
    getEnvelope: getCoreMediaJobEnvelope
  }
])('$name media job transcription intent', ({ start, startTranscriptionOnly, getEnvelope }) => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createMediaJob.mockImplementation(async (values: Record<string, unknown>) => ({
      ...values,
      id: 'job-1',
      createdAt: '2026-11-08T00:00:00.000Z',
      updatedAt: '2026-11-08T00:00:00.000Z'
    }));
    mocks.getAssetById.mockResolvedValue({
      organizationId,
      kind: 'video',
      provider: 'upload',
      storageKey: 'video.mp4'
    });
    mocks.hasActiveMediaJobForAsset.mockResolvedValue(false);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    { withTranscription: true, transcriptionPlanned: true },
    { withTranscription: false, transcriptionPlanned: false }
  ])(
    'reports $transcriptionPlanned before queue ids are assigned',
    async ({ withTranscription, transcriptionPlanned }) => {
      const job = await start({
        organizationId,
        assetId,
        storageKey: 'video.mp4',
        triggeredByProfileId: null,
        withTranscription
      });

      mocks.getMediaJobById.mockResolvedValue(job);

      const envelope = await getEnvelope(job.id, organizationId);

      expect(envelope.job.transcriptionPlanned).toBe(transcriptionPlanned);
      expect(job.jobIds?.['transcribe-audio']).toBe(transcriptionPlanned ? '' : undefined);
    }
  );

  it('reports manual transcription intent before queue ids are assigned', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');

    const job = await startTranscriptionOnly({ organizationId, assetId, triggeredByProfileId: null });
    mocks.getMediaJobById.mockResolvedValue(job);

    const envelope = await getEnvelope(job.id, organizationId);

    expect(envelope.job.transcriptionPlanned).toBe(true);
    expect(job.jobIds?.['transcribe-audio']).toBe('');
  });
});
