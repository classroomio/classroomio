import { BaseApi, classroomio } from '$lib/utils/services/api';

import type {
  AssetMediaJobs,
  CancelMediaJobRequest,
  GetMediaJobRequest,
  ListAssetMediaJobsRequest,
  ListMediaJobsRequest,
  MediaJobEnvelope,
  MediaJobsBatch
} from '../utils/types';

class JobsApi extends BaseApi {
  /** Latest envelope per polled job id. */
  envelopes = $state<Record<string, MediaJobEnvelope>>({});
  /** Per-asset latest runs (for lesson editor badges). */
  envelopesByAsset = $state<Record<string, AssetMediaJobs>>({});

  async getMediaJob(jobId: string): Promise<MediaJobEnvelope | null> {
    let envelope: MediaJobEnvelope | null = null;
    await this.execute<GetMediaJobRequest>({
      requestFn: () => classroomio.jobs.media[':jobId'].$get({ param: { jobId } }),
      logContext: 'fetching media job',
      onSuccess: (response) => {
        envelope = response.data;
        this.envelopes = { ...this.envelopes, [response.data.job.id]: response.data };
      }
    });

    return envelope;
  }

  async getMediaJobs(jobIds: string[]): Promise<MediaJobsBatch> {
    if (jobIds.length === 0) return {};

    let envelopes: MediaJobsBatch = {};
    await this.execute<ListMediaJobsRequest>({
      requestFn: () => classroomio.jobs.media.$get({ query: { ids: jobIds.join(',') } }),
      logContext: 'fetching media jobs (batch)',
      onSuccess: (response) => {
        envelopes = response.data;
        this.envelopes = { ...this.envelopes, ...response.data };
      }
    });

    return envelopes;
  }

  async getMediaJobsForAsset(assetId: string): Promise<AssetMediaJobs> {
    let envelopes: AssetMediaJobs = [];
    await this.execute<ListAssetMediaJobsRequest>({
      requestFn: () => classroomio.jobs.media.asset[':assetId'].$get({ param: { assetId } }),
      logContext: 'fetching media jobs for asset',
      onSuccess: (response) => {
        envelopes = response.data;
        this.envelopesByAsset = { ...this.envelopesByAsset, [assetId]: response.data };
      }
    });

    return envelopes;
  }

  async cancelMediaJob(jobId: string): Promise<MediaJobEnvelope | null> {
    let envelope: MediaJobEnvelope | null = null;
    await this.execute<CancelMediaJobRequest>({
      requestFn: () => classroomio.jobs.media[':jobId'].cancel.$post({ param: { jobId } }),
      logContext: 'cancelling media job',
      onSuccess: (response) => {
        envelope = response.data;
        this.envelopes = { ...this.envelopes, [response.data.job.id]: response.data };
      }
    });

    return envelope;
  }
}

export const jobsApi = new JobsApi();
