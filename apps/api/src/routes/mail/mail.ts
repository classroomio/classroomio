import { Hono } from '@api/utils/hono';
import { ZDeliverEmail } from '@cio/utils/validation/mail';
import { apiKeyMiddleware } from '@api/middlewares/api-key';
import { enqueueRawEmail } from '@api/services/jobs';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

/**
 * Public mail endpoint — accepts a list of raw subject/content emails and
 * enqueues them on the BullMQ `emails` queue via the transactional outbox.
 * Returns 202 with the outbox + delivery ids so callers can poll status if
 * needed.
 */
export const mailRouter = new Hono().post('/', apiKeyMiddleware, zValidator('json', ZDeliverEmail), async (c) => {
  const validatedData = c.req.valid('json');

  try {
    const enqueued = await Promise.all(
      validatedData.map((emailItem) =>
        enqueueRawEmail({
          from: emailItem.from,
          to: emailItem.to,
          subject: emailItem.subject,
          content: emailItem.content,
          replyTo: emailItem.replyTo
        })
      )
    );

    const jobIds = enqueued.flatMap((entry) => entry.jobIds);

    return c.json(
      {
        success: true,
        data: {
          accepted: jobIds.length,
          jobIds
        }
      },
      202
    );
  } catch (error) {
    return handleError(c, error, 'Failed to enqueue email send request', 'EMAIL_SEND_FAILED');
  }
});
