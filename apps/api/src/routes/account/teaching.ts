import { getGradingQueueSubmission, listGradingQueue, listTeachingCourses } from '@api/services/account/teaching';

import { Hono } from '@api/utils/hono';
import { ROLE } from '@cio/utils/constants';
import { ZSubmissionGetParam } from '@cio/utils/validation/submission';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { orgTeamMemberMiddleware } from '@api/middlewares/org-team-member';
import { zValidator } from '@hono/zod-validator';

function isOrgAdminOf(orgRoles: unknown, orgId: string) {
  return ((orgRoles as Record<string, number> | undefined) ?? {})[orgId] === ROLE.ADMIN;
}

export const accountTeachingRouter = new Hono()
  /**
   * GET /account/grading-queue
   * Ungraded submissions across every course in the active organization the caller can grade, oldest first.
   */
  .get('/grading-queue', authMiddleware, orgTeamMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const isOrgAdmin = isOrgAdminOf(c.get('orgRoles'), orgId);
      const queue = await listGradingQueue(orgId, user.id, isOrgAdmin);

      c.header('Cache-Control', 'no-store');

      return c.json({ success: true, data: queue }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load the grading queue');
    }
  })
  /**
   * GET /account/grading-queue/:submissionId
   * One submission with its questions, the learner's answers and starting points, for grading.
   */
  .get(
    '/grading-queue/:submissionId',
    authMiddleware,
    orgTeamMemberMiddleware,
    zValidator('param', ZSubmissionGetParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgId = c.req.header('cio-org-id')!;
        const { submissionId } = c.req.valid('param');
        const submission = await getGradingQueueSubmission(orgId, user.id, submissionId);

        c.header('Cache-Control', 'no-store');

        return c.json({ success: true, data: submission }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to load the submission');
      }
    }
  )
  /**
   * GET /account/teaching-courses
   * Courses in the active organization the caller teaches, with enrollment, completions, overdue learners and
   * ungraded submissions.
   */
  .get('/teaching-courses', authMiddleware, orgTeamMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const isOrgAdmin = isOrgAdminOf(c.get('orgRoles'), orgId);
      const courses = await listTeachingCourses(orgId, user.id, isOrgAdmin);

      c.header('Cache-Control', 'no-store');

      return c.json({ success: true, data: courses }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load taught courses');
    }
  });
