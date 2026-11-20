import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * PUT /learning-path/:pathId with an automation key may only change the
 * landing page: anything else is a 400 (not a 500), and the session-only
 * sanitize step never re-adds welcome email or certificate fields.
 */

const mocks = vi.hoisted(() => ({
  automationKey: null as null | { type: string },
  updateLearningPathService: vi.fn(),
  assertMcpAutomationUsageAllowed: vi.fn(),
  recordMcpAutomationUsage: vi.fn(),
  passThrough: async (_c: unknown, next: () => Promise<void>) => next()
}));

vi.mock('@api/middlewares/auth-or-automation-key', () => ({
  authOrAutomationKeyMiddleware: async (
    c: { set: (key: string, value: unknown) => void },
    next: () => Promise<void>
  ) => {
    c.set('actorId', 'actor-1');
    c.set('orgId', 'org-1');
    if (mocks.automationKey) c.set('automationKey', mocks.automationKey);
    await next();
  }
}));
vi.mock('@api/middlewares/learning-path-team-or-automation-key', () => ({
  learningPathTeamOrAutomationKeyMiddleware: () => mocks.passThrough
}));
vi.mock('@api/middlewares/auth', () => ({ authMiddleware: mocks.passThrough }));
vi.mock('@api/middlewares/learning-path-member', () => ({ learningPathMemberMiddleware: mocks.passThrough }));
vi.mock('@api/middlewares/learning-path-team', () => ({ learningPathTeamMiddleware: mocks.passThrough }));
vi.mock('@api/middlewares/rate-limiter', () => ({ createRateLimiter: () => mocks.passThrough }));
vi.mock('@api/services/organization/automation-usage', () => ({
  assertMcpAutomationUsageAllowed: mocks.assertMcpAutomationUsageAllowed,
  recordMcpAutomationUsage: mocks.recordMcpAutomationUsage
}));
vi.mock('@api/services/learning-path', () => ({ updateLearningPathService: mocks.updateLearningPathService }));
vi.mock('@api/services/invite-link', () => ({}));
vi.mock('@api/utils/certificate', () => ({}));

import { Hono } from '@api/utils/hono';
import { learningPathRouter } from './learning-path';

const PATH_ID = '22222222-2222-4222-8222-222222222222';
const LANDING_PAGE = { title: 'Learn it all' };

function put(body: unknown) {
  return new Hono().route('/', learningPathRouter).request(`/${PATH_ID}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
}

describe('PUT /learning-path/:pathId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.automationKey = null;
    mocks.updateLearningPathService.mockResolvedValue({ id: PATH_ID });
  });

  it('an automation key sending a non-landing-page field gets 400 and nothing is written', async () => {
    mocks.automationKey = { type: 'mcp' };

    const response = await put({ landingPage: LANDING_PAGE, cost: 100 });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({ success: false, field: 'cost' });
    expect(mocks.updateLearningPathService).not.toHaveBeenCalled();
  });

  it('an automation key cannot inject certificate or welcome email settings', async () => {
    mocks.automationKey = { type: 'mcp' };

    const response = await put({
      landingPage: LANDING_PAGE,
      certificate: { emailMessage: '<p>x</p>' },
      welcomeEmailMessage: '<p>hi</p>'
    });

    expect(response.status).toBe(400);
    expect(mocks.updateLearningPathService).not.toHaveBeenCalled();
  });

  it('an automation key sending only landingPage updates and is metered', async () => {
    mocks.automationKey = { type: 'mcp' };

    const response = await put({ landingPage: LANDING_PAGE });

    expect(response.status).toBe(200);
    expect(mocks.updateLearningPathService).toHaveBeenCalledWith(
      PATH_ID,
      'actor-1',
      { landingPage: expect.objectContaining(LANDING_PAGE) },
      undefined
    );
    expect(mocks.recordMcpAutomationUsage).toHaveBeenCalledWith(
      mocks.automationKey,
      'update_learning_path_landing_page',
      { pathId: PATH_ID }
    );
  });

  it('a session user can still update other fields', async () => {
    const response = await put({ name: 'Renamed', cost: 100 });

    expect(response.status).toBe(200);
    expect(mocks.updateLearningPathService).toHaveBeenCalledWith(
      PATH_ID,
      'actor-1',
      expect.objectContaining({ name: 'Renamed', cost: 100 }),
      undefined
    );
  });
});
