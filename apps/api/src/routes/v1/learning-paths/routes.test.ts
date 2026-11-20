import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from '@api/utils/hono';

const mocks = vi.hoisted(() => ({
  listLearningPathsService: vi.fn(),
  getLearningPathService: vi.fn(),
  createPublicApiLearningPathService: vi.fn(),
  updatePublicApiLearningPathService: vi.fn(),
  deletePublicApiLearningPathService: vi.fn(),
  addCoursesToPublicApiLearningPathService: vi.fn(),
  reorderPublicApiPathCoursesService: vi.fn(),
  removeCourseFromPublicApiPathService: vi.fn(),
  listPublicApiLearningPathMembersService: vi.fn()
}));

vi.mock('@api/services/v1/learning-paths', () => ({
  listLearningPathsService: mocks.listLearningPathsService,
  getLearningPathService: mocks.getLearningPathService,
  createPublicApiLearningPathService: mocks.createPublicApiLearningPathService,
  updatePublicApiLearningPathService: mocks.updatePublicApiLearningPathService,
  deletePublicApiLearningPathService: mocks.deletePublicApiLearningPathService,
  addCoursesToPublicApiLearningPathService: mocks.addCoursesToPublicApiLearningPathService,
  reorderPublicApiPathCoursesService: mocks.reorderPublicApiPathCoursesService,
  removeCourseFromPublicApiPathService: mocks.removeCourseFromPublicApiPathService,
  listPublicApiLearningPathMembersService: mocks.listPublicApiLearningPathMembersService
}));

import { v1LearningPathsRouter } from './index';

const PATH_ID = '22222222-2222-4222-8222-222222222222';

function createTestApp() {
  return new Hono()
    .use('*', async (c, next) => {
      c.set('orgId', 'org-1');
      c.set('actorId', 'actor-1');
      await next();
    })
    .route('/', v1LearningPathsRouter);
}

describe('v1 learning-paths routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('PATCH updates a path', async () => {
    mocks.updatePublicApiLearningPathService.mockResolvedValue({ id: PATH_ID, name: 'Renamed' });

    const response = await createTestApp().request(`/${PATH_ID}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Renamed' })
    });

    expect(response.status).toBe(200);
    expect(mocks.updatePublicApiLearningPathService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { pathId: PATH_ID },
      { name: 'Renamed' }
    );
  });

  it('PUT no longer updates a path', async () => {
    const response = await createTestApp().request(`/${PATH_ID}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Renamed' })
    });

    expect(response.status).toBe(404);
    expect(mocks.updatePublicApiLearningPathService).not.toHaveBeenCalled();
  });

  it('PATCH with no fields is rejected by the empty-update refine', async () => {
    const response = await createTestApp().request(`/${PATH_ID}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });

    expect(response.status).toBe(400);
    expect(mocks.updatePublicApiLearningPathService).not.toHaveBeenCalled();
  });

  it('GET members pages with page, limit, search and roleId', async () => {
    mocks.listPublicApiLearningPathMembersService.mockResolvedValue({
      data: [{ id: 'm-1' }],
      pagination: { page: 2, limit: 10, total: 1, totalPages: 1 }
    });

    const response = await createTestApp().request(`/${PATH_ID}/members?page=2&limit=10&search=ada&roleId=3`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.listPublicApiLearningPathMembersService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { pathId: PATH_ID },
      { page: 2, limit: 10, search: 'ada', roleId: 3 }
    );
    expect(body).toEqual({
      success: true,
      data: [{ id: 'm-1' }],
      pagination: { page: 2, limit: 10, total: 1, totalPages: 1 }
    });
  });

  it('the removed students endpoint is gone', async () => {
    const response = await createTestApp().request(`/${PATH_ID}/students`);

    expect(response.status).toBe(404);
    expect(mocks.listPublicApiLearningPathMembersService).not.toHaveBeenCalled();
  });

  it('list responses carry no extra query key', async () => {
    mocks.listLearningPathsService.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
    });

    const response = await createTestApp().request('/');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
    });
    expect(body).not.toHaveProperty('query');
  });
});
