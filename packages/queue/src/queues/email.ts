import { queueManager } from '../core/queue';
import { sendEmailJob } from '../jobs/email/send-email';
import type { SendEmailJobData } from '../jobs/email/send-email';

export const emailQueue = queueManager.createQueue<SendEmailJobData>('email', {
  attempts: 5,
  backoffDelay: 2000,
});

export function createEmailWorker() {
  return queueManager.createWorker('email', sendEmailJob, {
    concurrency: 3,
  });
}


