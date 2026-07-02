import { runComplianceExpiryCheck, runComplianceReminderScan } from '@api/services/course/compliance';
import { runCohortGoalEvaluationSweep, runCohortGoalReminderScan } from '@api/services/cohort/goal';

import { Hono } from '@api/utils/hono';
import { apiKeyMiddleware } from '@api/middlewares/api-key';
import { enqueueSessionReminderScan } from '@cio/jobs';
import { handleError } from '@api/utils/errors';

export const internalComplianceRouter = new Hono()
  .post('/send-session-reminders', apiKeyMiddleware, async (c) => {
    try {
      const jobId = await enqueueSessionReminderScan();

      return c.json({ success: true, data: { jobId: jobId ?? null } }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to enqueue session reminder scan');
    }
  })
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
   * POST /internal/compliance/evaluate-cohort-goals
   * Daily sweep: re-evaluate every active cohort goal and refresh per-learner
   * `cohort_goal_assignment` rows.
   */
  .post('/evaluate-cohort-goals', apiKeyMiddleware, async (c) => {
    try {
      const data = await runCohortGoalEvaluationSweep();

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to run cohort goal evaluation sweep');
    }
  })
  /**
   * POST /internal/compliance/send-cohort-goal-reminders
   * Sends learner reminder emails for upcoming/overdue cohort goals using
   * each goal's `reminderDaysBefore` cadence.
   */
  .post('/send-cohort-goal-reminders', apiKeyMiddleware, async (c) => {
    try {
      const data = await runCohortGoalReminderScan();

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to run cohort goal reminder scan');
    }
  });
