import { beforeEach, describe, expect, it, vi } from 'vitest';

const redisMocks = vi.hoisted(() => ({
  mGet: vi.fn(),
  setEx: vi.fn()
}));

vi.mock('@cio/core/config/env', () => ({
  env: { REDIS_URL: 'redis://localhost:6379' }
}));

vi.mock('@cio/core/utils/redis/redis', () => ({
  redis: redisMocks,
  logRedisUnavailableOnce: vi.fn()
}));

vi.mock('@cio/db/queries/analytics', () => ({
  selectCountryBreakdown: vi.fn(),
  selectCourseDailyRange: vi.fn(),
  selectOrgDailyRange: vi.fn(),
  selectPopularCourseTypes: vi.fn()
}));

import { selectOrgDailyRange } from '@cio/db/queries/analytics';
import { getLandingStats } from '@api/services/analytics/reads';

const cachedLandingStats = {
  totals: {
    landingViews: 5,
    coursePageViews: 4,
    uniqueVisitors: 3,
    enrollments: 2,
    completions: 1
  },
  sparkline: [{ date: '2026-08-27', views: 9, enrollments: 2 }]
};

describe('dashboard analytics cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisMocks.mGet.mockResolvedValue([null, null]);
    vi.mocked(selectOrgDailyRange).mockResolvedValue([
      {
        date: '2026-08-27',
        landingViews: 5,
        coursePageViews: 4,
        uniqueVisitors: 3,
        enrollments: 2,
        completions: 1
      }
    ]);
  });

  it('writes cache entries with the current organization cache version', async () => {
    redisMocks.mGet.mockResolvedValue(['4', null]);

    const result = await getLandingStats('org-1', 30);

    expect(result).toEqual(cachedLandingStats);
    expect(redisMocks.setEx).toHaveBeenCalledWith(
      'dash:analytics:landing:org-1:30',
      600,
      JSON.stringify({ version: '4', data: cachedLandingStats })
    );
  });

  it('returns cached analytics when the organization cache version matches', async () => {
    redisMocks.mGet.mockResolvedValue(['4', JSON.stringify({ version: '4', data: cachedLandingStats })]);

    const result = await getLandingStats('org-1', 30);

    expect(result).toEqual(cachedLandingStats);
    expect(selectOrgDailyRange).not.toHaveBeenCalled();
    expect(redisMocks.setEx).not.toHaveBeenCalled();
  });

  it('recomputes analytics when an organization mutation changed the cache version', async () => {
    redisMocks.mGet.mockResolvedValue(['5', JSON.stringify({ version: '4', data: cachedLandingStats })]);

    await getLandingStats('org-1', 30);

    expect(selectOrgDailyRange).toHaveBeenCalledTimes(1);
    expect(redisMocks.setEx).toHaveBeenCalledWith(
      'dash:analytics:landing:org-1:30',
      600,
      JSON.stringify({ version: '5', data: cachedLandingStats })
    );
  });

  it('bypasses matching cached data when refresh requests a cache bust', async () => {
    redisMocks.mGet.mockResolvedValue(['4', JSON.stringify({ version: '4', data: cachedLandingStats })]);

    await getLandingStats('org-1', 30, true);

    expect(selectOrgDailyRange).toHaveBeenCalledTimes(1);
    expect(redisMocks.setEx).toHaveBeenCalled();
  });
});
