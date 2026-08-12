import { beforeEach, describe, expect, it, vi } from 'vitest';

const redisMocks = vi.hoisted(() => ({
  mGet: vi.fn(),
  setEx: vi.fn(),
  incr: vi.fn(),
  del: vi.fn()
}));

vi.mock('@cio/core/config/env', () => ({
  env: { REDIS_URL: 'redis://localhost:6379' }
}));

vi.mock('@cio/core/utils/redis/redis', () => ({
  redis: redisMocks,
  logRedisUnavailableOnce: vi.fn()
}));

vi.mock('@cio/db/queries/dash', () => ({
  getDashOrgStats: vi.fn(),
  getCourseStats: vi.fn(),
  getRecentCertifications: vi.fn(),
  getTotalCertificatesIssued: vi.fn(),
  getOrgStudentLoginsByDayOfWeek: vi.fn(),
  getUserLoginStreak: vi.fn()
}));

vi.mock('@cio/db/queries', () => ({
  getOrgIdBySiteName: vi.fn()
}));

import {
  getCourseStats,
  getDashOrgStats,
  getRecentCertifications,
  getTotalCertificatesIssued
} from '@cio/db/queries/dash';
import { getOrganisationAnalytics } from '@api/services/dash';

const sampleAnalytics = {
  totalCertificates: 2,
  numberOfCourses: 8,
  totalStudents: 10,
  topCourses: [],
  recentCertifications: []
};

describe('getOrganisationAnalytics cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisMocks.mGet.mockResolvedValue([null, null]);
    vi.mocked(getDashOrgStats).mockResolvedValue([{ orgId: 'org-1', noOfCourses: 8, enrolledStudents: 10 }]);
    vi.mocked(getCourseStats).mockResolvedValue([]);
    vi.mocked(getRecentCertifications).mockResolvedValue([]);
    vi.mocked(getTotalCertificatesIssued).mockResolvedValue([{ count: 2 }]);
  });

  it('computes from the database on cache miss and writes the payload', async () => {
    const result = await getOrganisationAnalytics('org-1');

    expect(result.numberOfCourses).toBe(8);
    expect(getDashOrgStats).toHaveBeenCalledTimes(1);
    expect(redisMocks.setEx).toHaveBeenCalledWith(
      'dash:stats:v1:org-1',
      300,
      JSON.stringify({ version: '0', data: sampleAnalytics })
    );
  });

  it('returns cached payload when version matches', async () => {
    redisMocks.mGet.mockResolvedValue([
      '3',
      JSON.stringify({ version: '3', data: { ...sampleAnalytics, numberOfCourses: 5 } })
    ]);

    const result = await getOrganisationAnalytics('org-1');

    expect(result.numberOfCourses).toBe(5);
    expect(getDashOrgStats).not.toHaveBeenCalled();
    expect(redisMocks.setEx).not.toHaveBeenCalled();
  });

  it('treats a version mismatch as a cache miss', async () => {
    redisMocks.mGet.mockResolvedValue([
      '4',
      JSON.stringify({ version: '3', data: { ...sampleAnalytics, numberOfCourses: 5 } })
    ]);

    const result = await getOrganisationAnalytics('org-1');

    expect(result.numberOfCourses).toBe(8);
    expect(getDashOrgStats).toHaveBeenCalledTimes(1);
  });

  it('skips cache read when bustCache is true but still writes', async () => {
    redisMocks.mGet.mockResolvedValue([
      '1',
      JSON.stringify({ version: '1', data: { ...sampleAnalytics, numberOfCourses: 5 } })
    ]);

    const result = await getOrganisationAnalytics('org-1', undefined, true);

    expect(result.numberOfCourses).toBe(8);
    expect(getDashOrgStats).toHaveBeenCalledTimes(1);
    expect(redisMocks.setEx).toHaveBeenCalled();
  });

  it('falls back to the database when redis read fails', async () => {
    redisMocks.mGet.mockRejectedValue(new Error('redis down'));

    const result = await getOrganisationAnalytics('org-1');

    expect(result.numberOfCourses).toBe(8);
    expect(getDashOrgStats).toHaveBeenCalledTimes(1);
  });

  it('returns live data when redis write fails', async () => {
    redisMocks.setEx.mockRejectedValue(new Error('redis down'));

    const result = await getOrganisationAnalytics('org-1');

    expect(result.numberOfCourses).toBe(8);
  });

  it('treats malformed cache payload as a miss', async () => {
    redisMocks.mGet.mockResolvedValue(['1', '{not-json']);

    const result = await getOrganisationAnalytics('org-1');

    expect(result.numberOfCourses).toBe(8);
    expect(getDashOrgStats).toHaveBeenCalledTimes(1);
  });
});
