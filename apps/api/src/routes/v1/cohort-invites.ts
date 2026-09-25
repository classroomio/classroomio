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
} from '@api/services/v1/cohort-invite';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { COHORT_TEAM_RULE, cohortForbiddenResponses } from './cohort-route-docs';
import { errorResponses, itemResponse, jsonResponse, nullableItemResponse } from '@api/utils/openapi/responses';

const InviteLinkResponse = itemResponse(ZPublicApiCohortInviteLinkResponse);

export const v1CohortInvitesRouter = new Hono()
  .post(
    '/invite',
    describeRoute({
      description: `Invite students to a cohort by email, the same flow as the dashboard's invite modal. recipientCsv is a CSV of emails (optionally with names). For each row: an email that is not yet in your organization gets an organization invite (valid for 7 days) tagged with this cohort, so accepting it joins the cohort; an existing student in your organization is enrolled in the cohort directly; staff (admins/tutors) are skipped; invalid and repeated emails are reported per row. When sendEmail is true (default), invite and welcome emails are queued; emailsSent counts queued emails, not confirmed deliveries. Seat limits apply. ${COHORT_TEAM_RULE}`,
      tags: ['Public API Cohort Invites'],
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
        const result = await invitePublicApiCohortStudentsService(orgId, actorId, params, payload);

        return c.json({ success: true, data: result }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to invite students to cohort');
      }
    }
  )
  .post(
    '/invite/assign',
    describeRoute({
      description: `Add existing students from your organization's audience to a cohort, the same as the dashboard's "assign existing" option. Only profiles that are already students in your organization are assigned; any other profileId (including one from another organization) is skipped and not counted. When sendEmail is true (default), a cohort welcome email is queued for each newly assigned student. ${COHORT_TEAM_RULE}`,
      tags: ['Public API Cohort Invites'],
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
        const result = await assignPublicApiCohortStudentsService(orgId, actorId, params, payload);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to assign students to cohort');
      }
    }
  )
  .get(
    '/invite-link',
    describeRoute({
      description: `Get the cohort's shareable student join link. data is null if no link has been created yet. ${COHORT_TEAM_RULE}`,
      tags: ['Public API Cohort Invites'],
      responses: {
        200: jsonResponse('Invite link returned', nullableItemResponse(ZPublicApiCohortInviteLinkResponse)),
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
      description: `Get the cohort's shareable student join link, creating it on the first call. Calling it again returns the same link. ${COHORT_TEAM_RULE}`,
      tags: ['Public API Cohort Invites'],
      responses: {
        200: jsonResponse('Invite link returned', InviteLinkResponse),
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
      description: `Disable (isRevoked: true) or re-enable (isRevoked: false) the cohort's join link. The link keeps the same URL. ${COHORT_TEAM_RULE}`,
      tags: ['Public API Cohort Invites'],
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
