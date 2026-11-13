import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberRoleId: vi.fn(),
  getOrganizationMemberIdByOrgAndProfile: vi.fn(),
  getOrganizationMembersByNormalizedEmails: vi.fn()
}));

vi.mock('@api/services/course/compliance', () => ({
  getOrgComplianceOverview: vi.fn()
}));

vi.mock('@api/utils/redis/cached-read', () => ({
  cachedRead: vi.fn(async (_key: string, _ttl: number, compute: () => Promise<unknown>) => ({
    data: await compute(),
    generatedAt: '2026-09-27T10:00:00.000Z'
  }))
}));

import { getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import { getOrgComplianceOverview } from '@api/services/course/compliance';
import {
  getPublicApiComplianceAnalyticsService,
  listPublicApiComplianceStudentsService
} from '@api/services/v1/compliance';
import { cachedRead } from '@api/utils/redis/cached-read';
import { ROLE } from '@cio/utils/constants';

const ORG_ID = 'org-1';
const ACTOR_ID = 'actor-1';
const COURSE_ID = 'course-1';

const complianceOverview = {
  summary: { totalLearners: 2, totalCourses: 1, counts: { compliant: 1 } },
  courses: [{ courseId: COURSE_ID, courseTitle: 'Safety', learnerCount: 2, counts: { compliant: 1 } }],
  learners: [{ groupMemberId: 'gm-1' }, { groupMemberId: 'gm-2' }, { groupMemberId: 'gm-3' }]
};

describe('public API compliance services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
    vi.mocked(getOrgComplianceOverview).mockResolvedValue(complianceOverview as never);
  });

  describe('GET /analytics/compliance', () => {
    it('returns the summary and per-course counts with student naming and no student list', async () => {
      const result = await getPublicApiComplianceAnalyticsService(ORG_ID, ACTOR_ID);

      expect(result).toEqual({
        data: {
          summary: { totalStudents: 2, totalCourses: 1, counts: { compliant: 1 } },
          courses: [{ courseId: COURSE_ID, courseTitle: 'Safety', studentCount: 2, counts: { compliant: 1 } }]
        },
        meta: { generatedAt: '2026-09-27T10:00:00.000Z' }
      });
      expect(cachedRead).toHaveBeenCalledWith('public-api:analytics:compliance:org-1', 600, expect.any(Function));
    });

    it.each([
      ['an org tutor', ROLE.TUTOR],
      ['a student', ROLE.STUDENT],
      ['an actor with no active membership', null]
    ])('rejects %s with 403, matching orgAdminMiddleware', async (_label, roleId) => {
      vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(roleId);

      await expect(getPublicApiComplianceAnalyticsService(ORG_ID, ACTOR_ID)).rejects.toMatchObject({
        statusCode: 403
      });
      expect(getOrgComplianceOverview).not.toHaveBeenCalled();
    });

    it('rejects a key without an actor with 401', async () => {
      await expect(getPublicApiComplianceAnalyticsService(ORG_ID, null)).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe('GET /analytics/compliance/students', () => {
    it('rejects an org tutor with 403', async () => {
      vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);

      await expect(
        listPublicApiComplianceStudentsService(ORG_ID, ACTOR_ID, { page: 1, limit: 20 })
      ).rejects.toMatchObject({ statusCode: 403 });
      expect(getOrgComplianceOverview).not.toHaveBeenCalled();
    });

    it('paginates from the same cache entry as the compliance report', async () => {
      const result = await listPublicApiComplianceStudentsService(ORG_ID, ACTOR_ID, { page: 2, limit: 2 });

      expect(result.items).toEqual([{ groupMemberId: 'gm-3' }]);
      expect(result.pagination).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
      expect(cachedRead).toHaveBeenCalledWith('public-api:analytics:compliance:org-1', 600, expect.any(Function));
    });
  });
});
