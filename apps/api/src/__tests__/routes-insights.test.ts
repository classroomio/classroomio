import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';

const authState = vi.hoisted(() => ({ roles: { 'org-own': 1 } as Record<string, number> }));

vi.mock('@api/middlewares/auth', () => ({
  authMiddleware: async (c: Context, next: Next) => {
    c.set('user', { id: 'user-1' });
    c.set('orgRoles', authState.roles);
    await next();
  }
}));

vi.mock('@api/services/insights', () => ({
  runInsightsQueryForActor: vi.fn(),
  exportInsightsQueryForActor: vi.fn(),
  exportInsightsStudentsForActor: vi.fn(),
  getInsightsDashboardForActor: vi.fn(),
  updateInsightsSettings: vi.fn()
}));

import { ROLE } from '@cio/utils/constants';
import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  exportInsightsStudentsForActor,
  exportInsightsQueryForActor,
  getInsightsDashboardForActor,
  runInsightsQueryForActor,
  updateInsightsSettings
} from '@api/services/insights';
import { insightsRouter } from '@api/routes/insights';

const OWN_ORG = 'org-own';
const OTHER_ORG = '99999999-9999-4999-8999-999999999999';
const COHORT_ID = '11111111-1111-4111-8111-111111111111';

const VALID_QUERY_BODY = {
  scope: {
    type: 'cohort',
    id: COHORT_ID
  },
  spec: {
    source: 'student',
    measures: [{ metric: 'rows', agg: 'count' }]
  }
};

const VALID_EXPORT_BODY = {
  scope: {
    type: 'cohort',
    id: COHORT_ID
  },
  spec: {
    source: 'student',
    measures: [{ metric: 'rows', agg: 'count' }],
    limit: 100
  }
};

const VALID_STUDENT_EXPORT_BODY = {
  scope: {
    type: 'cohort',
    id: COHORT_ID
  },
  studentSpec: {
    source: 'student',
    dimensions: ['student'],
    measures: [{ metric: 'name', agg: 'value' }],
    limit: 100
  }
};

const MOCK_QUERY_RESULT = {
  columns: [{ key: 'enrolled_count', role: 'measure', valueType: 'integer' }],
  rows: [{ enrolled_count: 5 }],
  total: 1,
  generatedAt: '2026-01-01T00:00:00.000Z',
  cached: false,
  refreshThrottled: false
};

const MOCK_DASHBOARD_RESULT = {
  scope: {
    type: 'cohort',
    id: COHORT_ID,
    name: 'Cohort 1',
    studentCount: 5,
    pendingCount: 0,
    courses: []
  },
  structures: {},
  widgets: [],
  refreshIntervalSeconds: 30
};

