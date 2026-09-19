import {
  ZPublicApiCourseParam,
  ZPublicApiCreateSection,
  ZPublicApiPromoteUngroupedSection,
  ZPublicApiReorderSections,
  ZPublicApiSectionParam,
  ZPublicApiUpdateSection
} from '@cio/utils/validation/public-api';
import {
  createPublicApiSectionService,
  deletePublicApiSectionService,
  listPublicApiSectionsService,
  promoteUngroupedPublicApiSectionService,
  reorderPublicApiSectionsService,
  updatePublicApiSectionService
} from '@api/services/v1/course-section';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';

const SectionResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: { type: 'object' as const }
  },
  required: ['success', 'data']
};

const SectionListResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: { type: 'array' as const, items: { type: 'object' as const } }
  },
  required: ['success', 'data']
};

const jsonResponse = (description: string, schema: object) => ({
  description,
  content: { 'application/json': { schema } }
});

export const v1CourseSectionsRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: 'List the sections of a course',
      tags: ['Public API Sections'],
      responses: {
        200: jsonResponse('Sections returned successfully', SectionListResponse),
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course not found' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const sections = await listPublicApiSectionsService(orgId, params);

        return c.json({ success: true, data: sections }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list sections');
      }
    }
  )
  .post(
    '/',
    describeRoute({
      description: 'Create a section in a course',
      tags: ['Public API Sections'],
      responses: {
        201: jsonResponse('Section created successfully', SectionResponse),
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course not found' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('json', ZPublicApiCreateSection),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const section = await createPublicApiSectionService(orgId, params, payload);

        return c.json({ success: true, data: section }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to create section');
      }
    }
  )
  .post(
    '/reorder',
    describeRoute({
      description: 'Set the order of sections in a course',
      tags: ['Public API Sections'],
      responses: {
        200: jsonResponse('Sections reordered successfully', SectionListResponse),
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course or section not found' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('json', ZPublicApiReorderSections),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const sections = await reorderPublicApiSectionsService(orgId, params, payload);

        return c.json({ success: true, data: sections }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to reorder sections');
      }
    }
  )
  .post(
    '/promote-ungrouped',
    describeRoute({
      description: 'Move all ungrouped lessons and exercises into a new section',
      tags: ['Public API Sections'],
      responses: {
        201: jsonResponse('Ungrouped content moved into a new section', SectionResponse),
        400: { description: 'Invalid request body, or the course has no ungrouped content' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course not found' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('json', ZPublicApiPromoteUngroupedSection),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const result = await promoteUngroupedPublicApiSectionService(orgId, params, payload);

        return c.json({ success: true, data: result }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to promote ungrouped content');
      }
    }
  )
  .put(
    '/:sectionId',
    describeRoute({
      description: 'Update a section title or order',
      tags: ['Public API Sections'],
      responses: {
        200: jsonResponse('Section updated successfully', SectionResponse),
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course or section not found' }
      }
    }),
    validator('param', ZPublicApiSectionParam),
    validator('json', ZPublicApiUpdateSection),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const section = await updatePublicApiSectionService(orgId, params, payload);

        return c.json({ success: true, data: section }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update section');
      }
    }
  )
  .delete(
    '/:sectionId',
    describeRoute({
      description: 'Delete a section',
      tags: ['Public API Sections'],
      responses: {
        200: jsonResponse('Section deleted successfully', SectionResponse),
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course or section not found' }
      }
    }),
    validator('param', ZPublicApiSectionParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const section = await deletePublicApiSectionService(orgId, params);

        return c.json({ success: true, data: section }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to delete section');
      }
    }
  );
