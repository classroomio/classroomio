import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
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

vi.mock('@api/services/v1/courses/exercises', () => ({
  listCourseExercisesService: vi.fn(),
  createCourseExerciseService: vi.fn(),
  getCourseExerciseService: vi.fn(),
  updateCourseExerciseService: vi.fn(),
  deleteCourseExerciseService: vi.fn(),
  notifyCourseExerciseLearnersService: vi.fn(),
  getCourseExerciseNotifyStatusService: vi.fn()
}));
vi.mock('@api/services/v1/courses/submissions', () => ({
  listCourseSubmissionsService: vi.fn(),
  getCourseSubmissionService: vi.fn(),
  gradeCourseSubmissionService: vi.fn(),
  updateCourseSubmissionService: vi.fn(),
  deleteCourseSubmissionService: vi.fn()
}));
vi.mock('@api/services/v1/courses/marks', () => ({ getCourseMarksService: vi.fn() }));
vi.mock('@api/services/v1/exercise-templates/template', () => ({
  listExerciseTemplatesService: vi.fn(),
  getExerciseTemplateService: vi.fn()
}));

import * as exercises from '@api/services/v1/courses/exercises';
import * as submissions from '@api/services/v1/courses/submissions';
import * as marks from '@api/services/v1/courses/marks';
import * as templates from '@api/services/v1/exercise-templates/template';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { v1Router } from '@api/routes/v1';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const EXERCISE_ID = '22222222-2222-4222-8222-222222222222';
const SUBMISSION_ID = '33333333-3333-4333-8333-333333333333';
const EXERCISES = `/courses/${COURSE_ID}/exercises`;
const EXERCISE = `${EXERCISES}/${EXERCISE_ID}`;
const SUBMISSION = `/courses/${COURSE_ID}/submissions/${SUBMISSION_ID}`;
const PAGINATION = { page: 2, limit: 5, total: 6, totalPages: 2 };

const app = new Hono().route('/public-api/v1', v1Router);

const request = (path: string, init: RequestInit = {}) => {
  mocks.authenticate.mockResolvedValue({
    id: 'api-key',
    organizationId: 'org-1',
    createdByProfileId: 'actor-1',
    type: 'api',
    scopes: ['public_api:*']
  });

  return app.request(`/public-api/v1${path}`, {
    ...init,
    headers: { Authorization: 'Bearer key', 'content-type': 'application/json', ...init.headers }
  });
};

const send = (method: string, payload: unknown): RequestInit => ({ method, body: JSON.stringify(payload) });

beforeEach(() => {
  vi.resetAllMocks();
});

describe('v1 course exercise routes', () => {
  it('lists exercises with filters and pagination', async () => {
    vi.mocked(exercises.listCourseExercisesService).mockResolvedValue({
      items: [{ id: EXERCISE_ID }],
      pagination: PAGINATION
    } as never);

    const sectionId = '44444444-4444-4444-8444-444444444444';
    const response = await request(`${EXERCISES}?page=2&limit=5&sectionId=${sectionId}`);

    expect(response.status).toBe(200);
    expect(exercises.listCourseExercisesService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { courseId: COURSE_ID },
      { page: 2, limit: 5, sectionId }
    );
    expect(await response.json()).toEqual({ success: true, data: [{ id: EXERCISE_ID }], pagination: PAGINATION });
  });

  it('creates an exercise with questions and returns 201', async () => {
    vi.mocked(exercises.createCourseExerciseService).mockResolvedValue({ id: EXERCISE_ID } as never);
    const payload = {
      title: 'Quiz',
      order: 1,
      questions: [
        {
          question: 'Pick one',
          questionTypeId: 1,
          points: 2,
          options: [
            { label: 'A', isCorrect: true },
            { label: 'B', isCorrect: false }
          ]
        }
      ]
    };

    const response = await request(EXERCISES, send('POST', payload));

    expect(response.status).toBe(201);
    expect(exercises.createCourseExerciseService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { courseId: COURSE_ID },
      expect.objectContaining({ title: 'Quiz', order: 1 })
    );
    expect(await response.json()).toEqual({ success: true, data: { id: EXERCISE_ID } });
  });

  it.each([
    ['a title together with templateId', { title: 'Quiz', order: 1, templateId: 4 }],
    ['neither title nor templateId', { order: 1 }],
    [
      'a disabled question type',
      { title: 'Quiz', order: 1, questions: [{ question: 'Q', questionTypeId: 15, points: 1 }] }
    ],
    [
      'a choice question without a correct option',
      {
        title: 'Quiz',
        order: 1,
        questions: [
          {
            question: 'Q',
            questionTypeId: 1,
            points: 1,
            options: [
              { label: 'A', isCorrect: false },
              { label: 'B', isCorrect: false }
            ]
          }
        ]
      }
    ],
    ['a dueBy without a timezone', { title: 'Quiz', order: 1, dueBy: '2026-12-31 10:00' }]
  ])('rejects a create with %s', async (_case, payload) => {
    const response = await request(EXERCISES, send('POST', payload));

    expect(response.status).toBe(400);
    expect(exercises.createCourseExerciseService).not.toHaveBeenCalled();
  });

  it('rejects an empty update', async () => {
    const response = await request(EXERCISE, send('PUT', {}));

    expect(response.status).toBe(400);
    expect(exercises.updateCourseExerciseService).not.toHaveBeenCalled();
  });

  it('rejects deleting a question without its id', async () => {
    const response = await request(EXERCISE, send('PUT', { questions: [{ question: 'Q', points: 1, delete: true }] }));

    expect(response.status).toBe(400);
  });

  it('passes an update through to the service', async () => {
    vi.mocked(exercises.updateCourseExerciseService).mockResolvedValue({ id: EXERCISE_ID } as never);

    const response = await request(EXERCISE, send('PUT', { title: 'Quiz 2', isUnlocked: false }));

    expect(response.status).toBe(200);
    expect(exercises.updateCourseExerciseService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { courseId: COURSE_ID, exerciseId: EXERCISE_ID },
      { title: 'Quiz 2', isUnlocked: false }
    );
  });

  it('returns 400 for an exercise id that is not a UUID', async () => {
    const response = await request(`${EXERCISES}/not-a-uuid`);

    expect(response.status).toBe(400);
    expect(exercises.getCourseExerciseService).not.toHaveBeenCalled();
  });

  it('maps a service 404 to a 404 response', async () => {
    vi.mocked(exercises.getCourseExerciseService).mockRejectedValue(
      new AppError('Exercise not found', ErrorCodes.EXERCISE_NOT_FOUND, 404)
    );

    const response = await request(EXERCISE);

    expect(response.status).toBe(404);
  });

  it('queues a notification with 202 and reads its status', async () => {
    vi.mocked(exercises.notifyCourseExerciseLearnersService).mockResolvedValue({ jobId: 'job-1' });
    vi.mocked(exercises.getCourseExerciseNotifyStatusService).mockResolvedValue({ jobId: 'job-1' } as never);

    const queued = await request(`${EXERCISE}/notify`, { method: 'POST' });
    const status = await request(`${EXERCISE}/notify/job-1?pollCount=3`);

    expect(queued.status).toBe(202);
    expect(await queued.json()).toEqual({ success: true, data: { jobId: 'job-1' } });
    expect(status.status).toBe(200);
    expect(exercises.getCourseExerciseNotifyStatusService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { courseId: COURSE_ID, exerciseId: EXERCISE_ID, jobId: 'job-1' },
      { pollCount: 3 }
    );
  });
});

