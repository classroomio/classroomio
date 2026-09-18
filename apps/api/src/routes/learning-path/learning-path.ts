import * as z from 'zod';

import {
  ZAddLearningPathCourse,
  ZAddLearningPathMembers,
  ZCreateLearningPath,
  ZPublicLearningPathQuery,
  ZReorderLearningPathCourses,
  ZUpdateLearningPath,
  ZUpdateLearningPathCourse,
  ZVerifyLearningPathCertificateParam
} from '@cio/utils/validation/learning-path';

import {
  addCoursesToPathService,
  addPathMembersService,
  createLearningPathService,
  deleteLearningPathService,
  enrollInLearningPath,
  getEnrolledLearningPaths,
  getLearningPathDetail,
  getPathAnalyticsService,
  getPublicLearningPathBySlug,
  listOrgLearningPaths,
  listPathMembersService,
  removeCourseFromPathService,
  removePathMemberService,
  reorderPathCoursesService,
  updateLearningPathCourseService,
  updateLearningPathService,
  verifyLearningPathCertificateService
} from '@api/services/learning-path';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

const ZPathParam = z.object({ pathId: z.string().min(1) });
const ZCourseParam = z.object({ pathId: z.string().min(1), courseId: z.string().uuid() });
const ZMemberParam = z.object({ pathId: z.string().min(1), memberId: z.string().uuid() });
const ZOrgQuery = z.object({ organizationId: z.string().uuid() });
const ZMembersQuery = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']).optional()
});

const ZSlugParam = z.object({ slug: z.string().min(1) });

