import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/group', () => ({
  isCourseTeamMemberOrOrgAdmin: vi.fn(),
  isUserCourseMemberOrOrgAdmin: vi.fn(),
  getGroupMemberIdByCourseAndProfile: vi.fn()
}));

vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: vi.fn()
}));

vi.mock('@cio/db/queries/lesson', () => ({
  getLessonById: vi.fn()
}));

vi.mock('@cio/db/queries/course', () => ({
  getCourseSectionById: vi.fn(),
  getCourseSectionsByCourseId: vi.fn()
}));

vi.mock('@cio/db/queries/exercise', () => ({
  getExerciseById: vi.fn()
}));

vi.mock('@cio/core/services/course/section', () => ({
  createCourseSection: vi.fn(),
  deleteCourseSectionService: vi.fn(),
  promoteUngroupedSection: vi.fn(),
  reorderCourseSections: vi.fn(),
  updateCourseSectionService: vi.fn()
}));

vi.mock('@api/services/lesson', () => ({
  createLesson: vi.fn(),
  deleteLessonService: vi.fn(),
  updateLessonService: vi.fn(),
  getLesson: vi.fn(),
  listLessons: vi.fn(),
  getLessonCommentsPaginated: vi.fn(),
  createLessonCommentService: vi.fn(),
  updateLessonCommentService: vi.fn(),
  deleteLessonCommentService: vi.fn(),
  getLessonCompletionService: vi.fn(),
  upsertLessonCompletionService: vi.fn(),
  getLessonWatchProgressService: vi.fn(),
  updateLessonWatchProgressService: vi.fn(),
  getLessonHistoryService: vi.fn()
}));

vi.mock('@cio/core/services/lesson-language', () => ({
  getLessonLanguage: vi.fn(),
  listLessonLanguages: vi.fn(),
  updateLessonLanguageService: vi.fn(),
  upsertLessonLanguageService: vi.fn()
}));

vi.mock('@cio/core/services/exercise/exercise', () => ({
  createExercise: vi.fn(),
  createExerciseFromTemplate: vi.fn(),
  deleteExerciseForCourseService: vi.fn(),
  getExercise: vi.fn(),
  listExercises: vi.fn(),
  updateExerciseService: vi.fn()
}));

vi.mock('@api/services/exercise/template', () => ({
  fetchAllTemplatesMetadata: vi.fn(),
  fetchTemplateById: vi.fn(),
  fetchTemplatesByTag: vi.fn()
}));

import { Hono } from '@api/utils/hono';
import { isCourseTeamMemberOrOrgAdmin, isUserCourseMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { getLessonById } from '@cio/db/queries/lesson';
import { getCourseSectionById, getCourseSectionsByCourseId } from '@cio/db/queries/course';
import { getExerciseById } from '@cio/db/queries/exercise';
import {
  createCourseSection,
  deleteCourseSectionService,
  promoteUngroupedSection,
  reorderCourseSections,
  updateCourseSectionService
} from '@cio/core/services/course/section';
import { createLesson, deleteLessonService, updateLessonService } from '@api/services/lesson';
import { upsertLessonLanguageService, updateLessonLanguageService } from '@cio/core/services/lesson-language';
import {
  createExercise,
  createExerciseFromTemplate,
  deleteExerciseForCourseService,
  updateExerciseService
} from '@cio/core/services/exercise/exercise';
import { fetchTemplateById } from '@api/services/exercise/template';
import { sectionRouter } from '@api/routes/course/section';
import { lessonRouter } from '@api/routes/course/lesson';
import { exerciseRouter } from '@api/routes/course/exercise';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_COURSE_ID = '22222222-2222-4222-8222-222222222222';
const LESSON_ID = '33333333-3333-4333-8333-333333333333';
const SECTION_ID = '44444444-4444-4444-8444-444444444444';
const EXERCISE_ID = '55555555-5555-4555-8555-555555555555';
const USER_ID = '66666666-6666-4666-8666-666666666666';

function buildApp(mountPath: string, router: Hono) {
  return new Hono()
    .use('*', async (c, next) => {
      c.set('user', { id: USER_ID });
      c.set('session', { id: 'session' });
      await next();
    })
    .route(mountPath, router as never);
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  };
}

function asTeamMember() {
  vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
  vi.mocked(isUserCourseMemberOrOrgAdmin).mockResolvedValue(true);
  vi.mocked(getCourseOrganizationId).mockResolvedValue('org-1');
}

