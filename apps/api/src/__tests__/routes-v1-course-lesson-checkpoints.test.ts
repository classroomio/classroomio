import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/middlewares/rate-limiter', () => ({
  createRateLimiter: () => async (_c: unknown, next: () => Promise<void>) => next(),
  createAuthenticationFailureRateLimiter: () => async (_c: unknown, next: () => Promise<void>) => next()
}));

vi.mock('@api/services/v1/courses/lesson-checkpoints', () => ({
  listPublicApiVideoCheckpointsService: vi.fn(),
  createPublicApiVideoCheckpointService: vi.fn(),
  updatePublicApiVideoCheckpointService: vi.fn(),
  deletePublicApiVideoCheckpointService: vi.fn(),
  getPublicApiVideoCheckpointResultsService: vi.fn(),
  exportPublicApiVideoCheckpointResultsCsvService: vi.fn()
}));

import { Hono } from '@api/utils/hono';
import {
  createPublicApiVideoCheckpointService,
  deletePublicApiVideoCheckpointService,
  exportPublicApiVideoCheckpointResultsCsvService,
  getPublicApiVideoCheckpointResultsService,
  listPublicApiVideoCheckpointsService,
  updatePublicApiVideoCheckpointService
} from '@api/services/v1/courses/lesson-checkpoints';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { getPublicApiRouteScope } from '@api/middlewares/public-api-scopes';
import { v1CoursesRouter } from '@api/routes/v1/courses';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const LESSON_ID = '22222222-2222-4222-8222-222222222222';
const CHECKPOINT_ID = '33333333-3333-4333-8333-333333333333';
const ASSET_ID = '44444444-4444-4444-8444-444444444444';
const lessonParams = { courseId: COURSE_ID, lessonId: LESSON_ID };
const base = `/${COURSE_ID}/lessons/${LESSON_ID}/checkpoints`;

const app = new Hono()
  .use('*', async (c, next) => {
    c.set('orgId', 'org-1');
    c.set('actorId', 'actor-1');
    await next();
  })
  .route('/', v1CoursesRouter);

const json = (method: string, body: unknown) => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body)
});

const validBody = {
  timestampSeconds: 12,
  questionType: 'RADIO',
  title: 'What does X do?',
  resumePolicy: 'any',
  options: [
    { label: 'A', isCorrect: true },
    { label: 'B', isCorrect: false }
  ]
};

