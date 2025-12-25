import { Queue, QueueEvents } from 'bullmq';
import { redis } from '@api/utils/redis/redis';
import type { VideoEncodingJob } from './types';

export const videoProcessingQueue = new Queue<VideoEncodingJob>('video-encoding', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5s, 10s, 20s
    },
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 24 hours
      count: 1000, // Keep last 1000 jobs
    },
    removeOnFail: {
      age: 604800, // Keep failed jobs for 7 days
    },
  },
});

// Queue events for monitoring
export const videoQueueEvents = new QueueEvents('video-encoding', {
  connection: redis,
});
