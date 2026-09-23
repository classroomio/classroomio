import {
  ZPublicApiAddCohortMembers,
  ZPublicApiCohortMemberParam,
  ZPublicApiCohortParam,
  ZPublicApiPaginationQuery,
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
import { COHORT_MEMBER_RULE, COHORT_TEAM_RULE, PAGINATION_NOTE, cohortForbiddenResponses } from './cohort-route-docs';
import { ItemResponse, PaginatedListResponse, errorResponses, jsonResponse } from '@api/utils/openapi/responses';

export const v1CohortMembersRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List the members of a cohort. ${PAGINATION_NOTE} ${COHORT_MEMBER_RULE}`,
      tags: ['Public API Cohort Members'],
      responses: {
        200: jsonResponse('Cohort members returned successfully', PaginatedListResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.member,
        404: { description: 'Cohort not found' }
      }
    }),
    validator('param', ZPublicApiCohortParam),
    validator('query', ZPublicApiPaginationQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const query = c.req.valid('query');
        const result = await listPublicApiCohortMembersService(orgId, actorId, params, query);

        return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list cohort members');
      }
    }
  )
  .post(
    '/',
    describeRoute({
      description: `Add one or more members to a cohort. A profileId must belong to someone already in your organization. An email can be anyone; students added by email join your organization. Each member is added independently: data.added lists the new memberships and data.errors has one message per member that failed (for example, already a member). ${COHORT_TEAM_RULE}`,
      tags: ['Public API Cohort Members'],
      responses: {
        201: jsonResponse('Members processed; see the per-member results', ItemResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.team,
        404: { description: 'Cohort not found, or a profileId is not in your organization' }
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
      description: `Change a cohort member's role (tutor or student). ${COHORT_TEAM_RULE}`,
      tags: ['Public API Cohort Members'],
      responses: {
        200: jsonResponse('Cohort member updated successfully', ItemResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.team,
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
      description: `Remove a member from a cohort. This is a hard delete of the cohort membership only; the person keeps their account, organization membership, and course enrolments. ${COHORT_TEAM_RULE}`,
      tags: ['Public API Cohort Members'],
      responses: {
        200: jsonResponse('Cohort member removed successfully', ItemResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.team,
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
