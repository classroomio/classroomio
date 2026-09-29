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

vi.mock('@api/routes/v1/audience', () => ({ v1AudienceRouter: new Hono().get('/', (c) => c.json({ success: true })) }));
vi.mock('@api/routes/v1/courses/course', () => ({
  v1CourseRouter: new Hono().get('/', (c) => c.json({ success: true }))
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

vi.mock('@api/services/organization/automation-usage', () => ({
  reserveMcpAutomationUsage: vi.fn(),
  completeMcpAutomationUsage: vi.fn(),
  releaseMcpAutomationUsage: vi.fn()
}));

import * as exercises from '@api/services/v1/courses/exercises';
import * as submissions from '@api/services/v1/courses/submissions';
import * as marks from '@api/services/v1/courses/marks';
import * as templates from '@api/services/v1/exercise-templates/template';
import {
  completeMcpAutomationUsage,
  releaseMcpAutomationUsage,
  reserveMcpAutomationUsage
} from '@api/services/organization/automation-usage';
import { v1Router } from '@api/routes/v1';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const EXERCISE_ID = '22222222-2222-4222-8222-222222222222';
const SUBMISSION_ID = '33333333-3333-4333-8333-333333333333';
const EXERCISE_SCOPES = ['course:exercise:read', 'course:exercise:write'];
const SUBMISSION_SCOPES = ['course:submission:read', 'course:submission:write'];
const PAGE = { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };

const app = new Hono().route('/public-api/v1', v1Router);

const requestAs = (type: 'mcp' | 'api', scopes: string[], path: string, init: RequestInit = {}) => {
  mocks.authenticate.mockResolvedValue({
    id: `${type}-key`,
    organizationId: 'org-1',
    createdByProfileId: 'actor-1',
    type,
    scopes
  });

  return app.request(`/public-api/v1${path}`, {
    ...init,
    headers: { Authorization: 'Bearer key', 'content-type': 'application/json', ...init.headers }
  });
};

const body = (method: string, payload: unknown): RequestInit => ({ method, body: JSON.stringify(payload) });

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(reserveMcpAutomationUsage).mockResolvedValue('usage-1');
  vi.mocked(completeMcpAutomationUsage).mockResolvedValue(undefined);
  vi.mocked(releaseMcpAutomationUsage).mockResolvedValue(undefined);
  vi.mocked(exercises.listCourseExercisesService).mockResolvedValue(PAGE as never);
  vi.mocked(exercises.createCourseExerciseService).mockResolvedValue({} as never);
  vi.mocked(exercises.getCourseExerciseService).mockResolvedValue({} as never);
  vi.mocked(exercises.updateCourseExerciseService).mockResolvedValue({} as never);
  vi.mocked(exercises.deleteCourseExerciseService).mockResolvedValue({} as never);
  vi.mocked(exercises.notifyCourseExerciseLearnersService).mockResolvedValue({ jobId: 'job-1' });
  vi.mocked(exercises.getCourseExerciseNotifyStatusService).mockResolvedValue({} as never);
  vi.mocked(templates.listExerciseTemplatesService).mockResolvedValue(PAGE as never);
  vi.mocked(templates.getExerciseTemplateService).mockResolvedValue({} as never);
  vi.mocked(submissions.listCourseSubmissionsService).mockResolvedValue(PAGE as never);
  vi.mocked(submissions.getCourseSubmissionService).mockResolvedValue({} as never);
  vi.mocked(submissions.gradeCourseSubmissionService).mockResolvedValue({} as never);
  vi.mocked(submissions.updateCourseSubmissionService).mockResolvedValue({} as never);
  vi.mocked(submissions.deleteCourseSubmissionService).mockResolvedValue({} as never);
  vi.mocked(marks.getCourseMarksService).mockResolvedValue(PAGE as never);
});

const exercisePath = `/courses/${COURSE_ID}/exercises`;
const submissionPath = `/courses/${COURSE_ID}/submissions/${SUBMISSION_ID}`;

describe('MCP metering on exercise routes through the real v1 router', () => {
  it.each([
    ['list_course_exercises', 0, 200, exercisePath, {}],
    ['create_course_exercise', 1, 201, exercisePath, body('POST', { title: 'Quiz', order: 1 })],
    ['get_course_exercise', 0, 200, `${exercisePath}/${EXERCISE_ID}`, {}],
    ['update_course_exercise', 1, 200, `${exercisePath}/${EXERCISE_ID}`, body('PUT', { title: 'Quiz 2' })],
    ['delete_course_exercise', 1, 200, `${exercisePath}/${EXERCISE_ID}`, { method: 'DELETE' }],
    ['notify_course_exercise', 1, 202, `${exercisePath}/${EXERCISE_ID}/notify`, { method: 'POST' }],
    ['get_course_exercise_notify_status', 0, 200, `${exercisePath}/${EXERCISE_ID}/notify/job-1`, {}],
    ['list_exercise_templates', 0, 200, '/exercise-templates', {}],
    ['get_exercise_template', 0, 200, '/exercise-templates/4', {}]
  ])('meters %s at %i credits', async (toolName, credits, status, path, init) => {
    const response = await requestAs('mcp', EXERCISE_SCOPES, path, init);

    expect(response.status).toBe(status);
    expect(reserveMcpAutomationUsage).toHaveBeenCalledTimes(1);
    expect(completeMcpAutomationUsage).toHaveBeenCalledWith('usage-1', toolName, credits);
  });
});

describe('MCP metering on submission and marks routes through the real v1 router', () => {
  it.each([
    ['list_course_submissions', 0, `/courses/${COURSE_ID}/submissions`, {}],
    ['get_course_submission', 0, submissionPath, {}],
    ['grade_course_submission', 1, `${submissionPath}/grades`, body('PUT', { answers: [], total: 0 })],
    ['update_course_submission', 1, submissionPath, body('PATCH', { feedback: 'Nice' })],
    ['delete_course_submission', 1, submissionPath, { method: 'DELETE' }],
    ['get_course_marks', 0, `/courses/${COURSE_ID}/marks`, {}]
  ])('meters %s at %i credits', async (toolName, credits, path, init) => {
    const response = await requestAs('mcp', SUBMISSION_SCOPES, path, init);

    expect(response.status).toBe(200);
    expect(reserveMcpAutomationUsage).toHaveBeenCalledTimes(1);
    expect(completeMcpAutomationUsage).toHaveBeenCalledWith('usage-1', toolName, credits);
  });
});

describe('exercise and submission route scopes', () => {
  it.each([exercisePath, `${exercisePath}/${EXERCISE_ID}`, '/exercise-templates'])(
    'lets a key with only exercise scopes reach %s',
    async (path) => {
      expect((await requestAs('mcp', EXERCISE_SCOPES, path)).status).toBe(200);
    }
  );

  it.each([`/courses/${COURSE_ID}/submissions`, `/courses/${COURSE_ID}/marks`, '/courses', '/audience'])(
    'keeps an exercise-only key out of %s',
    async (path) => {
      const response = await requestAs('mcp', EXERCISE_SCOPES, path);

      expect(response.status).toBe(403);
      expect(reserveMcpAutomationUsage).not.toHaveBeenCalled();
    }
  );

  it.each([exercisePath, '/exercise-templates', `/courses/${COURSE_ID}/members`])(
    'keeps a submission-only key out of %s',
    async (path) => {
      const response = await requestAs('mcp', SUBMISSION_SCOPES, path);

      expect(response.status).toBe(403);
      expect(reserveMcpAutomationUsage).not.toHaveBeenCalled();
    }
  );

  it('needs the write scope for writes', async () => {
    const response = await requestAs(
      'mcp',
      ['course:exercise:read'],
      `${exercisePath}/${EXERCISE_ID}`,
      body('PUT', { title: 'Quiz 2' })
    );

    expect(response.status).toBe(403);
    expect(exercises.updateCourseExerciseService).not.toHaveBeenCalled();
  });

  it('lets a public_api:* key reach exercise, submission and template routes', async () => {
    for (const path of [exercisePath, `/courses/${COURSE_ID}/submissions`, '/exercise-templates']) {
      expect((await requestAs('api', ['public_api:*'], path)).status).toBe(200);
    }
  });
});
