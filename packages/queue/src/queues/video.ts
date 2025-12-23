import { queueManager } from '../core/queue';
import { ProcessVideoUploadJob, type ProcessVideoUploadJobData } from '../jobs/video/process-upload';

export const videoQueue = queueManager.createQueue<ProcessVideoUploadJobData>('video', {
  attempts: 3,
  backoffDelay: 5000,
});

export function createVideoWorker() {
  console.log('Creating video worker...');
  const worker = queueManager.createWorker('video', ProcessVideoUploadJob, {
    concurrency: 2,
  });
  console.log('Video worker created successfully');
  return worker;
}