function asStudent() {
  vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);
  vi.mocked(isUserCourseMemberOrOrgAdmin).mockResolvedValue(true);
  vi.mocked(getCourseOrganizationId).mockResolvedValue('org-1');
}

beforeEach(() => {
  vi.clearAllMocks();
  asTeamMember();
  vi.mocked(getLessonById).mockResolvedValue({ courseId: COURSE_ID } as never);
  vi.mocked(getCourseSectionById).mockResolvedValue({ courseId: COURSE_ID } as never);
  vi.mocked(getCourseSectionsByCourseId).mockResolvedValue([{ id: SECTION_ID } as never]);
  vi.mocked(getExerciseById).mockResolvedValue({ courseId: COURSE_ID } as never);
  vi.mocked(createCourseSection).mockResolvedValue({ id: SECTION_ID } as never);
  vi.mocked(updateCourseSectionService).mockResolvedValue({ id: SECTION_ID } as never);
  vi.mocked(deleteCourseSectionService).mockResolvedValue({ id: SECTION_ID } as never);
  vi.mocked(promoteUngroupedSection).mockResolvedValue({ section: { id: SECTION_ID } } as never);
  vi.mocked(reorderCourseSections).mockResolvedValue([{ id: SECTION_ID }] as never);
  vi.mocked(createLesson).mockResolvedValue({ id: LESSON_ID } as never);
  vi.mocked(updateLessonService).mockResolvedValue({ id: LESSON_ID } as never);
  vi.mocked(deleteLessonService).mockResolvedValue({ id: LESSON_ID } as never);
  vi.mocked(upsertLessonLanguageService).mockResolvedValue({ id: 'lang' } as never);
  vi.mocked(updateLessonLanguageService).mockResolvedValue({ id: 'lang' } as never);
  vi.mocked(createExercise).mockResolvedValue({ id: EXERCISE_ID } as never);
  vi.mocked(createExerciseFromTemplate).mockResolvedValue({ id: EXERCISE_ID } as never);
  vi.mocked(updateExerciseService).mockResolvedValue({ id: EXERCISE_ID } as never);
  vi.mocked(deleteExerciseForCourseService).mockResolvedValue({ id: EXERCISE_ID } as never);
  vi.mocked(fetchTemplateById).mockResolvedValue({ questionnaire: { questions: [] } } as never);
});

describe('section write access', () => {
  const app = () => buildApp('/course/:courseId/section', sectionRouter as never);

  it('rejects section create from a student', async () => {
    asStudent();

    const response = await app().request(
      `/course/${COURSE_ID}/section`,
      jsonInit('POST', { title: 'Section', courseId: COURSE_ID, order: 1 })
    );

    expect(response.status).toBe(403);
    expect(createCourseSection).not.toHaveBeenCalled();
  });

  it('allows section create from the course team', async () => {
    asTeamMember();

    const response = await app().request(
      `/course/${COURSE_ID}/section`,
      jsonInit('POST', { title: 'Section', courseId: COURSE_ID, order: 1 })
    );

    expect(response.status).toBe(201);
    expect(createCourseSection).toHaveBeenCalled();
  });

  it('rejects section promote-ungrouped from a student', async () => {
    asStudent();

    const response = await app().request(
      `/course/${COURSE_ID}/section/promote-ungrouped`,
      jsonInit('POST', { title: 'Grouped' })
    );

    expect(response.status).toBe(403);
    expect(promoteUngroupedSection).not.toHaveBeenCalled();
  });

  it('rejects section update from a student', async () => {
    asStudent();

    const response = await app().request(
      `/course/${COURSE_ID}/section/${SECTION_ID}`,
      jsonInit('PUT', { title: 'Renamed' })
    );

    expect(response.status).toBe(403);
    expect(updateCourseSectionService).not.toHaveBeenCalled();
  });

  it('allows section update from the course team', async () => {
    asTeamMember();

    const response = await app().request(
      `/course/${COURSE_ID}/section/${SECTION_ID}`,
      jsonInit('PUT', { title: 'Renamed' })
    );

    expect(response.status).toBe(200);
  });

  it('returns 404 when a section belongs to another course', async () => {
    asTeamMember();
    vi.mocked(getCourseSectionById).mockResolvedValue({ courseId: OTHER_COURSE_ID } as never);

    const response = await app().request(
      `/course/${COURSE_ID}/section/${SECTION_ID}`,
      jsonInit('PUT', { title: 'Renamed' })
    );

    expect(response.status).toBe(404);
    expect(updateCourseSectionService).not.toHaveBeenCalled();
  });

  it('rejects section delete from a student', async () => {
    asStudent();

    const response = await app().request(`/course/${COURSE_ID}/section/${SECTION_ID}`, { method: 'DELETE' });

    expect(response.status).toBe(403);
    expect(deleteCourseSectionService).not.toHaveBeenCalled();
  });

  it('returns 404 when deleting a section from another course', async () => {
    asTeamMember();
    vi.mocked(getCourseSectionById).mockResolvedValue({ courseId: OTHER_COURSE_ID } as never);

    const response = await app().request(`/course/${COURSE_ID}/section/${SECTION_ID}`, { method: 'DELETE' });

    expect(response.status).toBe(404);
    expect(deleteCourseSectionService).not.toHaveBeenCalled();
  });

  it('rejects section reorder from a student', async () => {
    asStudent();

    const response = await app().request(
      `/course/${COURSE_ID}/section/reorder`,
      jsonInit('POST', { sections: [{ id: SECTION_ID, order: 1 }] })
    );

    expect(response.status).toBe(403);
    expect(reorderCourseSections).not.toHaveBeenCalled();
  });

  it('returns 404 when reordering a section from another course', async () => {
    asTeamMember();
    vi.mocked(getCourseSectionsByCourseId).mockResolvedValue([]);

    const response = await app().request(
      `/course/${COURSE_ID}/section/reorder`,
      jsonInit('POST', { sections: [{ id: SECTION_ID, order: 1 }] })
    );

    expect(response.status).toBe(404);
    expect(reorderCourseSections).not.toHaveBeenCalled();
  });
});

