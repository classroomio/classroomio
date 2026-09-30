import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ROLE } from '@cio/utils/constants';
import { Hono } from '@api/utils/hono';
import type { Context, Next } from 'hono';

import { learningPathTeamMiddleware } from './learning-path-team';
import { learningPathMemberMiddleware } from './learning-path-member';

const mocks = vi.hoisted(() => ({
  getLearningPathById: vi.fn(),
  getLearningPathByPublicId: vi.fn(),
  getMemberByPathAndProfile: vi.fn()
}));

vi.mock('@cio/db/queries/learning-path', () => ({
  getLearningPathById: mocks.getLearningPathById,
  getLearningPathByPublicId: mocks.getLearningPathByPublicId,
  getMemberByPathAndProfile: mocks.getMemberByPathAndProfile
}));

const PATH_UUID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '22222222-2222-2222-2222-222222222222';
const ORG_ID = '33333333-3333-3333-3333-333333333333';

const mockPath = { id: PATH_UUID, organizationId: ORG_ID, name: 'Path' };

function buildApp(
  middleware: (c: Context, next: Next) => Promise<Response | void>,
  orgRoles: Record<string, number> | undefined,
  userId: string | null
) {
  const setContext = async (c: Context, next: Next) => {
    if (userId) {
      c.set('user', { id: userId });
    }
    if (orgRoles) {
      c.set('orgRoles', orgRoles);
    }
    await next();
  };

  return new Hono().use(setContext).get('/:pathId', middleware, (c) =>
    c.json({
      success: true,
      pathId: (c.get('learningPath') as { id: string } | undefined)?.id ?? null,
      memberId: (c.get('learningPathMember') as { id: string } | null | undefined)?.id ?? null
    })
  );
}

describe('learningPathTeamMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getLearningPathById.mockResolvedValue(mockPath);
  });

  it('lets org admins through and exposes the path', async () => {
    const app = buildApp(learningPathTeamMiddleware, { [ORG_ID]: ROLE.ADMIN }, USER_ID);

    const response = await app.request(`/${PATH_UUID}`, { method: 'GET' });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, pathId: PATH_UUID });
  });

  it('lets assigned tutors through', async () => {
    mocks.getMemberByPathAndProfile.mockResolvedValue({ id: 'm-1', roleId: ROLE.TUTOR, removedAt: null });
    const app = buildApp(learningPathTeamMiddleware, { [ORG_ID]: ROLE.TUTOR }, USER_ID);

    const response = await app.request(`/${PATH_UUID}`, { method: 'GET' });

    expect(response.status).toBe(200);
  });

  it('rejects unassigned tutors and students', async () => {
    mocks.getMemberByPathAndProfile.mockResolvedValue(null);

    const tutorApp = buildApp(learningPathTeamMiddleware, { [ORG_ID]: ROLE.TUTOR }, USER_ID);
    expect((await tutorApp.request(`/${PATH_UUID}`, { method: 'GET' })).status).toBe(403);

    const studentApp = buildApp(learningPathTeamMiddleware, { [ORG_ID]: ROLE.STUDENT }, USER_ID);
    expect((await studentApp.request(`/${PATH_UUID}`, { method: 'GET' })).status).toBe(403);
  });

  it('returns 404 when the path does not exist and 401 without a user', async () => {
    mocks.getLearningPathById.mockResolvedValue(null);
    const missingApp = buildApp(learningPathTeamMiddleware, { [ORG_ID]: ROLE.ADMIN }, USER_ID);
    expect((await missingApp.request(`/${PATH_UUID}`, { method: 'GET' })).status).toBe(404);

    mocks.getLearningPathById.mockResolvedValue(mockPath);
    const noUserApp = buildApp(learningPathTeamMiddleware, { [ORG_ID]: ROLE.ADMIN }, null);
    expect((await noUserApp.request(`/${PATH_UUID}`, { method: 'GET' })).status).toBe(401);
  });
});

describe('learningPathMemberMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getLearningPathById.mockResolvedValue(mockPath);
  });

  it('lets org admins through without a membership row', async () => {
    const app = buildApp(learningPathMemberMiddleware, { [ORG_ID]: ROLE.ADMIN }, USER_ID);

    const response = await app.request(`/${PATH_UUID}`, { method: 'GET' });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, pathId: PATH_UUID, memberId: null });
    expect(mocks.getMemberByPathAndProfile).not.toHaveBeenCalled();
  });

  it('lets enrolled members through and exposes their membership', async () => {
    mocks.getMemberByPathAndProfile.mockResolvedValue({ id: 'm-9', roleId: ROLE.STUDENT });
    const app = buildApp(learningPathMemberMiddleware, { [ORG_ID]: ROLE.STUDENT }, USER_ID);

    const response = await app.request(`/${PATH_UUID}`, { method: 'GET' });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, memberId: 'm-9' });
  });

  it('rejects non-members without admin access', async () => {
    mocks.getMemberByPathAndProfile.mockResolvedValue(null);
    const app = buildApp(learningPathMemberMiddleware, { [ORG_ID]: ROLE.STUDENT }, USER_ID);

    const response = await app.request(`/${PATH_UUID}`, { method: 'GET' });

    expect(response.status).toBe(403);
  });
});
