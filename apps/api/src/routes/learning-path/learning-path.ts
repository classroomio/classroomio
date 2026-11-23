import { zValidator } from '@hono/zod-validator';

import {
  ZAddLearningPathCourse,
  ZAddLearningPathMembers,
  ZCreateLearningPath,
  ZLearningPathCourseParam,
  ZLearningPathMemberParam,
  ZLearningPathParam,
  ZReorderLearningPathCourses,
  ZUpdateLearningPath
} from '@cio/utils/validation/learning-path/learning-path';
import { authMiddleware } from '@api/middlewares/auth';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { orgTeamMemberMiddleware } from '@api/middlewares/org-team-member';
import { createRateLimiter } from '@api/middlewares/rate-limiter';
import {
  enrollInLearningPathService,
  getLearnerLearningPathService,
  listEnrolledLearningPathsService,
  listExploreLearningPathsService
} from '@api/services/learning-path/learner';
import {
  addLearningPathCourseService,
  addLearningPathMembersService,
  createLearningPathService,
  deleteLearningPathService,
  getLearningPathDetailService,
  listLearningPathCourseOptionsService,
  listLearningPathMembersService,
  listLearningPathsService,
  removeLearningPathCourseService,
  removeLearningPathMemberService,
  reorderLearningPathCoursesService,
  updateLearningPathService
} from '@api/services/learning-path/learning-path';
import { handleError } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';

const enrollRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 20,
  message: 'Too many enrollment attempts. Please try again later.',
  keyGenerator: (c) => `learning-path-enroll:${c.get('user')?.id}:${c.req.param('pathId')}`
});

