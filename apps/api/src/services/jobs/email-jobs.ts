import { enqueueEmailSend, isRedisConfigured } from '@cio/jobs';
import { EmailRegistry, type EmailId, type EmailSchemaFor } from '@cio/email';
import * as z from 'zod';

import { logRedisUnavailableOnce } from '@cio/core/utils/redis/redis';

type Recipient = string | string[];

interface CommonOptions {
  /**
   * Stable key used as BullMQ `jobId` for idempotent enqueue (e.g.
   * `welcome:<userId>`). When omitted the job gets an auto-generated id, so
   * duplicate calls produce duplicate emails.
   */
  idempotencyKey?: string;
}

export interface EnqueueTemplateEmailInput<TId extends EmailId> extends CommonOptions {
  to: Recipient;
  fields: z.infer<EmailSchemaFor<TId>>;
  from?: string;
  replyTo?: string;
  /** Optional iCalendar (.ics) body attached as a text/calendar part. */
  ics?: string;
}

export interface EnqueueRawEmailInput extends CommonOptions {
  to: Recipient;
  subject: string;
  content: string;
  from?: string;
  replyTo?: string;
}

export interface EnqueueResult {
  /** BullMQ job ids — one per recipient. */
  jobIds: string[];
}

function toRecipientArray(to: Recipient): string[] {
  return Array.isArray(to) ? to : [to];
}

function recipientKey(base: string | undefined, recipient: string, total: number): string | undefined {
  if (!base) return undefined;

  return total === 1 ? base : `${base}:${recipient}`;
}

/**
 * Fire-and-forget enqueue of a registered template email. Validates `fields`
 * against the template's Zod schema up front so bad payloads fail in the
 * domain handler instead of silently inside the worker.
 *
 * BullMQ tracks send state, retries, and failure history — no DB ledger is
 * written. Final failures are recorded in `dead_letter_job` by the worker
 * for operator triage.
 */
export async function enqueueTransactionalEmail<TId extends EmailId>(
  template: TId,
  input: EnqueueTemplateEmailInput<TId>
): Promise<EnqueueResult> {
  const definition = EmailRegistry.get(template);
  if (!definition) {
    throw new Error(`Email template "${template}" is not registered`);
  }

  const validatedFields = definition.schema.parse(input.fields) as Record<string, unknown>;

  if (!isRedisConfigured()) {
    logRedisUnavailableOnce('Redis not configured: emails not enqueued. Set REDIS_URL and run apps/jobs to send them.');
    return { jobIds: [] };
  }

  const recipients = toRecipientArray(input.to);
  const jobIds: string[] = [];

  for (const recipient of recipients) {
    const jobId = await enqueueEmailSend(
      {
        kind: 'template',
        template,
        to: recipient,
        fields: validatedFields,
        from: input.from,
        replyTo: input.replyTo,
        ics: input.ics
      },
      { idempotencyKey: recipientKey(input.idempotencyKey, recipient, recipients.length) }
    );

    if (jobId) jobIds.push(jobId);
  }

  return { jobIds };
}

/**
 * Fire-and-forget enqueue of a free-form subject/content email — used by the
 * public mail route and submission notifications that don't have a registered
 * template.
 */
export async function enqueueRawEmail(input: EnqueueRawEmailInput): Promise<EnqueueResult> {
  if (!isRedisConfigured()) {
    logRedisUnavailableOnce('Redis not configured: emails not enqueued. Set REDIS_URL and run apps/jobs to send them.');
    return { jobIds: [] };
  }

  const recipients = toRecipientArray(input.to);
  const jobIds: string[] = [];

  for (const recipient of recipients) {
    const jobId = await enqueueEmailSend(
      {
        kind: 'raw',
        to: recipient,
        subject: input.subject,
        content: input.content,
        from: input.from,
        replyTo: input.replyTo
      },
      { idempotencyKey: recipientKey(input.idempotencyKey, recipient, recipients.length) }
    );

    if (jobId) jobIds.push(jobId);
  }

  return { jobIds };
}