describe('v1 exercise template routes', () => {
  it('lists templates by tag', async () => {
    vi.mocked(templates.listExerciseTemplatesService).mockResolvedValue({
      items: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
    });

    const response = await request('/exercise-templates?tag=math');

    expect(response.status).toBe(200);
    expect(templates.listExerciseTemplatesService).toHaveBeenCalledWith('org-1', 'actor-1', {
      page: 1,
      limit: 20,
      tag: 'math'
    });
  });

  it('rejects a non-numeric template id', async () => {
    const response = await request('/exercise-templates/abc');

    expect(response.status).toBe(400);
    expect(templates.getExerciseTemplateService).not.toHaveBeenCalled();
  });
});

describe('v1 course submission and marks routes', () => {
  it('lists submissions with filters', async () => {
    vi.mocked(submissions.listCourseSubmissionsService).mockResolvedValue({
      items: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
    } as never);

    const response = await request(
      `/courses/${COURSE_ID}/submissions?exerciseId=${EXERCISE_ID}&gradingState=awaiting_manual`
    );

    expect(response.status).toBe(200);
    expect(submissions.listCourseSubmissionsService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { courseId: COURSE_ID },
      { page: 1, limit: 20, exerciseId: EXERCISE_ID, gradingState: 'awaiting_manual' }
    );
  });

  it('rejects an unknown grading state filter', async () => {
    const response = await request(`/courses/${COURSE_ID}/submissions?gradingState=graded`);

    expect(response.status).toBe(400);
  });

  it('grades a submission', async () => {
    vi.mocked(submissions.gradeCourseSubmissionService).mockResolvedValue({ id: SUBMISSION_ID } as never);
    const payload = { answers: [{ questionId: 7, points: 2 }], total: 2, feedback: 'Good' };

    const response = await request(`${SUBMISSION}/grades`, send('PUT', payload));

    expect(response.status).toBe(200);
    expect(submissions.gradeCourseSubmissionService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { courseId: COURSE_ID, submissionId: SUBMISSION_ID },
      payload
    );
  });

  it.each([
    [
      'a repeated questionId',
      {
        answers: [
          { questionId: 7, points: 1 },
          { questionId: 7, points: 2 }
        ],
        total: 3
      }
    ],
    ['negative points', { answers: [{ questionId: 7, points: -1 }], total: 0 }],
    ['no total', { answers: [] }]
  ])('rejects grades with %s', async (_case, payload) => {
    const response = await request(`${SUBMISSION}/grades`, send('PUT', payload));

    expect(response.status).toBe(400);
    expect(submissions.gradeCourseSubmissionService).not.toHaveBeenCalled();
  });

  it('rejects an empty submission update', async () => {
    const response = await request(SUBMISSION, send('PATCH', {}));

    expect(response.status).toBe(400);
    expect(submissions.updateCourseSubmissionService).not.toHaveBeenCalled();
  });

  it('returns marks rows with pagination', async () => {
    vi.mocked(marks.getCourseMarksService).mockResolvedValue({
      items: [{ memberId: 'm-1' }],
      pagination: PAGINATION
    } as never);

    const response = await request(`/courses/${COURSE_ID}/marks?page=2&limit=5`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: [{ memberId: 'm-1' }], pagination: PAGINATION });
  });
});
