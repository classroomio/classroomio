import { Hono } from '@api/utils/hono';
import { ZDeliverEmail } from '@cio/utils/validation/mail';
import { deliverEmail } from '@cio/email';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const mailRouter = new Hono().post('/', zValidator('json', ZDeliverEmail), async (c) => {
  const validatedData = c.req.valid('json');

  try {
    const results = await deliverEmail(validatedData);

    const hasErrors = results.some((result) => !result.success);
    if (hasErrors) {
      return c.json(
        {
          success: false,
          error: 'Some emails failed to send',
          code: 'EMAIL_SEND_PARTIAL_FAILURE',
          details: results
        },
        500
      );
    }

    return c.json({ success: true, data: results }, 200);
  } catch (error) {
    return handleError(c, error, 'Failed to process email send request', 'EMAIL_SEND_FAILED');
  }
});
