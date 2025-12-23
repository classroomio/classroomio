export { queueManager } from './core/queue';
export { getRedisConnection, redisConnection } from './config/redis';
export { queueEnv } from './config/env';
export type { JobHandler } from './core/queue';

export { emailQueue, createEmailWorker } from './queues/email';
export type { SendEmailJobData } from './jobs/email/send-email';
export type { TEmailData } from '@cio/utils';

export { videoQueue, createVideoWorker } from './queues/video';
export type { ProcessVideoUploadJobData } from './jobs/video/process-upload';