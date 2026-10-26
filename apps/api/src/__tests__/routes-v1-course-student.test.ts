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

vi.mock('@api/services/v1/courses/student', () => ({
  setStudentLessonCompletionService: vi.fn(),
  createStudentSubmissionService: vi.fn()
}));
vi.mock('@api/services/v1/courses/members', () => ({
  listCourseMembersService: vi.fn(),
  addCourseMemberService: vi.fn(),
  getCourseMemberService: vi.fn(),
  updateCourseMemberService: vi.fn(),
  deleteCourseMemberService: vi.fn(),
  resetCourseMemberProgressService: vi.fn(),
  getCourseMemberAnalyticsService: vi.fn()
}));

import * as student from '@api/services/v1/courses/student';
import * as members from '@api/services/v1/courses/members';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { v1Router } from '@api/routes/v1';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const MEMBER_ID = '22222222-2222-4222-8222-222222222222';
const LESSON_ID = '33333333-3333-4333-8333-333333333333';
const EXERCISE_ID = '44444444-4444-4444-8444-444444444444';
const MEMBER = `/courses/${COURSE_ID}/members/${MEMBER_ID}`;
const COMPLETION = `${MEMBER}/lessons/${LESSON_ID}/completion`;
const SUBMISSIONS = `${MEMBER}/exercises/${EXERCISE_ID}/submissions`;

const app = new Hono().route('/public-api/v1', v1Router);

const request = (path: string, init: RequestInit = {}, scopes = ['course:student:write']) => {
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

const send = (method: string, payload: unknown): RequestInit => ({ method, body: JSON.stringify(payload) });

beforeEach(() => {
  vi.resetAllMocks();
});

describe('v1 student activity routes', () => {
  it('sets a lesson completion for the member in the path', async () => {
    const completion = { lessonId: LESSON_ID, memberId: MEMBER_ID, isComplete: true, updatedAt: '2026-01-02' };
    vi.mocked(student.setStudentLessonCompletionService).mockResolvedValue(completion);

    const response = await request(COMPLETION, send('PUT', { isComplete: true }));

    expect(response.status).toBe(200);
    expect(student.setStudentLessonCompletionService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { courseId: COURSE_ID, memberId: MEMBER_ID, lessonId: LESSON_ID },
      { isComplete: true }
    );
    expect(await response.json()).toEqual({ success: true, data: completion });
  });

  it('submits an exercise for the member in the path and returns 201', async () => {
    vi.mocked(student.createStudentSubmissionService).mockResolvedValue({ id: 'submission-1' } as never);
    const payload = { answers: [{ questionId: 7, optionId: 70 }] };

    const response = await request(SUBMISSIONS, send('POST', payload));

    expect(response.status).toBe(201);
    expect(student.createStudentSubmissionService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { courseId: COURSE_ID, memberId: MEMBER_ID, exerciseId: EXERCISE_ID },
      payload,
      'public_api'
    );
    expect(await response.json()).toEqual({ success: true, data: { id: 'submission-1' } });
  });

  it.each([
    ['a missing isComplete', COMPLETION, send('PUT', {})],
    ['no answers', SUBMISSIONS, send('POST', { answers: [] })],
    [
      'a member id that is not a UUID',
      `/courses/${COURSE_ID}/members/nope/lessons/${LESSON_ID}/completion`,
      send('PUT', { isComplete: true })
    ]
  ])('returns 400 for %s', async (_name, path, init) => {
    const response = await request(path, init);

    expect(response.status).toBe(400);
    expect(student.setStudentLessonCompletionService).not.toHaveBeenCalled();
    expect(student.createStudentSubmissionService).not.toHaveBeenCalled();
  });

  it.each([['course:member:write'], ['course:submission:write']])(
    'returns 403 for a %s key before the handler runs',
    async (scope) => {
      const completion = await request(COMPLETION, send('PUT', { isComplete: true }), [scope]);
      const submission = await request(SUBMISSIONS, send('POST', { answers: [{ questionId: 7 }] }), [scope]);

      expect(completion.status).toBe(403);
      expect(submission.status).toBe(403);
      expect(student.setStudentLessonCompletionService).not.toHaveBeenCalled();
      expect(student.createStudentSubmissionService).not.toHaveBeenCalled();
    }
  );

  it('passes a service error through with its status', async () => {
    vi.mocked(student.createStudentSubmissionService).mockRejectedValue(
      new AppError('This exercise allows only one submission', ErrorCodes.CONFLICT, 409)
    );

    const response = await request(SUBMISSIONS, send('POST', { answers: [{ questionId: 7 }] }));

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ success: false, code: ErrorCodes.CONFLICT });
  });

  it('leaves the member routes on the same prefix reachable', async () => {
    vi.mocked(members.getCourseMemberAnalyticsService).mockResolvedValue({} as never);

    const response = await request(`${MEMBER}/analytics`, {}, ['public_api:*']);

    expect(response.status).toBe(200);
    expect(members.getCourseMemberAnalyticsService).toHaveBeenCalled();
  });
});

describe('v1 student activity OpenAPI spec', () => {
  it('lists both routes with their method and path params', async () => {
    const spec = await generateSpecs(app);
    const paths = spec.paths ?? {};
    const prefix = '/public-api/v1/courses/{courseId}/members/{memberId}';

    expect(paths[`${prefix}/lessons/{lessonId}/completion`]?.put?.tags).toEqual(['Course Members']);
    expect(paths[`${prefix}/exercises/{exerciseId}/submissions`]?.post?.tags).toEqual(['Course Members']);
  });
});
