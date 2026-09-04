import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/analytics', () => ({
  selectCountryDailyAggregates: vi.fn(),
  selectCourseDailyAggregates: vi.fn(),
  selectOrgDailyAggregates: vi.fn(),
  upsertCountryDailyRows: vi.fn(),
  upsertCourseDailyRows: vi.fn(),
  upsertOrgDailyRows: vi.fn()
}));

vi.mock('@cio/core/utils/redis/org-stats-cache', () => ({
  invalidateOrgStatsForIds: vi.fn()
}));

import {
  selectCountryDailyAggregates,
  selectCourseDailyAggregates,
  selectOrgDailyAggregates,
  upsertCountryDailyRows,
  upsertCourseDailyRows,
  upsertOrgDailyRows
} from '@cio/db/queries/analytics';
import { invalidateOrgStatsForIds } from '@cio/core/utils/redis/org-stats-cache';
import { runAnalyticsRollupDaily } from '@cio/analytics';

describe('analytics rollup cache invalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(selectOrgDailyAggregates).mockResolvedValue([
      {
        orgId: 'org-1',
        date: '2026-08-26',
        landingViews: 2,
        uniqueVisitors: 2,
        coursePageViews: 1,
        enrollments: 1,
        completions: 0
      }
    ]);
    vi.mocked(selectCourseDailyAggregates).mockResolvedValue([
      {
        courseId: 'course-1',
        orgId: 'org-1',
        date: '2026-08-26',
        views: 1,
        uniqueVisitors: 1,
        enrollments: 1,
        completions: 0
      }
    ]);
    vi.mocked(selectCountryDailyAggregates).mockResolvedValue([
      {
        orgId: 'org-2',
        date: '2026-08-26',
        country: 'NG',
        views: 1,
        enrollments: 0
      }
    ]);
    vi.mocked(upsertOrgDailyRows).mockResolvedValue(1);
    vi.mocked(upsertCourseDailyRows).mockResolvedValue(1);
    vi.mocked(upsertCountryDailyRows).mockResolvedValue(1);
  });

  it('invalidates each affected organization after writing rollups', async () => {
    await runAnalyticsRollupDaily({ daysAgo: 1 });

    expect(invalidateOrgStatsForIds).toHaveBeenCalledWith(['org-1', 'org-2']);
  });
});
