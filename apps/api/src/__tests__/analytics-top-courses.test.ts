import { beforeEach, describe, expect, it, vi } from 'vitest';

const redisMocks = vi.hoisted(() => ({
  get: vi.fn(),
  setEx: vi.fn()
}));

const queryMocks = vi.hoisted(() => ({
  selectTopCoursesByViews: vi.fn()
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
  selectPopularCourseTypes: vi.fn(),
  selectTopCoursesByViews: queryMocks.selectTopCoursesByViews
}));

import { getTopCoursesByViews } from '@api/services/analytics';

const sampleRows = [
  { courseId: 'course-1', title: 'SOC 2 Security Basics', views: 31 },
  { courseId: 'course-2', title: 'HIPAA Awareness 2026', views: 12 }
];

describe('getTopCoursesByViews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisMocks.get.mockResolvedValue(null);
    redisMocks.setEx.mockResolvedValue('OK');
    queryMocks.selectTopCoursesByViews.mockResolvedValue(sampleRows);
  });

  it('maps course titles and view counts from the daily rollup', async () => {
    const result = await getTopCoursesByViews('11111111-1111-1111-1111-111111111111', 30);

    expect(result).toEqual(sampleRows);
    expect(queryMocks.selectTopCoursesByViews).toHaveBeenCalledTimes(1);
    expect(redisMocks.setEx).toHaveBeenCalledWith(
      'dash:analytics:top-courses:11111111-1111-1111-1111-111111111111:30',
      600,
      JSON.stringify(sampleRows)
    );
  });

  it('returns the cached ranking when present', async () => {
    const cached = [{ courseId: 'cached', title: 'Cached Course', views: 9 }];
    redisMocks.get.mockResolvedValue(JSON.stringify(cached));

    const result = await getTopCoursesByViews('11111111-1111-1111-1111-111111111111', 30);

    expect(result).toEqual(cached);
    expect(queryMocks.selectTopCoursesByViews).not.toHaveBeenCalled();
    expect(redisMocks.setEx).not.toHaveBeenCalled();
  });

  it('skips the cache read when bustCache is true but still writes', async () => {
    redisMocks.get.mockResolvedValue(JSON.stringify([{ courseId: 'stale', title: 'Stale', views: 1 }]));

    const result = await getTopCoursesByViews('11111111-1111-1111-1111-111111111111', 7, true);

    expect(result).toEqual(sampleRows);
    expect(queryMocks.selectTopCoursesByViews).toHaveBeenCalledTimes(1);
    expect(redisMocks.get).not.toHaveBeenCalled();
    expect(redisMocks.setEx).toHaveBeenCalledWith(
      'dash:analytics:top-courses:11111111-1111-1111-1111-111111111111:7',
      600,
      JSON.stringify(sampleRows)
    );
  });

  it('falls back to the database when redis read fails', async () => {
    redisMocks.get.mockRejectedValue(new Error('redis down'));

    const result = await getTopCoursesByViews('11111111-1111-1111-1111-111111111111', 30);

    expect(result).toEqual(sampleRows);
    expect(queryMocks.selectTopCoursesByViews).toHaveBeenCalledTimes(1);
  });
});
