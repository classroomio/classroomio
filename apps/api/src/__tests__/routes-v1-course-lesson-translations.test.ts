import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/v1/courses/lesson-translations', () => ({
  listPublicApiCourseLessonTranslationsService: vi.fn(),
  setPublicApiCourseLessonTranslationService: vi.fn(),
  listPublicApiCourseLessonHistoryService: vi.fn()
}));

import { Hono } from '@api/utils/hono';
import {
  listPublicApiCourseLessonHistoryService,
  listPublicApiCourseLessonTranslationsService,
  setPublicApiCourseLessonTranslationService
} from '@api/services/v1/courses/lesson-translations';
import { v1CoursesRouter } from '@api/routes/v1/courses';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const LESSON_ID = '22222222-2222-4222-8222-222222222222';
const lessonParams = { courseId: COURSE_ID, lessonId: LESSON_ID };
const base = `/${COURSE_ID}/lessons/${LESSON_ID}`;

const app = new Hono()
  .use('*', async (c, next) => {
    c.set('orgId', 'org-1');
    c.set('actorId', 'actor-1');
    await next();
  })
  .route('/', v1CoursesRouter);

const put = (body: unknown) => ({
  method: 'PUT',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body)
});

describe('v1 lesson translation and history routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists translations, optionally for one locale', async () => {
    vi.mocked(listPublicApiCourseLessonTranslationsService).mockResolvedValue([]);

    const response = await app.request(`${base}/translations?locale=fr`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: [] });
    expect(listPublicApiCourseLessonTranslationsService).toHaveBeenCalledWith('org-1', 'actor-1', lessonParams, {
      locale: 'fr'
    });
  });

  it('upserts a translation by locale', async () => {
    vi.mocked(setPublicApiCourseLessonTranslationService).mockResolvedValue({ id: 1 } as never);

    const response = await app.request(`${base}/translations/fr`, put({ content: '<p>Salut</p>' }));

    expect(response.status).toBe(200);
    expect(setPublicApiCourseLessonTranslationService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { ...lessonParams, locale: 'fr' },
      { content: '<p>Salut</p>' }
    );
  });

  it('rejects an unknown locale with 400', async () => {
    expect((await app.request(`${base}/translations/xx`, put({ content: 'x' }))).status).toBe(400);
    expect((await app.request(`${base}/history?locale=xx`)).status).toBe(400);
    expect(setPublicApiCourseLessonTranslationService).not.toHaveBeenCalled();
  });

  it('lists history with the cursor query', async () => {
    vi.mocked(listPublicApiCourseLessonHistoryService).mockResolvedValue({ items: [], nextCursor: null });

    const response = await app.request(`${base}/history?locale=en&limit=5&cursor=abc`);

    expect(response.status).toBe(200);
    expect(listPublicApiCourseLessonHistoryService).toHaveBeenCalledWith('org-1', 'actor-1', lessonParams, {
      locale: 'en',
      limit: 5,
      cursor: 'abc'
    });
  });
});
