import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/v1/course-section', () => ({
  listPublicApiSectionsService: vi.fn(),
  createPublicApiSectionService: vi.fn(),
  promoteUngroupedPublicApiSectionService: vi.fn(),
  reorderPublicApiSectionsService: vi.fn(),
  updatePublicApiSectionService: vi.fn(),
  deletePublicApiSectionService: vi.fn()
}));

vi.mock('@api/services/v1/course-lesson', () => ({
  listPublicApiLessonsService: vi.fn(),
  getPublicApiLessonService: vi.fn(),
  createPublicApiLessonService: vi.fn(),
  updatePublicApiLessonService: vi.fn(),
  deletePublicApiLessonService: vi.fn(),
  reorderPublicApiLessonsService: vi.fn(),
  listPublicApiLessonTranslationsService: vi.fn(),
  getPublicApiLessonTranslationService: vi.fn(),
  createPublicApiLessonTranslationService: vi.fn(),
  updatePublicApiLessonTranslationService: vi.fn(),
  getPublicApiLessonHistoryService: vi.fn()
}));

import { Hono } from '@api/utils/hono';
import {
  createPublicApiSectionService,
  deletePublicApiSectionService,
  listPublicApiSectionsService,
  reorderPublicApiSectionsService,
  updatePublicApiSectionService
} from '@api/services/v1/course-section';
import {
  createPublicApiLessonTranslationService,
  getPublicApiLessonHistoryService,
  getPublicApiLessonTranslationService,
  listPublicApiLessonsService,
  updatePublicApiLessonService
} from '@api/services/v1/course-lesson';
import { v1CoursesRouter } from '@api/routes/v1/courses';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const SECTION_ID = '22222222-2222-4222-8222-222222222222';
const LESSON_ID = '33333333-3333-4333-8333-333333333333';

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

describe('v1CoursesRouter section routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists sections with the courseId from the parent path', async () => {
    vi.mocked(listPublicApiSectionsService).mockResolvedValue([]);

    const response = await app.request(`/${COURSE_ID}/sections`);

    expect(response.status).toBe(200);
    expect(listPublicApiSectionsService).toHaveBeenCalledWith('org-1', { courseId: COURSE_ID });
  });

  it('creates a section and returns 201', async () => {
    vi.mocked(createPublicApiSectionService).mockResolvedValue({ id: SECTION_ID } as Awaited<
      ReturnType<typeof createPublicApiSectionService>
    >);

    const response = await app.request(`/${COURSE_ID}/sections`, jsonRequest('POST', { title: 'Intro' }));

    expect(response.status).toBe(201);
    expect(createPublicApiSectionService).toHaveBeenCalledWith('org-1', { courseId: COURSE_ID }, { title: 'Intro' });
  });

  it('routes /reorder to the reorder service, not the /:sectionId handlers', async () => {
    vi.mocked(reorderPublicApiSectionsService).mockResolvedValue([]);

    const response = await app.request(
      `/${COURSE_ID}/sections/reorder`,
      jsonRequest('POST', { sections: [{ id: SECTION_ID, order: 0 }] })
    );

    expect(response.status).toBe(200);
    expect(reorderPublicApiSectionsService).toHaveBeenCalledTimes(1);
  });

  it('updates and deletes a section by id', async () => {
    vi.mocked(updatePublicApiSectionService).mockResolvedValue({ id: SECTION_ID } as Awaited<
      ReturnType<typeof updatePublicApiSectionService>
    >);
    vi.mocked(deletePublicApiSectionService).mockResolvedValue({ id: SECTION_ID } as Awaited<
      ReturnType<typeof deletePublicApiSectionService>
    >);

    const updated = await app.request(`/${COURSE_ID}/sections/${SECTION_ID}`, jsonRequest('PUT', { title: 'New' }));
    const deleted = await app.request(`/${COURSE_ID}/sections/${SECTION_ID}`, { method: 'DELETE' });

    expect(updated.status).toBe(200);
    expect(updatePublicApiSectionService).toHaveBeenCalledWith(
      'org-1',
      { courseId: COURSE_ID, sectionId: SECTION_ID },
      { title: 'New' }
    );
    expect(deleted.status).toBe(200);
    expect(deletePublicApiSectionService).toHaveBeenCalledWith('org-1', {
      courseId: COURSE_ID,
      sectionId: SECTION_ID
    });
  });

  it('rejects a non-UUID sectionId with a validation error', async () => {
    const response = await app.request(`/${COURSE_ID}/sections/not-a-uuid`, { method: 'DELETE' });

    expect(response.status).toBe(400);
    expect(deletePublicApiSectionService).not.toHaveBeenCalled();
  });
});

