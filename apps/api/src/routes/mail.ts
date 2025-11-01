import { sendWithNodemailer, sendWithZoho } from '@api/services/mail';

import { Hono } from 'hono';
import { ZSendEmailValidation } from '@api/types/mail';
import { env } from '@api/config/env';
import { zValidator } from '@hono/zod-validator';

export const mailRouter = new Hono().post(
  '/send',
  zValidator('json', ZSendEmailValidation),
  async (c) => {
    const validatedData = c.req.valid('json');

    const results = await Promise.all(
      validatedData.map(async (emailData) => {
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
  }
);
