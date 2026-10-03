import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { ROLE } from '@cio/utils/constants';

const mocks = vi.hoisted(() => ({
  searchOrganization: vi.fn()
}));

vi.mock('@api/middlewares/auth', () => ({
  authMiddleware: async (context: Context, next: Next) => {
    const orgId = context.req.header('cio-org-id')!;
    const roleId = Number(context.req.header('x-test-role'));
    context.set('user', { id: 'profile-1' });
    context.set('orgRoles', { [orgId]: roleId });
    await next();
  }
}));

vi.mock('@api/services/organization/search', () => ({
  searchLmsOrganization: vi.fn(),
  searchOrganization: mocks.searchOrganization
}));

import { searchRouter } from './search';

function searchRequest(roleId: number) {
  return searchRouter.request('/?q=alex&limit=5', {
    headers: {
      'cio-org-id': 'org-1',
      'x-test-role': roleId.toString()
    }
  });
}

describe('organization search audience access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.searchOrganization.mockResolvedValue({
      courses: [],
      cohorts: [],
      widgets: [],
      tags: [],
      audience: []
    });
  });

  it('disables audience search for tutors', async () => {
    const response = await searchRequest(ROLE.TUTOR);

    expect(response.status).toBe(200);
    expect(mocks.searchOrganization).toHaveBeenCalledWith('org-1', 'alex', 5, false);
  });

  it('enables audience search for admins', async () => {
    const response = await searchRequest(ROLE.ADMIN);

    expect(response.status).toBe(200);
    expect(mocks.searchOrganization).toHaveBeenCalledWith('org-1', 'alex', 5, true);
  });
});
