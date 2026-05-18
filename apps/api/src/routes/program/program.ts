import * as z from 'zod';

import {
  ZAddCourseToProgram,
  ZAddProgramMembers,
  ZAssignExistingStudentsToProgram,
  ZCreateProgram,
  ZCreateProgramGoal,
  ZCreateProgramNewsfeed,
  ZCreateProgramNewsfeedComment,
  ZInviteStudentsToProgram,
  ZUpdateProgram,
  ZUpdateProgramGoal,
  ZUpdateProgramMember,
  ZUpdateProgramNewsfeed,
  ZUpdateProgramReaction
} from '@cio/utils/validation/program';
import {
  addCourseToProgramService,
  addProgramMembers,
  createProgram,
  createProgramNewsfeedCommentService,
  createProgramNewsfeedService,
  deleteProgram,
  removeProgramMemberService,
  deleteProgramNewsfeedCommentService,
  deleteProgramNewsfeedService,
  getEnrolledPrograms,
  getProgram,
  listOrgPrograms,
  listProgramCourses,
  listProgramMembers,
  listProgramNewsfeed,
  listProgramNewsfeedComments,
  removeCourseFromProgramService,
  updateProgram,
  updateProgramMemberService,
  updateProgramNewsfeedReactionService,
  updateProgramNewsfeedService
} from '@api/services/program/program';
import { assignExistingStudentsToProgram, inviteStudentsToProgram } from '@api/services/program/invite';
import {
  archiveGoal,
  createGoal,
  evaluateGoal,
  evaluateProgramGoals,
  getGoal,
  getMyGoals,
  getOrgGoalsOverview,
  listGoals,
  removeGoal,
  updateGoal
} from '@api/services/program/goal';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgTeamMemberMiddleware } from '@api/middlewares/org-team-member';
import { programMemberMiddleware } from '@api/middlewares/program-member';
import { programTeamMemberMiddleware } from '@api/middlewares/program-team-member';
import { programNewsfeedCommentAuthorOrTeamMiddleware } from '@api/middlewares/program-newsfeed-comment-author-or-team';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

const ZProgramParam = z.object({ programId: z.string().uuid() });
const ZMemberParam = z.object({ programId: z.string().uuid(), memberId: z.string().uuid() });
const ZCourseParam = z.object({ programId: z.string().uuid(), courseId: z.string().uuid() });
const ZFeedParam = z.object({ programId: z.string().uuid(), feedId: z.string().uuid() });
const ZCommentParam = z.object({
  programId: z.string().uuid(),
  feedId: z.string().uuid(),
  commentId: z.coerce.number().int()
});
const ZGoalParam = z.object({ programId: z.string().uuid(), goalId: z.string().uuid() });
const ZListQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});
const ZOrgQuery = z.object({ organizationId: z.string().uuid() });

