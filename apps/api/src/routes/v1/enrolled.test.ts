import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from '@api/utils/hono';

const mocks = vi.hoisted(() => ({
  listEnrolledService: vi.fn()
}));

vi.mock('@api/services/v1/enrolled', () => ({
  listEnrolledService: mocks.listEnrolledService
}));

import { v1EnrolledRouter } from './enrolled';

const ACTOR_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

function createTestApp() {
  return new Hono()
    .use('*', async (c, next) => {
      c.set('orgId', 'org-1');
      c.set('actorId', ACTOR_ID);
      await next();
    })
    .route('/', v1EnrolledRouter);
}

describe('GET /v1/enrolled', () => {
  beforeEach(() => {
    mocks.listEnrolledService.mockReset();
    mocks.listEnrolledService.mockResolvedValue({
      data: [{ kind: 'course', data: { id: 'course-1' } }],
      pagination: { page: 1, limit: 20, total: 25, totalPages: 2 },
      counts: { inProgress: 20, completed: 5 }
    });
  });

  it('returns the key creator feed envelope with pagination and counts', async () => {
    const response = await createTestApp().request('/');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.listEnrolledService).toHaveBeenCalledWith('org-1', ACTOR_ID, {
      page: 1,
      limit: 20,
      status: 'all'
    });
    expect(body).toEqual({
      success: true,
      data: [{ kind: 'course', data: { id: 'course-1' } }],
      pagination: { page: 1, limit: 20, total: 25, totalPages: 2 },
      counts: { inProgress: 20, completed: 5 }
    });
  });

  it('passes page, limit, status and a trimmed search through', async () => {
    const response = await createTestApp().request('/?page=3&limit=10&status=completed&search=%20excel%20');

    expect(response.status).toBe(200);
    expect(mocks.listEnrolledService).toHaveBeenCalledWith('org-1', ACTOR_ID, {
      page: 3,
      limit: 10,
      status: 'completed',
      search: 'excel'
    });
  });

  it.each(['/?limit=101', '/?limit=0', '/?page=0', '/?status=archived', `/?search=${'x'.repeat(201)}`])(
    'rejects %s',
    async (path) => {
      const response = await createTestApp().request(path);

      expect(response.status).toBe(400);
      expect(mocks.listEnrolledService).not.toHaveBeenCalled();
    }
  );
});