describe('v1 lesson video question routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists questions for a lesson', async () => {
    vi.mocked(listPublicApiVideoCheckpointsService).mockResolvedValue({ checkpoints: [] });

    const response = await app.request(base);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: { checkpoints: [] } });
    expect(listPublicApiVideoCheckpointsService).toHaveBeenCalledWith('org-1', 'actor-1', lessonParams);
  });

  it('creates a question with a 201 and passes the validated body', async () => {
    vi.mocked(createPublicApiVideoCheckpointService).mockResolvedValue({ id: CHECKPOINT_ID } as never);

    const response = await app.request(base, json('POST', { ...validBody, assetId: ASSET_ID }));

    expect(response.status).toBe(201);
    expect(createPublicApiVideoCheckpointService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      lessonParams,
      expect.objectContaining({ assetId: ASSET_ID, timestampSeconds: 12, settings: {}, resumePolicy: 'any' })
    );
  });

  it.each([
    ['a non-uuid asset id', { ...validBody, assetId: 'nope' }],
    ['a negative time', { ...validBody, assetId: ASSET_ID, timestampSeconds: -1 }],
    ['a fractional time', { ...validBody, assetId: ASSET_ID, timestampSeconds: 1.5 }],
    ['an unsupported type', { ...validBody, assetId: ASSET_ID, questionType: 'TEXTAREA' }],
    ['a radio with no correct option', { ...validBody, assetId: ASSET_ID, options: [{ label: 'A' }, { label: 'B' }] }],
    ['a missing title', { ...validBody, assetId: ASSET_ID, title: '  ' }]
  ])('rejects %s with 400', async (_name, body) => {
    const response = await app.request(base, json('POST', body));

    expect(response.status).toBe(400);
    expect(createPublicApiVideoCheckpointService).not.toHaveBeenCalled();
  });

  it('replaces a question by id and does not accept an asset change', async () => {
    vi.mocked(updatePublicApiVideoCheckpointService).mockResolvedValue({ id: CHECKPOINT_ID } as never);

    const response = await app.request(`${base}/${CHECKPOINT_ID}`, json('PUT', validBody));

    expect(response.status).toBe(200);
    expect(updatePublicApiVideoCheckpointService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { ...lessonParams, checkpointId: CHECKPOINT_ID },
      expect.not.objectContaining({ assetId: expect.anything() })
    );
  });

  it('rejects a non-uuid checkpoint id', async () => {
    expect((await app.request(`${base}/nope`, json('PUT', validBody))).status).toBe(400);
    expect((await app.request(`${base}/nope`, { method: 'DELETE' })).status).toBe(400);
  });

  it('deletes a question', async () => {
    vi.mocked(deletePublicApiVideoCheckpointService).mockResolvedValue({ id: CHECKPOINT_ID });

    const response = await app.request(`${base}/${CHECKPOINT_ID}`, { method: 'DELETE' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: { id: CHECKPOINT_ID } });
  });

  it('serves results as JSON and as CSV', async () => {
    vi.mocked(getPublicApiVideoCheckpointResultsService).mockResolvedValue({ checkpoints: [] } as never);
    vi.mocked(exportPublicApiVideoCheckpointResultsCsvService).mockResolvedValue('Learner,Time\nAda,0:12');

    const json200 = await app.request(`${base}/results`);
    const csv = await app.request(`${base}/results/csv`);

    expect(json200.status).toBe(200);
    expect(csv.status).toBe(200);
    expect(csv.headers.get('content-type')).toContain('text/csv');
    expect(await csv.text()).toBe('Learner,Time\nAda,0:12');
  });

  it('surfaces a plan lock and a time collision as their own statuses', async () => {
    vi.mocked(createPublicApiVideoCheckpointService).mockRejectedValueOnce(
      new AppError('In-video questions require a paid plan', ErrorCodes.UPGRADE_REQUIRED, 403)
    );
    vi.mocked(createPublicApiVideoCheckpointService).mockRejectedValueOnce(
      new AppError('Too close', ErrorCodes.VALIDATION_ERROR, 409, 'timestampSeconds')
    );

    const locked = await app.request(base, json('POST', { ...validBody, assetId: ASSET_ID }));
    const collided = await app.request(base, json('POST', { ...validBody, assetId: ASSET_ID }));

    expect(locked.status).toBe(403);
    expect((await locked.json()).code).toBe(ErrorCodes.UPGRADE_REQUIRED);
    expect(collided.status).toBe(409);
  });
});

describe('video question API scopes', () => {
  const path = `/public-api/v1/courses/${COURSE_ID}/lessons/${LESSON_ID}/checkpoints`;

  it.each([
    ['GET', path, 'course:video_checkpoint:read'],
    ['GET', `${path}/results`, 'course:video_checkpoint:read'],
    ['GET', `${path}/results/csv`, 'course:video_checkpoint:read'],
    ['POST', path, 'course:video_checkpoint:write'],
    ['PUT', `${path}/${CHECKPOINT_ID}`, 'course:video_checkpoint:write'],
    ['DELETE', `${path}/${CHECKPOINT_ID}`, 'course:video_checkpoint:write']
  ])('maps %s %s to %s, not the broader course scopes', (method, requestPath, scope) => {
    expect(getPublicApiRouteScope(method, requestPath)).toBe(scope);
  });

  it('leaves the neighbouring lesson routes on the course scopes', () => {
    expect(getPublicApiRouteScope('GET', `/public-api/v1/courses/${COURSE_ID}/lessons/${LESSON_ID}`)).toBe(
      'course:read'
    );
  });
});
