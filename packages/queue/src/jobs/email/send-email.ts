import type { Job } from 'bullmq';
import type { TEmailData } from '@cio/utils';
import { deliverEmail } from '@cio/email';

export interface SendEmailJobData extends TEmailData {}

export async function sendEmailJob(job: Job<SendEmailJobData>) {
  await job.updateProgress(10);

  const results = await deliverEmail([job.data]);

  await job.updateProgress(100);

  const result = results[0];
  if (!result.success) {
    throw new Error(result.error || 'Email send failed');
  }

  return { success: true, result };
}