describe('insights routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.roles = { [OWN_ORG]: ROLE.ADMIN };
  });

  describe('POST /query', () => {
    it('sets Cache-Control: private, no-store and returns 200 with data', async () => {
      vi.mocked(runInsightsQueryForActor).mockResolvedValueOnce(MOCK_QUERY_RESULT as any);

      const response = await insightsRouter.request('/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cio-org-id': OWN_ORG
        },
        body: JSON.stringify(VALID_QUERY_BODY)
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('private, no-store');

      const body = await response.json();
      expect(body).toEqual({
        success: true,
        data: MOCK_QUERY_RESULT
      });

      expect(runInsightsQueryForActor).toHaveBeenCalledWith(
        {
          profileId: 'user-1',
          orgId: OWN_ORG,
          orgRoles: { 'org-own': 1 }
        },
        expect.objectContaining({
          scope: { type: 'cohort', id: COHORT_ID }
        })
      );
    });

    it('rejects request with missing cio-org-id header with 400', async () => {
      const response = await insightsRouter.request('/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(VALID_QUERY_BODY)
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.code).toBe('ORG_ID_REQUIRED');
      expect(runInsightsQueryForActor).not.toHaveBeenCalled();
    });

    it('rejects request for org the user does not belong to with 403', async () => {
      const response = await insightsRouter.request('/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cio-org-id': OTHER_ORG
        },
        body: JSON.stringify(VALID_QUERY_BODY)
      });

      expect(response.status).toBe(403);
      expect(runInsightsQueryForActor).not.toHaveBeenCalled();
    });

    it('always passes the verified org from header to the service actor', async () => {
      vi.mocked(runInsightsQueryForActor).mockResolvedValueOnce(MOCK_QUERY_RESULT as any);

      const response = await insightsRouter.request('/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cio-org-id': OWN_ORG
        },
        body: JSON.stringify({
          ...VALID_QUERY_BODY,
          scope: { type: 'org', id: OTHER_ORG }
        })
      });

      expect(response.status).toBe(200);
      expect(runInsightsQueryForActor).toHaveBeenCalledWith(
        expect.objectContaining({ orgId: OWN_ORG }),
        expect.anything()
      );
    });

    it('returns error when service throws AppError', async () => {
      vi.mocked(runInsightsQueryForActor).mockRejectedValueOnce(
        new AppError('Unauthorized', ErrorCodes.UNAUTHORIZED, 403)
      );

      const response = await insightsRouter.request('/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cio-org-id': OWN_ORG
        },
        body: JSON.stringify(VALID_QUERY_BODY)
      });

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.code).toBe(ErrorCodes.UNAUTHORIZED);
    });

    it('returns 400 when an unknown range is requested', async () => {
      const response = await insightsRouter.request('/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cio-org-id': OWN_ORG
        },
        body: JSON.stringify({
          ...VALID_QUERY_BODY,
          spec: {
            ...VALID_QUERY_BODY.spec,
            range: '1y'
          }
        })
      });

      expect(response.status).toBe(400);
      expect(runInsightsQueryForActor).not.toHaveBeenCalled();
    });
  });

  describe('POST /export', () => {
    it('sets Cache-Control: private, no-store and returns 200 with data', async () => {
      vi.mocked(exportInsightsQueryForActor).mockResolvedValueOnce(MOCK_QUERY_RESULT as any);

      const response = await insightsRouter.request('/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cio-org-id': OWN_ORG
        },
        body: JSON.stringify(VALID_EXPORT_BODY)
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('private, no-store');

      const body = await response.json();
      expect(body).toEqual({
        success: true,
        data: MOCK_QUERY_RESULT
      });

      expect(exportInsightsQueryForActor).toHaveBeenCalledWith(
        {
          profileId: 'user-1',
          orgId: OWN_ORG,
          orgRoles: { 'org-own': 1 }
        },
        expect.objectContaining({
          scope: { type: 'cohort', id: COHORT_ID }
        })
      );
    });

    it('rejects request with missing cio-org-id header with 400', async () => {
      const response = await insightsRouter.request('/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(VALID_EXPORT_BODY)
      });

      expect(response.status).toBe(400);
      expect(exportInsightsQueryForActor).not.toHaveBeenCalled();
    });

    it('rejects request for org the user does not belong to with 403', async () => {
      const response = await insightsRouter.request('/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cio-org-id': OTHER_ORG
        },
        body: JSON.stringify(VALID_EXPORT_BODY)
      });

      expect(response.status).toBe(403);
      expect(exportInsightsQueryForActor).not.toHaveBeenCalled();
    });
  });

  describe('POST /export/students', () => {
    it('returns the student rows and compact exercise cells', async () => {
      const exportResult = {
        students: MOCK_QUERY_RESULT,
        cells: {},
        studentsTruncated: false,
        exercisesTruncated: false
      };
      vi.mocked(exportInsightsStudentsForActor).mockResolvedValueOnce(exportResult as any);

      const response = await insightsRouter.request('/export/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cio-org-id': OWN_ORG
        },
        body: JSON.stringify(VALID_STUDENT_EXPORT_BODY)
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('private, no-store');

      const body = await response.json();
      expect(body).toEqual({ success: true, data: exportResult });
      expect(exportInsightsStudentsForActor).toHaveBeenCalledWith(
        {
          profileId: 'user-1',
          orgId: OWN_ORG,
          orgRoles: { [OWN_ORG]: ROLE.ADMIN }
        },
        expect.objectContaining({
          scope: { type: 'cohort', id: COHORT_ID }
        })
      );
    });

    it('rejects a request with missing cio-org-id header with 400', async () => {
      const response = await insightsRouter.request('/export/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(VALID_STUDENT_EXPORT_BODY)
      });

      expect(response.status).toBe(400);
      expect(exportInsightsStudentsForActor).not.toHaveBeenCalled();
    });
  });

  describe('GET /dashboards/:scopeType/:scopeId', () => {
    it('sets Cache-Control: private, no-store and returns 200 with dashboard data', async () => {
      vi.mocked(getInsightsDashboardForActor).mockResolvedValueOnce(MOCK_DASHBOARD_RESULT as any);

      const response = await insightsRouter.request(`/dashboards/cohort/${COHORT_ID}`, {
        method: 'GET',
        headers: {
          'cio-org-id': OWN_ORG
        }
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('private, no-store');

      const body = await response.json();
      expect(body).toEqual({
        success: true,
        data: MOCK_DASHBOARD_RESULT
      });

      expect(getInsightsDashboardForActor).toHaveBeenCalledWith(
        {
          profileId: 'user-1',
          orgId: OWN_ORG,
          orgRoles: { 'org-own': 1 }
        },
        {
          scopeType: 'cohort',
          scopeId: COHORT_ID
        }
      );
    });

    it('forwards the refresh route to the dashboard service', async () => {
      vi.mocked(getInsightsDashboardForActor).mockResolvedValueOnce(MOCK_DASHBOARD_RESULT as any);

      const response = await insightsRouter.request('/dashboards-refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cio-org-id': OWN_ORG
        },
        body: JSON.stringify({ type: 'cohort', id: COHORT_ID })
      });

      expect(response.status).toBe(200);
      expect(getInsightsDashboardForActor).toHaveBeenCalledWith(
        expect.anything(),
        { scopeType: 'cohort', scopeId: COHORT_ID },
        { refresh: true }
      );
    });

    it('rejects invalid scope type with 400', async () => {
      const response = await insightsRouter.request(`/dashboards/invalid-scope/${COHORT_ID}`, {
        method: 'GET',
        headers: {
          'cio-org-id': OWN_ORG
        }
      });

      expect(response.status).toBe(400);
      expect(getInsightsDashboardForActor).not.toHaveBeenCalled();
    });

    it('rejects non-uuid scope id with 400', async () => {
      const response = await insightsRouter.request('/dashboards/cohort/not-a-uuid', {
        method: 'GET',
        headers: {
          'cio-org-id': OWN_ORG
        }
      });

      expect(response.status).toBe(400);
      expect(getInsightsDashboardForActor).not.toHaveBeenCalled();
    });

    it('rejects missing cio-org-id header with 400', async () => {
      const response = await insightsRouter.request(`/dashboards/cohort/${COHORT_ID}`, {
        method: 'GET'
      });

      expect(response.status).toBe(400);
      expect(getInsightsDashboardForActor).not.toHaveBeenCalled();
    });

    it('rejects unauthorized org with 403', async () => {
      const response = await insightsRouter.request(`/dashboards/cohort/${COHORT_ID}`, {
        method: 'GET',
        headers: {
          'cio-org-id': OTHER_ORG
        }
      });

      expect(response.status).toBe(403);
      expect(getInsightsDashboardForActor).not.toHaveBeenCalled();
    });
  });

  describe('PUT /settings', () => {
    it('saves the student target for an org admin', async () => {
      vi.mocked(updateInsightsSettings).mockResolvedValueOnce({ studentTarget: 500 });

      const response = await insightsRouter.request('/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'cio-org-id': OWN_ORG
        },
        body: JSON.stringify({ studentTarget: 500 })
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('private, no-store');
      expect(await response.json()).toEqual({ success: true, data: { studentTarget: 500 } });
      expect(updateInsightsSettings).toHaveBeenCalledWith(OWN_ORG, { studentTarget: 500 });
    });

    it('clears the target when the body sends null', async () => {
      vi.mocked(updateInsightsSettings).mockResolvedValueOnce({ studentTarget: null });

      const response = await insightsRouter.request('/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'cio-org-id': OWN_ORG
        },
        body: JSON.stringify({ studentTarget: null })
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true, data: { studentTarget: null } });
      expect(updateInsightsSettings).toHaveBeenCalledWith(OWN_ORG, { studentTarget: null });
    });

    it('rejects a tutor with 403', async () => {
      authState.roles = { [OWN_ORG]: ROLE.TUTOR };

      const response = await insightsRouter.request('/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'cio-org-id': OWN_ORG
        },
        body: JSON.stringify({ studentTarget: 500 })
      });

      expect(response.status).toBe(403);
      expect(updateInsightsSettings).not.toHaveBeenCalled();
    });

    it.each([0, -1, 1_000_001])('rejects the out-of-range target %i with 400', async (studentTarget) => {
      const response = await insightsRouter.request('/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'cio-org-id': OWN_ORG
        },
        body: JSON.stringify({ studentTarget })
      });

      expect(response.status).toBe(400);
      expect(updateInsightsSettings).not.toHaveBeenCalled();
    });

    it('rejects a missing org header with 400', async () => {
      const response = await insightsRouter.request('/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentTarget: 500 })
      });

      expect(response.status).toBe(400);
      expect(updateInsightsSettings).not.toHaveBeenCalled();
    });
  });
});
