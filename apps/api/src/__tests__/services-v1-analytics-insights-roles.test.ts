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

vi.mock('@cio/db/queries/insights', () => ({
  listInsightsScopeCourseIds: vi.fn()
}));

vi.mock('@api/services/insights/dashboards', () => ({
  getInsightsDashboardForScope: vi.fn()
}));

vi.mock('@api/services/insights/query', () => ({
  runInsightsQueryForScope: vi.fn()
}));

vi.mock('@api/services/insights/plan', () => ({
  resolveInsightsRange: vi.fn(async (_orgId: unknown, range: unknown) => range)
}));

import { getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import { getCohortMemberRole, getCohortOrganizationId } from '@cio/db/queries/cohort';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { listInsightsScopeCourseIds } from '@cio/db/queries/insights';
import { getInsightsDashboardForScope } from '@api/services/insights/dashboards';
import { runInsightsQueryForScope } from '@api/services/insights/query';
import { ROLE } from '@cio/utils/constants';
import { ErrorCodes } from '@api/utils/errors';
import { getPublicApiInsightsSnapshotService } from '@api/services/v1/analytics/insights';

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

describe('v1 insights per-scope role matrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getInsightsDashboardForScope).mockResolvedValue(DASHBOARD as never);
    vi.mocked(runInsightsQueryForScope).mockResolvedValue({ columns: [], rows: [], total: 0 } as never);
    vi.mocked(listInsightsScopeCourseIds).mockResolvedValue([]);
  });

  it('refuses an org tutor with 403 on org scope', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);

    await expect(
      getPublicApiInsightsSnapshotService(ORG_ID, TUTOR_ID, { scopeType: 'org', scopeId: ORG_ID }, {})
    ).rejects.toMatchObject({ code: ErrorCodes.INSIGHTS_SCOPE_FORBIDDEN, statusCode: 403 });

    expect(getInsightsDashboardForScope).not.toHaveBeenCalled();
  });

  it('refuses a tutor with 403 on a course they do not teach', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);

    await expect(
      getPublicApiInsightsSnapshotService(ORG_ID, TUTOR_ID, { scopeType: 'course', scopeId: COURSE_ID }, {})
    ).rejects.toMatchObject({ code: ErrorCodes.INSIGHTS_SCOPE_FORBIDDEN, statusCode: 403 });

    expect(isCourseTeamMemberOrOrgAdmin).toHaveBeenCalledWith(COURSE_ID, TUTOR_ID);
    expect(getInsightsDashboardForScope).not.toHaveBeenCalled();
  });

  it('reports another organization’s id with 404', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
    vi.mocked(getCohortOrganizationId).mockResolvedValue(OTHER_ORG_ID);

    await expect(
      getPublicApiInsightsSnapshotService(ORG_ID, ADMIN_ID, { scopeType: 'cohort', scopeId: COHORT_ID }, {})
    ).rejects.toMatchObject({ code: ErrorCodes.INSIGHTS_SCOPE_NOT_FOUND, statusCode: 404 });

    expect(getInsightsDashboardForScope).not.toHaveBeenCalled();
  });

  it('authorizes an org admin on org scope through the live role', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
    vi.mocked(getInsightsDashboardForScope).mockResolvedValue({
      ...DASHBOARD,
      scope: { ...DASHBOARD.scope, type: 'org', id: ORG_ID }
    } as never);

    const snapshot = await getPublicApiInsightsSnapshotService(
      ORG_ID,
      ADMIN_ID,
      { scopeType: 'org', scopeId: ORG_ID },
      {}
    );

    expect(getOrganizationMemberRoleId).toHaveBeenCalledWith(ORG_ID, ADMIN_ID);
    expect(snapshot.scope.id).toBe(ORG_ID);
  });

  it('rejects a creator who lost their membership with 401', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(null);

    await expect(
      getPublicApiInsightsSnapshotService(ORG_ID, TUTOR_ID, { scopeType: 'org', scopeId: ORG_ID }, {})
    ).rejects.toMatchObject({ code: ErrorCodes.UNAUTHORIZED, statusCode: 401 });
  });
});
