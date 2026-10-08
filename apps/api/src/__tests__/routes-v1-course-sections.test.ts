import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/v1/courses/sections', () => ({
  listPublicApiCourseSectionsService: vi.fn(),
  createPublicApiCourseSectionService: vi.fn(),
  updatePublicApiCourseSectionService: vi.fn(),
  deletePublicApiCourseSectionService: vi.fn()
}));

import { Hono } from '@api/utils/hono';
import { AppError } from '@api/utils/errors';
import {
  createPublicApiCourseSectionService,
  deletePublicApiCourseSectionService,
  listPublicApiCourseSectionsService,
  updatePublicApiCourseSectionService
} from '@api/services/v1/courses/sections';
import { v1CoursesRouter } from '@api/routes/v1/courses';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const SECTION_ID = '22222222-2222-4222-8222-222222222222';

const app = new Hono()
  .use('*', async (c, next) => {
    c.set('orgId', 'org-1');
    c.set('actorId', 'actor-1');
    await next();
  })
  .route('/', v1CoursesRouter);

const jsonRequest = (method: string, body: unknown) => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body)
});

describe('v1 course sections routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists sections with the paginated envelope', async () => {
    const pagination = { page: 1, limit: 20, total: 0, totalPages: 0 };
    vi.mocked(listPublicApiCourseSectionsService).mockResolvedValue({ items: [], pagination });

    const response = await app.request(`/${COURSE_ID}/sections`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: [], pagination });
    expect(listPublicApiCourseSectionsService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { courseId: COURSE_ID },
      { page: 1, limit: 20 }
    );
  });

  it('creates a section with 201', async () => {
    vi.mocked(createPublicApiCourseSectionService).mockResolvedValue({ id: SECTION_ID } as never);

    const response = await app.request(
      `/${COURSE_ID}/sections`,
      jsonRequest('POST', { title: 'Loose', moveUngrouped: true })
    );

    expect(response.status).toBe(201);
    expect(createPublicApiCourseSectionService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { courseId: COURSE_ID },
      { title: 'Loose', moveUngrouped: true }
    );
  });

  it('rejects bad input with 400 before the service', async () => {
    expect((await app.request(`/not-a-uuid/sections`)).status).toBe(400);
    expect((await app.request(`/${COURSE_ID}/sections`, jsonRequest('POST', { title: 'X' }))).status).toBe(400);
    expect((await app.request(`/${COURSE_ID}/sections/${SECTION_ID}`, jsonRequest('PUT', {}))).status).toBe(400);
    expect(createPublicApiCourseSectionService).not.toHaveBeenCalled();
    expect(updatePublicApiCourseSectionService).not.toHaveBeenCalled();
  });

  it('updates and deletes a section', async () => {
    vi.mocked(updatePublicApiCourseSectionService).mockResolvedValue({ id: SECTION_ID } as never);
    vi.mocked(deletePublicApiCourseSectionService).mockResolvedValue({ id: SECTION_ID } as never);
    const params = { courseId: COURSE_ID, sectionId: SECTION_ID };

    expect(
      (await app.request(`/${COURSE_ID}/sections/${SECTION_ID}`, jsonRequest('PUT', { title: 'W2' }))).status
    ).toBe(200);
    expect((await app.request(`/${COURSE_ID}/sections/${SECTION_ID}`, { method: 'DELETE' })).status).toBe(200);
    expect(updatePublicApiCourseSectionService).toHaveBeenCalledWith('org-1', 'actor-1', params, { title: 'W2' });
    expect(deletePublicApiCourseSectionService).toHaveBeenCalledWith('org-1', 'actor-1', params);
  });

  it('passes service errors through', async () => {
    vi.mocked(deletePublicApiCourseSectionService).mockRejectedValue(
      new AppError('Course section not found', 'COURSE_SECTION_NOT_FOUND', 404)
    );

    const response = await app.request(`/${COURSE_ID}/sections/${SECTION_ID}`, { method: 'DELETE' });

    expect(response.status).toBe(404);
  });
});