export const learningPathRouter = new Hono()
  /**
   * GET /learning-path/public/:slug?organizationId=...
   * Public landing route for learning paths (unauthenticated)
   */
  .get('/public/:slug', zValidator('param', ZSlugParam), zValidator('query', ZPublicLearningPathQuery), async (c) => {
    try {
      const { slug } = c.req.valid('param');
      const { organizationId } = c.req.valid('query');
      const path = await getPublicLearningPathBySlug(organizationId, slug);

      return c.json({ success: true, data: path }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch public learning path');
    }
  })

  /**
   * GET /learning-path/certificates/:certificateId/verify
   * Public certificate verification endpoint (unauthenticated)
   */
  .get('/certificates/:certificateId/verify', zValidator('param', ZVerifyLearningPathCertificateParam), async (c) => {
    try {
      const { certificateId } = c.req.valid('param');
      const certificate = await verifyLearningPathCertificateService(certificateId);

      return c.json({ success: true, data: certificate }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to verify learning path certificate');
    }
  })
  /**
   * GET /learning-path?organizationId=...
   * Lists learning paths for an organization
   */
  .get('/', authMiddleware, zValidator('query', ZOrgQuery), async (c) => {
    try {
      const user = c.get('user')!;
      const orgRoles = c.get('orgRoles') as Record<string, number> | undefined;
      const { organizationId } = c.req.valid('query');
      const paths = await listOrgLearningPaths(organizationId, user.id, orgRoles);

      return c.json({ success: true, data: paths }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list learning paths');
    }
  })

  /**
   * POST /learning-path
   * Creates a new learning path in UNPUBLISHED status
   */
  .post('/', authMiddleware, zValidator('json', ZCreateLearningPath), async (c) => {
    try {
      const user = c.get('user')!;
      const orgRoles = c.get('orgRoles') as Record<string, number> | undefined;
      const { organizationId, ...data } = c.req.valid('json');
      const path = await createLearningPathService(organizationId, user.id, data, orgRoles);

      return c.json({ success: true, data: path }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create learning path');
    }
  })

  /**
   * GET /learning-path/enrolled
   * Returns caller's enrolled learning paths with live progress and per-course unlock status
   */
  .get('/enrolled', authMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const paths = await getEnrolledLearningPaths(user.id);

      return c.json({ success: true, data: paths }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to get enrolled learning paths');
    }
  })

  /**
   * GET /learning-path/:pathId
   * Gets detail of a learning path including its ordered courses
   */
  .get('/:pathId', authMiddleware, zValidator('param', ZPathParam), async (c) => {
    try {
      const user = c.get('user')!;
      const orgRoles = c.get('orgRoles') as Record<string, number> | undefined;
      const { pathId } = c.req.valid('param');
      const path = await getLearningPathDetail(pathId, user.id, orgRoles);

      return c.json({ success: true, data: path }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to get learning path detail');
    }
  })

  /**
   * PUT /learning-path/:pathId
   * Updates a learning path
   */
  .put(
    '/:pathId',
    authMiddleware,
    zValidator('param', ZPathParam),
    zValidator('json', ZUpdateLearningPath),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgRoles = c.get('orgRoles') as Record<string, number> | undefined;
        const { pathId } = c.req.valid('param');
        const data = c.req.valid('json');
        const path = await updateLearningPathService(pathId, user.id, data, orgRoles);

        return c.json({ success: true, data: path }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update learning path');
      }
    }
  )

  /**
   * DELETE /learning-path/:pathId
   * Deletes a learning path
   */
  .delete('/:pathId', authMiddleware, zValidator('param', ZPathParam), async (c) => {
    try {
      const user = c.get('user')!;
      const orgRoles = c.get('orgRoles') as Record<string, number> | undefined;
      const { pathId } = c.req.valid('param');
      const path = await deleteLearningPathService(pathId, user.id, orgRoles);

      return c.json({ success: true, data: path }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to delete learning path');
    }
  })

  /**
   * POST /learning-path/:pathId/enroll
   * Self-enrolls the caller in a published learning path and its courses (idempotent)
   */
  .post('/:pathId/enroll', authMiddleware, zValidator('param', ZPathParam), async (c) => {
    try {
      const user = c.get('user')!;
      const { pathId } = c.req.valid('param');
      const member = await enrollInLearningPath(pathId, user.id);

      return c.json({ success: true, data: member }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to enroll in learning path');
    }
  })

  /**
   * POST /learning-path/:pathId/courses
   * Adds courses to a learning path (and auto-enrolls members atomically)
   */
  .post(
    '/:pathId/courses',
    authMiddleware,
    zValidator('param', ZPathParam),
    zValidator('json', ZAddLearningPathCourse),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgRoles = c.get('orgRoles') as Record<string, number> | undefined;
        const { pathId } = c.req.valid('param');
        const data = c.req.valid('json');
        const courses = await addCoursesToPathService(pathId, data, user.id, orgRoles);

        return c.json({ success: true, data: courses }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to add course to learning path');
      }
    }
  )

  /**
   * PUT /learning-path/:pathId/courses/order
   * Reorders courses in a learning path atomically
   */
  .put(
    '/:pathId/courses/order',
    authMiddleware,
    zValidator('param', ZPathParam),
    zValidator('json', ZReorderLearningPathCourses),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgRoles = c.get('orgRoles') as Record<string, number> | undefined;
        const { pathId } = c.req.valid('param');
        const { courseIds } = c.req.valid('json');
        const result = await reorderPathCoursesService(pathId, courseIds, user.id, orgRoles);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to reorder learning path courses');
      }
    }
  )

  /**
   * PUT /learning-path/:pathId/courses/:courseId
   * Updates course settings in learning path (such as learning outcomes)
   */
  .put(
    '/:pathId/courses/:courseId',
    authMiddleware,
    zValidator('param', ZCourseParam),
    zValidator('json', ZUpdateLearningPathCourse),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgRoles = c.get('orgRoles') as Record<string, number> | undefined;
        const { pathId, courseId } = c.req.valid('param');
        const data = c.req.valid('json');
        const updated = await updateLearningPathCourseService(pathId, courseId, data, user.id, orgRoles);

        return c.json({ success: true, data: updated }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update course in learning path');
      }
    }
  )

  /**
   * DELETE /learning-path/:pathId/courses/:courseId
   * Removes a course from a learning path
   */
  .delete('/:pathId/courses/:courseId', authMiddleware, zValidator('param', ZCourseParam), async (c) => {
    try {
      const user = c.get('user')!;
      const orgRoles = c.get('orgRoles') as Record<string, number> | undefined;
      const { pathId, courseId } = c.req.valid('param');
      const removed = await removeCourseFromPathService(pathId, courseId, user.id, orgRoles);

      return c.json({ success: true, data: removed }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to remove course from learning path');
    }
  })

  /**
   * GET /learning-path/:pathId/members
   * Lists active members with their profiles
   */
  .get(
    '/:pathId/members',
    authMiddleware,
    zValidator('param', ZPathParam),
    zValidator('query', ZMembersQuery),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgRoles = c.get('orgRoles') as Record<string, number> | undefined;
        const { pathId } = c.req.valid('param');
        const query = c.req.valid('query');
        const members = await listPathMembersService(pathId, user.id, orgRoles, query);

        return c.json({ success: true, data: members }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to list learning path members');
      }
    }
  )

  /**
   * POST /learning-path/:pathId/members
   * Batch adds members to a learning path and auto-enrolls into courses
   */
  .post(
    '/:pathId/members',
    authMiddleware,
    zValidator('param', ZPathParam),
    zValidator('json', ZAddLearningPathMembers),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgRoles = c.get('orgRoles') as Record<string, number> | undefined;
        const { pathId } = c.req.valid('param');
        const data = c.req.valid('json');
        const members = await addPathMembersService(pathId, data, user.id, orgRoles);

        return c.json({ success: true, data: members }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to add learning path members');
      }
    }
  )

  /**
   * DELETE /learning-path/:pathId/members/:memberId
   * Soft-removes a member from a learning path and revokes their grants
   */
  .delete('/:pathId/members/:memberId', authMiddleware, zValidator('param', ZMemberParam), async (c) => {
    try {
      const user = c.get('user')!;
      const orgRoles = c.get('orgRoles') as Record<string, number> | undefined;
      const { pathId, memberId } = c.req.valid('param');
      const removed = await removePathMemberService(pathId, memberId, user.id, orgRoles);

      return c.json({ success: true, data: removed }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to remove learning path member');
    }
  })

  /**
   * GET /learning-path/:pathId/analytics
   * Returns funnel metrics across courses in the learning path
   */
  .get('/:pathId/analytics', authMiddleware, zValidator('param', ZPathParam), async (c) => {
    try {
      const user = c.get('user')!;
      const orgRoles = c.get('orgRoles') as Record<string, number> | undefined;
      const { pathId } = c.req.valid('param');
      const analytics = await getPathAnalyticsService(pathId, user.id, orgRoles);

      return c.json({ success: true, data: analytics }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to get learning path analytics');
    }
  });
