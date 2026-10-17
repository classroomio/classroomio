import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { generateSpecs } from 'hono-openapi';
import { Hono } from '@api/utils/hono';

const mocks = vi.hoisted(() => ({ authenticate: vi.fn() }));

vi.mock('@hono/node-server/conninfo', () => ({
  getConnInfo: () => ({ remote: { address: '127.0.0.1' } })
}));

vi.mock('@api/middlewares/rate-limiter', () => ({
  createAuthenticationFailureRateLimiter: () => async (_c: Context, next: Next) => next(),
  createRateLimiter: () => async (_c: Context, next: Next) => next()
}));

vi.mock('@api/services/organization/automation-key', () => ({
  authenticateOrganizationApiKeyService: mocks.authenticate,
  organizationApiKeyHasScopes: (keyScopes: string[], requiredScopes: string[]) =>
    requiredScopes.every((scope) => keyScopes.includes(scope)),
  touchOrganizationApiKeyLastUsedService: vi.fn()
}));

vi.mock('@api/services/v1/courses/exercise-questions', () => ({
  addCourseExerciseQuestionService: vi.fn(),
  updateCourseExerciseQuestionService: vi.fn(),
  deleteCourseExerciseQuestionService: vi.fn()
}));
vi.mock('@api/services/v1/courses/exercise-sections', () => ({
  addCourseExerciseSectionService: vi.fn(),
  updateCourseExerciseSectionService: vi.fn(),
  deleteCourseExerciseSectionService: vi.fn()
}));
vi.mock('@api/services/v1/courses/exercises', () => ({
  listCourseExercisesService: vi.fn(),
  createCourseExerciseService: vi.fn(),
  getCourseExerciseService: vi.fn(),
  updateCourseExerciseService: vi.fn(),
  deleteCourseExerciseService: vi.fn(),
  notifyCourseExerciseStudentsService: vi.fn(),
  getCourseExerciseNotifyStatusService: vi.fn()
}));

import * as questions from '@api/services/v1/courses/exercise-questions';
import * as sections from '@api/services/v1/courses/exercise-sections';
import * as exercises from '@api/services/v1/courses/exercises';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { v1Router } from '@api/routes/v1';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const EXERCISE_ID = '22222222-2222-4222-8222-222222222222';
const SECTION_ID = '33333333-3333-4333-8333-333333333333';
const EXERCISE = `/courses/${COURSE_ID}/exercises/${EXERCISE_ID}`;
const exerciseParams = { courseId: COURSE_ID, exerciseId: EXERCISE_ID };

const app = new Hono().route('/public-api/v1', v1Router);

const request = (path: string, init: RequestInit = {}, scopes = ['public_api:*']) => {
  mocks.authenticate.mockResolvedValue({
    id: 'api-key',
    organizationId: 'org-1',
    createdByProfileId: 'actor-1',
    type: 'api',
    scopes
  });

  return app.request(`/public-api/v1${path}`, {
    ...init,
    headers: { Authorization: 'Bearer key', 'content-type': 'application/json', ...init.headers }
  });
};

const send = (method: string, payload?: unknown): RequestInit => ({
  method,
  ...(payload !== undefined && { body: JSON.stringify(payload) })
});

const newQuestion = {
  question: 'Pick one',
  questionTypeId: 1,
  points: 1,
  options: [
    { label: 'A', isCorrect: true },
    { label: 'B', isCorrect: false }
  ]
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('v1 exercise question routes', () => {
  it('adds a question with 201 and does not reach the exercise router', async () => {
    vi.mocked(questions.addCourseExerciseQuestionService).mockResolvedValue({ id: 9 } as never);

    const response = await request(`${EXERCISE}/questions`, send('POST', newQuestion));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ success: true, data: { id: 9 } });
    expect(questions.addCourseExerciseQuestionService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      exerciseParams,
      expect.objectContaining({ question: 'Pick one' })
    );
    expect(exercises.getCourseExerciseService).not.toHaveBeenCalled();
  });

  it('rejects a single choice question with no correct option', async () => {
    const response = await request(
      `${EXERCISE}/questions`,
      send('POST', { ...newQuestion, options: [{ label: 'A', isCorrect: false }] })
    );

    expect(response.status).toBe(400);
    expect(questions.addCourseExerciseQuestionService).not.toHaveBeenCalled();
  });

  it('edits a question with explicit option lists', async () => {
    vi.mocked(questions.updateCourseExerciseQuestionService).mockResolvedValue({ id: 9 } as never);
    const payload = { points: 2, addOptions: [{ label: 'C', isCorrect: false }], removeOptionIds: [70] };

    const response = await request(`${EXERCISE}/questions/9`, send('PATCH', payload));

    expect(response.status).toBe(200);
    expect(questions.updateCourseExerciseQuestionService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { ...exerciseParams, questionId: 9 },
      payload
    );
  });

  it('rejects an empty question edit and a non-numeric question id', async () => {
    expect((await request(`${EXERCISE}/questions/9`, send('PATCH', {}))).status).toBe(400);
    expect((await request(`${EXERCISE}/questions/abc`, send('PATCH', { points: 2 }))).status).toBe(400);
    expect(questions.updateCourseExerciseQuestionService).not.toHaveBeenCalled();
  });

  it('deletes a question, passing force from the query string', async () => {
    vi.mocked(questions.deleteCourseExerciseQuestionService).mockResolvedValue({ id: 9 } as never);

    expect((await request(`${EXERCISE}/questions/9`, send('DELETE'))).status).toBe(200);
    expect((await request(`${EXERCISE}/questions/9?force=true`, send('DELETE'))).status).toBe(200);

    const calls = vi.mocked(questions.deleteCourseExerciseQuestionService).mock.calls;
    expect(calls[0][3]).toEqual({ force: false });
    expect(calls[1][3]).toEqual({ force: true });
  });

  it('passes a 409 for an answered question through', async () => {
    vi.mocked(questions.deleteCourseExerciseQuestionService).mockRejectedValue(
      new AppError('Students have answered this question', ErrorCodes.CONFLICT, 409)
    );

    expect((await request(`${EXERCISE}/questions/9`, send('DELETE'))).status).toBe(409);
  });
});