describe('lesson write access', () => {
  const app = () => buildApp('/course/:courseId/lesson', lessonRouter as never);

  it('rejects lesson create from a student', async () => {
    asStudent();

    const response = await app().request(
      `/course/${COURSE_ID}/lesson`,
      jsonInit('POST', { title: 'Lesson', courseId: COURSE_ID, order: 1 })
    );

    expect(response.status).toBe(403);
    expect(createLesson).not.toHaveBeenCalled();
  });

  it('allows lesson create from the course team', async () => {
    asTeamMember();

    const response = await app().request(
      `/course/${COURSE_ID}/lesson`,
      jsonInit('POST', { title: 'Lesson', courseId: COURSE_ID, order: 1 })
    );

    expect(response.status).toBe(201);
  });

  it('rejects lesson update from a student', async () => {
    asStudent();

    const response = await app().request(
      `/course/${COURSE_ID}/lesson/${LESSON_ID}`,
      jsonInit('PUT', { title: 'Renamed' })
    );

    expect(response.status).toBe(403);
    expect(updateLessonService).not.toHaveBeenCalled();
  });

  it('returns 404 when a lesson belongs to another course', async () => {
    asTeamMember();
    vi.mocked(getLessonById).mockResolvedValue({ courseId: OTHER_COURSE_ID } as never);

    const response = await app().request(
      `/course/${COURSE_ID}/lesson/${LESSON_ID}`,
      jsonInit('PUT', { title: 'Renamed' })
    );

    expect(response.status).toBe(404);
    expect(updateLessonService).not.toHaveBeenCalled();
  });

  it('rejects lesson delete from a student', async () => {
    asStudent();

    const response = await app().request(`/course/${COURSE_ID}/lesson/${LESSON_ID}`, { method: 'DELETE' });

    expect(response.status).toBe(403);
    expect(deleteLessonService).not.toHaveBeenCalled();
  });

  it('returns 404 when deleting a lesson from another course', async () => {
    asTeamMember();
    vi.mocked(getLessonById).mockResolvedValue({ courseId: OTHER_COURSE_ID } as never);

    const response = await app().request(`/course/${COURSE_ID}/lesson/${LESSON_ID}`, { method: 'DELETE' });

    expect(response.status).toBe(404);
    expect(deleteLessonService).not.toHaveBeenCalled();
  });
});

