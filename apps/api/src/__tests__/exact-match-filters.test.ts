import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/organization', () => ({
  getOrgAudience: vi.fn(),
  getOrganizationCourses: vi.fn()
}));

vi.mock('@api/services/course/people', () => ({
  listPaginatedCourseMembers: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberRoleId: vi.fn()
}));

vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: vi.fn()
}));

vi.mock('@cio/db/queries/group', () => ({
  isCourseTeamMemberOrOrgAdmin: vi.fn()
}));

import { ROLE } from '@cio/utils/constants';
import { buildAudienceWhereClause } from '@cio/db/queries/organization/audience';
import { getOrgAudience, getOrganizationCourses } from '@api/services/organization';
import { listPaginatedCourseMembers } from '@api/services/course/people';
import { getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { listAudienceService } from '@api/services/v1/audience';
import { listCoursesService } from '@api/services/v1/courses/course';
import { listCourseMembersService } from '@api/services/v1/courses/members';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const COURSE_ID = '22222222-2222-4222-8222-222222222222';
const ACTOR_ID = '33333333-3333-4333-8333-333333333333';

function extractSqlText(sqlObj: any): string {
  if (!sqlObj) return '';
  if (typeof sqlObj === 'string') return sqlObj;
  if (Array.isArray(sqlObj)) return sqlObj.map(extractSqlText).join(' ');
  if (sqlObj.value !== undefined) {
    return typeof sqlObj.value === 'object' ? extractSqlText(sqlObj.value) : String(sqlObj.value);
  }
  if (sqlObj.queryChunks) {
    return sqlObj.queryChunks.map(extractSqlText).join(' ');
  }
  if (sqlObj.name) return String(sqlObj.name);
  return '';
}

describe('Exact-match filters (R4.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
  });

  describe('Audience exact email filter', () => {
    it('buildAudienceWhereClause adds lowercase profile/member email conditions when email is provided', () => {
      const { whereClause } = buildAudienceWhereClause(ORG_ID, {
        email: '  Learner@Example.Com  '
      });

      const sqlText = extractSqlText(whereClause);
      expect(sqlText).toContain('lower');
      expect(sqlText).toContain('learner@example.com');
    });

    it('listAudienceService forwards email filter to getOrgAudience', async () => {
      vi.mocked(getOrgAudience).mockResolvedValue({
        items: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        query: {
          page: 1,
          limit: 20,
          sortBy: 'createdAt',
          sortOrder: 'desc',
          status: 'ACTIVE',
          excludeRecentJoiners: true
        }
      });

      const query = {
        page: 1,
        limit: 20,
        email: 'learner@example.com',
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
        status: 'ACTIVE' as const,
        excludeRecentJoiners: false
      };

      await listAudienceService(ORG_ID, ACTOR_ID, query);

      expect(getOrgAudience).toHaveBeenCalledWith(ORG_ID, query);
    });
  });

  describe('Courses exact slug and title filters', () => {
    it('listCoursesService forwards slug and title filters to getOrganizationCourses unchanged', async () => {
      vi.mocked(getOrganizationCourses).mockResolvedValue({
        role: ROLE.ADMIN,
        courses: []
      } as never);

      const query = {
        page: 1,
        limit: 20,
        slug: 'intro-to-typescript',
        title: 'Intro to TypeScript'
      };

      await listCoursesService(ORG_ID, ACTOR_ID, query);

      expect(getOrganizationCourses).toHaveBeenCalledWith(ORG_ID, ACTOR_ID, ROLE.ADMIN, query);
    });
  });

  describe('Course members exact email filter', () => {
    it('listCourseMembersService forwards email filter to listPaginatedCourseMembers', async () => {
      vi.mocked(listPaginatedCourseMembers).mockResolvedValue({
        items: [],
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      } as never);

      const query = {
        page: 1,
        limit: 20,
        email: 'student@example.com'
      };

      await listCourseMembersService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID }, query);

      expect(listPaginatedCourseMembers).toHaveBeenCalledWith(COURSE_ID, query);
    });
  });
});
