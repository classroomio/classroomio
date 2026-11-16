import {
  ZSkillCreate,
  ZSkillImport,
  ZSkillParam,
  ZSkillUpdate,
  ZPublicApiSkillsQuery
} from '@cio/utils/validation/skill';
import {
  createPublicApiSkillService,
  importPublicApiSkillsService,
  listPublicApiSkillsService,
  updatePublicApiSkillService
} from '@api/services/v1/skills';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, jsonResponse } from '@api/utils/openapi/responses';
import { mcpRateLimitResponse } from '../courses/docs';
import { ORG_ADMIN_RULE } from '../team/docs';
import { ORG_MEMBER_RULE, tagForbiddenResponses } from '../tags/docs';

const TAG = 'Skills';
const dataResponse = { type: 'object' as const, properties: { success: { type: 'boolean' as const }, data: {} } };

export const v1SkillsRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List the organization's skills and standards, with how many questions each is tagged on; ${ORG_MEMBER_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Skills ordered by code', dataResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: tagForbiddenResponses.read,
        429: mcpRateLimitResponse
      }
    }),
    validator('query', ZPublicApiSkillsQuery),
    async (c) => {
      try {
        const result = await listPublicApiSkillsService(c.get('orgId')!, c.get('actorId'), c.req.valid('query'));

        return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list skills');
      }
    }
  )
  .post(
    '/',
    describeRoute({
      description: `Create a skill; ${ORG_ADMIN_RULE}.`,
      tags: [TAG],
      responses: {
        201: jsonResponse('Skill created', dataResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: tagForbiddenResponses.write,
        409: { description: 'A skill with the same code already exists' },
        429: mcpRateLimitResponse
      }
    }),
    validator('json', ZSkillCreate),
    async (c) => {
      try {
        const skill = await createPublicApiSkillService(c.get('orgId')!, c.get('actorId'), c.req.valid('json'));

        return c.json({ success: true, data: skill }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to create skill');
      }
    }
  )
  .post(
    '/import',
    describeRoute({
      description: `Import skills from CSV text with the columns code, name and optionally parent_code, description and framework. Set dryRun to preview without saving; an import with any error saves nothing; ${ORG_ADMIN_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Preview or result with the rows, counts and errors', dataResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: tagForbiddenResponses.write,
        429: mcpRateLimitResponse
      }
    }),
    validator('json', ZSkillImport),
    async (c) => {
      try {
        const result = await importPublicApiSkillsService(c.get('orgId')!, c.get('actorId'), c.req.valid('json'));

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to import skills');
      }
    }
  )
  .put(
    '/:skillId',
    describeRoute({
      description: `Update a skill's code, name, description, framework or parent; ${ORG_ADMIN_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Skill updated', dataResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: tagForbiddenResponses.write,
        404: { description: 'Skill not found' },
        409: { description: 'Another skill already has this code' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZSkillParam),
    validator('json', ZSkillUpdate),
    async (c) => {
      try {
        const { skillId } = c.req.valid('param');
        const skill = await updatePublicApiSkillService(c.get('orgId')!, c.get('actorId'), skillId, c.req.valid('json'));

        return c.json({ success: true, data: skill }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update skill');
      }
    }
  );
