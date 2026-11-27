import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/v1/courses/settings', () => ({
  getPublicApiCourseSettingsService: vi.fn(),
  updatePublicApiCourseSettingsService: vi.fn()
}));

import { Hono } from '@api/utils/hono';
import {
  getPublicApiCourseSettingsService,
  updatePublicApiCourseSettingsService
} from '@api/services/v1/courses/settings';
import { getPublicApiRouteScope } from '@api/middlewares/public-api-scopes';
import { v1CoursesRouter } from '@api/routes/v1/courses';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const courseParams = { courseId: COURSE_ID };
const settings = {
  progressionMode: 'sequential' as const,
  allowSelfEnrollment: true,
  allowMarkdownExport: false,
  commentsEnabled: true
};

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

describe('v1 course settings routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the course settings', async () => {
    vi.mocked(getPublicApiCourseSettingsService).mockResolvedValue(settings);

    const response = await app.request(`/${COURSE_ID}/settings`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: settings });
    expect(getPublicApiCourseSettingsService).toHaveBeenCalledWith('org-1', 'actor-1', courseParams);
  });

  it('passes only the sent settings to the service', async () => {
    vi.mocked(updatePublicApiCourseSettingsService).mockResolvedValue(settings);

    const response = await app.request(
      `/${COURSE_ID}/settings`,
      jsonRequest('PATCH', { progressionMode: 'sequential' })
    );

    expect(response.status).toBe(200);
    expect(updatePublicApiCourseSettingsService).toHaveBeenCalledWith('org-1', 'actor-1', courseParams, {
      progressionMode: 'sequential'
    });
  });

  it.each([{}, { progressionMode: 'strict' }, { commentsEnabled: 'yes' }])('rejects %j with 400', async (body) => {
    const response = await app.request(`/${COURSE_ID}/settings`, jsonRequest('PATCH', body));

    expect(response.status).toBe(400);
    expect(updatePublicApiCourseSettingsService).not.toHaveBeenCalled();
  });

  it('maps reads to course:read and writes to course:write', () => {
    expect(getPublicApiRouteScope('GET', `/public-api/v1/courses/${COURSE_ID}/settings`)).toBe('course:read');
    expect(getPublicApiRouteScope('PATCH', `/public-api/v1/courses/${COURSE_ID}/settings`)).toBe('course:write');
  });
});
