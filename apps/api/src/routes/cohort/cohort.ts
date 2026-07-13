import * as z from 'zod';

import {
  ZAddCourseToCohort,
  ZAddCohortMembers,
  ZAssignExistingStudentsToCohort,
  ZCreateCohort,
  ZCreateCohortGoal,
  ZCreateCohortNewsfeed,
  ZCreateCohortNewsfeedComment,
  ZInviteStudentsToCohort,
  ZUpdateCohort,
  ZUpdateCohortGoal,
  ZUpdateCohortMember,
  ZUpdateCohortNewsfeed,
  ZUpdateCohortReaction
} from '@cio/utils/validation/cohort';
import {
  addCourseToCohortService,
  addCohortMembers,
  createCohort,
  createCohortNewsfeedCommentService,
  createCohortNewsfeedService,
  deleteCohort,
  removeCohortMemberService,
  deleteCohortNewsfeedCommentService,
  deleteCohortNewsfeedService,
  getEnrolledCohorts,
  getCohort,
  listOrgCohorts,
  listCohortCourses,
  listCohortMembers,
  listCohortNewsfeed,
  listCohortNewsfeedComments,
  removeCourseFromCohortService,
  updateCohort,
  updateCohortMemberService,
  updateCohortNewsfeedReactionService,
  updateCohortNewsfeedService
} from '@api/services/cohort/cohort';
import { assignExistingStudentsToCohort, inviteStudentsToCohort } from '@api/services/cohort/invite';
import {
  archiveGoal,
  createGoal,
  evaluateGoal,
  evaluateCohortGoals,
  getGoal,
  getMyGoals,
  getOrgGoalsOverview,
  listGoals,
  removeGoal,
  updateGoal
} from '@api/services/cohort/goal';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgTeamMemberMiddleware } from '@api/middlewares/org-team-member';
import { cohortMemberMiddleware } from '@api/middlewares/cohort-member';
import { cohortTeamMemberMiddleware } from '@api/middlewares/cohort-team-member';
import { cohortNewsfeedCommentAuthorOrTeamMiddleware } from '@api/middlewares/cohort-newsfeed-comment-author-or-team';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

const ZCohortParam = z.object({ cohortId: z.string().uuid() });
const ZMemberParam = z.object({ cohortId: z.string().uuid(), memberId: z.string().uuid() });
const ZCourseParam = z.object({ cohortId: z.string().uuid(), courseId: z.string().uuid() });
const ZFeedParam = z.object({ cohortId: z.string().uuid(), feedId: z.string().uuid() });
const ZCommentParam = z.object({
  cohortId: z.string().uuid(),
  feedId: z.string().uuid(),
  commentId: z.coerce.number().int()
});
const ZGoalParam = z.object({ cohortId: z.string().uuid(), goalId: z.string().uuid() });
const ZListQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});
const ZOrgQuery = z.object({ organizationId: z.string().uuid() });

