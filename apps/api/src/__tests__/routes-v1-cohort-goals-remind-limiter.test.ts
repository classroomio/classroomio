import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isAllowed: vi.fn(),
  logRedisUnavailable: vi.fn()
}));

vi.mock('@cio/core/config/env', () => ({ env: { NODE_ENV: 'production' } }));

vi.mock('@cio/core/utils/redis/redis', () => ({
  redis: {},
  logRedisUnavailableOnce: mocks.logRedisUnavailable
}));

vi.mock('@api/utils/redis/limiter', () => ({
  RedisRateLimiter: class {
    isAllowed = mocks.isAllowed;
  }
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

import { Hono } from '@api/utils/hono';
import { ErrorCodes } from '@api/utils/errors';
import { remindPublicApiOverdueCohortGoalsService } from '@api/services/v1/cohorts/goals';
import { v1CohortsRouter } from '@api/routes/v1/cohorts';

const COHORT_ID = '11111111-1111-4111-8111-111111111111';

const app = new Hono()
  .use('*', async (c, next) => {
    c.set('orgId', 'org-1');
    c.set('actorId', 'actor-1');
    await next();
  })
  .route('/public-api/v1/cohorts', v1CohortsRouter);

describe('POST /:cohortId/goals/remind-overdue when Redis is down', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAllowed.mockRejectedValue(new Error('ECONNREFUSED'));
  });

  it('refuses with 503 and never runs the reminder', async () => {
    const response = await app.request(`/public-api/v1/cohorts/${COHORT_ID}/goals/remind-overdue`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ success: false, code: ErrorCodes.RATE_LIMIT_UNAVAILABLE });
    expect(remindPublicApiOverdueCohortGoalsService).not.toHaveBeenCalled();
  });
});