export const programRouter = new Hono()
  // ── Enrolled Programs (LMS) ─── must be before /:programId ───────────────

  /**
   * GET /program/enrolled
   * Get programs the current user is enrolled in
   */
  .get('/enrolled', authMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const programs = await getEnrolledPrograms(user.id);
      return c.json({ success: true, data: programs }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to get enrolled programs');
    }
  })

  // ── Programs ──────────────────────────────────────────────────────────────

  /**
   * GET /program?organizationId=...
   * List all programs for an org
   */
  .get('/', authMiddleware, zValidator('query', ZOrgQuery), async (c) => {
    try {
      const { organizationId } = c.req.valid('query');
      const programs = await listOrgPrograms(organizationId);
      return c.json({ success: true, data: programs }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list programs');
    }
  })

  /**
   * POST /program
   * Create a new program
   */
  .post(
    '/',
    authMiddleware,
    zValidator('json', ZCreateProgram.extend({ organizationId: z.string().uuid() })),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { organizationId, ...data } = c.req.valid('json');
        const program = await createProgram(organizationId, user.id, data);
        return c.json({ success: true, data: program }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create program');
      }
    }
  )

  /**
   * GET /program/:programId
   * Get a program by ID
   */
  .get('/:programId', authMiddleware, programMemberMiddleware, zValidator('param', ZProgramParam), async (c) => {
    try {
      const { programId } = c.req.valid('param');
      const program = await getProgram(programId);
      return c.json({ success: true, data: program }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to get program');
    }
  })

  /**
   * PUT /program/:programId
   * Update a program
   */
  .put(
    '/:programId',
    authMiddleware,
    programTeamMemberMiddleware,
    zValidator('param', ZProgramParam),
    zValidator('json', ZUpdateProgram),
    async (c) => {
      try {
        const { programId } = c.req.valid('param');
        const data = c.req.valid('json');
        const program = await updateProgram(programId, data);
        return c.json({ success: true, data: program }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update program');
      }
    }
  )

  /**
   * DELETE /program/:programId
   * Delete a program
   */
  .delete('/:programId', authMiddleware, programTeamMemberMiddleware, zValidator('param', ZProgramParam), async (c) => {
    try {
      const { programId } = c.req.valid('param');
      const program = await deleteProgram(programId);
      return c.json({ success: true, data: program }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to delete program');
    }
  })

  // ── Members ───────────────────────────────────────────────────────────────

  /**
   * GET /program/:programId/members
   * List program members
   */
  .get(
    '/:programId/members',
    authMiddleware,
    programMemberMiddleware,
    zValidator('param', ZProgramParam),
    async (c) => {
      try {
        const { programId } = c.req.valid('param');
        const members = await listProgramMembers(programId);
        return c.json({ success: true, data: members }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to list program members');
      }
    }
  )

  /**
   * POST /program/:programId/members
   * Add members to a program
   */
  .post(
    '/:programId/members',
    authMiddleware,
    programTeamMemberMiddleware,
    zValidator('param', ZProgramParam),
    zValidator('json', ZAddProgramMembers),
    async (c) => {
      try {
        const { programId } = c.req.valid('param');
        const data = c.req.valid('json');
        const result = await addProgramMembers(programId, data);
        return c.json({ success: true, data: result }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to add program members');
      }
    }
  )

  /**
   * PUT /program/:programId/members/:memberId
   * Update a program member's role
   */
  .put(
    '/:programId/members/:memberId',
    authMiddleware,
    programTeamMemberMiddleware,
    zValidator('param', ZMemberParam),
    zValidator('json', ZUpdateProgramMember),
    async (c) => {
      try {
        const { programId, memberId } = c.req.valid('param');
        const data = c.req.valid('json');
        const member = await updateProgramMemberService(programId, memberId, data);
        return c.json({ success: true, data: member }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update program member');
      }
    }
  )

  /**
   * DELETE /program/:programId/members/:memberId
   * Remove a member from a program
   */
  .delete(
    '/:programId/members/:memberId',
    authMiddleware,
    programTeamMemberMiddleware,
    zValidator('param', ZMemberParam),
    async (c) => {
      try {
        const { programId, memberId } = c.req.valid('param');
        const member = await removeProgramMemberService(programId, memberId);
        return c.json({ success: true, data: member }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to remove program member');
      }
    }
  )

  // ── Invite ────────────────────────────────────────────────────────────────

  /**
   * POST /program/:programId/invite
   * Invite new students to a program by CSV emails. Issues org invites
   * pre-tagged with this program so accept auto-enrolls them.
   * Gated by program-team-member middleware — Program ADMINs/TUTORs can
   * invite into their own program without org-admin rights.
   */
  .post(
    '/:programId/invite',
    authMiddleware,
    programTeamMemberMiddleware,
    zValidator('param', ZProgramParam),
    zValidator('json', ZInviteStudentsToProgram),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { programId } = c.req.valid('param');
        const data = c.req.valid('json');
        const result = await inviteStudentsToProgram(programId, data, user.id);
        return c.json({ success: true, data: result }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to invite students to program');
      }
    }
  )

  /**
   * POST /program/:programId/invite/assign
   * Assign existing org-audience student profiles to a program.
   */
  .post(
    '/:programId/invite/assign',
    authMiddleware,
    programTeamMemberMiddleware,
    zValidator('param', ZProgramParam),
    zValidator('json', ZAssignExistingStudentsToProgram),
    async (c) => {
      try {
        const { programId } = c.req.valid('param');
        const data = c.req.valid('json');
        const result = await assignExistingStudentsToProgram(programId, data);
        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to assign students to program');
      }
    }
  )

  // ── Courses ───────────────────────────────────────────────────────────────

  /**
   * GET /program/:programId/courses
   * List courses in a program
   */
  .get(
    '/:programId/courses',
    authMiddleware,
    programMemberMiddleware,
    zValidator('param', ZProgramParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { programId } = c.req.valid('param');
        const courses = await listProgramCourses(programId, user.id);
        return c.json({ success: true, data: courses }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to list program courses');
      }
    }
  )

  /**
   * POST /program/:programId/courses
   * Add a course to a program
   */
  .post(
    '/:programId/courses',
    authMiddleware,
    programTeamMemberMiddleware,
    zValidator('param', ZProgramParam),
    zValidator('json', ZAddCourseToProgram),
    async (c) => {
      try {
        const { programId } = c.req.valid('param');
        const data = c.req.valid('json');
        const result = await addCourseToProgramService(programId, data);
        return c.json({ success: true, data: result }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to add course to program');
      }
    }
  )

  /**
   * DELETE /program/:programId/courses/:courseId
   * Remove a course from a program
   */
  .delete(
    '/:programId/courses/:courseId',
    authMiddleware,
    programTeamMemberMiddleware,
    zValidator('param', ZCourseParam),
    async (c) => {
      try {
        const { programId, courseId } = c.req.valid('param');
        const result = await removeCourseFromProgramService(programId, courseId);
        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to remove course from program');
      }
    }
  )

  // ── Newsfeed ──────────────────────────────────────────────────────────────

  /**
   * GET /program/:programId/newsfeed
   * List newsfeed for a program (paginated)
   */
  .get(
    '/:programId/newsfeed',
    authMiddleware,
    programMemberMiddleware,
    zValidator('param', ZProgramParam),
    zValidator('query', ZListQuery),
    async (c) => {
      try {
        const { programId } = c.req.valid('param');
        const { cursor, limit } = c.req.valid('query');
        const result = await listProgramNewsfeed(programId, { cursor, limit });
        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to list program newsfeed');
      }
    }
  )

  /**
   * POST /program/:programId/newsfeed
   * Create a newsfeed post
   */
  .post(
    '/:programId/newsfeed',
    authMiddleware,
    programTeamMemberMiddleware,
    zValidator('param', ZProgramParam),
    zValidator('json', ZCreateProgramNewsfeed),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { programId } = c.req.valid('param');
        const data = c.req.valid('json');
        const feed = await createProgramNewsfeedService(programId, user.id, data);
        return c.json({ success: true, data: feed }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create program newsfeed post');
      }
    }
  )

  /**
   * PUT /program/:programId/newsfeed/:feedId
   * Update a newsfeed post
   */
  .put(
    '/:programId/newsfeed/:feedId',
    authMiddleware,
    programTeamMemberMiddleware,
    zValidator('param', ZFeedParam),
    zValidator('json', ZUpdateProgramNewsfeed),
    async (c) => {
      try {
        const { feedId } = c.req.valid('param');
        const data = c.req.valid('json');
        const feed = await updateProgramNewsfeedService(feedId, data);
        return c.json({ success: true, data: feed }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update program newsfeed post');
      }
    }
  )

  /**
   * PUT /program/:programId/newsfeed/:feedId/react
   * Update reaction on a newsfeed post
   */
  .put(
    '/:programId/newsfeed/:feedId/react',
    authMiddleware,
    programMemberMiddleware,
    zValidator('param', ZFeedParam),
    zValidator('json', ZUpdateProgramReaction),
    async (c) => {
      try {
        const { feedId } = c.req.valid('param');
        const data = c.req.valid('json');
        const feed = await updateProgramNewsfeedReactionService(feedId, data);
        return c.json({ success: true, data: feed }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update program newsfeed reaction');
      }
    }
  )

  /**
   * DELETE /program/:programId/newsfeed/:feedId
   * Delete a newsfeed post
   */
  .delete(
    '/:programId/newsfeed/:feedId',
    authMiddleware,
    programTeamMemberMiddleware,
    zValidator('param', ZFeedParam),
    async (c) => {
      try {
        const { feedId } = c.req.valid('param');
        const feed = await deleteProgramNewsfeedService(feedId);
        return c.json({ success: true, data: feed }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to delete program newsfeed post');
      }
    }
  )

  /**
   * GET /program/:programId/newsfeed/:feedId/comments
   * List comments on a newsfeed post
   */
  .get(
    '/:programId/newsfeed/:feedId/comments',
    authMiddleware,
    programMemberMiddleware,
    zValidator('param', ZFeedParam),
    async (c) => {
      try {
        const { feedId } = c.req.valid('param');
        const comments = await listProgramNewsfeedComments(feedId);
        return c.json({ success: true, data: comments }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to list program newsfeed comments');
      }
    }
  )

  /**
   * POST /program/:programId/newsfeed/:feedId/comment
   * Create a comment on a newsfeed post
   */
  .post(
    '/:programId/newsfeed/:feedId/comment',
    authMiddleware,
    programMemberMiddleware,
    zValidator('param', ZFeedParam),
    zValidator('json', ZCreateProgramNewsfeedComment),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { feedId } = c.req.valid('param');
        const data = c.req.valid('json');
        const comment = await createProgramNewsfeedCommentService(feedId, user.id, data);
        return c.json({ success: true, data: comment }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create program newsfeed comment');
      }
    }
  )

  /**
   * DELETE /program/:programId/newsfeed/:feedId/comment/:commentId
   * Delete a comment on a newsfeed post
   */
  .delete(
    '/:programId/newsfeed/:feedId/comment/:commentId',
    authMiddleware,
    programNewsfeedCommentAuthorOrTeamMiddleware,
    zValidator('param', ZCommentParam),
    async (c) => {
      try {
        const { commentId } = c.req.valid('param');
        const comment = await deleteProgramNewsfeedCommentService(commentId);
        return c.json({ success: true, data: comment }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to delete program newsfeed comment');
      }
    }
  )

  // ── Goals ─────────────────────────────────────────────────────────────────

  /**
   * GET /program/my/goals
   * Goal assignments for the current authenticated user across all their programs.
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
   * GET /program/goals/overview?organizationId=...
   * Cross-program goal roll-up for the org owner. One entry per active goal
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
   * GET /program/:programId/goals
   */
  .get('/:programId/goals', authMiddleware, programMemberMiddleware, zValidator('param', ZProgramParam), async (c) => {
    try {
      const { programId } = c.req.valid('param');
      const goals = await listGoals(programId);
      return c.json({ success: true, data: goals }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list program goals');
    }
  })

  /**
   * POST /program/:programId/goals
   */
  .post(
    '/:programId/goals',
    authMiddleware,
    programTeamMemberMiddleware,
    zValidator('param', ZProgramParam),
    zValidator('json', ZCreateProgramGoal),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { programId } = c.req.valid('param');
        const data = c.req.valid('json');
        const goal = await createGoal(programId, user.id, data);
        return c.json({ success: true, data: goal }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create program goal');
      }
    }
  )

  /**
   * GET /program/:programId/goals/:goalId
   */
  .get(
    '/:programId/goals/:goalId',
    authMiddleware,
    programMemberMiddleware,
    zValidator('param', ZGoalParam),
    async (c) => {
      try {
        const { goalId } = c.req.valid('param');
        const goal = await getGoal(goalId);
        return c.json({ success: true, data: goal }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to get program goal');
      }
    }
  )

  /**
   * PUT /program/:programId/goals/:goalId
   */
  .put(
    '/:programId/goals/:goalId',
    authMiddleware,
    programTeamMemberMiddleware,
    zValidator('param', ZGoalParam),
    zValidator('json', ZUpdateProgramGoal),
    async (c) => {
      try {
        const { goalId } = c.req.valid('param');
        const data = c.req.valid('json');
        const goal = await updateGoal(goalId, data);
        return c.json({ success: true, data: goal }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update program goal');
      }
    }
  )

  /**
   * DELETE /program/:programId/goals/:goalId
   * Hard delete (vs. archive). Use PUT with status=archived to preserve history.
   */
  .delete(
    '/:programId/goals/:goalId',
    authMiddleware,
    programTeamMemberMiddleware,
    zValidator('param', ZGoalParam),
    async (c) => {
      try {
        const { goalId } = c.req.valid('param');
        const goal = await removeGoal(goalId);
        return c.json({ success: true, data: goal }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to delete program goal');
      }
    }
  )

  /**
   * POST /program/:programId/goals/:goalId/archive
   */
  .post(
    '/:programId/goals/:goalId/archive',
    authMiddleware,
    programTeamMemberMiddleware,
    zValidator('param', ZGoalParam),
    async (c) => {
      try {
        const { goalId } = c.req.valid('param');
        const goal = await archiveGoal(goalId);
        return c.json({ success: true, data: goal }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to archive program goal');
      }
    }
  )

  /**
   * POST /program/:programId/goals/:goalId/evaluate
   * Force a re-evaluation of one goal's per-learner statuses.
   */
  .post(
    '/:programId/goals/:goalId/evaluate',
    authMiddleware,
    programTeamMemberMiddleware,
    zValidator('param', ZGoalParam),
    async (c) => {
      try {
        const { goalId } = c.req.valid('param');
        const result = await evaluateGoal(goalId);
        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to evaluate program goal');
      }
    }
  )

  /**
   * POST /program/:programId/goals/evaluate-all
   * Force a re-evaluation of every active goal in the program.
   */
  .post(
    '/:programId/goals/evaluate-all',
    authMiddleware,
    programTeamMemberMiddleware,
    zValidator('param', ZProgramParam),
    async (c) => {
      try {
        const { programId } = c.req.valid('param');
        const result = await evaluateProgramGoals(programId);
        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to evaluate program goals');
      }
    }
  );
