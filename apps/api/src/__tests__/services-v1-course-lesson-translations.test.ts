import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/tag', () => ({ getCourseOrganizationId: vi.fn() }));
vi.mock('@cio/db/queries/group', () => ({ isCourseTeamMemberOrOrgAdmin: vi.fn() }));
vi.mock('@cio/db/queries/lesson', () => ({ getLessonById: vi.fn() }));
vi.mock('@cio/core/services/course/course', () => ({}));
vi.mock('@api/services/lesson', () => ({ getLessonHistoryService: vi.fn() }));
vi.mock('@api/services/course/notify-session', () => ({}));
vi.mock('@cio/core/services/lesson-language', () => ({
  getLessonLanguage: vi.fn(),
  listLessonLanguages: vi.fn(),
  upsertLessonLanguageService: vi.fn()
}));

import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getLessonById } from '@cio/db/queries/lesson';
import { getLessonHistoryService } from '@api/services/lesson';
import {
  getLessonLanguage,
  listLessonLanguages,
  upsertLessonLanguageService
} from '@cio/core/services/lesson-language';
import {
  listPublicApiCourseLessonHistoryService,
  listPublicApiCourseLessonTranslationsService,
  setPublicApiCourseLessonTranslationService
} from '@api/services/v1/courses/lesson-translations';

const ORG_ID = 'org-1';
const COURSE_ID = 'course-1';
const ACTOR_ID = 'actor-1';
const LESSON_ID = 'lesson-1';
const lessonParams = { courseId: COURSE_ID, lessonId: LESSON_ID };
const english = { id: 1, lessonId: LESSON_ID, locale: 'en', content: '<p>Hi</p>', updatedAt: 'now' } as never;

describe('services/v1/courses/lesson-translations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
    vi.mocked(getLessonById).mockResolvedValue({ id: LESSON_ID, courseId: COURSE_ID } as never);
  });

  it('returns 404 for a lesson from another course before touching translations', async () => {
    vi.mocked(getLessonById).mockResolvedValue({ id: LESSON_ID, courseId: 'other-course' } as never);

    await expect(
      listPublicApiCourseLessonTranslationsService(ORG_ID, ACTOR_ID, lessonParams, {})
    ).rejects.toMatchObject({ statusCode: 404 });
    await expect(
      setPublicApiCourseLessonTranslationService(ORG_ID, ACTOR_ID, { ...lessonParams, locale: 'fr' }, { content: 'x' })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(upsertLessonLanguageService).not.toHaveBeenCalled();
  });

  it('rejects a student and another organization on reads and writes', async () => {
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);
    await expect(
      listPublicApiCourseLessonTranslationsService(ORG_ID, ACTOR_ID, lessonParams, {})
    ).rejects.toMatchObject({ statusCode: 403 });
    await expect(
      listPublicApiCourseLessonHistoryService(ORG_ID, ACTOR_ID, lessonParams, { locale: 'en', limit: 10 })
    ).rejects.toMatchObject({ statusCode: 403 });

    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
    vi.mocked(getCourseOrganizationId).mockResolvedValue('other-org');
    await expect(
      setPublicApiCourseLessonTranslationService(ORG_ID, ACTOR_ID, { ...lessonParams, locale: 'en' }, { content: 'x' })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(upsertLessonLanguageService).not.toHaveBeenCalled();
    expect(getLessonHistoryService).not.toHaveBeenCalled();
  });

  it('lists every locale, or filters to one', async () => {
    vi.mocked(listLessonLanguages).mockResolvedValue([english]);
    await expect(
      listPublicApiCourseLessonTranslationsService(ORG_ID, ACTOR_ID, lessonParams, {})
    ).resolves.toHaveLength(1);

    vi.mocked(getLessonLanguage).mockResolvedValue(null);
    await expect(
      listPublicApiCourseLessonTranslationsService(ORG_ID, ACTOR_ID, lessonParams, { locale: 'fr' })
    ).resolves.toEqual([]);
    expect(getLessonLanguage).toHaveBeenCalledWith(LESSON_ID, 'fr');
  });

  it('upserts a translation as the key creator', async () => {
    vi.mocked(upsertLessonLanguageService).mockResolvedValue(english);

    await setPublicApiCourseLessonTranslationService(
      ORG_ID,
      ACTOR_ID,
      { ...lessonParams, locale: 'en' },
      { content: '<p>Hi</p>', versionIntent: 'manual', versionLabel: 'v2' }
    );

    expect(upsertLessonLanguageService).toHaveBeenCalledWith(
      LESSON_ID,
      { locale: 'en', content: '<p>Hi</p>' },
      { authorId: ACTOR_ID, versionIntent: 'manual', versionLabel: 'v2' }
    );
  });

  it('returns 401 on a write without an actor', async () => {
    await expect(
      setPublicApiCourseLessonTranslationService(ORG_ID, null, { ...lessonParams, locale: 'en' }, { content: 'x' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('turns the history cursor into a string', async () => {
    vi.mocked(getLessonHistoryService).mockResolvedValue({
      items: [],
      nextCursor: { timestamp: '2026-09-30 10:00:00', id: 7 }
    });

    const page = await listPublicApiCourseLessonHistoryService(ORG_ID, ACTOR_ID, lessonParams, {
      locale: 'en',
      limit: 10
    });

    expect(page.nextCursor).toBe('2026-09-30 10:00:00|7');
    expect(getLessonHistoryService).toHaveBeenCalledWith(LESSON_ID, 'en', 10, undefined);
  });
});
