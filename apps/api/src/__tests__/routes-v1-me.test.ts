import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/v1/me/me', () => ({
  getMeService: vi.fn()
}));

import { Hono } from '@api/utils/hono';
import { generateSpecs } from 'hono-openapi';
import { enrichPublicApiOpenApiSpec } from '@cio/utils/openapi/public-api';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { getMeService } from '@api/services/v1/me/me';
import { v1MeRouter } from '@api/routes/v1/me';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const ACTOR_ID = '22222222-2222-4222-8222-222222222222';
const KEY_ID = '33333333-3333-4333-8333-333333333333';

const mockMeData = {
  organization: {
    id: ORG_ID,
    name: 'Acme Academy',
    siteName: 'acme',
    avatarUrl: null
  },
  connection: {
    kind: 'api_key' as const,
    id: KEY_ID,
    clientId: null,
    scopes: ['course:read']
  },
  actor: {
    profileId: ACTOR_ID,
    fullname: 'Jane Admin',
    email: 'jane@example.com'
  }
};

describe('v1MeRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with connection and identity details', async () => {
    vi.mocked(getMeService).mockResolvedValue(mockMeData);

    const app = new Hono()
      .use('*', async (c, next) => {
        c.set('orgId', ORG_ID);
        c.set('actorId', ACTOR_ID);
        c.set('automationKey', { id: KEY_ID, scopes: ['course:read'] } as never);
        await next();
      })
      .route('/me', v1MeRouter);

    const response = await app.request('/me');
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true, data: mockMeData });
  });

  it('maps AppError to public error response', async () => {
    vi.mocked(getMeService).mockRejectedValue(
      new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404)
    );

    const app = new Hono()
      .use('*', async (c, next) => {
        c.set('orgId', ORG_ID);
        c.set('actorId', ACTOR_ID);
        c.set('automationKey', { id: KEY_ID } as never);
        await next();
      })
      .route('/me', v1MeRouter);

    const response = await app.request('/me');
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toMatchObject({
      success: false,
      code: ErrorCodes.ORGANIZATION_NOT_FOUND
    });
  });

  it('documents the route under the Connection tag with its summary', async () => {
    const app = new Hono().route('/public-api/v1/me', v1MeRouter);
    const spec = enrichPublicApiOpenApiSpec((await generateSpecs(app)) as never) as {
      paths: Record<string, Record<string, { summary?: string; tags?: string[] }>>;
    };

    expect(spec.paths['/public-api/v1/me']?.get).toMatchObject({
      summary: 'Get the current connection',
      tags: ['Connection']
    });
  });
});
