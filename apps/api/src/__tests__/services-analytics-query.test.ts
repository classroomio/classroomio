import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/core/utils/redis/analytics-cache', () => ({
  claimAnalyticsRefresh: vi.fn(),
  analyticsKey: vi.fn(
    (section, orgId, scopeType, scopeId, hash) =>
      `analytics:${section}:${orgId}:${scopeType}:${scopeId}${hash ? `:${hash}` : ''}`
  ),
  analyticsTtlSeconds: vi.fn((scopeType) => (scopeType === 'org' ? 60 : 30))
}));

vi.mock('@cio/db/queries/analytics', () => ({
  requiresOrderedItems: vi.fn().mockReturnValue(false),
  runAnalyticsQuery: vi.fn().mockResolvedValue({
    columns: [{ key: 'rows__count', role: 'measure', valueType: 'int' }],
    rows: [{ rows__count: 42 }],
    total: 1
  })
}));

vi.mock('@api/services/analytics/authorize', () => ({
  resolveAuthorizedScope: vi.fn()
}));

vi.mock('@api/services/analytics/structure', () => ({
  getAnalyticsCourseStructure: vi.fn(),
  toOrderedItems: vi.fn().mockReturnValue([])
}));

vi.mock('@api/services/analytics/plan', () => ({
  resolveAnalyticsRange: vi.fn().mockResolvedValue('all')
}));

vi.mock('@api/utils/redis/cached-read', () => ({
  cachedRead: vi.fn()
}));

import { claimAnalyticsRefresh, analyticsKey, analyticsTtlSeconds } from '@cio/core/utils/redis/analytics-cache';
import { requiresOrderedItems, runAnalyticsQuery } from '@cio/db/queries/analytics';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { cachedRead } from '@api/utils/redis/cached-read';
import { resolveAuthorizedScope } from '@api/services/analytics/authorize';
import { exportAnalyticsQueryForActor, runAnalyticsQueryForActor } from '@api/services/analytics/query';
import { resolveAnalyticsRange } from '@api/services/analytics/plan';
import type { AnalyticsActor } from '@api/services/analytics/types';
import { ZAnalyticsExportSpec, ZAnalyticsQuerySpec } from '@cio/utils/validation/analytics';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const COHORT_ID = '22222222-2222-4222-8222-222222222222';
const COURSE_ID = '33333333-3333-4333-8333-333333333333';

