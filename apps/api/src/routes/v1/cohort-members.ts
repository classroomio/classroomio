import {
  ZPublicApiAddCohortMembers,
  ZPublicApiCohortMemberParam,
  ZPublicApiCohortParam,
  ZPublicApiUpdateCohortMember
} from '@cio/utils/validation/public-api';
import {
  addPublicApiCohortMembersService,
  listPublicApiCohortMembersService,
  removePublicApiCohortMemberService,
  updatePublicApiCohortMemberService
} from '@api/services/v1/cohort-member';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';

const MemberResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: { type: 'object' as const }
  },
  required: ['success', 'data']
};

const MemberListResponse = {
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

export const v1CohortMembersRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: 'List the members of a cohort',
      tags: ['Public API Cohort Members'],
      responses: {
        200: jsonResponse('Cohort members returned successfully', MemberListResponse),
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Cohort not found' }
      }
    }),
    validator('param', ZPublicApiCohortParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const members = await listPublicApiCohortMembersService(orgId, params);

        return c.json({ success: true, data: members }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list cohort members');
      }
    }
  )
  .post(
    '/',
    describeRoute({
      description: 'Add one or more members to a cohort, by profileId or email',
      tags: ['Public API Cohort Members'],
      responses: {
        201: jsonResponse('Cohort members added', MemberResponse),
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Cohort not found' }
      }
    }),
    validator('param', ZPublicApiCohortParam),
    validator('json', ZPublicApiAddCohortMembers),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const result = await addPublicApiCohortMembersService(orgId, actorId, params, payload);

        return c.json({ success: true, data: result }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to add cohort members');
      }
    }
  )
  .put(
    '/:memberId',
    describeRoute({
      description: "Update a cohort member's role",
      tags: ['Public API Cohort Members'],
      responses: {
        200: jsonResponse('Cohort member updated successfully', MemberResponse),
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Cohort or member not found' }
      }
    }),
    validator('param', ZPublicApiCohortMemberParam),
    validator('json', ZPublicApiUpdateCohortMember),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const member = await updatePublicApiCohortMemberService(orgId, actorId, params, payload);

        return c.json({ success: true, data: member }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update cohort member');
      }
    }
  )
  .delete(
    '/:memberId',
    describeRoute({
      description: 'Remove a member from a cohort',
      tags: ['Public API Cohort Members'],
      responses: {
        200: jsonResponse('Cohort member removed successfully', MemberResponse),
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Cohort or member not found' }
      }
    }),
    validator('param', ZPublicApiCohortMemberParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const member = await removePublicApiCohortMemberService(orgId, actorId, params);

        return c.json({ success: true, data: member }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to remove cohort member');
      }
    }
  );
