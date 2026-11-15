import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberRoleId: vi.fn(),
  getOrganizationMemberIdByOrgAndProfile: vi.fn(),
  getOrganizationMembersByNormalizedEmails: vi.fn()
}));

vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: vi.fn()
}));

vi.mock('@cio/db/queries/group', () => ({
  isCourseTeamMemberOrOrgAdmin: vi.fn()
}));

vi.mock('@api/services/marketing', () => ({
  getCountryBreakdown: vi.fn(),
  getCourseFunnel: vi.fn(),
  getLandingStats: vi.fn(),
  getPopularTypes: vi.fn(),
  getTopCoursesByViews: vi.fn()
}));

const cache = new Map<string, { data: unknown; generatedAt: string }>();

vi.mock('@api/utils/redis/cached-read', () => ({
  cachedRead: vi.fn(async (key: string, _ttl: number, compute: () => Promise<unknown>) => {
    const cached = cache.get(key);
    if (cached) return cached;

    const entry = { data: await compute(), generatedAt: '2026-09-27T10:00:00.000Z' };
    cache.set(key, entry);

    return entry;
  })
}));

import { getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import { getCountryBreakdown } from '@api/services/marketing';
import { getPublicApiMarketingAnalyticsService } from '@api/services/v1/marketing';
import { ROLE } from '@cio/utils/constants';

const ORG_ID = 'org-1';
const ACTOR_ID = 'actor-1';

const rows = (count: number) => Array.from({ length: count }, (_, index) => ({ id: index }));

const marketingQuery = (limit: number) => ({ include: ['countries'], days: 30, limit }) as never;

describe('public API marketing cache and limit', () => {
  beforeEach(() => {
    cache.clear();
    vi.clearAllMocks();
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
    vi.mocked(getCountryBreakdown).mockResolvedValue(rows(20) as never);
  });

  it('serves each caller its own limit from one cached list', async () => {
    const first = await getPublicApiMarketingAnalyticsService(ORG_ID, ACTOR_ID, marketingQuery(2));
    const second = await getPublicApiMarketingAnalyticsService(ORG_ID, ACTOR_ID, marketingQuery(5));

    expect((first.data as Record<string, unknown[]>).countries).toHaveLength(2);
    expect((second.data as Record<string, unknown[]>).countries).toHaveLength(5);
    expect(getCountryBreakdown).toHaveBeenCalledTimes(1);
  });
});