export const cohortRouter = new Hono()
  // ── Enrolled Cohorts (LMS) ─── must be before /:cohortId ───────────────

  /**
   * GET /cohort/enrolled
   * Get cohorts the current user is enrolled in
   */
  .get('/enrolled', authMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const cohorts = await getEnrolledCohorts(user.id);
      return c.json({ success: true, data: cohorts }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to get enrolled cohorts');
    }
  })

  // ── Cohorts ───────────────────────────────────────────────────────────────

  /**
   * GET /cohort?organizationId=...
   * List all cohorts for an org
   */
  .get('/', authMiddleware, zValidator('query', ZOrgQuery), async (c) => {
    try {
      const { organizationId } = c.req.valid('query');
      const cohorts = await listOrgCohorts(organizationId);
      return c.json({ success: true, data: cohorts }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list cohorts');
    }
  })

  /**
   * POST /cohort
   * Create a new cohort
   */
  .post(
    '/',
    authMiddleware,
    zValidator('json', ZCreateCohort.extend({ organizationId: z.string().uuid() })),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { organizationId, ...data } = c.req.valid('json');
        const cohort = await createCohort(organizationId, user.id, data);
        return c.json({ success: true, data: cohort }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create cohort');
      }
    }
  )

  /**
   * GET /cohort/:cohortId
   * Get a cohort by ID
   */
  .get('/:cohortId', authMiddleware, cohortMemberMiddleware, zValidator('param', ZCohortParam), async (c) => {
    try {
      const { cohortId } = c.req.valid('param');
      const cohort = await getCohort(cohortId);
      return c.json({ success: true, data: cohort }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to get cohort');
    }
  })

  /**
   * PUT /cohort/:cohortId
   * Update a cohort
   */
  .put(
    '/:cohortId',
    authMiddleware,
    cohortTeamMemberMiddleware,
    zValidator('param', ZCohortParam),
    zValidator('json', ZUpdateCohort),
    async (c) => {
      try {
        const { cohortId } = c.req.valid('param');
        const data = c.req.valid('json');
        const cohort = await updateCohort(cohortId, data);
        return c.json({ success: true, data: cohort }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update cohort');
      }
    }
  )

  /**
   * DELETE /cohort/:cohortId
   * Delete a cohort
   */
  .delete('/:cohortId', authMiddleware, cohortTeamMemberMiddleware, zValidator('param', ZCohortParam), async (c) => {
    try {
      const { cohortId } = c.req.valid('param');
      const cohort = await deleteCohort(cohortId);
      return c.json({ success: true, data: cohort }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to delete cohort');
    }
  })

  // ── Members ───────────────────────────────────────────────────────────────

  /**
   * GET /cohort/:cohortId/members
   * List cohort members
   */
  .get('/:cohortId/members', authMiddleware, cohortMemberMiddleware, zValidator('param', ZCohortParam), async (c) => {
    try {
      const { cohortId } = c.req.valid('param');
      const members = await listCohortMembers(cohortId);
      return c.json({ success: true, data: members }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list cohort members');
    }
  })

  /**
   * POST /cohort/:cohortId/members
   * Add members to a cohort
   */
  .post(
    '/:cohortId/members',
    authMiddleware,
    cohortTeamMemberMiddleware,
    zValidator('param', ZCohortParam),
    zValidator('json', ZAddCohortMembers),
    async (c) => {
      try {
        const { cohortId } = c.req.valid('param');
        const data = c.req.valid('json');
        const result = await addCohortMembers(cohortId, data);
        return c.json({ success: true, data: result }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to add cohort members');
      }
    }
  )

  /**
   * PUT /cohort/:cohortId/members/:memberId
   * Update a cohort member's role
   */
  .put(
    '/:cohortId/members/:memberId',
    authMiddleware,
    cohortTeamMemberMiddleware,
    zValidator('param', ZMemberParam),
    zValidator('json', ZUpdateCohortMember),
    async (c) => {
      try {
        const { cohortId, memberId } = c.req.valid('param');
        const data = c.req.valid('json');
        const member = await updateCohortMemberService(cohortId, memberId, data);
        return c.json({ success: true, data: member }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update cohort member');
      }
    }
  )

  /**
   * DELETE /cohort/:cohortId/members/:memberId
   * Remove a member from a cohort
   */
  .delete(
    '/:cohortId/members/:memberId',
    authMiddleware,
    cohortTeamMemberMiddleware,
    zValidator('param', ZMemberParam),
    async (c) => {
      try {
        const { cohortId, memberId } = c.req.valid('param');
        const member = await removeCohortMemberService(cohortId, memberId);
        return c.json({ success: true, data: member }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to remove cohort member');
      }
    }
  )

  // ── Invite ────────────────────────────────────────────────────────────────

  /**
   * POST /cohort/:cohortId/invite
   * Invite new students to a cohort by CSV emails. Issues org invites
   * pre-tagged with this cohort so accept auto-enrolls them.
   * Gated by cohort-team-member middleware — Cohort ADMINs/TUTORs can
   * invite into their own cohort without org-admin rights.
   */
  .post(
    '/:cohortId/invite',
    authMiddleware,
    cohortTeamMemberMiddleware,
    zValidator('param', ZCohortParam),
    zValidator('json', ZInviteStudentsToCohort),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { cohortId } = c.req.valid('param');
        const data = c.req.valid('json');
        const result = await inviteStudentsToCohort(cohortId, data, user.id);
        return c.json({ success: true, data: result }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to invite students to cohort');
      }
    }
  )

  /**
   * POST /cohort/:cohortId/invite/assign
   * Assign existing org-audience student profiles to a cohort.
   */
  .post(
    '/:cohortId/invite/assign',
    authMiddleware,
    cohortTeamMemberMiddleware,
    zValidator('param', ZCohortParam),
    zValidator('json', ZAssignExistingStudentsToCohort),
    async (c) => {
      try {
        const { cohortId } = c.req.valid('param');
        const data = c.req.valid('json');
        const result = await assignExistingStudentsToCohort(cohortId, data);
        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to assign students to cohort');
      }
    }
  )

  // ── Courses ───────────────────────────────────────────────────────────────

  /**
   * GET /cohort/:cohortId/courses
   * List courses in a cohort
   */
  .get('/:cohortId/courses', authMiddleware, cohortMemberMiddleware, zValidator('param', ZCohortParam), async (c) => {
    try {
      const user = c.get('user')!;
      const { cohortId } = c.req.valid('param');
      const courses = await listCohortCourses(cohortId, user.id);
      return c.json({ success: true, data: courses }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list cohort courses');
    }
  })

  /**
   * POST /cohort/:cohortId/courses
   * Add a course to a cohort
   */
  .post(
    '/:cohortId/courses',
    authMiddleware,
    cohortTeamMemberMiddleware,
    zValidator('param', ZCohortParam),
    zValidator('json', ZAddCourseToCohort),
    async (c) => {
      try {
        const { cohortId } = c.req.valid('param');
        const data = c.req.valid('json');
        const result = await addCourseToCohortService(cohortId, data);
        return c.json({ success: true, data: result }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to add course to cohort');
      }
    }
  )

  /**
   * DELETE /cohort/:cohortId/courses/:courseId
   * Remove a course from a cohort
   */
  .delete(
    '/:cohortId/courses/:courseId',
    authMiddleware,
    cohortTeamMemberMiddleware,
    zValidator('param', ZCourseParam),
    async (c) => {
      try {
        const { cohortId, courseId } = c.req.valid('param');
        const result = await removeCourseFromCohortService(cohortId, courseId);
        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to remove course from cohort');
      }
    }
  )

  // ── Newsfeed ──────────────────────────────────────────────────────────────

  /**
   * GET /cohort/:cohortId/newsfeed
   * List newsfeed for a cohort (paginated)
   */
  .get(
    '/:cohortId/newsfeed',
    authMiddleware,
    cohortMemberMiddleware,
    zValidator('param', ZCohortParam),
    zValidator('query', ZListQuery),
    async (c) => {
      try {
        const { cohortId } = c.req.valid('param');
        const { cursor, limit } = c.req.valid('query');
        const result = await listCohortNewsfeed(cohortId, { cursor, limit });
        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to list cohort newsfeed');
      }
    }
  )

  /**
   * POST /cohort/:cohortId/newsfeed
   * Create a newsfeed post
   */
  .post(
    '/:cohortId/newsfeed',
    authMiddleware,
    cohortTeamMemberMiddleware,
    zValidator('param', ZCohortParam),
    zValidator('json', ZCreateCohortNewsfeed),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { cohortId } = c.req.valid('param');
        const data = c.req.valid('json');
        const feed = await createCohortNewsfeedService(cohortId, user.id, data);
        return c.json({ success: true, data: feed }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create cohort newsfeed post');
      }
    }
  )

  /**
   * PUT /cohort/:cohortId/newsfeed/:feedId
   * Update a newsfeed post
   */
  .put(
    '/:cohortId/newsfeed/:feedId',
    authMiddleware,
    cohortTeamMemberMiddleware,
    zValidator('param', ZFeedParam),
    zValidator('json', ZUpdateCohortNewsfeed),
    async (c) => {
      try {
        const { feedId } = c.req.valid('param');
        const data = c.req.valid('json');
        const feed = await updateCohortNewsfeedService(feedId, data);
        return c.json({ success: true, data: feed }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update cohort newsfeed post');
      }
    }
  )

  /**
   * PUT /cohort/:cohortId/newsfeed/:feedId/react
   * Update reaction on a newsfeed post
   */
  .put(
    '/:cohortId/newsfeed/:feedId/react',
    authMiddleware,
    cohortMemberMiddleware,
    zValidator('param', ZFeedParam),
    zValidator('json', ZUpdateCohortReaction),
    async (c) => {
      try {
        const { feedId } = c.req.valid('param');
        const data = c.req.valid('json');
        const feed = await updateCohortNewsfeedReactionService(feedId, data);
        return c.json({ success: true, data: feed }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update cohort newsfeed reaction');
      }
    }
  )

  /**
   * DELETE /cohort/:cohortId/newsfeed/:feedId
   * Delete a newsfeed post
   */
  .delete(
    '/:cohortId/newsfeed/:feedId',
    authMiddleware,
    cohortTeamMemberMiddleware,
    zValidator('param', ZFeedParam),
    async (c) => {
      try {
        const { feedId } = c.req.valid('param');
        const feed = await deleteCohortNewsfeedService(feedId);
        return c.json({ success: true, data: feed }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to delete cohort newsfeed post');
      }
    }
  )

  /**
   * GET /cohort/:cohortId/newsfeed/:feedId/comments
   * List comments on a newsfeed post
   */
  .get(
    '/:cohortId/newsfeed/:feedId/comments',
    authMiddleware,
    cohortMemberMiddleware,
    zValidator('param', ZFeedParam),
    async (c) => {
      try {
        const { feedId } = c.req.valid('param');
        const comments = await listCohortNewsfeedComments(feedId);
        return c.json({ success: true, data: comments }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to list cohort newsfeed comments');
      }
    }
  )

  /**
   * POST /cohort/:cohortId/newsfeed/:feedId/comment
   * Create a comment on a newsfeed post
   */
  .post(
    '/:cohortId/newsfeed/:feedId/comment',
    authMiddleware,
    cohortMemberMiddleware,
    zValidator('param', ZFeedParam),
    zValidator('json', ZCreateCohortNewsfeedComment),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { feedId } = c.req.valid('param');
        const data = c.req.valid('json');
        const comment = await createCohortNewsfeedCommentService(feedId, user.id, data);
        return c.json({ success: true, data: comment }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create cohort newsfeed comment');
      }
    }
  )

  /**
   * DELETE /cohort/:cohortId/newsfeed/:feedId/comment/:commentId
   * Delete a comment on a newsfeed post
   */
  .delete(
    '/:cohortId/newsfeed/:feedId/comment/:commentId',
    authMiddleware,
    cohortNewsfeedCommentAuthorOrTeamMiddleware,
    zValidator('param', ZCommentParam),
    async (c) => {
      try {
        const { commentId } = c.req.valid('param');
        const comment = await deleteCohortNewsfeedCommentService(commentId);
        return c.json({ success: true, data: comment }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to delete cohort newsfeed comment');
      }
    }
  )

  // ── Goals ─────────────────────────────────────────────────────────────────

  /**
   * GET /cohort/my/goals
   * Goal assignments for the current authenticated user across all their cohorts.
   * Used by the LMS "Your Goals" widget.
   */
  .get('/my/goals', authMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const goals = await getMyGoals(user.id);
      return c.json({ success: true, data: goals }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load goals');
    }
  })

  /**
   * GET /cohort/goals/overview?organizationId=...
   * Cross-cohort goal roll-up for the org owner. One entry per active goal
   * with per-status learner counts, scoped to the org via header + query.
   */
  .get('/goals/overview', authMiddleware, orgTeamMemberMiddleware, zValidator('query', ZOrgQuery), async (c) => {
    try {
      const { organizationId } = c.req.valid('query');
      const overview = await getOrgGoalsOverview(organizationId);
      return c.json({ success: true, data: overview }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load goals overview');
    }
  })

  /**
   * GET /cohort/:cohortId/goals
   */
  .get('/:cohortId/goals', authMiddleware, cohortMemberMiddleware, zValidator('param', ZCohortParam), async (c) => {
    try {
      const { cohortId } = c.req.valid('param');
      const goals = await listGoals(cohortId);
      return c.json({ success: true, data: goals }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list cohort goals');
    }
  })

  /**
   * POST /cohort/:cohortId/goals
   */
  .post(
    '/:cohortId/goals',
    authMiddleware,
    cohortTeamMemberMiddleware,
    zValidator('param', ZCohortParam),
    zValidator('json', ZCreateCohortGoal),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { cohortId } = c.req.valid('param');
        const data = c.req.valid('json');
        const goal = await createGoal(cohortId, user.id, data);
        return c.json({ success: true, data: goal }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create cohort goal');
      }
    }
  )

  /**
   * GET /cohort/:cohortId/goals/:goalId
   */
  .get(
    '/:cohortId/goals/:goalId',
    authMiddleware,
    cohortMemberMiddleware,
    zValidator('param', ZGoalParam),
    async (c) => {
      try {
        const { goalId } = c.req.valid('param');
        const goal = await getGoal(goalId);
        return c.json({ success: true, data: goal }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to get cohort goal');
      }
    }
  )

  /**
   * PUT /cohort/:cohortId/goals/:goalId
   */
  .put(
    '/:cohortId/goals/:goalId',
    authMiddleware,
    cohortTeamMemberMiddleware,
    zValidator('param', ZGoalParam),
    zValidator('json', ZUpdateCohortGoal),
    async (c) => {
      try {
        const { goalId } = c.req.valid('param');
        const data = c.req.valid('json');
        const goal = await updateGoal(goalId, data);
        return c.json({ success: true, data: goal }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update cohort goal');
      }
    }
  )

  /**
   * DELETE /cohort/:cohortId/goals/:goalId
   * Hard delete (vs. archive). Use PUT with status=archived to preserve history.
   */
  .delete(
    '/:cohortId/goals/:goalId',
    authMiddleware,
    cohortTeamMemberMiddleware,
    zValidator('param', ZGoalParam),
    async (c) => {
      try {
        const { goalId } = c.req.valid('param');
        const goal = await removeGoal(goalId);
        return c.json({ success: true, data: goal }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to delete cohort goal');
      }
    }
  )

  /**
   * POST /cohort/:cohortId/goals/:goalId/archive
   */
  .post(
    '/:cohortId/goals/:goalId/archive',
    authMiddleware,
    cohortTeamMemberMiddleware,
    zValidator('param', ZGoalParam),
    async (c) => {
      try {
        const { goalId } = c.req.valid('param');
        const goal = await archiveGoal(goalId);
        return c.json({ success: true, data: goal }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to archive cohort goal');
      }
    }
  )

  /**
   * POST /cohort/:cohortId/goals/:goalId/evaluate
   * Force a re-evaluation of one goal's per-learner statuses.
   */
  .post(
    '/:cohortId/goals/:goalId/evaluate',
    authMiddleware,
    cohortTeamMemberMiddleware,
    zValidator('param', ZGoalParam),
    async (c) => {
      try {
        const { goalId } = c.req.valid('param');
        const result = await evaluateGoal(goalId);
        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to evaluate cohort goal');
      }
    }
  )

  /**
   * POST /cohort/:cohortId/goals/evaluate-all
   * Force a re-evaluation of every active goal in the cohort.
   */
  .post(
    '/:cohortId/goals/evaluate-all',
    authMiddleware,
    cohortTeamMemberMiddleware,
    zValidator('param', ZCohortParam),
    async (c) => {
      try {
        const { cohortId } = c.req.valid('param');
        const result = await evaluateCohortGoals(cohortId);
        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to evaluate cohort goals');
      }
    }
  );
