import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/v1/tags', () => ({
  createPublicApiTagGroupService: vi.fn(),
  createPublicApiTagService: vi.fn(),
  listPublicApiTagGroupsService: vi.fn(),
  updatePublicApiTagGroupService: vi.fn(),
  updatePublicApiTagService: vi.fn()
}));

vi.mock('@api/services/organization/automation-usage', () => ({
  reserveMcpAutomationUsage: vi.fn(),
  completeMcpAutomationUsage: vi.fn(),
  releaseMcpAutomationUsage: vi.fn()
}));

vi.mock('@api/services/organization/automation-key', () => ({
  organizationApiKeyHasScopes: (keyScopes: string[], requiredScopes: string[]) =>
    requiredScopes.every((scope) => keyScopes.includes(scope))
}));

import type { TOrganizationApiKey } from '@cio/db/types';
import { Hono } from '@api/utils/hono';
import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  createPublicApiTagGroupService,
  createPublicApiTagService,
  listPublicApiTagGroupsService,
  updatePublicApiTagGroupService,
  updatePublicApiTagService
} from '@api/services/v1/tags';
import { publicApiScopesMiddleware } from '@api/middlewares/public-api-scopes';
import { v1McpUsageMiddleware } from '@api/middlewares/v1-mcp-usage';
import { v1TagsRouter } from '@api/routes/v1/tags';

const GROUP_ID = '11111111-1111-4111-8111-111111111111';
const TAG_ID = '22222222-2222-4222-8222-222222222222';
const COURSE_ID = '33333333-3333-4333-8333-333333333333';

const apiKey = {
  id: 'api-key',
  organizationId: 'org-1',
  type: 'api',
  scopes: ['public_api:*']
} as unknown as TOrganizationApiKey;

const v1 = new Hono()
  .use('*', async (c, next) => {
    c.set('orgId', 'org-1');
    c.set('actorId', 'actor-1');
    c.set('automationKey', apiKey);
    await next();
  })
  .use('*', publicApiScopesMiddleware)
  .use('*', v1McpUsageMiddleware)
  .route('/tags', v1TagsRouter);
const app = new Hono().route('/public-api/v1', v1);

const send = (method: string, path: string, body?: unknown) =>
  app.request(`/public-api/v1/tags${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

describe('v1 tag routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists tag groups with pagination and passes courseId through', async () => {
    const pagination = { page: 1, limit: 20, total: 1, totalPages: 1 };
    vi.mocked(listPublicApiTagGroupsService).mockResolvedValue({ items: [{ id: GROUP_ID }], pagination } as never);

    const response = await send('GET', `?courseId=${COURSE_ID}`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: [{ id: GROUP_ID }], pagination });
    expect(listPublicApiTagGroupsService).toHaveBeenCalledWith('org-1', 'actor-1', {
      page: 1,
      limit: 20,
      courseId: COURSE_ID
    });
  });

  it('creates a tag group and a tag with 201', async () => {
    vi.mocked(createPublicApiTagGroupService).mockResolvedValue({ id: GROUP_ID } as never);
    vi.mocked(createPublicApiTagService).mockResolvedValue({ id: TAG_ID } as never);

    const groupResponse = await send('POST', '/groups', { name: 'Topics' });
    const tagResponse = await send('POST', '', { name: 'Safety', groupId: GROUP_ID, color: '#EF4444' });

    expect(groupResponse.status).toBe(201);
    expect(await groupResponse.json()).toEqual({ success: true, data: { id: GROUP_ID } });
    expect(createPublicApiTagGroupService).toHaveBeenCalledWith('org-1', 'actor-1', { name: 'Topics' });
    expect(tagResponse.status).toBe(201);
    expect(createPublicApiTagService).toHaveBeenCalledWith('org-1', 'actor-1', {
      name: 'Safety',
      groupId: GROUP_ID,
      color: '#EF4444'
    });
  });

  it('routes /groups/:groupId to the group update, not the tag update', async () => {
    vi.mocked(updatePublicApiTagGroupService).mockResolvedValue({ id: GROUP_ID } as never);

    const response = await send('PUT', `/groups/${GROUP_ID}`, { order: 1 });

    expect(response.status).toBe(200);
    expect(updatePublicApiTagGroupService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { groupId: GROUP_ID },
      { order: 1 }
    );
    expect(updatePublicApiTagService).not.toHaveBeenCalled();
  });

  it('updates a tag', async () => {
    vi.mocked(updatePublicApiTagService).mockResolvedValue({ id: TAG_ID } as never);

    const response = await send('PUT', `/${TAG_ID}`, { color: '#F97316' });

    expect(response.status).toBe(200);
    expect(updatePublicApiTagService).toHaveBeenCalledWith('org-1', 'actor-1', { tagId: TAG_ID }, { color: '#F97316' });
  });

  it.each([
    ['GET', '?courseId=not-a-uuid', undefined],
    ['GET', '?limit=101', undefined],
    ['POST', '', { name: 'Safety', groupId: GROUP_ID, color: '#123456' }],
    ['POST', '', { name: '', groupId: GROUP_ID, color: '#EF4444' }],
    ['POST', '/groups', { name: 'x'.repeat(81) }],
    ['PUT', `/${TAG_ID}`, {}],
    ['PUT', '/not-a-uuid', { name: 'x' }],
    ['PUT', `/groups/${GROUP_ID}`, {}]
  ])('returns 400 for %s %s with a bad request', async (method, path, body) => {
    expect((await send(method, path, body)).status).toBe(400);
  });

  it('maps service errors to their status', async () => {
    vi.mocked(createPublicApiTagService).mockRejectedValue(
      new AppError('A tag with this name already exists', ErrorCodes.TAG_ALREADY_EXISTS, 409, 'name')
    );

    const response = await send('POST', '', { name: 'Safety', groupId: GROUP_ID, color: '#EF4444' });

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ success: false, code: ErrorCodes.TAG_ALREADY_EXISTS });
  });
});
