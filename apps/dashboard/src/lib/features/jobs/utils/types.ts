import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type GetMediaJobRequest = (typeof classroomio.jobs.media)[':jobId']['$get'];
export type GetMediaJobSuccess = Extract<InferResponseType<GetMediaJobRequest>, { success: true }>;
export type MediaJobEnvelope = GetMediaJobSuccess['data'];

export type ListMediaJobsRequest = (typeof classroomio.jobs.media)['$get'];
export type ListMediaJobsSuccess = Extract<InferResponseType<ListMediaJobsRequest>, { success: true }>;
export type MediaJobsBatch = ListMediaJobsSuccess['data'];

export type ListAssetMediaJobsRequest = (typeof classroomio.jobs.media)['asset'][':assetId']['$get'];
export type ListAssetMediaJobsSuccess = Extract<InferResponseType<ListAssetMediaJobsRequest>, { success: true }>;
export type AssetMediaJobs = ListAssetMediaJobsSuccess['data'];

export type CancelMediaJobRequest = (typeof classroomio.jobs.media)[':jobId']['cancel']['$post'];
export type CancelMediaJobSuccess = Extract<InferResponseType<CancelMediaJobRequest>, { success: true }>;

export type StartAssetTranscriptionRequest =
  (typeof classroomio.jobs.media)['asset'][':assetId']['transcribe']['$post'];
export type StartAssetTranscriptionSuccess = Extract<
  InferResponseType<StartAssetTranscriptionRequest>,
  { success: true }
>;
