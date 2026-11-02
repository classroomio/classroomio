import { File } from 'expo-file-system';

import type { ApiClient } from '@/feature/common/api/api-client';
import { request } from '@/feature/common/api/request';
import type { AnswerOf, VideoRecordingMimeType } from '@/feature/exercise/types/exercise';

export type UploadProgressHandler = (fraction: number) => void;

export type LocalMedia = { uri: string; name: string; mimeType: string; size: number };

export class UploadCancelledError extends Error {
  constructor() {
    super('Upload cancelled');
  }
}

export class UploadRejectedError extends Error {
  constructor(readonly status: number) {
    super(`Storage rejected the upload (${status})`);
  }
}

/** PUTs a local file to a presigned storage URL, reporting progress as a 0–1 fraction. */
export async function putToPresignedUrl(
  media: LocalMedia,
  url: string,
  onProgress: UploadProgressHandler,
  signal: AbortSignal
) {
  const task = new File(media.uri).createUploadTask(url, {
    httpMethod: 'PUT',
    headers: { 'Content-Type': media.mimeType },
    mimeType: media.mimeType,
    sessionType: 'foreground',
    onProgress: ({ bytesSent, totalBytes }) => {
      if (totalBytes > 0) onProgress(Math.min(1, bytesSent / totalBytes));
    }
  });

  const abort = () => task.cancel();
  signal.addEventListener('abort', abort);

  try {
    const result = await task.uploadAsync();
    if (result.status < 200 || result.status >= 300) {
      throw new UploadRejectedError(result.status);
    }
  } catch (error) {
    if (signal.aborted) throw new UploadCancelledError();
    throw error;
  } finally {
    signal.removeEventListener('abort', abort);
    task.release();
  }
}

type UploadContext = {
  api: ApiClient;
  onProgress: UploadProgressHandler;
  signal: AbortSignal;
};

/** Uploads a file answer through the document presign route and returns the answer to store. */
export async function uploadExerciseFile(
  media: LocalMedia,
  acceptedTypes: string[],
  { api, onProgress, signal }: UploadContext
): Promise<AnswerOf<'FILE_UPLOAD'>> {
  const presigned = await request(
    api.course.presign.document.upload.$post({
      json: {
        fileName: media.name,
        fileType: media.mimeType,
        fileSize: media.size > 0 ? media.size : undefined,
        acceptedTypes: acceptedTypes.length > 0 ? acceptedTypes : undefined
      }
    })
  );

  await putToPresignedUrl(media, presigned.url, onProgress, signal);

  return {
    type: 'FILE_UPLOAD',
    fileKey: presigned.fileKey,
    fileName: media.name,
    mimeType: media.mimeType,
    size: media.size
  };
}

type RecordingInput = {
  courseId: string;
  exerciseId: string;
  questionId: number;
  media: LocalMedia & { mimeType: VideoRecordingMimeType };
  durationSeconds: number;
  recordedAt: string;
  retakeCount: number;
};

/** Runs the video-recording upload handshake (init, PUT, complete) and returns the stored answer. */
export async function uploadVideoRecording(
  { courseId, exerciseId, questionId, media, durationSeconds, recordedAt, retakeCount }: RecordingInput,
  { api, onProgress, signal }: UploadContext
): Promise<AnswerOf<'VIDEO_RECORDING'>> {
  const route = api.course[':courseId'].exercise[':exerciseId'].question[':questionId']['video-recording'].upload;
  const param = { courseId, exerciseId, questionId: String(questionId) };

  const init = await request(
    route.init.$post({ param, json: { fileName: media.name, mimeType: media.mimeType, size: media.size } })
  );

  await putToPresignedUrl(media, init.data.uploadUrl, onProgress, signal);

  const completed = await request(
    route.complete.$post({
      param,
      json: {
        assetId: init.data.assetId,
        storageKey: init.data.storageKey,
        fileName: media.name,
        mimeType: media.mimeType,
        size: media.size,
        durationSeconds,
        recordedAt,
        retakeCount
      }
    })
  );

  return completed.data;
}
