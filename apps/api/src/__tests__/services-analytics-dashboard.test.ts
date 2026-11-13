import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/core/utils/redis/analytics-cache', () => ({
  analyticsKey: vi.fn((section, orgId, scopeType, scopeId) => `analytics:${section}:${orgId}:${scopeType}:${scopeId}`),
  analyticsTtlSeconds: vi.fn((scopeType) => (scopeType === 'org' ? 60 : 30))
}));

vi.mock('@cio/db/queries/analytics', () => ({
  getAnalyticsScopeSummary: vi.fn().mockResolvedValue({
    name: 'Test Scope',
    studentCount: 10,
    pendingCount: 2,
    courses: [{ id: 'course-1', title: 'Course 1', isGrouped: true, hasPassRequired: false }]
  })
}));

vi.mock('@api/services/analytics/authorize', () => ({
  resolveAuthorizedScope: vi.fn()
}));

vi.mock('@api/services/analytics/structure', () => ({
  getAnalyticsCourseStructure: vi.fn().mockImplementation(async (orgId, courseId) => ({
    courseId,
    isGrouped: true,
    sections: [],
    items: []
  }))
}));

vi.mock('@api/utils/redis/cached-read', () => ({
  cachedRead: vi.fn()
}));

import { cachedRead } from '@api/utils/redis/cached-read';
import { resolveAuthorizedScope } from '@api/services/analytics/authorize';
import { getAnalyticsDashboardForActor } from '@api/services/analytics/dashboards';
import { getAnalyticsCourseStructure } from '@api/services/analytics/structure';
import type { AnalyticsActor } from '@api/services/analytics/types';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const COHORT_ID = '22222222-2222-4222-8222-222222222222';
const COURSE_ID = '33333333-3333-4333-8333-333333333333';

const actor: AnalyticsActor = {
  profileId: '44444444-4444-4444-8444-444444444444',
  orgId: ORG_ID,
  orgRoles: { [ORG_ID]: 2 }
};

describe('getAnalyticsDashboardForActor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cachedRead).mockImplementation(async (key, ttl, compute) => {
      const data = await compute();

      return { data, generatedAt: new Date().toISOString() };
    });
  });

  it('loads dashboard for cohort scope with structures and preset widgets', async () => {
    vi.mocked(resolveAuthorizedScope).mockResolvedValue({
      orgId: ORG_ID,
      type: 'cohort',
      id: COHORT_ID,
      courseIds: [COURSE_ID]
    });

    const dashboard = await getAnalyticsDashboardForActor(actor, {
      scopeType: 'cohort',
      scopeId: COHORT_ID
    });

    expect(dashboard.scope.name).toBe('Test Scope');
    expect(dashboard.scope.type).toBe('cohort');
    expect(dashboard.scope.id).toBe(COHORT_ID);
    expect(dashboard.structures[COURSE_ID]).toBeDefined();
    expect(getAnalyticsCourseStructure).toHaveBeenCalledWith(ORG_ID, COURSE_ID);
    expect(dashboard.widgets.length).toBeGreaterThan(0);
    expect(dashboard.refreshIntervalSeconds).toBe(30);
  });

  it('loads dashboard for org scope without course structures', async () => {
    vi.mocked(resolveAuthorizedScope).mockResolvedValue({
      orgId: ORG_ID,
      type: 'org',
      id: ORG_ID,
      courseIds: [COURSE_ID]
    });

    const dashboard = await getAnalyticsDashboardForActor(actor, {
      scopeType: 'org',
      scopeId: ORG_ID
    });

    expect(dashboard.scope.type).toBe('org');
    expect(dashboard.structures).toEqual({});
    expect(getAnalyticsCourseStructure).not.toHaveBeenCalled();
    expect(dashboard.widgets.length).toBeGreaterThan(0);
    expect(dashboard.refreshIntervalSeconds).toBe(60);
  });

  it('forwards a manual refresh to the cached summary', async () => {
    vi.mocked(resolveAuthorizedScope).mockResolvedValue({
      orgId: ORG_ID,
      type: 'cohort',
      id: COHORT_ID,
      courseIds: [COURSE_ID]
    });

    await getAnalyticsDashboardForActor(actor, { scopeType: 'cohort', scopeId: COHORT_ID }, { refresh: true });

    expect(cachedRead).toHaveBeenCalledWith(expect.any(String), 30, expect.any(Function), { refresh: true });
  });

  it('loads dashboard for course scope with its structure and course presets', async () => {
    vi.mocked(resolveAuthorizedScope).mockResolvedValue({
      orgId: ORG_ID,
      type: 'course',
      id: COURSE_ID,
      courseIds: [COURSE_ID]
    });

    const dashboard = await getAnalyticsDashboardForActor(actor, {
      scopeType: 'course',
      scopeId: COURSE_ID
    });

    expect(dashboard.scope.type).toBe('course');
    expect(dashboard.scope.id).toBe(COURSE_ID);
    expect(dashboard.structures[COURSE_ID]).toBeDefined();
    expect(getAnalyticsCourseStructure).toHaveBeenCalledWith(ORG_ID, COURSE_ID);
    expect(dashboard.widgets.map((widget) => widget.id)).toContain('cohorts_in_course');
    expect(dashboard.widgets.map((widget) => widget.id)).toContain('students');
    expect(dashboard.widgets.every((widget) => widget.spec.source !== 'overdue_item')).toBe(true);
    expect(dashboard.refreshIntervalSeconds).toBe(30);
  });
});
