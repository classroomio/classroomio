import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ROLE } from '@cio/utils/constants';
import { Hono } from '@api/utils/hono';
import type { Context, Next } from 'hono';

import { learningPathTeamOrAutomationKeyMiddleware } from './learning-path-team-or-automation-key';

const mocks = vi.hoisted(() => ({
  hasScopes: vi.fn(),
  getLearningPathById: vi.fn(),
  getLearningPathByPublicId: vi.fn(),
  getMemberByPathAndProfile: vi.fn(),
  getOrganizationMemberRoleId: vi.fn()
}));

vi.mock('@api/services/organization/automation-key', () => ({
  organizationApiKeyHasScopes: (scopes: string[], requiredScopes: string[]) => mocks.hasScopes(scopes, requiredScopes)
}));

vi.mock('@cio/db/queries/learning-path', () => ({
  getLearningPathById: mocks.getLearningPathById,
  getLearningPathByPublicId: mocks.getLearningPathByPublicId,
  getMemberByPathAndProfile: mocks.getMemberByPathAndProfile
}));

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberRoleId: mocks.getOrganizationMemberRoleId
}));

const PATH_UUID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '22222222-2222-2222-2222-222222222222';
const ORG_ID = '33333333-3333-3333-3333-333333333333';
const OTHER_ORG_ID = '44444444-4444-4444-4444-444444444444';
const ACTOR_ID = '55555555-5555-5555-5555-555555555555';

const mockPath = { id: PATH_UUID, organizationId: ORG_ID, name: 'Path' };

const mockKey = {
  id: 'key-1',
  type: 'mcp',
  organizationId: ORG_ID,
  createdByProfileId: ACTOR_ID,
  scopes: ['learning_path:write']
};

function buildApp(
  middleware: (c: Context, next: Next) => Promise<Response | void>,
  options: {
    automationKey?: typeof mockKey | null;
    orgRoles?: Record<string, number>;
    userId?: string | null;
    route?: string;
  } = {}
) {
  const { automationKey = null, orgRoles, userId = null, route = '/:pathId' } = options;
  const setContext = async (c: Context, next: Next) => {
    c.set('automationKey', automationKey);
    if (userId) {
      c.set('user', { id: userId });
    }
    if (orgRoles) {
      c.set('orgRoles', orgRoles);
    }
    await next();
  };

  return new Hono().use(setContext).post(route, middleware, (c) =>
    c.json({
      success: true,
      pathId: (c.get('learningPath') as { id: string } | undefined)?.id ?? null,
      orgId: c.get('orgId'),
      actorId: c.get('actorId'),
      orgRoles: c.get('orgRoles')
    })
  );
}

describe('learningPathTeamOrAutomationKeyMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasScopes.mockReturnValue(true);
    mocks.getLearningPathById.mockResolvedValue(mockPath);
    mocks.getLearningPathByPublicId.mockResolvedValue(mockPath);
    mocks.getOrganizationMemberRoleId.mockResolvedValue(ROLE.ADMIN);
  });

  it('lets session admins through with unchanged team semantics', async () => {
    const app = buildApp(learningPathTeamOrAutomationKeyMiddleware(['learning_path:write']), {
      orgRoles: { [ORG_ID]: ROLE.ADMIN },
      userId: USER_ID
    });

    const response = await app.request(`/${PATH_UUID}`, { method: 'POST' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ success: true, pathId: PATH_UUID, actorId: USER_ID });
    expect(mocks.hasScopes).not.toHaveBeenCalled();
  });

  it('rejects session callers without a user', async () => {
    const app = buildApp(learningPathTeamOrAutomationKeyMiddleware(['learning_path:write']), {
      orgRoles: { [ORG_ID]: ROLE.ADMIN },
      userId: null
    });

    const response = await app.request(`/${PATH_UUID}`, { method: 'POST' });

    expect(response.status).toBe(401);
  });

  it('lets scoped automation keys through and confines them to their org', async () => {
    const app = buildApp(learningPathTeamOrAutomationKeyMiddleware(['learning_path:write']), {
      automationKey: mockKey
    });

    const response = await app.request(`/${PATH_UUID}`, { method: 'POST' });

    expect(response.status).toBe(200);
    expect(mocks.hasScopes).toHaveBeenCalledWith(['learning_path:write'], ['learning_path:write']);
    const body = await response.json();
    expect(body).toMatchObject({
      success: true,
      pathId: PATH_UUID,
      orgId: ORG_ID,
      actorId: ACTOR_ID,
      orgRoles: { [ORG_ID]: ROLE.ADMIN }
    });
    expect(mocks.getOrganizationMemberRoleId).toHaveBeenCalledWith(ORG_ID, ACTOR_ID);
  });

  it('uses the key creator real role instead of admin', async () => {
    mocks.getOrganizationMemberRoleId.mockResolvedValue(ROLE.TUTOR);
    mocks.getMemberByPathAndProfile.mockResolvedValue({ id: 'm-1', roleId: ROLE.TUTOR });
    const app = buildApp(learningPathTeamOrAutomationKeyMiddleware(['learning_path:write']), {
      automationKey: mockKey
    });

    const response = await app.request(`/${PATH_UUID}`, { method: 'POST' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ orgRoles: { [ORG_ID]: ROLE.TUTOR } });
  });

  it('rejects keys whose creator cannot manage the path', async () => {
    mocks.getOrganizationMemberRoleId.mockResolvedValue(ROLE.STUDENT);
    const app = buildApp(learningPathTeamOrAutomationKeyMiddleware(['learning_path:write']), {
      automationKey: mockKey
    });

    const response = await app.request(`/${PATH_UUID}`, { method: 'POST' });

    expect(response.status).toBe(403);
  });

  it('rejects keys whose creator left the org', async () => {
    mocks.getOrganizationMemberRoleId.mockResolvedValue(null);
    const app = buildApp(learningPathTeamOrAutomationKeyMiddleware(['learning_path:write']), {
      automationKey: mockKey
    });

    const response = await app.request(`/${PATH_UUID}`, { method: 'POST' });

    expect(response.status).toBe(403);
  });

  it('rejects automation keys missing the required scopes', async () => {
    mocks.hasScopes.mockReturnValue(false);
    const app = buildApp(learningPathTeamOrAutomationKeyMiddleware(['learning_path:write']), {
      automationKey: mockKey
    });

    const response = await app.request(`/${PATH_UUID}`, { method: 'POST' });

    expect(response.status).toBe(403);
  });

  it('returns 404 when the key targets another organization path', async () => {
    const app = buildApp(learningPathTeamOrAutomationKeyMiddleware(['learning_path:read']), {
      automationKey: { ...mockKey, organizationId: OTHER_ORG_ID }
    });

    const response = await app.request(`/${PATH_UUID}`, { method: 'POST' });

    expect(response.status).toBe(404);
  });

  it('returns 404 when the path does not exist', async () => {
    mocks.getLearningPathById.mockResolvedValue(null);
    const app = buildApp(learningPathTeamOrAutomationKeyMiddleware(['learning_path:read']), {
      automationKey: mockKey
    });

    const response = await app.request(`/${PATH_UUID}`, { method: 'POST' });

    expect(response.status).toBe(404);
  });

  it('supports collection routes without a pathId for keys and sessions', async () => {
    const middleware = learningPathTeamOrAutomationKeyMiddleware(['learning_path:write'], { team: false });

    const keyApp = buildApp(middleware, { automationKey: mockKey, route: '/' });
    const keyResponse = await keyApp.request('/', { method: 'POST' });
    expect(keyResponse.status).toBe(200);
    expect(await keyResponse.json()).toMatchObject({ success: true, orgId: ORG_ID, actorId: ACTOR_ID });

    const sessionApp = buildApp(middleware, { orgRoles: { [ORG_ID]: ROLE.ADMIN }, userId: USER_ID, route: '/' });
    const sessionResponse = await sessionApp.request('/', { method: 'POST' });
    expect(sessionResponse.status).toBe(200);
    expect(await sessionResponse.json()).toMatchObject({ success: true, actorId: USER_ID });
  });
});