describe('v1 exercise section routes', () => {
  it('adds a section with 201', async () => {
    vi.mocked(sections.addCourseExerciseSectionService).mockResolvedValue({ id: SECTION_ID } as never);

    const response = await request(`${EXERCISE}/sections`, send('POST', { title: 'Part 2', order: 1 }));

    expect(response.status).toBe(201);
    expect(sections.addCourseExerciseSectionService).toHaveBeenCalledWith('org-1', 'actor-1', exerciseParams, {
      title: 'Part 2',
      order: 1,
      colorTheme: 'blue',
      afterBehavior: { action: 'continue' }
    });
  });

  it('edits and deletes a section', async () => {
    vi.mocked(sections.updateCourseExerciseSectionService).mockResolvedValue({ id: SECTION_ID } as never);
    vi.mocked(sections.deleteCourseExerciseSectionService).mockResolvedValue({ id: SECTION_ID } as never);
    const sectionParams = { ...exerciseParams, sectionId: SECTION_ID };

    expect((await request(`${EXERCISE}/sections/${SECTION_ID}`, send('PATCH', { title: 'Renamed' }))).status).toBe(200);
    expect((await request(`${EXERCISE}/sections/${SECTION_ID}`, send('DELETE'))).status).toBe(200);

    expect(sections.updateCourseExerciseSectionService).toHaveBeenCalledWith('org-1', 'actor-1', sectionParams, {
      title: 'Renamed'
    });
    expect(sections.deleteCourseExerciseSectionService).toHaveBeenCalledWith('org-1', 'actor-1', sectionParams);
  });

  it('rejects an empty section edit and a section id that is not a UUID', async () => {
    expect((await request(`${EXERCISE}/sections/${SECTION_ID}`, send('PATCH', {}))).status).toBe(400);
    expect((await request(`${EXERCISE}/sections/not-a-uuid`, send('DELETE'))).status).toBe(400);
  });
});

describe('MCP key scopes on question and section routes', () => {
  it('lets course:exercise:write reach them and refuses a key without it', async () => {
    vi.mocked(sections.addCourseExerciseSectionService).mockResolvedValue({ id: SECTION_ID } as never);
    const body = send('POST', { title: 'Part 2', order: 1 });

    expect((await request(`${EXERCISE}/sections`, body, ['course:exercise:write'])).status).toBe(201);
    expect((await request(`${EXERCISE}/sections`, body, ['course:exercise:read'])).status).toBe(403);
  });
});

describe('v1 exercise question and section OpenAPI spec', () => {
  it('lists every route with its method, path params and the Course Exercises tag', async () => {
    const spec = await generateSpecs(app);
    const paths = spec.paths ?? {};
    const prefix = '/public-api/v1/courses/{courseId}/exercises/{exerciseId}';
    const operations = [
      paths[`${prefix}/questions`]?.post,
      paths[`${prefix}/questions/{questionId}`]?.patch,
      paths[`${prefix}/questions/{questionId}`]?.delete,
      paths[`${prefix}/sections`]?.post,
      paths[`${prefix}/sections/{sectionId}`]?.patch,
      paths[`${prefix}/sections/{sectionId}`]?.delete
    ];

    for (const operation of operations) {
      expect(operation?.tags).toEqual(['Course Exercises']);
    }
  });
});
