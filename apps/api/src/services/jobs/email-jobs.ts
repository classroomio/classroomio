import { enqueueEmailSend, enqueueEmailSends, isRedisConfigured, type EmailSendJob } from '@cio/jobs';
import { EmailRegistry, type EmailId, type EmailSchemaFor } from '@cio/email';
import { EmailPreferenceLookupCache } from '@cio/db/queries/notifications';
import { chunk } from '@cio/utils/functions/array';
import type { EmailLocale } from '@cio/utils/email';
import * as z from 'zod';

import { logRedisUnavailableOnce } from '@cio/core/utils/redis/redis';
import { getStudentEmailDeliveryLocale } from '@cio/core/services/email/localization';

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
  /** Override the template's default subject (e.g. org-scoped transactional mail). */
  subject?: string;
  /** Optional iCalendar (.ics) body attached as a text/calendar part. */
  ics?: string;
  organizationId?: string;
  preference?: {
    organizationId?: string;
    recipientProfileId?: string;
  };
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

export type EnqueueOutcome = { ok: true; jobIds: string[] } | { ok: false; error: Error };

const ENQUEUE_CHUNK_SIZE = 500;

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
 * **Link fields** (`courseUrl`, `autoEnrollUrl`, `loginUrl`, `inviteUrl`, etc.)
 * must be built by the caller before enqueueing. Use `getAppBaseUrl()` for
 * teacher/tutor/admin dashboard links and `getDashboardBaseUrl(org)` for
 * student/learner links — see `packages/email/README.md` § Email link URLs.
 *
 * BullMQ tracks send state, retries, and failure history — no DB ledger is
 * written. Final failures are recorded in `dead_letter_job` by the worker
 * for operator triage.
 */
export async function enqueueTransactionalEmail<TId extends EmailId>(
  template: TId,
  input: EnqueueTemplateEmailInput<TId>
): Promise<EnqueueResult> {
  const [outcome] = await enqueueTransactionalEmails(template, [input]);

  if (!outcome.ok) {
    throw outcome.error;
  }

  return { jobIds: outcome.jobIds };
}

/**
 * Batch form of `enqueueTransactionalEmail` for one template. Resolves the locale once per org, checks email
 * preferences with a few bulk queries, and adds the jobs in bulk. Returns one outcome per input, in order: an input
 * that fails validation, its preference lookup or its enqueue is reported as failed without affecting the others.
 */
export async function enqueueTransactionalEmails<TId extends EmailId>(
  template: TId,
  inputs: EnqueueTemplateEmailInput<TId>[]
): Promise<EnqueueOutcome[]> {
  const definition = EmailRegistry.get(template);
  if (!definition) {
    throw new Error(`Email template "${template}" is not registered`);
  }

  const outcomes: EnqueueOutcome[] = new Array(inputs.length);
  const valid: { index: number; input: EnqueueTemplateEmailInput<TId>; fields: Record<string, unknown> }[] = [];

  inputs.forEach((input, index) => {
    try {
      valid.push({ index, input, fields: definition.schema.parse(input.fields) as Record<string, unknown> });
    } catch (error) {
      outcomes[index] = failed(error);
    }
  });

  if (valid.length === 0) {
    return outcomes;
  }

  if (!isRedisConfigured()) {
    logRedisUnavailableOnce('Redis not configured: emails not enqueued. Set REDIS_URL and run apps/jobs to send them.');

    for (const { index } of valid) {
      outcomes[index] = { ok: true, jobIds: [] };
    }

    return outcomes;
  }

  const allowedRecipients = await filterRecipientsByPreference(
    template,
    valid.map(({ input }) => input)
  );
  const localeByOrganizationId = new Map<string | undefined, Promise<EmailLocale>>();
  const jobs: { index: number; job: EmailSendJob }[] = [];

  for (const [position, { index, input, fields }] of valid.entries()) {
    const recipients = allowedRecipients[position];

    if (recipients instanceof Error) {
      outcomes[index] = failed(recipients);
      continue;
    }

    const organizationId = input.organizationId ?? input.preference?.organizationId;
    if (!localeByOrganizationId.has(organizationId)) {
      localeByOrganizationId.set(organizationId, getStudentEmailDeliveryLocale(organizationId, template));
    }
    const locale = await localeByOrganizationId.get(organizationId)!;
    const total = toRecipientArray(input.to).length;

    outcomes[index] = { ok: true, jobIds: [] };

    for (const recipient of recipients) {
      jobs.push({
        index,
        job: {
          payload: {
            kind: 'template',
            template,
            to: recipient,
            fields,
            from: input.from,
            replyTo: input.replyTo,
            subject: input.subject,
            ics: input.ics,
            organizationId,
            locale
          },
          idempotencyKey: recipientKey(input.idempotencyKey, recipient, total)
        }
      });
    }
  }

  for (const jobChunk of chunk(jobs, ENQUEUE_CHUNK_SIZE)) {
    try {
      const jobIds = await enqueueEmailSends(jobChunk.map(({ job }) => job));

      jobIds.forEach((jobId, position) => {
        const outcome = outcomes[jobChunk[position].index];
        if (jobId && outcome.ok) outcome.jobIds.push(jobId);
      });
    } catch (error) {
      for (const { index } of jobChunk) {
        outcomes[index] = failed(error);
      }
    }
  }

  return outcomes;
}

async function filterRecipientsByPreference<TId extends EmailId>(
  template: TId,
  inputs: EnqueueTemplateEmailInput<TId>[]
): Promise<(string[] | Error)[]> {
  const cache = new EmailPreferenceLookupCache();
  const primeErrorByOrganizationId = new Map<string | undefined, Error>();
  const organizationIds = new Set(
    inputs.flatMap((input) => (input.preference ? [input.preference.organizationId] : []))
  );

  for (const organizationId of organizationIds) {
    const forOrganization = inputs.filter(
      (input) => input.preference && input.preference.organizationId === organizationId
    );

    try {
      await cache.prime({
        organizationId,
        profileIds: forOrganization.flatMap((input) =>
          input.preference?.recipientProfileId ? [input.preference.recipientProfileId] : []
        ),
        emails: forOrganization.flatMap((input) =>
          input.preference?.recipientProfileId ? [] : toRecipientArray(input.to)
        )
      });
    } catch (error) {
      primeErrorByOrganizationId.set(organizationId, toError(error));
    }
  }

  const results: (string[] | Error)[] = [];

  for (const input of inputs) {
    const recipients = toRecipientArray(input.to);

    if (!input.preference) {
      results.push(recipients);
      continue;
    }

    const primeError = primeErrorByOrganizationId.get(input.preference.organizationId);
    if (primeError) {
      results.push(primeError);
      continue;
    }

    try {
      const allowed: string[] = [];

      for (const recipient of recipients) {
        const send = await cache.shouldSend({
          emailId: template,
          organizationId: input.preference.organizationId,
          recipientEmail: recipient,
          recipientProfileId: input.preference.recipientProfileId
        });

        if (send) allowed.push(recipient);
      }

      results.push(allowed);
    } catch (error) {
      results.push(toError(error));
    }
  }

  return results;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function failed(error: unknown): EnqueueOutcome {
  return { ok: false, error: toError(error) };
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