describe('lesson language write access', () => {
  const app = () => buildApp('/course/:courseId/lesson', lessonRouter as never);

  it('rejects language upsert from a student', async () => {
    asStudent();

    const response = await app().request(
      `/course/${COURSE_ID}/lesson/${LESSON_ID}/language`,
      jsonInit('POST', { locale: 'en', content: '<p>Hi</p>' })
    );

    expect(response.status).toBe(403);
    expect(upsertLessonLanguageService).not.toHaveBeenCalled();
  });

  it('allows language upsert from the course team', async () => {
    asTeamMember();

    const response = await app().request(
      `/course/${COURSE_ID}/lesson/${LESSON_ID}/language`,
      jsonInit('POST', { locale: 'en', content: '<p>Hi</p>' })
    );

    expect(response.status).toBe(201);
  });

  it('rejects language update from a student', async () => {
    asStudent();

    const response = await app().request(
      `/course/${COURSE_ID}/lesson/${LESSON_ID}/language/en`,
      jsonInit('PUT', { content: '<p>Hi</p>' })
    );

    expect(response.status).toBe(403);
    expect(updateLessonLanguageService).not.toHaveBeenCalled();
  });

  it('returns 404 when the language lesson belongs to another course', async () => {
    asTeamMember();
    vi.mocked(getLessonById).mockResolvedValue({ courseId: OTHER_COURSE_ID } as never);

    const response = await app().request(
      `/course/${COURSE_ID}/lesson/${LESSON_ID}/language/en`,
      jsonInit('PUT', { content: '<p>Hi</p>' })
    );

    expect(response.status).toBe(404);
    expect(updateLessonLanguageService).not.toHaveBeenCalled();
  });
});

describe('exercise write access', () => {
  const app = () => buildApp('/course/:courseId/exercise', exerciseRouter as never);

  it('rejects exercise create from a student', async () => {
    asStudent();

    const response = await app().request(
      `/course/${COURSE_ID}/exercise`,
      jsonInit('POST', { title: 'Exercise', courseId: COURSE_ID, order: 1 })
    );

    expect(response.status).toBe(403);
    expect(createExercise).not.toHaveBeenCalled();
  });

  it('allows exercise create from the course team and pins it to the path course', async () => {
    asTeamMember();

    const response = await app().request(
      `/course/${COURSE_ID}/exercise`,
      jsonInit('POST', { title: 'Exercise', courseId: OTHER_COURSE_ID, order: 1 })
    );

    expect(response.status).toBe(201);
    expect(createExercise).toHaveBeenCalledWith(expect.objectContaining({ courseId: COURSE_ID }));
  });

  it('rejects exercise from-template from a student', async () => {
    asStudent();

    const response = await app().request(
      `/course/${COURSE_ID}/exercise/from-template`,
      jsonInit('POST', { order: 1, templateId: 1 })
    );

    expect(response.status).toBe(403);
    expect(createExerciseFromTemplate).not.toHaveBeenCalled();
  });

  it('rejects exercise update from a student', async () => {
    asStudent();

    const response = await app().request(
      `/course/${COURSE_ID}/exercise/${EXERCISE_ID}`,
      jsonInit('PUT', { title: 'Renamed' })
    );

    expect(response.status).toBe(403);
    expect(updateExerciseService).not.toHaveBeenCalled();
  });

  it('allows exercise update from the course team', async () => {
    asTeamMember();

    const response = await app().request(
      `/course/${COURSE_ID}/exercise/${EXERCISE_ID}`,
      jsonInit('PUT', { title: 'Renamed' })
    );

    expect(response.status).toBe(200);
  });

  it('returns 404 when an exercise belongs to another course', async () => {
    asTeamMember();
    vi.mocked(getExerciseById).mockResolvedValue({ courseId: OTHER_COURSE_ID } as never);

    const response = await app().request(
      `/course/${COURSE_ID}/exercise/${EXERCISE_ID}`,
      jsonInit('PUT', { title: 'Renamed' })
    );

    expect(response.status).toBe(404);
    expect(updateExerciseService).not.toHaveBeenCalled();
  });

  it('rejects exercise delete from a student', async () => {
    asStudent();

    const response = await app().request(`/course/${COURSE_ID}/exercise/${EXERCISE_ID}`, { method: 'DELETE' });

    expect(response.status).toBe(403);
    expect(deleteExerciseForCourseService).not.toHaveBeenCalled();
  });

  it('allows exercise delete from the course team', async () => {
    asTeamMember();

    const response = await app().request(`/course/${COURSE_ID}/exercise/${EXERCISE_ID}`, { method: 'DELETE' });

    expect(response.status).toBe(200);
  });
});
