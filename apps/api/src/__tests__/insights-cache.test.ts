import { beforeEach, describe, expect, it, vi } from 'vitest';

const redisMocks = vi.hoisted(() => ({
  set: vi.fn(),
  del: vi.fn()
}));

const envMock = vi.hoisted(() => ({ REDIS_URL: 'redis://localhost:6379' as string | undefined }));

vi.mock('@cio/core/config/env', () => ({ env: envMock }));
vi.mock('@cio/core/utils/redis/redis', () => ({
  redis: redisMocks,
  logRedisUnavailableOnce: vi.fn()
}));

vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: vi.fn()
}));

import { getCourseOrganizationId } from '@cio/db/queries/tag';
import {
  INSIGHTS_REFRESH_COOLDOWN_SECONDS,
  INSIGHTS_TTL_SECONDS,
  claimInsightsRefresh,
  insightsKey,
  insightsStructureKey,
  insightsTtlSeconds,
  invalidateInsightsCourseStructure
} from '@cio/core/utils/redis/insights-cache';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const COHORT_ID = '22222222-2222-4222-8222-222222222222';
const COURSE_ID = '33333333-3333-4333-8333-333333333333';
const PROFILE_ID = '44444444-4444-4444-8444-444444444444';
const SPEC_HASH = 'a'.repeat(32);

describe('insights-cache helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMock.REDIS_URL = 'redis://localhost:6379';
    redisMocks.set.mockResolvedValue('OK');
    redisMocks.del.mockResolvedValue(1);
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
  });

  describe('insightsKey', () => {
    it('builds a cache key without specHash', () => {
      expect(insightsKey('query', ORG_ID, 'cohort', COHORT_ID)).toBe(`insights:query:${ORG_ID}:cohort:${COHORT_ID}`);
    });

    it('builds a cache key with specHash appended', () => {
      expect(insightsKey('query', ORG_ID, 'cohort', COHORT_ID, 'hash123')).toBe(
        `insights:query:${ORG_ID}:cohort:${COHORT_ID}:hash123`
      );
    });

    it('builds dashboard and structure keys correctly', () => {
      expect(insightsKey('dashboard', ORG_ID, 'org', ORG_ID)).toBe(`insights:dashboard:${ORG_ID}:org:${ORG_ID}`);
      expect(insightsKey('structure', ORG_ID, 'course', COURSE_ID)).toBe(
        `insights:structure:${ORG_ID}:course:${COURSE_ID}`
      );
    });
  });

  describe('insightsStructureKey', () => {
    it('delegates to insightsKey with structure section and course scope', () => {
      expect(insightsStructureKey(ORG_ID, COURSE_ID)).toBe(`insights:structure:${ORG_ID}:course:${COURSE_ID}`);
    });
  });

  describe('insightsTtlSeconds', () => {
    it('returns org TTL for org scope', () => {
      expect(insightsTtlSeconds('org')).toBe(INSIGHTS_TTL_SECONDS.org);
      expect(insightsTtlSeconds('org')).toBe(60);
    });

    it('returns scope TTL for cohort and course scope', () => {
      expect(insightsTtlSeconds('cohort')).toBe(INSIGHTS_TTL_SECONDS.scope);
      expect(insightsTtlSeconds('cohort')).toBe(30);
      expect(insightsTtlSeconds('course')).toBe(INSIGHTS_TTL_SECONDS.scope);
      expect(insightsTtlSeconds('course')).toBe(30);
    });
  });

  describe('claimInsightsRefresh', () => {
    it('claims the refresh gate using NX and 15s cooldown', async () => {
      const allowed = await claimInsightsRefresh(PROFILE_ID, 'cohort', COHORT_ID, SPEC_HASH);

      expect(allowed).toBe(true);
      expect(redisMocks.set).toHaveBeenCalledWith(
        `insights:refresh:${PROFILE_ID}:cohort:${COHORT_ID}:${SPEC_HASH}`,
        '1',
        {
          NX: true,
          EX: INSIGHTS_REFRESH_COOLDOWN_SECONDS
        }
      );
    });

    it('returns false when another refresh claimed the slot', async () => {
      redisMocks.set.mockResolvedValue(null);

      const allowed = await claimInsightsRefresh(PROFILE_ID, 'cohort', COHORT_ID, SPEC_HASH);

      expect(allowed).toBe(false);
    });

    it('fails open when redis throws', async () => {
      redisMocks.set.mockRejectedValue(new Error('Redis connection lost'));

      const allowed = await claimInsightsRefresh(PROFILE_ID, 'cohort', COHORT_ID, SPEC_HASH);

      expect(allowed).toBe(true);
    });

    it('returns true when Redis is not configured', async () => {
      envMock.REDIS_URL = undefined;

      const allowed = await claimInsightsRefresh(PROFILE_ID, 'cohort', COHORT_ID, SPEC_HASH);

      expect(allowed).toBe(true);
      expect(redisMocks.set).not.toHaveBeenCalled();
    });
  });

  describe('invalidateInsightsCourseStructure', () => {
    it('resolves orgId and deletes the structure key', async () => {
      await invalidateInsightsCourseStructure(COURSE_ID);

      expect(getCourseOrganizationId).toHaveBeenCalledWith(COURSE_ID);
      expect(redisMocks.del).toHaveBeenCalledWith(`insights:structure:${ORG_ID}:course:${COURSE_ID}`);
    });

    it('does nothing when course has no orgId', async () => {
      vi.mocked(getCourseOrganizationId).mockResolvedValue(null);

      await invalidateInsightsCourseStructure(COURSE_ID);

      expect(redisMocks.del).not.toHaveBeenCalled();
    });

    it('does nothing when REDIS_URL is not set', async () => {
      envMock.REDIS_URL = undefined;

      await invalidateInsightsCourseStructure(COURSE_ID);

      expect(getCourseOrganizationId).not.toHaveBeenCalled();
      expect(redisMocks.del).not.toHaveBeenCalled();
    });

    it('catches and suppresses any error without throwing', async () => {
      redisMocks.del.mockRejectedValue(new Error('Redis down'));

      await expect(invalidateInsightsCourseStructure(COURSE_ID)).resolves.toBeUndefined();
    });
  });
});
