import { BaseApi, classroomio } from '$lib/utils/services/api';
import type {
  CoursesByOrganizationSiteName,
  GetAudienceResponse,
  GetCoursesBySiteNameResponse,
  OrganizationAudience,
  OrganizationTeamMembers
} from '../utils/types';

import type { GetTeamResponse } from '../utils/types';
import type { TGetOrganizations } from '@cio/utils/validation/organization';
import { orgs } from '$lib/utils/store/org';

/**
 * API class for organization operations
 */
class OrgApi extends BaseApi {
  teamMembers = $state<OrganizationTeamMembers>([]);
  audience = $state<OrganizationAudience>([]);
  orgSiteCourses = $state<CoursesByOrganizationSiteName>([]);

  /**
   * Gets organization team members (non-students)
   * @param orgId Organization ID
   * @returns Team members array
   */
  async getOrgTeam(orgId: string) {
    return this.execute<GetTeamResponse>({
      requestFn: () =>
        classroomio.organization[':orgId'].team.$get({
          param: { orgId }
        }),
      logContext: 'fetching organization team',
      onSuccess: (response) => {
        this.teamMembers = response.data;
      }
    });
  }

  /**
   * Gets organization audience (students)
   * @param orgId Organization ID
   * @returns Audience array
   */
  async getOrgAudience(orgId: string) {
    return this.execute<GetAudienceResponse>({
      requestFn: () =>
        classroomio.organization[':orgId'].audience.$get({
          param: { orgId }
        }),
      logContext: 'fetching organization audience',
      onSuccess: (response) => {
        this.audience = response.data;
      }
    });
  }

  /**
   * Gets courses by organization siteName
   * @param siteName Organization site name
   * @returns Courses array
   */
  async getCourseBySiteName(siteName: string) {
    return this.execute<GetCoursesBySiteNameResponse>({
      requestFn: () =>
        classroomio.organization.courses.$get({
          query: { siteName }
        }),
      logContext: 'fetching courses',
      onSuccess: (response) => {
        this.orgSiteCourses = response.data;
      }
    });
  }

  /**
   * Gets current organization by siteName or custom domain
   * @param siteName Organization site name or custom domain
   * @param isCustomDomain Whether the siteName is a custom domain
   * @returns Organization data or null if not found
   */
  async getOrgBySiteName(siteName: string, isCustomDomain = false) {
    const query: TGetOrganizations = { siteName };
    if (isCustomDomain) {
      query.customDomain = siteName;
      query.isCustomDomainVerified = true;
    }

    const result = await this.execute<typeof classroomio.organization.$get>({
      requestFn: () =>
        classroomio.organization.$get({
          query
        }),
      logContext: 'fetching organization',
      onSuccess: (response) => {
        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
          return;
        }

        orgs.set(response.data);
      }
    });

    return result;
  }
}

export const orgApi = new OrgApi();
