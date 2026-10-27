import {
  ZPublicApiCreateTeamInviteLink,
  ZPublicApiInviteTeamMembers,
  ZPublicApiInviteTeamMembersResponse,
  ZPublicApiRemoveTeamMemberResponse,
  ZPublicApiTeamInviteLinkQuery,
  ZPublicApiTeamInviteLinkResponse,
  ZPublicApiTeamMemberParam,
  ZPublicApiTeamMemberResponse,
  ZPublicApiTeamQuery,
  ZPublicApiUpdateTeamInviteLink,
  ZPublicApiUpdateTeamMember
} from '@cio/utils/validation/public-api';
import {
  createTeamInviteLinkService,
  getTeamInviteLinkService,
  getTeamMemberService,
  inviteTeamMembersService,
  listTeamService,
  removeTeamMemberService,
  updateTeamInviteLinkService,
  updateTeamMemberService
} from '@api/services/v1/team';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { createRateLimiter } from '@api/middlewares/rate-limiter';
import {
  errorResponses,
  itemResponse,
  jsonResponse,
  nullableItemResponse,
  paginatedResponse
} from '@api/utils/openapi/responses';
import { mcpRateLimitResponse } from '../courses/docs';
import { ORG_ADMIN_RULE, teamForbiddenResponse } from './docs';

const TeamMemberResponse = itemResponse(ZPublicApiTeamMemberResponse);
const TeamInviteLinkResponse = itemResponse(ZPublicApiTeamInviteLinkResponse);

const inviteTeamRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 60,
  message: 'Too many team invite attempts. Please try again later.',
  keyGenerator: (c) => `team_invite_create:user:${c.get('actorId')}:${c.get('orgId')}`
});

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
  .post(
    '/invites',
    describeRoute({
      description: `Invite people to the team as admins or tutors by email, the same as Settings → Teams; ${ORG_ADMIN_RULE}.`,
      tags: ['Team'],
      responses: {
        200: jsonResponse(
          'Nothing was sent: some addresses are already on the team, or belong to students not listed in confirmedStudentEmails',
          itemResponse(ZPublicApiInviteTeamMembersResponse)
        ),
        201: jsonResponse(
          'Invites created and emails queued; failedEmails lists any address that could not be invited',
          itemResponse(ZPublicApiInviteTeamMembersResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: teamForbiddenResponse('team:write'),
        429: {
          description:
            'More than 60 team invite requests in an hour for this key creator, or (MCP keys) the MCP rate limit was hit'
        }
      }
    }),
    inviteTeamRateLimit,
    validator('json', ZPublicApiInviteTeamMembers),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const payload = c.req.valid('json');
        const result = await inviteTeamMembersService(orgId, actorId, payload);
        const status = result.requiresConfirmation || result.existingTeamMembers.length > 0 ? 200 : 201;

        return c.json({ success: true, data: result }, status);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to invite team members');
      }
    }
  )
  .get(
    '/invite-link',
    describeRoute({
      description: `Get the reusable invite link for a role; ${ORG_ADMIN_RULE}.`,
      tags: ['Team'],
      responses: {
        200: jsonResponse(
          'The active link, or null when the role has no link or its link is turned off',
          nullableItemResponse(ZPublicApiTeamInviteLinkResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: teamForbiddenResponse('team:read'),
        429: mcpRateLimitResponse
      }
    }),
    validator('query', ZPublicApiTeamInviteLinkQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const query = c.req.valid('query');
        const link = await getTeamInviteLinkService(orgId, actorId, query);

        return c.json({ success: true, data: link }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to fetch team invite link');
      }
    }
  )
  .post(
    '/invite-link',
    describeRoute({
      description: `Get the role's active invite link, creating a new one if the role has none or its link is turned off; ${ORG_ADMIN_RULE}.`,
      tags: ['Team'],
      responses: {
        200: jsonResponse('The active invite link for the role', TeamInviteLinkResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: teamForbiddenResponse('team:write'),
        429: mcpRateLimitResponse
      }
    }),
    validator('json', ZPublicApiCreateTeamInviteLink),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const payload = c.req.valid('json');
        const link = await createTeamInviteLinkService(orgId, actorId, payload);

        return c.json({ success: true, data: link }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to create team invite link');
      }
    }
  )
  .patch(
    '/invite-link',
    describeRoute({
      description: `Turn a role's invite link off or back on; ${ORG_ADMIN_RULE}.`,
      tags: ['Team'],
      responses: {
        200: jsonResponse('Invite link updated; turning it back on reopens the same URL', TeamInviteLinkResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: teamForbiddenResponse('team:write'),
        404: { description: 'The role has never had an invite link; create one with POST /team/invite-link' },
        429: mcpRateLimitResponse
      }
    }),
    validator('json', ZPublicApiUpdateTeamInviteLink),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const payload = c.req.valid('json');
        const link = await updateTeamInviteLinkService(orgId, actorId, payload);

        return c.json({ success: true, data: link }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update team invite link');
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
        200: jsonResponse('Team member updated', TeamMemberResponse),
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
  )
  .delete(
    '/:memberId',
    describeRoute({
      description: `Remove an admin or tutor from the organization, which also revokes their pending invites; ${ORG_ADMIN_RULE}.`,
      tags: ['Team'],
      responses: {
        200: jsonResponse(
          'Team member removed; the person keeps their account',
          itemResponse(ZPublicApiRemoveTeamMemberResponse)
        ),
        400: { description: 'Invalid path, removing yourself, or removing the last admin' },
        401: errorResponses.unauthorized,
        403: teamForbiddenResponse('team:write'),
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
        const removed = await removeTeamMemberService(orgId, actorId, params);

        return c.json({ success: true, data: removed }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to remove team member');
      }
    }
  );
