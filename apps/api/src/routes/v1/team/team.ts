import {
  ZPublicApiTeamMemberParam,
  ZPublicApiTeamMemberResponse,
  ZPublicApiTeamQuery,
  ZPublicApiUpdateTeamMember
} from '@cio/utils/validation/public-api';
import { getTeamMemberService, listTeamService, updateTeamMemberService } from '@api/services/v1/team';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';
import { mcpRateLimitResponse } from '../courses/docs';
import { ORG_ADMIN_RULE, teamForbiddenResponse } from './docs';

const TeamMemberResponse = itemResponse(ZPublicApiTeamMemberResponse);

export const v1TeamRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List the organization's admins and tutors, including pending invites; ${ORG_ADMIN_RULE}.`,
      tags: ['Team'],
      responses: {
        200: jsonResponse(
          'Admins and tutors, newest first; students are listed by GET /audience',
          paginatedResponse(ZPublicApiTeamMemberResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: teamForbiddenResponse('team:read'),
        429: mcpRateLimitResponse
      }
    }),
    validator('query', ZPublicApiTeamQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const query = c.req.valid('query');
        const result = await listTeamService(orgId, actorId, query);

        return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list team members');
      }
    }
  )
  .get(
    '/:memberId',
    describeRoute({
      description: `Get an admin or tutor by their organization member id; ${ORG_ADMIN_RULE}.`,
      tags: ['Team'],
      responses: {
        200: jsonResponse('Team member returned successfully', TeamMemberResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: teamForbiddenResponse('team:read'),
        404: { description: 'Team member not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiTeamMemberParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const member = await getTeamMemberService(orgId, actorId, params);

        return c.json({ success: true, data: member }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to fetch team member');
      }
    }
  )
  .put(
    '/:memberId',
    describeRoute({
      description: `Change a team member's organization role, name, or both; ${ORG_ADMIN_RULE}.`,
      tags: ['Team'],
      responses: {
        200: jsonResponse(
          'Team member updated; inviting and removing team members are not part of the public API yet',
          TeamMemberResponse
        ),
        400: {
          description:
            'Invalid path or body, no fields to update, changing your own role, removing the last admin, or renaming a pending member'
        },
        401: errorResponses.unauthorized,
        403: teamForbiddenResponse('team:write'),
        404: { description: 'Team member not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiTeamMemberParam),
    validator('json', ZPublicApiUpdateTeamMember),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const member = await updateTeamMemberService(orgId, actorId, params, payload);

        return c.json({ success: true, data: member }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update team member');
      }
    }
  );