describe('v1CoursesRouter lesson routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists lessons filtered by section', async () => {
    vi.mocked(listPublicApiLessonsService).mockResolvedValue([]);

    const response = await app.request(`/${COURSE_ID}/lessons?sectionId=${SECTION_ID}`);

    expect(response.status).toBe(200);
    expect(listPublicApiLessonsService).toHaveBeenCalledWith(
      'org-1',
      { courseId: COURSE_ID },
      { sectionId: SECTION_ID }
    );
  });

  it('accepts video links on update and rejects uploaded-file video fields', async () => {
    vi.mocked(updatePublicApiLessonService).mockResolvedValue({ id: LESSON_ID } as Awaited<
      ReturnType<typeof updatePublicApiLessonService>
    >);

    const linkVideo = await app.request(
      `/${COURSE_ID}/lessons/${LESSON_ID}`,
      jsonRequest('PUT', { videos: [{ type: 'youtube', link: 'https://youtu.be/abc' }] })
    );
    const uploadedVideo = await app.request(
      `/${COURSE_ID}/lessons/${LESSON_ID}`,
      jsonRequest('PUT', { videos: [{ type: 'upload', link: 'https://example.com/v.mp4' }] })
    );

    expect(linkVideo.status).toBe(200);
    expect(uploadedVideo.status).toBe(400);
    expect(updatePublicApiLessonService).toHaveBeenCalledTimes(1);
  });

  it('strips teacherId and documents from the update payload', async () => {
    vi.mocked(updatePublicApiLessonService).mockResolvedValue({ id: LESSON_ID } as Awaited<
      ReturnType<typeof updatePublicApiLessonService>
    >);

    await app.request(
      `/${COURSE_ID}/lessons/${LESSON_ID}`,
      jsonRequest('PUT', { title: 'Renamed', teacherId: 'someone', documents: [] })
    );

    expect(updatePublicApiLessonService).toHaveBeenCalledWith(
      'org-1',
      { courseId: COURSE_ID, lessonId: LESSON_ID },
      { title: 'Renamed' }
    );
  });

  it('reads and writes translations, passing actorId on writes', async () => {
    vi.mocked(getPublicApiLessonTranslationService).mockResolvedValue({ locale: 'fr' } as Awaited<
      ReturnType<typeof getPublicApiLessonTranslationService>
    >);
    vi.mocked(createPublicApiLessonTranslationService).mockResolvedValue({ locale: 'fr' } as Awaited<
      ReturnType<typeof createPublicApiLessonTranslationService>
    >);

    const read = await app.request(`/${COURSE_ID}/lessons/${LESSON_ID}/translations/fr`);
    const created = await app.request(
      `/${COURSE_ID}/lessons/${LESSON_ID}/translations`,
      jsonRequest('POST', { locale: 'fr', content: '<p>Bonjour</p>' })
    );

    expect(read.status).toBe(200);
    expect(getPublicApiLessonTranslationService).toHaveBeenCalledWith('org-1', {
      courseId: COURSE_ID,
      lessonId: LESSON_ID,
      locale: 'fr'
    });
    expect(created.status).toBe(201);
    expect(createPublicApiLessonTranslationService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { courseId: COURSE_ID, lessonId: LESSON_ID },
      { locale: 'fr', content: '<p>Bonjour</p>' }
    );
  });

  it('rejects an unsupported translation locale', async () => {
    const response = await app.request(`/${COURSE_ID}/lessons/${LESSON_ID}/translations/xx`);

    expect(response.status).toBe(400);
    expect(getPublicApiLessonTranslationService).not.toHaveBeenCalled();
  });

  it('requires a locale for history and applies the default page size', async () => {
    vi.mocked(getPublicApiLessonHistoryService).mockResolvedValue(
      {} as Awaited<ReturnType<typeof getPublicApiLessonHistoryService>>
    );

    const missingLocale = await app.request(`/${COURSE_ID}/lessons/${LESSON_ID}/history`);
    const withLocale = await app.request(`/${COURSE_ID}/lessons/${LESSON_ID}/history?locale=en`);

    expect(missingLocale.status).toBe(400);
    expect(withLocale.status).toBe(200);
    expect(getPublicApiLessonHistoryService).toHaveBeenCalledWith(
      'org-1',
      { courseId: COURSE_ID, lessonId: LESSON_ID },
      { locale: 'en', limit: 10 }
    );
  });
});
