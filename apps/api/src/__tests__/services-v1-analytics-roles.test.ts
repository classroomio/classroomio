import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberRoleId: vi.fn()
}));

vi.mock('@cio/db/queries/cohort', () => ({
  getCohortMemberRole: vi.fn(),
  getCohortOrganizationId: vi.fn()
}));

vi.mock('@cio/db/queries/group', () => ({
  isCourseTeamMemberOrOrgAdmin: vi.fn()
}));

vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: vi.fn()
}));

vi.mock('@cio/db/queries/analytics', () => ({
  listAnalyticsScopeCourseIds: vi.fn()
}));

vi.mock('@api/services/analytics/dashboards', () => ({
  getAnalyticsDashboardForScope: vi.fn()
}));

vi.mock('@api/services/analytics/query', () => ({
  runAnalyticsQueryForScope: vi.fn()
}));

vi.mock('@api/services/analytics/plan', () => ({
  resolveAnalyticsRange: vi.fn(async (_orgId: unknown, range: unknown) => range)
}));

import { getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import { getCohortMemberRole, getCohortOrganizationId } from '@cio/db/queries/cohort';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { listAnalyticsScopeCourseIds } from '@cio/db/queries/analytics';
import { getAnalyticsDashboardForScope } from '@api/services/analytics/dashboards';
import { runAnalyticsQueryForScope } from '@api/services/analytics/query';
import { ROLE } from '@cio/utils/constants';
import { ErrorCodes } from '@api/utils/errors';
import { getPublicApiAnalyticsSnapshotService } from '@api/services/v1/analytics';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ORG_ID = '99999999-9999-4999-8999-999999999999';
const COHORT_ID = '22222222-2222-4222-8222-222222222222';
const COURSE_ID = '33333333-3333-4333-8333-333333333333';

const TUTOR_ID = '44444444-4444-4444-8444-444444444444';
const ADMIN_ID = '55555555-5555-5555-8555-555555555555';

const DASHBOARD = {
  scope: {
    type: 'cohort',
    id: COHORT_ID,
    name: 'Cohort',
    description: null,
    studentCount: 1,
    pendingCount: 0,
    cohortCount: 1,
    activeCohortCount: 1,
    studentTarget: null,
    seatsUsed: null,
    seatsNotJoined: null,
    courses: []
  },
  structures: {},
  widgets: [],
  refreshIntervalSeconds: 30
};

describe('v1 analytics per-scope role matrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAnalyticsDashboardForScope).mockResolvedValue(DASHBOARD as never);
    vi.mocked(runAnalyticsQueryForScope).mockResolvedValue({ columns: [], rows: [], total: 0 } as never);
    vi.mocked(listAnalyticsScopeCourseIds).mockResolvedValue([]);
  });

  it('refuses an org tutor with 403 on org scope', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);

    await expect(
      getPublicApiAnalyticsSnapshotService(ORG_ID, TUTOR_ID, { type: 'org', id: ORG_ID }, {})
    ).rejects.toMatchObject({ code: ErrorCodes.ANALYTICS_SCOPE_FORBIDDEN, statusCode: 403 });

    expect(getAnalyticsDashboardForScope).not.toHaveBeenCalled();
  });

  it('refuses a tutor with 403 on a course they do not teach', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);

    await expect(
      getPublicApiAnalyticsSnapshotService(ORG_ID, TUTOR_ID, { type: 'course', id: COURSE_ID }, {})
    ).rejects.toMatchObject({ code: ErrorCodes.ANALYTICS_SCOPE_FORBIDDEN, statusCode: 403 });

    expect(isCourseTeamMemberOrOrgAdmin).toHaveBeenCalledWith(COURSE_ID, TUTOR_ID);
    expect(getAnalyticsDashboardForScope).not.toHaveBeenCalled();
  });

  it('reports another organization’s id with 404', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
    vi.mocked(getCohortOrganizationId).mockResolvedValue(OTHER_ORG_ID);

    await expect(
      getPublicApiAnalyticsSnapshotService(ORG_ID, ADMIN_ID, { type: 'cohort', id: COHORT_ID }, {})
    ).rejects.toMatchObject({ code: ErrorCodes.ANALYTICS_SCOPE_NOT_FOUND, statusCode: 404 });

    expect(getAnalyticsDashboardForScope).not.toHaveBeenCalled();
  });

  it('authorizes an org admin on org scope through the live role', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
    vi.mocked(getAnalyticsDashboardForScope).mockResolvedValue({
      ...DASHBOARD,
      scope: { ...DASHBOARD.scope, type: 'org', id: ORG_ID }
    } as never);

    const snapshot = await getPublicApiAnalyticsSnapshotService(ORG_ID, ADMIN_ID, { type: 'org', id: ORG_ID }, {});

    expect(getOrganizationMemberRoleId).toHaveBeenCalledWith(ORG_ID, ADMIN_ID);
    expect(snapshot.scope.id).toBe(ORG_ID);
  });

  it('rejects a creator who lost their membership with 401', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(null);

    await expect(
      getPublicApiAnalyticsSnapshotService(ORG_ID, TUTOR_ID, { type: 'org', id: ORG_ID }, {})
    ).rejects.toMatchObject({ code: ErrorCodes.UNAUTHORIZED, statusCode: 401 });
  });

  it('authorizes a course-team tutor on course scope', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
    vi.mocked(getAnalyticsDashboardForScope).mockResolvedValue({
      ...DASHBOARD,
      scope: { ...DASHBOARD.scope, type: 'course', id: COURSE_ID }
    } as never);

    const snapshot = await getPublicApiAnalyticsSnapshotService(
      ORG_ID,
      TUTOR_ID,
      { type: 'course', id: COURSE_ID },
      {}
    );

    expect(isCourseTeamMemberOrOrgAdmin).toHaveBeenCalledWith(COURSE_ID, TUTOR_ID);
    expect(getAnalyticsDashboardForScope).toHaveBeenCalled();
    expect(snapshot.scope.id).toBe(COURSE_ID);
  });

  it('authorizes a cohort tutor on cohort scope', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);
    vi.mocked(getCohortOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.TUTOR);

    const snapshot = await getPublicApiAnalyticsSnapshotService(
      ORG_ID,
      TUTOR_ID,
      { type: 'cohort', id: COHORT_ID },
      {}
    );

    expect(getCohortMemberRole).toHaveBeenCalledWith(COHORT_ID, TUTOR_ID);
    expect(getAnalyticsDashboardForScope).toHaveBeenCalled();
    expect(snapshot.scope.id).toBe(COHORT_ID);
  });
});
