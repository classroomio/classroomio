import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: vi.fn()
}));

vi.mock('@cio/db/queries/course', () => ({
  getCourseSectionById: vi.fn(),
  getCourseSectionsByCourseId: vi.fn()
}));

vi.mock('@cio/db/queries/lesson', () => ({
  getLessonById: vi.fn(),
  getLessonsByCourseId: vi.fn()
}));

vi.mock('@cio/core/services/course/section', () => ({
  createCourseSection: vi.fn(),
  deleteCourseSectionService: vi.fn(),
  listCourseSections: vi.fn(),
  promoteUngroupedSection: vi.fn(),
  reorderCourseSections: vi.fn(),
  updateCourseSectionService: vi.fn()
}));

vi.mock('@api/services/lesson', () => ({
  createLesson: vi.fn(),
  deleteLessonService: vi.fn(),
  getLesson: vi.fn(),
  getLessonHistoryService: vi.fn(),
  listLessons: vi.fn(),
  reorderLessons: vi.fn(),
  updateLessonService: vi.fn()
}));

vi.mock('@cio/core/services/lesson-language', () => ({
  getLessonLanguage: vi.fn(),
  listLessonLanguages: vi.fn(),
  updateLessonLanguageService: vi.fn(),
  upsertLessonLanguageService: vi.fn()
}));

import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { getCourseSectionById, getCourseSectionsByCourseId } from '@cio/db/queries/course';
import { getLessonById, getLessonsByCourseId } from '@cio/db/queries/lesson';
import {
  createCourseSection,
  deleteCourseSectionService,
  reorderCourseSections,
  updateCourseSectionService
} from '@cio/core/services/course/section';
import {
  createLesson,
  deleteLessonService,
  getLessonHistoryService,
  reorderLessons,
  updateLessonService
} from '@api/services/lesson';
import {
  getLessonLanguage,
  updateLessonLanguageService,
  upsertLessonLanguageService
} from '@cio/core/services/lesson-language';
import {
  createPublicApiSectionService,
  deletePublicApiSectionService,
  reorderPublicApiSectionsService,
  updatePublicApiSectionService
} from '@api/services/v1/course-section';
import {
  createPublicApiLessonService,
  createPublicApiLessonTranslationService,
  deletePublicApiLessonService,
  getPublicApiLessonHistoryService,
  getPublicApiLessonTranslationService,
  reorderPublicApiLessonsService,
  updatePublicApiLessonService,
  updatePublicApiLessonTranslationService
} from '@api/services/v1/course-lesson';

const ORG_ID = 'org-1';
const COURSE_ID = 'course-1';
const OTHER_COURSE_ID = 'course-2';
const SECTION_ID = 'section-1';
const LESSON_ID = 'lesson-1';

const courseParams = { courseId: COURSE_ID };
const sectionParams = { courseId: COURSE_ID, sectionId: SECTION_ID };
const lessonParams = { courseId: COURSE_ID, lessonId: LESSON_ID };

