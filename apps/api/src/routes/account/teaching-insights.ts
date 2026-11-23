import {
  getTeachingStats,
  listTeachingActivity,
  listTeachingLearners,
  listSubmissionHistory,
  listUpcomingSubmissions,
  listUpcomingTeachingSessions,
  nudgeLearner,
  type TeachingScope
} from '@api/services/account/teaching-insights';
import type { Context } from 'hono';

import { Hono } from '@api/utils/hono';
import { ROLE } from '@cio/utils/constants';
import {
  ZLearnerNudge,
  ZTeachingActivityQuery,
  ZTeachingLearnersQuery,
  ZTeachingSessionsQuery,
  ZTeachingSubmissionHistoryQuery
} from '@cio/utils/validation/account';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { orgTeamMemberMiddleware } from '@api/middlewares/org-team-member';
import { zValidator } from '@hono/zod-validator';

function teachingScope(c: Context): TeachingScope {
  const user = c.get('user')!;
  const orgId = c.req.header('cio-org-id')!;
  const orgRoles = (c.get('orgRoles') as Record<string, number> | undefined) ?? {};

  return { orgId, profileId: user.id, isOrgAdmin: orgRoles[orgId] === ROLE.ADMIN };
}

export const accountTeachingInsightsRouter = new Hono()
  /**
   * GET /account/teaching-stats
   * Key numbers across the courses the caller teaches (every course for an org admin).
   */
  .get('/teaching-stats', authMiddleware, orgTeamMemberMiddleware, async (c) => {
    try {
      const data = await getTeachingStats(teachingScope(c));

      c.header('Cache-Control', 'no-store');

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load teaching stats');
    }
  })
  /**
   * GET /account/teaching-sessions
   * Live sessions in the taught courses that have not ended, soonest first, with registered and enrolled counts.
   */
  .get(
    '/teaching-sessions',
    authMiddleware,
    orgTeamMemberMiddleware,
    zValidator('query', ZTeachingSessionsQuery),
    async (c) => {
      try {
        const data = await listUpcomingTeachingSessions(teachingScope(c), c.req.valid('query'));

        c.header('Cache-Control', 'no-store');

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to load upcoming sessions');
      }
    }
  )
  /**
   * GET /account/teaching-activity
   * Enrollments, lesson completions, submissions and course completions in the taught courses, newest first.
   */
  .get(
    '/teaching-activity',
    authMiddleware,
    orgTeamMemberMiddleware,
    zValidator('query', ZTeachingActivityQuery),
    async (c) => {
      try {
        const data = await listTeachingActivity(teachingScope(c), c.req.valid('query'));

        c.header('Cache-Control', 'no-store');

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to load recent activity');
      }
    }
  )
  /**
   * GET /account/teaching-submissions/upcoming
   * Exercises with a due date ahead, soonest first, with how many enrolled students have submitted.
   */
  .get('/teaching-submissions/upcoming', authMiddleware, orgTeamMemberMiddleware, async (c) => {
    try {
      const data = await listUpcomingSubmissions(teachingScope(c));

      c.header('Cache-Control', 'no-store');

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load upcoming submissions');
    }
  })
  /**
   * GET /account/teaching-submissions/history
   * Graded submissions, most recently graded first.
   */
  .get(
    '/teaching-submissions/history',
    authMiddleware,
    orgTeamMemberMiddleware,
    zValidator('query', ZTeachingSubmissionHistoryQuery),
    async (c) => {
      try {
        const data = await listSubmissionHistory(teachingScope(c), c.req.valid('query'));

        c.header('Cache-Control', 'no-store');

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to load graded submissions');
      }
    }
  )
  /**
   * GET /account/teaching-learners
   * Student enrollments in the taught courses with progress, last activity and nudge state. `filter=needs-nudge`
   * keeps learners who stalled.
   */
  .get(
    '/teaching-learners',
    authMiddleware,
    orgTeamMemberMiddleware,
    zValidator('query', ZTeachingLearnersQuery),
    async (c) => {
      try {
        const data = await listTeachingLearners(teachingScope(c), c.req.valid('query'));

        c.header('Cache-Control', 'no-store');

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to load learners');
      }
    }
  )
  /**
   * POST /account/teaching-learners/nudge
   * Sends a learner a reminder for one course. One per learner per course every 24 hours (429 NUDGE_RATE_LIMITED).
   */
  .post(
    '/teaching-learners/nudge',
    authMiddleware,
    orgTeamMemberMiddleware,
    zValidator('json', ZLearnerNudge),
    async (c) => {
      try {
        const data = await nudgeLearner(teachingScope(c), c.req.valid('json'));

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to nudge learner');
      }
    }
  );
