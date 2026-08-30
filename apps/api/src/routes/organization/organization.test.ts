import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { Hono } from '@api/utils/hono';
import { ROLE } from '@cio/utils/constants';

const serviceMocks = vi.hoisted(() => ({
  getOrgAudience: vi.fn(),
  getOrgTeam: vi.fn()
}));

vi.mock('@api/middlewares/auth', () => ({
  authMiddleware: async (context: Context, next: Next) => {
    const roleId = Number(context.req.header('x-test-role'));
    const orgId = context.req.header('cio-org-id')!;
    context.set('user', { id: 'profile-1' });
    context.set('orgRoles', { [orgId]: roleId });
    await next();
  }
}));
vi.mock('@api/middlewares/auth-or-api-key', () => ({
  authOrApiKeyMiddleware: async (_context: Context, next: Next) => next()
}));
vi.mock('@api/middlewares/auth-or-automation-key', () => ({
  authOrAutomationKeyMiddleware: () => async (_context: Context, next: Next) => next()
}));
vi.mock('@api/middlewares/org-member-or-automation-key', () => ({
  orgMemberOrAutomationKeyMiddleware: () => async (_context: Context, next: Next) => next()
}));
vi.mock('@api/services/organization', () => serviceMocks);
vi.mock('@api/services/organization/audience', () => ({}));
vi.mock('@api/services/organization/automation-usage', () => ({}));
vi.mock('@api/services/organization/auto-join', () => ({}));
vi.mock('@api/services/organization/invite', () => ({}));
vi.mock('@api/services/exercise', () => ({}));
vi.mock('@api/routes/organization/assets', () => ({ assetsRouter: new Hono() }));
vi.mock('@api/routes/organization/ai-tutor', () => ({ organizationAiTutorRouter: new Hono() }));
vi.mock('@api/routes/organization/automation', () => ({ automationRouter: new Hono() }));
vi.mock('@api/routes/organization/course-import', () => ({ courseImportRouter: new Hono() }));
vi.mock('@api/routes/organization/member-email-notifications', () => ({
  organizationMemberEmailNotificationsRouter: new Hono()
}));
vi.mock('@api/routes/organization/quiz', () => ({ quizRouter: new Hono() }));
vi.mock('@api/routes/organization/search', () => ({ searchRouter: new Hono() }));
vi.mock('@api/routes/organization/tags', () => ({ tagsRouter: new Hono() }));
vi.mock('@api/routes/organization/widgets', () => ({ widgetsRouter: new Hono() }));

import { organizationRouter } from './organization';

const orgId = 'org-1';

function rosterRequest(path: string, roleId: number) {
  return organizationRouter.request(path, {
    headers: {
      'cio-org-id': orgId,
      'x-test-role': roleId.toString()
    }
  });
}

describe('organization roster authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.getOrgTeam.mockResolvedValue([]);
    serviceMocks.getOrgAudience.mockResolvedValue({ items: [], pagination: {}, query: {} });
  });

  it.each(['/team', '/audience'])('rejects tutors from GET %s', async (path) => {
    const response = await rosterRequest(path, ROLE.TUTOR);

    expect(response.status).toBe(403);
  });

  it.each(['/team', '/audience'])('allows admins to GET %s', async (path) => {
    const response = await rosterRequest(path, ROLE.ADMIN);

    expect(response.status).toBe(200);
  });
});