const actor: AnalyticsActor = {
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

const spec = ZAnalyticsQuerySpec.parse({
  source: 'student',
  measures: [{ metric: 'rows', agg: 'count' }],
  filters: []
});

const exportSpec = ZAnalyticsExportSpec.parse({
  source: 'student',
  measures: [{ metric: 'rows', agg: 'count' }],
  filters: []
});

describe('runAnalyticsQueryForActor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resolveAuthorizedScope).mockResolvedValue(scope);
    vi.mocked(resolveAnalyticsRange).mockResolvedValue('all');
    vi.mocked(claimAnalyticsRefresh).mockResolvedValue(true);
    vi.mocked(cachedRead).mockImplementation(async (key, ttl, compute) => {
      const data = await compute();

      return { data, generatedAt: new Date().toISOString() };
    });
  });

  it('fails immediately when authorization fails, never calling cachedRead', async () => {
    vi.mocked(resolveAuthorizedScope).mockRejectedValue(
      new AppError('Forbidden', ErrorCodes.ANALYTICS_SCOPE_FORBIDDEN, 403)
    );

    await expect(
      runAnalyticsQueryForActor(actor, {
        scope: { type: 'cohort', id: COHORT_ID },
        spec
      })
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(cachedRead).not.toHaveBeenCalled();
  });

  it('clamps the range before hashing the spec and reading the cache', async () => {
    vi.mocked(resolveAnalyticsRange).mockResolvedValue('7d');

    await runAnalyticsQueryForActor(actor, {
      scope: { type: 'cohort', id: COHORT_ID },
      spec
    });

    expect(resolveAnalyticsRange).toHaveBeenCalledWith(ORG_ID, spec.range);
    expect(runAnalyticsQuery).toHaveBeenCalledWith(expect.objectContaining({ range: '7d' }), expect.anything());
    expect(cachedRead).toHaveBeenCalledTimes(1);
  });

  it('bypasses the cache when a search filter is present', async () => {
    const searchSpec = { ...spec, search: 'Jane' };

    const result = await runAnalyticsQueryForActor(actor, {
      scope: { type: 'cohort', id: COHORT_ID },
      spec: searchSpec
    });

    expect(cachedRead).not.toHaveBeenCalled();
    expect(runAnalyticsQuery).toHaveBeenCalled();
    expect(result.cached).toBe(false);
    expect(result.refreshThrottled).toBe(false);
  });

  it('reads from cache on standard query and uses scope TTL', async () => {
    const result = await runAnalyticsQueryForActor(actor, {
      scope: { type: 'cohort', id: COHORT_ID },
      spec
    });

    expect(cachedRead).toHaveBeenCalledTimes(1);
    expect(analyticsTtlSeconds).toHaveBeenCalledWith('cohort');
    expect(result.total).toBe(1);
    expect(result.refreshThrottled).toBe(false);
  });

  it('allows refresh when slot is claimed', async () => {
    vi.mocked(claimAnalyticsRefresh).mockResolvedValue(true);

    const result = await runAnalyticsQueryForActor(actor, {
      scope: { type: 'cohort', id: COHORT_ID },
      spec,
      refresh: true
    });

    expect(claimAnalyticsRefresh).toHaveBeenCalledWith(
      actor.profileId,
      'cohort',
      COHORT_ID,
      expect.stringMatching(/^[0-9a-f]{32}$/)
    );
    expect(cachedRead).toHaveBeenCalledWith(expect.any(String), 30, expect.any(Function), { refresh: true });
    expect(result.refreshThrottled).toBe(false);
  });

  it('claims a separate refresh slot for each widget spec in the same scope', async () => {
    vi.mocked(claimAnalyticsRefresh).mockResolvedValue(true);
    const otherSpec = ZAnalyticsQuerySpec.parse({
      source: 'student',
      measures: [{ metric: 'overall_progress_pct', agg: 'avg' }],
      filters: []
    });

    await runAnalyticsQueryForActor(actor, { scope: { type: 'cohort', id: COHORT_ID }, spec, refresh: true });
    await runAnalyticsQueryForActor(actor, {
      scope: { type: 'cohort', id: COHORT_ID },
      spec: otherSpec,
      refresh: true
    });

    const [firstClaim, secondClaim] = vi.mocked(claimAnalyticsRefresh).mock.calls;
    expect(firstClaim?.[3]).toEqual(expect.stringMatching(/^[0-9a-f]{32}$/));
    expect(secondClaim?.[3]).toEqual(expect.stringMatching(/^[0-9a-f]{32}$/));
    expect(firstClaim?.[3]).not.toBe(secondClaim?.[3]);
  });

  it('marks refresh throttled and serves cached entry when refresh cooldown is active', async () => {
    vi.mocked(claimAnalyticsRefresh).mockResolvedValue(false);

    const result = await runAnalyticsQueryForActor(actor, {
      scope: { type: 'cohort', id: COHORT_ID },
      spec,
      refresh: true
    });

    expect(claimAnalyticsRefresh).toHaveBeenCalledWith(
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
      runAnalyticsQueryForActor(actor, {
        scope: { type: 'cohort', id: COHORT_ID },
        spec
      })
    ).rejects.toMatchObject({
      code: ErrorCodes.ANALYTICS_QUERY_INVALID,
      statusCode: 400
    });
  });
});

describe('exportAnalyticsQueryForActor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resolveAuthorizedScope).mockResolvedValue(scope);
  });

  it('runs query directly without using cachedRead', async () => {
    const result = await exportAnalyticsQueryForActor(actor, {
      scope: { type: 'cohort', id: COHORT_ID },
      spec: exportSpec
    });

    expect(cachedRead).not.toHaveBeenCalled();
    expect(runAnalyticsQuery).toHaveBeenCalled();
    expect(result.cached).toBe(false);
    expect(result.refreshThrottled).toBe(false);
  });
});
