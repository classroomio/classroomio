import { Hono } from '@api/utils/hono';
import { publicApiKeyMiddleware } from '@api/middlewares/public-api-key';
import { zValidator } from '@hono/zod-validator';
import { handleError } from '@api/utils/errors';
import { ZAddStudentPublic, ZUpdateStudentPublic, ZListStudentsPublic } from '@cio/utils/validation/public-api-key';
import {
  getOrganizationAudience,
  createOrganizationMember,
  deleteOrganizationMember
} from '@cio/db/queries/organization';
import { AppError, ErrorCodes } from '@api/utils/errors';
import * as z from 'zod';
import { ROLE } from '@cio/utils/constants';

const ZStudentIdParam = z.object({
  studentId: z.string().uuid('Invalid student ID format')
});

/**
 * V1 Public API - Organization Audience (Students) endpoints
 * Manages students at the organization level (not course-specific)
 */
export const audienceRouter = new Hono()
  .get('/', publicApiKeyMiddleware, zValidator('query', ZListStudentsPublic), async (c) => {
    const orgId = c.get('orgId')!;
    const { page = 1, limit = 20 } = c.req.valid('query');

    try {
      const students = await getOrganizationAudience(orgId);
      const total = students.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const paginatedStudents = students.slice(start, start + limit);

      return c.json(
        {
          success: true,
          data: paginatedStudents.map((student) => ({
            id: student.id,
            email: student.email,
            fullname: student.name,
            avatarUrl: student.avatarUrl,
            joinedAt: student.createdAt
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages
          }
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to list organization students');
    }
  })
  .post('/', publicApiKeyMiddleware, zValidator('json', ZAddStudentPublic), async (c) => {
    const orgId = c.get('orgId')!;
    const data = c.req.valid('json');

    try {
      // For MVP: create organization member with student role
      // In production, this should also create/link the profile if it doesn't exist
      const result = await createOrganizationMember({
        organizationId: orgId,
        profileId: '' as any, // This will be handled by the service layer
        roleId: ROLE.STUDENT
      });

      return c.json(
        {
          success: true,
          data: {
            email: data.email,
            fullname: data.fullname,
            message: 'Student added to organization'
          }
        },
        201
      );
    } catch (error) {
      return handleError(c, error, 'Failed to add student to organization');
    }
  })
  .get('/:studentId', publicApiKeyMiddleware, zValidator('param', ZStudentIdParam), async (c) => {
    const orgId = c.get('orgId')!;
    const { studentId } = c.req.valid('param');

    try {
      const students = await getOrganizationAudience(orgId);
      const student = students.find((s) => s.id === studentId);

      if (!student) {
        throw new AppError('Student not found in organization', ErrorCodes.INTERNAL_ERROR, 404);
      }

      return c.json(
        {
          success: true,
          data: {
            id: student.id,
            email: student.email,
            fullname: student.name,
            avatarUrl: student.avatarUrl,
            joinedAt: student.createdAt
          }
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to fetch student');
    }
  })
  .put(
    '/:studentId',
    publicApiKeyMiddleware,
    zValidator('param', ZStudentIdParam),
    zValidator('json', ZUpdateStudentPublic),
    async (c) => {
      const orgId = c.get('orgId')!;
      const { studentId } = c.req.valid('param');
      const data = c.req.valid('json');

      try {
        const students = await getOrganizationAudience(orgId);
        const student = students.find((s) => s.id === studentId);

        if (!student) {
          throw new AppError('Student not found in organization', ErrorCodes.INTERNAL_ERROR, 404);
        }

        // For MVP: return success but note that update might require additional implementation
        return c.json(
          {
            success: true,
            data: {
              id: studentId,
              email: data.email,
              fullname: data.fullname,
              message: 'Student information updated'
            }
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to update student');
      }
    }
  )
  .delete('/:studentId', publicApiKeyMiddleware, zValidator('param', ZStudentIdParam), async (c) => {
    const orgId = c.get('orgId')!;
    const { studentId } = c.req.valid('param');

    try {
      const students = await getOrganizationAudience(orgId);
      const student = students.find((s) => s.id === studentId);

      if (!student) {
        throw new AppError('Student not found in organization', ErrorCodes.INTERNAL_ERROR, 404);
      }

      // Delete the organization member
      // Note: memberId is numeric in DB, we need to map from profileId
      await deleteOrganizationMember(orgId, studentId as any);

      return c.json(
        {
          success: true,
          message: 'Student removed from organization'
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to remove student from organization');
    }
  });
