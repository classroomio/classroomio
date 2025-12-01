import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  CoursesByOrganizationSiteName,
  GetAudienceResponse,
  GetCoursesBySiteNameResponse,
  OrganizationAudience,
  OrganizationTeamMembers
} from '../utils/types';
import type { TGetOrganizations, TUpdateOrganization } from '@cio/utils/validation/organization';
import { currentOrg, orgs } from '$lib/utils/store/org';

import type { GetTeamResponse } from '../utils/types';
import type { UpdateOrganizationRequestType } from './types';
import { ZUpdateOrganization } from '@cio/utils/validation/organization';
import { get } from 'svelte/store';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { snackbar } from '$lib/components/Snackbar/store';
import { t } from '$lib/utils/functions/translations';
import { uploadImage } from '$lib/utils/services/upload';

export interface TOrgUpdateForm {
  name?: string;
  avatar?: string | File | undefined;
}

/**
 * API class for organization operations
 */
class OrgApi extends BaseApiWithErrors {
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

  /**
   * Updates an organization
   * @param orgId Organization ID
   * @param fields Organization update data (name, avatar)
   */
  async update(orgId: string, fields: TOrgUpdateForm) {
    // Validate form data
    const validationData: TUpdateOrganization = {};
    if (fields.name !== undefined) {
      validationData.name = fields.name;
    }

    const result = ZUpdateOrganization.safeParse(validationData);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'organization');
      return;
    }

    this.isLoading = true;
    this.errors = {};
    this.success = false;

    // Handle avatar upload if provided
    let avatarUrl: string | undefined;
    if (fields.avatar instanceof File) {
      avatarUrl = await uploadImage(fields.avatar);
    } else if (typeof fields.avatar === 'string') {
      avatarUrl = fields.avatar;
    }

    // Build update payload
    const updates: TUpdateOrganization = {};
    if (fields.name) {
      updates.name = fields.name;
    }
    if (avatarUrl) {
      updates.avatarUrl = avatarUrl;
    }

    if (Object.keys(updates).length > 0) {
      await this.execute<UpdateOrganizationRequestType>({
        requestFn: () =>
          classroomio.organization[':orgId'].$put({
            param: { orgId },
            // @ts-expect-error - the json type is not inferred correctly
            json: updates
          }),
        logContext: 'updating organization',
        onSuccess: (response) => {
          if (!response.data) {
            return;
          }

          orgs.update((_orgs) =>
            _orgs.map((org) => {
              if (org.id === orgId) {
                return { ...org, ...response.data };
              }

              return org;
            })
          );
          const currentOrgData = get(currentOrg);

          if (currentOrgData.id === orgId) {
            currentOrg.update((org) => ({
              ...org,
              ...response.data
            }));
          }

          snackbar.success('snackbar.course_settings.success.update_successful');
          this.success = true;
          this.errors = {};
        },
        onError: (error) => {
          console.error('Error updating organization:', error);

          const message = error instanceof Error ? error.message : `${error}`;
          this.errors.general = message;

          snackbar.error(`${t.get('snackbar.update_failed')}: ${message}`);
        }
      });
    }

    this.isLoading = false;
  }
}

export const orgApi = new OrgApi();
