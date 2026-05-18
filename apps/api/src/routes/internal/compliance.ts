import { runComplianceExpiryCheck, runComplianceReminderScan } from '@api/services/course/compliance';
import { runProgramGoalEvaluationSweep, runProgramGoalReminderScan } from '@api/services/program/goal';

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
  })
  /**
   * POST /internal/compliance/evaluate-program-goals
   * Daily sweep: re-evaluate every active program goal and refresh per-learner
   * `program_goal_assignment` rows.
   */
  .post('/evaluate-program-goals', apiKeyMiddleware, async (c) => {
    try {
      const data = await runProgramGoalEvaluationSweep();

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to run program goal evaluation sweep');
    }
  })
  /**
   * POST /internal/compliance/send-program-goal-reminders
   * Sends learner reminder emails for upcoming/overdue program goals using
   * each goal's `reminderDaysBefore` cadence.
   */
  .post('/send-program-goal-reminders', apiKeyMiddleware, async (c) => {
    try {
      const data = await runProgramGoalReminderScan();

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to run program goal reminder scan');
    }
  });
