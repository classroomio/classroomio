import { deliverEmail, sendEmail, type EmailId } from '@cio/email';
import { ZSendEmailPayload } from '@cio/jobs';
import { getStudentEmailSendContext } from '@cio/core/services/email/localization';
import { isReminderDeliveryClaimedBy, markReminderDeliverySent } from '@cio/db/queries/course';

import { log } from '../../utils/logger';

interface SendResult {
  providerId: string;
}

/**
 * Process an `emails:send` job. Dispatches based on payload `kind`, calls the
 * provider via `@cio/email`, and returns a provider message id (BullMQ stores
 * this as the job return value). A live session reminder whose ledger row no
 * longer belongs to this job is dropped without sending.
 */
export async function processSendEmail(rawPayload: unknown, bullmqJobId?: string): Promise<SendResult> {
  const payload = ZSendEmailPayload.parse(rawPayload);

  if (payload.kind === 'template') {
    const reminderClaim =
      payload.reminderDeliveryId && bullmqJobId ? { deliveryId: payload.reminderDeliveryId, bullmqJobId } : null;
    if (reminderClaim && !(await isReminderDeliveryClaimedBy(reminderClaim.deliveryId, reminderClaim.bullmqJobId))) {
      log.info('email-reminder-dropped', reminderClaim);
      return { providerId: '' };
    }

    const { locale, templateOverride } = payload.organizationId
      ? await getStudentEmailSendContext(payload.organizationId, payload.template, payload.locale ?? 'en')
      : { locale: payload.locale ?? 'en', templateOverride: undefined };
    const responses = await sendEmail(payload.template as EmailId, {
      to: payload.to,
      // Re-validated by `sendEmail` against the registered template schema; the
      // generic record was already validated in the API helper before enqueue.
      fields: payload.fields as never,
      from: payload.from,
      replyTo: payload.replyTo,
      subject: payload.subject,
      ics: payload.ics,
      locale,
      contentOverride: templateOverride?.content,
      subjectOverride: templateOverride?.subject ?? undefined
    });
    const result = extractProviderId(responses);
    log.info('email-sent', {
      kind: 'template',
      template: payload.template,
      recipient: payload.to,
      providerId: result.providerId
    });

    if (reminderClaim) {
      await markReminderDeliverySent(reminderClaim.deliveryId, reminderClaim.bullmqJobId, result.providerId);
    }

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
