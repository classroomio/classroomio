import { useEffect, useRef, useState } from 'react';

import { errorMessage } from '@/feature/common/helpers/error-message';
import { errorHaptic, successHaptic } from '@/feature/common/helpers/haptics';
import {
  UploadCancelledError,
  UploadRejectedError,
  type UploadProgressHandler
} from '@/feature/exercise/api/media-upload';
import type { AnswerData } from '@/feature/exercise/types/exercise';

export type UploadJob = {
  fileName: string;
  size?: number;
  previewUri?: string;
  run: (onProgress: UploadProgressHandler, signal: AbortSignal) => Promise<AnswerData>;
};

export type UploadState = {
  status: 'uploading' | 'failed';
  progress: number;
  fileName: string;
  size?: number;
  previewUri?: string;
  error?: string;
};

/** Tracks in-flight media uploads per question so they survive paging between questions. */
export function useUploadRegistry(onUploaded: (questionKey: string, answer: AnswerData) => void) {
  const [uploads, setUploads] = useState<Record<string, UploadState>>({});
  const jobs = useRef(new Map<string, UploadJob>());
  const controllers = useRef(new Map<string, AbortController>());

  useEffect(() => {
    const active = controllers.current;

    return () => active.forEach((controller) => controller.abort());
  }, []);

  const patch = (questionKey: string, next: UploadState | null) => {
    setUploads((current) => {
      const copy = { ...current };
      if (next) copy[questionKey] = next;
      else delete copy[questionKey];

      return copy;
    });
  };

  const run = async (questionKey: string, job: UploadJob) => {
    controllers.current.get(questionKey)?.abort();
    const controller = new AbortController();
    controllers.current.set(questionKey, controller);
    jobs.current.set(questionKey, job);

    const base = { fileName: job.fileName, size: job.size, previewUri: job.previewUri };
    let lastPercent = -1;
    patch(questionKey, { ...base, status: 'uploading', progress: 0 });

    const onProgress: UploadProgressHandler = (fraction) => {
      const percent = Math.round(fraction * 100);
      if (percent === lastPercent || controller.signal.aborted) return;

      lastPercent = percent;
      patch(questionKey, { ...base, status: 'uploading', progress: fraction });
    };

    try {
      const answer = await job.run(onProgress, controller.signal);
      if (controller.signal.aborted) return;

      controllers.current.delete(questionKey);
      jobs.current.delete(questionKey);
      patch(questionKey, null);
      successHaptic();
      onUploaded(questionKey, answer);
    } catch (error) {
      if (controllers.current.get(questionKey) !== controller) return;

      controllers.current.delete(questionKey);
      if (error instanceof UploadCancelledError || controller.signal.aborted) {
        jobs.current.delete(questionKey);
        patch(questionKey, null);
        return;
      }

      errorHaptic();
      const reason = error instanceof UploadRejectedError ? undefined : errorMessage(error);
      patch(questionKey, { ...base, status: 'failed', progress: 0, error: reason });
    }
  };

  return {
    uploads,
    isUploading: Object.values(uploads).some((upload) => upload.status === 'uploading'),
    startUpload: (questionKey: string, job: UploadJob) => void run(questionKey, job),
    retryUpload: (questionKey: string) => {
      const job = jobs.current.get(questionKey);
      if (job) void run(questionKey, job);
    },
    cancelUpload: (questionKey: string) => {
      const controller = controllers.current.get(questionKey);
      controllers.current.delete(questionKey);
      jobs.current.delete(questionKey);
      controller?.abort();
      patch(questionKey, null);
    }
  };
}