describe('services/v1/course-section', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(getCourseSectionById).mockResolvedValue({ id: SECTION_ID, courseId: COURSE_ID } as Awaited<
      ReturnType<typeof getCourseSectionById>
    >);
  });

  it('throws 404 and does not write when the course belongs to another organization', async () => {
    vi.mocked(getCourseOrganizationId).mockResolvedValue('other-org');

    await expect(createPublicApiSectionService(ORG_ID, courseParams, { title: 'Intro' })).rejects.toMatchObject({
      statusCode: 404
    });
    expect(createCourseSection).not.toHaveBeenCalled();
  });

  it('creates a section with the courseId from the path', async () => {
    await createPublicApiSectionService(ORG_ID, courseParams, { title: 'Intro' });

    expect(createCourseSection).toHaveBeenCalledWith(COURSE_ID, { title: 'Intro', courseId: COURSE_ID });
  });

  it('throws 404 when the section belongs to another course', async () => {
    vi.mocked(getCourseSectionById).mockResolvedValue({ id: SECTION_ID, courseId: OTHER_COURSE_ID } as Awaited<
      ReturnType<typeof getCourseSectionById>
    >);

    await expect(updatePublicApiSectionService(ORG_ID, sectionParams, { title: 'x' })).rejects.toMatchObject({
      statusCode: 404
    });
    await expect(deletePublicApiSectionService(ORG_ID, sectionParams)).rejects.toMatchObject({ statusCode: 404 });
    expect(updateCourseSectionService).not.toHaveBeenCalled();
    expect(deleteCourseSectionService).not.toHaveBeenCalled();
  });

  it('throws 404 when the section does not exist', async () => {
    vi.mocked(getCourseSectionById).mockResolvedValue(null as never);

    await expect(deletePublicApiSectionService(ORG_ID, sectionParams)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('delegates update and delete once the section is confirmed', async () => {
    await updatePublicApiSectionService(ORG_ID, sectionParams, { title: 'New' });
    await deletePublicApiSectionService(ORG_ID, sectionParams);

    expect(updateCourseSectionService).toHaveBeenCalledWith(SECTION_ID, { title: 'New' });
    expect(deleteCourseSectionService).toHaveBeenCalledWith(SECTION_ID);
  });

  it('rejects a reorder that includes a section from another course', async () => {
    vi.mocked(getCourseSectionsByCourseId).mockResolvedValue([{ id: SECTION_ID }] as Awaited<
      ReturnType<typeof getCourseSectionsByCourseId>
    >);

    await expect(
      reorderPublicApiSectionsService(ORG_ID, courseParams, {
        sections: [
          { id: SECTION_ID, order: 0 },
          { id: 'foreign-section', order: 1 }
        ]
      })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(reorderCourseSections).not.toHaveBeenCalled();
  });
});

describe('services/v1/course-lesson', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(getLessonById).mockResolvedValue({ id: LESSON_ID, courseId: COURSE_ID } as Awaited<
      ReturnType<typeof getLessonById>
    >);
    vi.mocked(getCourseSectionById).mockResolvedValue({ id: SECTION_ID, courseId: COURSE_ID } as Awaited<
      ReturnType<typeof getCourseSectionById>
    >);
  });

  it('throws 404 and does not write when the lesson belongs to another course', async () => {
    vi.mocked(getLessonById).mockResolvedValue({ id: LESSON_ID, courseId: OTHER_COURSE_ID } as Awaited<
      ReturnType<typeof getLessonById>
    >);

    await expect(updatePublicApiLessonService(ORG_ID, lessonParams, { title: 'x' })).rejects.toMatchObject({
      statusCode: 404
    });
    await expect(deletePublicApiLessonService(ORG_ID, lessonParams)).rejects.toMatchObject({ statusCode: 404 });
    await expect(
      createPublicApiLessonTranslationService(ORG_ID, 'actor-1', lessonParams, { locale: 'fr' })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(updateLessonService).not.toHaveBeenCalled();
    expect(deleteLessonService).not.toHaveBeenCalled();
    expect(upsertLessonLanguageService).not.toHaveBeenCalled();
  });

  it('rejects create and update that target a section from another course', async () => {
    vi.mocked(getCourseSectionById).mockResolvedValue({ id: SECTION_ID, courseId: OTHER_COURSE_ID } as Awaited<
      ReturnType<typeof getCourseSectionById>
    >);

    await expect(
      createPublicApiLessonService(ORG_ID, courseParams, { title: 'L', sectionId: SECTION_ID })
    ).rejects.toMatchObject({ statusCode: 404 });
    await expect(updatePublicApiLessonService(ORG_ID, lessonParams, { sectionId: SECTION_ID })).rejects.toMatchObject({
      statusCode: 404
    });
    expect(createLesson).not.toHaveBeenCalled();
    expect(updateLessonService).not.toHaveBeenCalled();
  });

  it('creates a lesson with the courseId from the path', async () => {
    await createPublicApiLessonService(ORG_ID, courseParams, { title: 'Lesson', sectionId: SECTION_ID });

    expect(createLesson).toHaveBeenCalledWith(COURSE_ID, {
      title: 'Lesson',
      sectionId: SECTION_ID,
      courseId: COURSE_ID
    });
  });

  it('rejects a lesson reorder that includes a foreign lesson or a foreign target section', async () => {
    vi.mocked(getLessonsByCourseId).mockResolvedValue([{ id: LESSON_ID }] as Awaited<
      ReturnType<typeof getLessonsByCourseId>
    >);
    vi.mocked(getCourseSectionsByCourseId).mockResolvedValue([{ id: SECTION_ID }] as Awaited<
      ReturnType<typeof getCourseSectionsByCourseId>
    >);

    await expect(
      reorderPublicApiLessonsService(ORG_ID, courseParams, { lessons: [{ id: 'foreign-lesson', order: 0 }] })
    ).rejects.toMatchObject({ statusCode: 404 });
    await expect(
      reorderPublicApiLessonsService(ORG_ID, courseParams, {
        lessons: [{ id: LESSON_ID, order: 0, sectionId: 'foreign-section' }]
      })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(reorderLessons).not.toHaveBeenCalled();
  });

  it('reorders lessons that all belong to the course', async () => {
    vi.mocked(getLessonsByCourseId).mockResolvedValue([{ id: LESSON_ID }] as Awaited<
      ReturnType<typeof getLessonsByCourseId>
    >);
    vi.mocked(getCourseSectionsByCourseId).mockResolvedValue([{ id: SECTION_ID }] as Awaited<
      ReturnType<typeof getCourseSectionsByCourseId>
    >);
    const lessons = [{ id: LESSON_ID, order: 2, sectionId: SECTION_ID }];

    await reorderPublicApiLessonsService(ORG_ID, courseParams, { lessons });

    expect(reorderLessons).toHaveBeenCalledWith(lessons);
  });

  it('passes the actor as translation author and splits version options from content', async () => {
    await createPublicApiLessonTranslationService(ORG_ID, 'actor-1', lessonParams, {
      locale: 'fr',
      content: '<p>Bonjour</p>',
      versionIntent: 'manual',
      versionLabel: 'v1'
    });
    await updatePublicApiLessonTranslationService(
      ORG_ID,
      null,
      { ...lessonParams, locale: 'fr' },
      { content: '<p>Salut</p>' }
    );

    expect(upsertLessonLanguageService).toHaveBeenCalledWith(
      LESSON_ID,
      { locale: 'fr', content: '<p>Bonjour</p>' },
      { authorId: 'actor-1', versionIntent: 'manual', versionLabel: 'v1' }
    );
    expect(updateLessonLanguageService).toHaveBeenCalledWith(
      LESSON_ID,
      'fr',
      { content: '<p>Salut</p>' },
      { authorId: null, versionIntent: undefined, versionLabel: undefined }
    );
  });

  it('throws 404 when a lesson has no translation for the locale', async () => {
    vi.mocked(getLessonLanguage).mockResolvedValue(null);

    await expect(getPublicApiLessonTranslationService(ORG_ID, { ...lessonParams, locale: 'fr' })).rejects.toMatchObject(
      { statusCode: 404 }
    );
  });

  it('confirms the lesson before returning history', async () => {
    vi.mocked(getLessonById).mockResolvedValue({ id: LESSON_ID, courseId: OTHER_COURSE_ID } as Awaited<
      ReturnType<typeof getLessonById>
    >);

    await expect(
      getPublicApiLessonHistoryService(ORG_ID, lessonParams, { locale: 'en', limit: 10 })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(getLessonHistoryService).not.toHaveBeenCalled();
  });
});
