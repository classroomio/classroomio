import {
  ZPublicApiAssignStudentsToCohort,
  ZPublicApiAssignStudentsToCohortResponse,
  ZPublicApiCohortInviteLinkResponse,
  ZPublicApiCohortParam,
  ZPublicApiInviteStudentsToCohort,
  ZPublicApiInviteStudentsToCohortResponse,
  ZPublicApiSetCohortInviteLinkRevoked
} from '@cio/utils/validation/public-api';
import {
  assignPublicApiCohortStudentsService,
  createPublicApiCohortInviteLinkService,
  getPublicApiCohortInviteLinkService,
  invitePublicApiCohortStudentsService,
  setPublicApiCohortInviteLinkRevokedService
} from '@api/services/v1/cohorts/invites';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { getEventSource } from '@api/utils/event-source';
import { describeRoute, validator } from 'hono-openapi';
import { COHORT_TEAM_RULE, cohortForbiddenResponses } from './docs';
import { errorResponses, itemResponse, jsonResponse, nullableItemResponse } from '@api/utils/openapi/responses';

const InviteLinkResponse = itemResponse(ZPublicApiCohortInviteLinkResponse);

export const v1CohortInvitesRouter = new Hono()
  .post(
    '/invite',
    describeRoute({
      description: `Invite students to a cohort by email, the same flow as the dashboard's invite modal; ${COHORT_TEAM_RULE}.`,
      tags: ['Cohort Invites'],
      responses: {
        201: jsonResponse(
          'Invites processed; see data.rows for the per-email outcome',
          itemResponse(ZPublicApiInviteStudentsToCohortResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.team,
        404: { description: 'Cohort not found' }
      }
    }),
    validator('param', ZPublicApiCohortParam),
    validator('json', ZPublicApiInviteStudentsToCohort),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const result = await invitePublicApiCohortStudentsService(orgId, actorId, params, payload, getEventSource(c));

        return c.json({ success: true, data: result }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to invite students to cohort');
      }
    }
  )
  .post(
    '/invite/assign',
    describeRoute({
      description: `Add students already in your organization's audience to a cohort; ${COHORT_TEAM_RULE}.`,
      tags: ['Cohort Invites'],
      responses: {
        200: jsonResponse('Students assigned', itemResponse(ZPublicApiAssignStudentsToCohortResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.team,
        404: { description: 'Cohort not found' }
      }
    }),
    validator('param', ZPublicApiCohortParam),
    validator('json', ZPublicApiAssignStudentsToCohort),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const result = await assignPublicApiCohortStudentsService(orgId, actorId, params, payload, getEventSource(c));

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to assign students to cohort');
      }
    }
  )
  .get(
    '/invite-link',
    describeRoute({
      description: `Get the cohort's shareable student join link; ${COHORT_TEAM_RULE}.`,
      tags: ['Cohort Invites'],
      responses: {
        200: jsonResponse(
          'Invite link returned; data is null if no link has been created yet',
          nullableItemResponse(ZPublicApiCohortInviteLinkResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.team,
        404: { description: 'Cohort not found' }
      }
    }),
    validator('param', ZPublicApiCohortParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const result = await getPublicApiCohortInviteLinkService(orgId, actorId, params);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to load cohort invite link');
      }
    }
  )
  .post(
    '/invite-link',
    describeRoute({
      description: `Get the cohort's shareable student join link, creating it on the first call; ${COHORT_TEAM_RULE}.`,
      tags: ['Cohort Invites'],
      responses: {
        200: jsonResponse('Invite link returned; repeat calls return the same link', InviteLinkResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.team,
        404: { description: 'Cohort not found' }
      }
    }),
    validator('param', ZPublicApiCohortParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const result = await createPublicApiCohortInviteLinkService(orgId, actorId, params);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to create cohort invite link');
      }
    }
  )
  .patch(
    '/invite-link',
    describeRoute({
      description: `Disable or re-enable the cohort's student join link; ${COHORT_TEAM_RULE}.`,
      tags: ['Cohort Invites'],
      responses: {
        200: jsonResponse('Invite link updated', InviteLinkResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.team,
        404: { description: 'Cohort or invite link not found' }
      }
    }),
    validator('param', ZPublicApiCohortParam),
    validator('json', ZPublicApiSetCohortInviteLinkRevoked),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const result = await setPublicApiCohortInviteLinkRevokedService(orgId, actorId, params, payload);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update cohort invite link');
      }
    }
  );
