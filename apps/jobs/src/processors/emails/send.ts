import { deliverEmail, sendEmail, type EmailId } from '@cio/email';
import { ZSendEmailPayload } from '@cio/jobs';

import { log } from '../../utils/logger';

interface SendResult {
  providerId: string;
}

/**
 * Process an `emails:send` job. Dispatches based on payload `kind`, calls the
 * provider via `@cio/email`, and returns a provider message id (BullMQ stores
 * this as the job return value).
 */
export async function processSendEmail(rawPayload: unknown): Promise<SendResult> {
  const payload = ZSendEmailPayload.parse(rawPayload);

  if (payload.kind === 'template') {
    const responses = await sendEmail(payload.template as EmailId, {
      to: payload.to,
      // Re-validated by `sendEmail` against the registered template schema; the
      // generic record was already validated in the API helper before enqueue.
      fields: payload.fields as never,
      from: payload.from,
      replyTo: payload.replyTo,
      ics: payload.ics
    });
    const result = extractProviderId(responses);
    log.info('email-sent', {
      kind: 'template',
      template: payload.template,
      recipient: payload.to,
      providerId: result.providerId
    });
    return result;
  }

  const responses = await deliverEmail([
    {
      to: payload.to,
      subject: payload.subject,
      content: payload.content,
      from: payload.from,
      replyTo: payload.replyTo
    }
  ]);
  const result = extractProviderId(responses);
  log.info('email-sent', { kind: 'raw', recipient: payload.to, providerId: result.providerId });
  return result;
}

function extractProviderId(
  responses: ReadonlyArray<{ success: boolean; details?: unknown; error?: string }>
): SendResult {
  const failed = responses.find((response) => !response.success);
  if (failed) {
    throw new Error(failed.error ?? 'email provider returned an unsuccessful response');
  }

  for (const response of responses) {
    const details = response.details as
      | { messageId?: string; request_id?: string; data?: { request_id?: string } }
      | undefined;
    const candidate = details?.messageId ?? details?.request_id ?? details?.data?.request_id;
    if (candidate) {
      return { providerId: String(candidate) };
    }
  }

  return { providerId: '' };
}
