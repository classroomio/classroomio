import { Context, Hono } from 'hono';
import { sendWithNodemailer, sendWithZoho } from '$src/services/mail';

import { ZSendEmailValidation } from '$src/types/mail';
import { env } from '$src/config/env';
import { z } from 'zod';

export const mailRouter = new Hono();

mailRouter.post('/send', async (c: Context) => {
  try {
    const data = await c.req.json();
    const validatedData = ZSendEmailValidation.parse(data);

    const results = await Promise.all(
      validatedData.map(async (emailData) => {
        console.log('emailData', emailData);
        try {
          const res = env.ZOHO_TOKEN
            ? await sendWithZoho(emailData)
            : await sendWithNodemailer(emailData);

          console.log('Email status:', res);
          return res;
        } catch (error) {
          console.error('Error sending email:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            details: error
          };
        }
      })
    );

    const hasErrors = results.some((result) => !result.success);
    if (hasErrors) {
      return c.json(
        {
          success: false,
          error: 'Some emails failed to send',
          details: results
        },
        500
      );
    }

    return c.json({ success: true, details: results });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors
        },
        400
      );
    }

    console.error('Error sending emails:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error
      },
      500
    );
  }
});