export const learningPathRouter = new Hono()
  /**
   * GET /learning-path/enrolled
   * The caller's active learning paths in the organization, with per-course progress and unlock state.
   */
  .get('/enrolled', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const paths = await listEnrolledLearningPathsService(orgId, user.id);

      return c.json({ success: true, data: paths }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list enrolled learning paths');
    }
  })
  /**
   * GET /learning-path/explore
   * Active self-enrollable learning paths the caller has not joined.
   */
  .get('/explore', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const paths = await listExploreLearningPathsService(orgId, user.id);

      return c.json({ success: true, data: paths }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list learning paths');
    }
  })
  /**
   * GET /learning-path
   * Every learning path in the organization with counts and an overview (admins and tutors).
   */
  .get('/', authMiddleware, orgTeamMemberMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const result = await listLearningPathsService(orgId);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list learning paths');
    }
  })
  /**
   * POST /learning-path
   * Creates a draft learning path (admins).
   */
  .post('/', authMiddleware, orgAdminMiddleware, zValidator('json', ZCreateLearningPath), async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const data = c.req.valid('json');
      const path = await createLearningPathService(orgId, user.id, data);

      return c.json({ success: true, data: path }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create learning path');
    }
  })
  /**
   * GET /learning-path/:pathId
   * A learning path with its ordered courses (admins and tutors).
   */
  .get('/:pathId', authMiddleware, orgTeamMemberMiddleware, zValidator('param', ZLearningPathParam), async (c) => {
    try {
      const { pathId } = c.req.valid('param');
      const orgId = c.req.header('cio-org-id')!;
      const path = await getLearningPathDetailService(orgId, pathId);

      return c.json({ success: true, data: path }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to get learning path');
    }
  })
  /**
   * PUT /learning-path/:pathId
   * Updates details, enrollment settings or status (admins only).
   */
  .put(
    '/:pathId',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZLearningPathParam),
    zValidator('json', ZUpdateLearningPath),
    async (c) => {
      try {
        const { pathId } = c.req.valid('param');
        const orgId = c.req.header('cio-org-id')!;
        const data = c.req.valid('json');
        const path = await updateLearningPathService(orgId, pathId, data);

        return c.json({ success: true, data: path }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update learning path');
      }
    }
  )
  /**
   * DELETE /learning-path/:pathId
   * Deletes a learning path. Course enrollments and progress stay (admins).
   */
  .delete('/:pathId', authMiddleware, orgAdminMiddleware, zValidator('param', ZLearningPathParam), async (c) => {
    try {
      const { pathId } = c.req.valid('param');
      const orgId = c.req.header('cio-org-id')!;
      const result = await deleteLearningPathService(orgId, pathId);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to delete learning path');
    }
  })
  /**
   * GET /learning-path/:pathId/course-options
   * Organization courses for the course picker, flagged when already in the path (admins only).
   */
  .get(
    '/:pathId/course-options',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZLearningPathParam),
    async (c) => {
      try {
        const { pathId } = c.req.valid('param');
        const orgId = c.req.header('cio-org-id')!;
        const courses = await listLearningPathCourseOptionsService(orgId, pathId);

        return c.json({ success: true, data: courses }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to list courses');
      }
    }
  )
  /**
   * POST /learning-path/:pathId/courses
   * Adds a course at the end of the path and, when the path auto-enrolls, enrolls its students in it (admins only).
   */
  .post(
    '/:pathId/courses',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZLearningPathParam),
    zValidator('json', ZAddLearningPathCourse),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { pathId } = c.req.valid('param');
        const { courseId } = c.req.valid('json');
        const orgId = c.req.header('cio-org-id')!;
        const result = await addLearningPathCourseService(orgId, pathId, courseId, user.id);

        return c.json({ success: true, data: result }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to add course to learning path');
      }
    }
  )
  /**
   * PUT /learning-path/:pathId/courses/order
   * Sets the course order. The body lists every course in the path once (admins only).
   */
  .put(
    '/:pathId/courses/order',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZLearningPathParam),
    zValidator('json', ZReorderLearningPathCourses),
    async (c) => {
      try {
        const { pathId } = c.req.valid('param');
        const { courseIds } = c.req.valid('json');
        const orgId = c.req.header('cio-org-id')!;
        const result = await reorderLearningPathCoursesService(orgId, pathId, courseIds);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to reorder learning path courses');
      }
    }
  )
  /**
   * DELETE /learning-path/:pathId/courses/:courseId
   * Removes a course from the path. Nobody is unenrolled (admins only).
   */
  .delete(
    '/:pathId/courses/:courseId',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZLearningPathCourseParam),
    async (c) => {
      try {
        const { pathId, courseId } = c.req.valid('param');
        const orgId = c.req.header('cio-org-id')!;
        const result = await removeLearningPathCourseService(orgId, pathId, courseId);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to remove course from learning path');
      }
    }
  )
  /**
   * GET /learning-path/:pathId/members
   * Students in the path with their path progress (admins only).
   */
  .get('/:pathId/members', authMiddleware, orgAdminMiddleware, zValidator('param', ZLearningPathParam), async (c) => {
    try {
      const { pathId } = c.req.valid('param');
      const orgId = c.req.header('cio-org-id')!;
      const members = await listLearningPathMembersService(orgId, pathId);

      return c.json({ success: true, data: members }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list learning path members');
    }
  })
  /**
   * POST /learning-path/:pathId/members
   * Adds existing accounts by email as students of the path and its courses (admins only).
   */
  .post(
    '/:pathId/members',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZLearningPathParam),
    zValidator('json', ZAddLearningPathMembers),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { pathId } = c.req.valid('param');
        const data = c.req.valid('json');
        const orgId = c.req.header('cio-org-id')!;
        const result = await addLearningPathMembersService(orgId, pathId, data, user.id);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to add learning path members');
      }
    }
  )
  /**
   * DELETE /learning-path/:pathId/members/:memberId
   * Removes a student from the path. Their course access and progress stay (admins only).
   */
  .delete(
    '/:pathId/members/:memberId',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZLearningPathMemberParam),
    async (c) => {
      try {
        const { pathId, memberId } = c.req.valid('param');
        const orgId = c.req.header('cio-org-id')!;
        const result = await removeLearningPathMemberService(orgId, pathId, memberId);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to remove learning path member');
      }
    }
  )
  /**
   * GET /learning-path/:pathId/learner
   * The path as the caller sees it: progress for members, an enroll preview for an open path.
   */
  .get('/:pathId/learner', authMiddleware, orgMemberMiddleware, zValidator('param', ZLearningPathParam), async (c) => {
    try {
      const user = c.get('user')!;
      const { pathId } = c.req.valid('param');
      const orgId = c.req.header('cio-org-id')!;
      const path = await getLearnerLearningPathService(orgId, pathId, user.id);

      return c.json({ success: true, data: path }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to get learning path');
    }
  })
  /**
   * POST /learning-path/:pathId/enroll
   * Joins a free, active, self-enrollable path and every course in it. Repeating the call changes nothing.
   */
  .post(
    '/:pathId/enroll',
    authMiddleware,
    orgMemberMiddleware,
    enrollRateLimit,
    zValidator('param', ZLearningPathParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { pathId } = c.req.valid('param');
        const orgId = c.req.header('cio-org-id')!;
        const path = await enrollInLearningPathService(orgId, pathId, user.id);

        return c.json({ success: true, data: path }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to join learning path');
      }
    }
  );
