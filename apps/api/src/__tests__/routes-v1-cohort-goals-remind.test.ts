import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { generateSpecs } from 'hono-openapi';
import { Hono } from '@api/utils/hono';

vi.mock('@api/middlewares/rate-limiter', () => ({
  createAuthenticationFailureRateLimiter: () => async (_c: Context, next: Next) => next(),
  createRateLimiter: () => async (_c: Context, next: Next) => next()
}));

vi.mock('@api/services/v1/cohorts/goals', () => ({
  listPublicApiCohortGoalsService: vi.fn(),
  createPublicApiCohortGoalService: vi.fn(),
  getPublicApiCohortGoalService: vi.fn(),
  updatePublicApiCohortGoalService: vi.fn(),
  archivePublicApiCohortGoalService: vi.fn(),
  deletePublicApiCohortGoalService: vi.fn(),
  evaluatePublicApiCohortGoalService: vi.fn(),
  evaluateAllPublicApiCohortGoalsService: vi.fn(),
  remindPublicApiOverdueCohortGoalsService: vi.fn(),
  getPublicApiOrgGoalsOverviewService: vi.fn(),
  listPublicApiMyCohortGoalsService: vi.fn()
}));

import { AppError, ErrorCodes } from '@api/utils/errors';
import { enrichPublicApiOpenApiSpec } from '@cio/utils/openapi/public-api';
import { remindPublicApiOverdueCohortGoalsService } from '@api/services/v1/cohorts/goals';
import { v1CohortsRouter } from '@api/routes/v1/cohorts';

const COHORT_ID = '11111111-1111-4111-8111-111111111111';
const COURSE_ID = '33333333-3333-4333-8333-333333333333';

const app = new Hono()
  .use('*', async (c, next) => {
    c.set('orgId', 'org-1');
    c.set('actorId', 'actor-1');
    await next();
  })
  .route('/public-api/v1/cohorts', v1CohortsRouter);

const COHORT_GOALS_PATH = `/public-api/v1/cohorts/${COHORT_ID}/goals/remind-overdue`;

const remindRequest = (body: unknown) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body)
});

const REMIND_RESULT = { enqueued: 3, skipped: 1, truncated: false };

describe('POST /:cohortId/goals/remind-overdue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reminds with an empty body and passes org, actor, params and payload through', async () => {
    vi.mocked(remindPublicApiOverdueCohortGoalsService).mockResolvedValue(REMIND_RESULT);

    const response = await app.request(COHORT_GOALS_PATH, remindRequest({}));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: REMIND_RESULT });
    expect(remindPublicApiOverdueCohortGoalsService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { cohortId: COHORT_ID },
      {}
    );
  });

  it('narrows the run with courseId and profileId', async () => {
    vi.mocked(remindPublicApiOverdueCohortGoalsService).mockResolvedValue(REMIND_RESULT);
    const profileId = '44444444-4444-4444-8444-444444444444';

    const response = await app.request(COHORT_GOALS_PATH, remindRequest({ courseId: COURSE_ID, profileId }));

    expect(response.status).toBe(200);
    expect(remindPublicApiOverdueCohortGoalsService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { cohortId: COHORT_ID },
      { courseId: COURSE_ID, profileId }
    );
  });

  it('reports the second same-day call as skipped without re-enqueueing', async () => {
    vi.mocked(remindPublicApiOverdueCohortGoalsService)
      .mockResolvedValueOnce({ enqueued: 2, skipped: 0, truncated: false })
      .mockResolvedValueOnce({ enqueued: 0, skipped: 2, truncated: false });

    const first = await app.request(COHORT_GOALS_PATH, remindRequest({}));
    const second = await app.request(COHORT_GOALS_PATH, remindRequest({}));

    expect(await first.json()).toEqual({ success: true, data: { enqueued: 2, skipped: 0, truncated: false } });
    expect(await second.json()).toEqual({ success: true, data: { enqueued: 0, skipped: 2, truncated: false } });
  });

  it('rejects a non-uuid courseId with 400 without calling the service', async () => {
    const response = await app.request(COHORT_GOALS_PATH, remindRequest({ courseId: 'nope' }));

    expect(response.status).toBe(400);
    expect(remindPublicApiOverdueCohortGoalsService).not.toHaveBeenCalled();
  });

  it('maps a cohort outside the organization to 404', async () => {
    vi.mocked(remindPublicApiOverdueCohortGoalsService).mockRejectedValue(
      new AppError('Cohort not found in this organization', ErrorCodes.COHORT_NOT_FOUND, 404)
    );

    const response = await app.request(COHORT_GOALS_PATH, remindRequest({}));

    expect(response.status).toBe(404);
  });

  it('maps a non-team key creator to 403', async () => {
    vi.mocked(remindPublicApiOverdueCohortGoalsService).mockRejectedValue(
      new AppError(
        'Automation actor must be a cohort tutor/admin or an organization admin',
        ErrorCodes.COHORT_FORBIDDEN,
        403
      )
    );

    const response = await app.request(COHORT_GOALS_PATH, remindRequest({}));

    expect(response.status).toBe(403);
  });
});

describe('OpenAPI', () => {
  it('documents the remind route with its summary, tag and status keys', async () => {
    const spec = enrichPublicApiOpenApiSpec((await generateSpecs(app)) as never) as {
      paths: Record<string, Record<string, { summary?: string; tags?: string[]; responses: Record<string, unknown> }>>;
    };

    const remind = spec.paths['/public-api/v1/cohorts/{cohortId}/goals/remind-overdue']?.post;

    expect(remind).toMatchObject({ summary: 'Send overdue goal reminders now', tags: ['Cohort Goals'] });
    expect(Object.keys(remind?.responses ?? {}).sort()).toEqual(['200', '400', '401', '403', '404', '429', '503']);
  });
});
