import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';

const mocks = vi.hoisted(() => ({
  getUserEnrolled: vi.fn()
}));

vi.mock('@api/middlewares/auth', () => ({
  authMiddleware: async (c: Context, next: Next) => {
    c.set('user', { id: 'profile-1' });
    await next();
  }
}));

vi.mock('@api/middlewares/org-member', () => ({
  orgMemberMiddleware: async (_c: Context, next: Next) => next()
}));

vi.mock('@api/services/organization', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@api/services/organization')>()),
  getUserEnrolled: mocks.getUserEnrolled
}));

import { organizationRouter } from './organization';

function requestEnrolled(query = '') {
  return organizationRouter.request(`/enrolled${query}`, { headers: { 'cio-org-id': 'org-1' } });
}

describe('GET /organization/enrolled', () => {
  beforeEach(() => {
    mocks.getUserEnrolled.mockReset();
    mocks.getUserEnrolled.mockResolvedValue({
      items: [{ kind: 'learning_path', data: { id: 'path-1' } }],
      total: 25,
      counts: { inProgress: 20, completed: 5 }
    });
  });

  it('defaults to the first page of 12 across both tabs and returns the envelope', async () => {
    const response = await requestEnrolled();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.getUserEnrolled).toHaveBeenCalledWith('org-1', 'profile-1', {
      page: 1,
      limit: 12,
      status: 'all'
    });
    expect(body).toEqual({
      success: true,
      data: [{ kind: 'learning_path', data: { id: 'path-1' } }],
      pagination: { page: 1, limit: 12, total: 25, totalPages: 3 },
      counts: { inProgress: 20, completed: 5 }
    });
  });

  it('passes page, limit, status and a trimmed search through', async () => {
    const response = await requestEnrolled('?page=3&limit=10&status=completed&search=%20excel%20');
    const body = await response.json();

    expect(mocks.getUserEnrolled).toHaveBeenCalledWith('org-1', 'profile-1', {
      page: 3,
      limit: 10,
      status: 'completed',
      search: 'excel'
    });
    expect(body.pagination).toEqual({ page: 3, limit: 10, total: 25, totalPages: 3 });
  });

  it.each(['?limit=51', '?limit=0', '?page=0', '?page=abc', '?status=archived', `?search=${'x'.repeat(201)}`])(
    'rejects %s',
    async (query) => {
      const response = await requestEnrolled(query);

      expect(response.status).toBe(400);
      expect(mocks.getUserEnrolled).not.toHaveBeenCalled();
    }
  );
});
