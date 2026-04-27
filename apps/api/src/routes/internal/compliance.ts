import { runComplianceExpiryCheck, runComplianceReminderScan } from '@api/services/course/compliance';

import { Hono } from '@api/utils/hono';
import { apiKeyMiddleware } from '@api/middlewares/api-key';
import { handleError } from '@api/utils/errors';

export const internalComplianceRouter = new Hono()
  .post('/check-expiry', apiKeyMiddleware, async (c) => {
    try {
      const data = await runComplianceExpiryCheck();

      return c.json(
        {
          success: true,
          data
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to run compliance expiry check');
    }
  })
  .post('/send-reminders', apiKeyMiddleware, async (c) => {
    try {
      const data = await runComplianceReminderScan();

      return c.json(
        {
          success: true,
          data
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to run compliance reminder scan');
    }
  });
