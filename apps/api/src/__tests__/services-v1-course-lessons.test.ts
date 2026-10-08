import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/tag', () => ({ getCourseOrganizationId: vi.fn() }));
vi.mock('@cio/db/queries/group', () => ({ isCourseTeamMemberOrOrgAdmin: vi.fn() }));
vi.mock('@cio/db/queries/course', () => ({ getCourseSectionById: vi.fn() }));
vi.mock('@cio/db/queries/lesson', () => ({ getLessonById: vi.fn() }));
vi.mock('@cio/core/services/course/course', () => ({}));
vi.mock('@api/services/lesson', () => ({
  deleteLessonService: vi.fn(),
  getLesson: vi.fn(),
  listLessonsPaginated: vi.fn()
}));
vi.mock('@api/services/course/notify-session', () => ({ notifyCourseSessionUpdateService: vi.fn() }));

import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getCourseSectionById } from '@cio/db/queries/course';
import { getLessonById } from '@cio/db/queries/lesson';
import { deleteLessonService, getLesson, listLessonsPaginated } from '@api/services/lesson';
import { notifyCourseSessionUpdateService } from '@api/services/course/notify-session';
import {
  deletePublicApiCourseLessonService,
  getPublicApiCourseLessonService,
  listPublicApiCourseLessonsService,
  notifyPublicApiCourseLessonSessionService
} from '@api/services/v1/courses/lessons';

const ORG_ID = 'org-1';
const COURSE_ID = 'course-1';
const ACTOR_ID = 'actor-1';
const LESSON_ID = 'lesson-1';

const lesson = (overrides: Record<string, unknown> = {}) =>
  ({
    id: LESSON_ID,
    courseId: COURSE_ID,
    sectionId: null,
    title: 'Intro',
    order: 1,
    callUrl: null,
    lessonAt: '2026-10-01T10:00:00Z',
    videos: [],
    documents: [],
    slides: [],
    lessonLanguages: [],
    ...overrides
  }) as never;

const lessonParams = { courseId: COURSE_ID, lessonId: LESSON_ID };

describe('services/v1/courses/lessons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
    vi.mocked(getLessonById).mockResolvedValue(lesson());
  });

  it('returns 404 for a course in another organization and 401 without an actor', async () => {
    await expect(getPublicApiCourseLessonService(ORG_ID, null, lessonParams)).rejects.toMatchObject({
      statusCode: 401
    });

    vi.mocked(getCourseOrganizationId).mockResolvedValue('other-org');
    await expect(getPublicApiCourseLessonService(ORG_ID, ACTOR_ID, lessonParams)).rejects.toMatchObject({
      statusCode: 404
    });
    expect(getLesson).not.toHaveBeenCalled();
  });

  it('rejects a student on reads and writes, like the team rule', async () => {
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);

    await expect(getPublicApiCourseLessonService(ORG_ID, ACTOR_ID, lessonParams)).rejects.toMatchObject({
      statusCode: 403
    });
    await expect(deletePublicApiCourseLessonService(ORG_ID, ACTOR_ID, lessonParams)).rejects.toMatchObject({
      statusCode: 403
    });
    expect(deleteLessonService).not.toHaveBeenCalled();
  });

  it('returns 404 for a lesson from another course', async () => {
    vi.mocked(getLessonById).mockResolvedValue(lesson({ courseId: 'other-course' }));

    await expect(getPublicApiCourseLessonService(ORG_ID, ACTOR_ID, lessonParams)).rejects.toMatchObject({
      statusCode: 404
    });
    await expect(deletePublicApiCourseLessonService(ORG_ID, ACTOR_ID, lessonParams)).rejects.toMatchObject({
      statusCode: 404
    });
    expect(getLesson).not.toHaveBeenCalled();
    expect(deleteLessonService).not.toHaveBeenCalled();
  });

  it('returns 404 when filtering by a section from another course', async () => {
    vi.mocked(getCourseSectionById).mockResolvedValue({ id: 's', courseId: 'other-course' } as never);

    await expect(
      listPublicApiCourseLessonsService(
        ORG_ID,
        ACTOR_ID,
        { courseId: COURSE_ID },
        { page: 1, limit: 20, sectionId: 's' }
      )
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(listLessonsPaginated).not.toHaveBeenCalled();
  });

  it('asks the database for one page of lessons', async () => {
    vi.mocked(getCourseSectionById).mockResolvedValue({ id: 's', courseId: COURSE_ID } as never);
    vi.mocked(listLessonsPaginated).mockResolvedValue({
      items: [lesson({ id: 'c', order: 3 }), lesson({ id: 'd', order: 4 })],
      total: 5
    });

    const query = { page: 2, limit: 2, sectionId: 's' };
    const result = await listPublicApiCourseLessonsService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID }, query);

    expect(listLessonsPaginated).toHaveBeenCalledWith(COURSE_ID, query);
    expect(result.items.map((item) => item.id)).toEqual(['c', 'd']);
    expect(result.pagination).toEqual({ page: 2, limit: 2, total: 5, totalPages: 3 });
  });

  it('hides storage keys in the lesson detail', async () => {
    vi.mocked(getLesson).mockResolvedValue(
      lesson({
        videos: [{ type: 'upload', link: 'https://signed', key: 'org/video.mp4', assetId: 'asset-1' }],
        documents: [{ type: 'pdf', name: 'a.pdf', link: 'https://signed', key: 'org/a.pdf' }],
        lessonLanguages: [{ id: 1, lessonId: LESSON_ID, locale: 'en', content: '<p>Hi</p>', updatedAt: 'now' }]
      })
    );

    const detail = await getPublicApiCourseLessonService(ORG_ID, ACTOR_ID, lessonParams);

    expect(detail.videos[0]).not.toHaveProperty('key');
    expect(detail.documents[0]).not.toHaveProperty('key');
    expect(detail.translations[0]).toMatchObject({ locale: 'en', content: '<p>Hi</p>' });
  });

  it('refuses to notify about a lesson without a live session', async () => {
    await expect(notifyPublicApiCourseLessonSessionService(ORG_ID, ACTOR_ID, lessonParams)).rejects.toMatchObject({
      statusCode: 409
    });
    expect(notifyCourseSessionUpdateService).not.toHaveBeenCalled();
  });

  it('queues the session notification for a live lesson', async () => {
    vi.mocked(getLessonById).mockResolvedValue(lesson({ callUrl: 'https://meet.example.com/x' }));
    vi.mocked(notifyCourseSessionUpdateService).mockResolvedValue({ jobId: 'job-1' });

    await expect(notifyPublicApiCourseLessonSessionService(ORG_ID, ACTOR_ID, lessonParams)).resolves.toEqual({
      jobId: 'job-1'
    });
    expect(notifyCourseSessionUpdateService).toHaveBeenCalledWith(COURSE_ID, LESSON_ID);
  });
});
