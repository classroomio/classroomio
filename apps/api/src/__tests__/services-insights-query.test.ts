import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/core/utils/redis/insights-cache', () => ({
  claimInsightsRefresh: vi.fn(),
  insightsKey: vi.fn(
    (section, orgId, scopeType, scopeId, hash) =>
      `insights:${section}:${orgId}:${scopeType}:${scopeId}${hash ? `:${hash}` : ''}`
  ),
  insightsTtlSeconds: vi.fn((scopeType) => (scopeType === 'org' ? 60 : 30))
}));

vi.mock('@cio/db/queries/insights', () => ({
  requiresOrderedItems: vi.fn().mockReturnValue(false),
  runInsightsQuery: vi.fn().mockResolvedValue({
    columns: [{ key: 'rows__count', role: 'measure', valueType: 'int' }],
    rows: [{ rows__count: 42 }],
    total: 1
  })
}));

vi.mock('@api/services/insights/authorize', () => ({
  resolveAuthorizedScope: vi.fn()
}));

vi.mock('@api/services/insights/structure', () => ({
  getInsightsCourseStructure: vi.fn(),
  toOrderedItems: vi.fn().mockReturnValue([])
}));

vi.mock('@api/services/insights/plan', () => ({
  assertInsightsRangeAllowed: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('@api/utils/redis/cached-read', () => ({
  cachedRead: vi.fn()
}));

import { claimInsightsRefresh, insightsKey, insightsTtlSeconds } from '@cio/core/utils/redis/insights-cache';
import { requiresOrderedItems, runInsightsQuery } from '@cio/db/queries/insights';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { cachedRead } from '@api/utils/redis/cached-read';
import { resolveAuthorizedScope } from '@api/services/insights/authorize';
import { exportInsightsQueryForActor, runInsightsQueryForActor } from '@api/services/insights/query';
import { assertInsightsRangeAllowed } from '@api/services/insights/plan';
import type { InsightsActor } from '@api/services/insights/types';
import { ZInsightsExportSpec, ZInsightsQuerySpec } from '@cio/utils/validation/insights';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const COHORT_ID = '22222222-2222-4222-8222-222222222222';
const COURSE_ID = '33333333-3333-4333-8333-333333333333';

const actor: InsightsActor = {
  profileId: '44444444-4444-4444-8444-444444444444',
  orgId: ORG_ID,
  orgRoles: { [ORG_ID]: 2 }
};

const scope = {
  orgId: ORG_ID,
  type: 'cohort' as const,
  id: COHORT_ID,
  courseIds: [COURSE_ID]
};

const spec = ZInsightsQuerySpec.parse({
  source: 'student',
  measures: [{ metric: 'rows', agg: 'count' }],
  filters: []
});

const exportSpec = ZInsightsExportSpec.parse({
  source: 'student',
  measures: [{ metric: 'rows', agg: 'count' }],
  filters: []
});

describe('runInsightsQueryForActor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resolveAuthorizedScope).mockResolvedValue(scope);
    vi.mocked(assertInsightsRangeAllowed).mockResolvedValue(undefined);
    vi.mocked(claimInsightsRefresh).mockResolvedValue(true);
    vi.mocked(cachedRead).mockImplementation(async (key, ttl, compute) => {
      const data = await compute();

      return { data, generatedAt: new Date().toISOString() };
    });
  });

  it('fails immediately when authorization fails, never calling cachedRead', async () => {
    vi.mocked(resolveAuthorizedScope).mockRejectedValue(
      new AppError('Forbidden', ErrorCodes.INSIGHTS_SCOPE_FORBIDDEN, 403)
    );

    await expect(
      runInsightsQueryForActor(actor, {
        scope: { type: 'cohort', id: COHORT_ID },
        spec
      })
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(cachedRead).not.toHaveBeenCalled();
  });

  it('refuses a range outside the plan before reading the cache', async () => {
    vi.mocked(assertInsightsRangeAllowed).mockRejectedValue(
      new AppError('Upgrade required', ErrorCodes.PLAN_UPGRADE_REQUIRED, 402)
    );

    await expect(
      runInsightsQueryForActor(actor, {
        scope: { type: 'cohort', id: COHORT_ID },
        spec
      })
    ).rejects.toMatchObject({ statusCode: 402 });

    expect(assertInsightsRangeAllowed).toHaveBeenCalledWith(ORG_ID, spec.range);
    expect(cachedRead).not.toHaveBeenCalled();
  });

  it('bypasses the cache when a search filter is present', async () => {
    const searchSpec = { ...spec, search: 'Jane' };

    const result = await runInsightsQueryForActor(actor, {
      scope: { type: 'cohort', id: COHORT_ID },
      spec: searchSpec
    });

    expect(cachedRead).not.toHaveBeenCalled();
    expect(runInsightsQuery).toHaveBeenCalled();
    expect(result.cached).toBe(false);
    expect(result.refreshThrottled).toBe(false);
  });

  it('reads from cache on standard query and uses scope TTL', async () => {
    const result = await runInsightsQueryForActor(actor, {
      scope: { type: 'cohort', id: COHORT_ID },
      spec
    });

    expect(cachedRead).toHaveBeenCalledTimes(1);
    expect(insightsTtlSeconds).toHaveBeenCalledWith('cohort');
    expect(result.total).toBe(1);
    expect(result.refreshThrottled).toBe(false);
  });

  it('allows refresh when slot is claimed', async () => {
    vi.mocked(claimInsightsRefresh).mockResolvedValue(true);

    const result = await runInsightsQueryForActor(actor, {
      scope: { type: 'cohort', id: COHORT_ID },
      spec,
      refresh: true
    });

    expect(claimInsightsRefresh).toHaveBeenCalledWith(
      actor.profileId,
      'cohort',
      COHORT_ID,
      expect.stringMatching(/^[0-9a-f]{32}$/)
    );
    expect(cachedRead).toHaveBeenCalledWith(expect.any(String), 30, expect.any(Function), { refresh: true });
    expect(result.refreshThrottled).toBe(false);
  });

  it('claims a separate refresh slot for each widget spec in the same scope', async () => {
    vi.mocked(claimInsightsRefresh).mockResolvedValue(true);
    const otherSpec = ZInsightsQuerySpec.parse({
      source: 'student',
      measures: [{ metric: 'overall_progress_pct', agg: 'avg' }],
      filters: []
    });

    await runInsightsQueryForActor(actor, { scope: { type: 'cohort', id: COHORT_ID }, spec, refresh: true });
    await runInsightsQueryForActor(actor, {
      scope: { type: 'cohort', id: COHORT_ID },
      spec: otherSpec,
      refresh: true
    });

    const [firstClaim, secondClaim] = vi.mocked(claimInsightsRefresh).mock.calls;
    expect(firstClaim?.[3]).toEqual(expect.stringMatching(/^[0-9a-f]{32}$/));
    expect(secondClaim?.[3]).toEqual(expect.stringMatching(/^[0-9a-f]{32}$/));
    expect(firstClaim?.[3]).not.toBe(secondClaim?.[3]);
  });

  it('marks refresh throttled and serves cached entry when refresh cooldown is active', async () => {
    vi.mocked(claimInsightsRefresh).mockResolvedValue(false);

    const result = await runInsightsQueryForActor(actor, {
      scope: { type: 'cohort', id: COHORT_ID },
      spec,
      refresh: true
    });

    expect(claimInsightsRefresh).toHaveBeenCalledWith(
      actor.profileId,
      'cohort',
      COHORT_ID,
      expect.stringMatching(/^[0-9a-f]{32}$/)
    );
    expect(cachedRead).toHaveBeenCalledWith(expect.any(String), 30, expect.any(Function), { refresh: false });
    expect(result.refreshThrottled).toBe(true);
  });

  it('throws an AppError when requiredOrderedItems exceeds maxOutlineCourses', async () => {
    vi.mocked(requiresOrderedItems).mockReturnValue(true);
    vi.mocked(resolveAuthorizedScope).mockResolvedValue({
      ...scope,
      courseIds: Array.from({ length: 51 }, (_, i) => `course-${i}`)
    });

    await expect(
      runInsightsQueryForActor(actor, {
        scope: { type: 'cohort', id: COHORT_ID },
        spec
      })
    ).rejects.toMatchObject({
      code: ErrorCodes.INSIGHTS_QUERY_INVALID,
      statusCode: 400
    });
  });
});

describe('exportInsightsQueryForActor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resolveAuthorizedScope).mockResolvedValue(scope);
  });

  it('runs query directly without using cachedRead', async () => {
    const result = await exportInsightsQueryForActor(actor, {
      scope: { type: 'cohort', id: COHORT_ID },
      spec: exportSpec
    });

    expect(cachedRead).not.toHaveBeenCalled();
    expect(runInsightsQuery).toHaveBeenCalled();
    expect(result.cached).toBe(false);
    expect(result.refreshThrottled).toBe(false);
  });
});
