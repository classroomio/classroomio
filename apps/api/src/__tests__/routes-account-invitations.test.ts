import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';

vi.mock('@api/middlewares/auth', () => ({
  authMiddleware: async (c: Context, next: Next) => {
    c.set('user', { id: 'user-1', email: 'learner@example.com', emailVerified: true } as never);
    return next();
  }
}));

vi.mock('@api/services/account/invites', () => ({
  listPendingCourseInvitesForAccount: vi.fn(),
  listPendingInvitationsForAccount: vi.fn()
}));

vi.mock('@api/middlewares/rate-limiter', () => ({
  createRateLimiter: () => async (_c: Context, next: Next) => next()
}));

import { Hono } from '@api/utils/hono';
import { accountRouter } from '@api/routes/account/account';
import { listPendingInvitationsForAccount } from '@api/services/account/invites';

const app = new Hono().route('/account', accountRouter);

describe('GET /account/invitations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listPendingInvitationsForAccount).mockResolvedValue([
      {
        organization: { id: 'org-1', name: 'Acme', siteName: 'acme', avatarUrl: null },
        orgInvite: {
          id: 'org-invite-1',
          email: 'learner@example.com',
          roleId: 3,
          roleLabel: 'Student',
          createdAt: '2026-01-01T00:00:00.000Z',
          expiresAt: '2026-02-01T00:00:00.000Z'
        },
        courses: [
          {
            inviteId: 'course-invite-1',
            courseId: 'course-1',
            title: 'Intro',
            description: null,
            slug: null,
            createdAt: '2026-01-01T00:00:00.000Z',
            expiresAt: '2026-02-01T00:00:00.000Z'
          }
        ],
        cohorts: []
      }
    ]);
  });

  it('returns invitations grouped by organization', async () => {
    const response = await app.request('/account/invitations');
    const json = (await response.json()) as { success: boolean; data: unknown[] };

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(listPendingInvitationsForAccount).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1', email: 'learner@example.com' })
    );
  });

  it('keeps /account/course-invites as a flattened alias', async () => {
    const response = await app.request('/account/course-invites');
    const json = (await response.json()) as {
      success: boolean;
      data: { id: string; course: { id: string } }[];
    };

    expect(response.status).toBe(200);
    expect(json.data).toEqual([
      expect.objectContaining({
        id: 'course-invite-1',
        course: expect.objectContaining({ id: 'course-1' })
      })
    ]);
  });
});
