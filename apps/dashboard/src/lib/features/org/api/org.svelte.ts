import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  CoursesByOrganizationSiteName,
  DeleteTeamResponse,
  GetAudienceResponse,
  GetCoursesBySiteNameResponse,
  InviteTeamResponse,
  OrganizationAudience,
  OrganizationTeamMembers
} from '../utils/types';
import type { TCreateOrganization, TGetOrganizations, TUpdateOrganization } from '@cio/utils/validation/organization';
import { ZCreateOrganization, ZUpdateOrganization } from '@cio/utils/validation/organization';
import { currentOrg, orgs } from '$lib/utils/store/org';

import type { AccountOrg } from '$lib/features/app/types';
import type { GetTeamResponse } from '../utils/types';
import { ROLE } from '@cio/utils/constants';
import { ROLE_LABEL } from '$lib/utils/constants/roles';
import type { UpdateOrganizationRequestType } from './types';
import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { resolve } from '$app/paths';
import { snackbar } from '$lib/components/Snackbar/store';
import { t } from '$lib/utils/functions/translations';
import { uploadImage } from '$lib/utils/services/upload';

export interface TOrgUpdateForm {
  name?: string;
  avatar?: string | File | undefined;
  theme?: string;
  landingpage?: AccountOrg['landingpage'];
  siteName?: string;
  customDomain?: string | null;
  isCustomDomainVerified?: boolean;
  customization?: AccountOrg['customization'];
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
        // Map API response to include role and isAdmin directly in the API layer
        const mappedTeam = response.data.map((member) => ({
          ...member,
          role: ROLE_LABEL[member.roleId] || '',
          isAdmin: member.roleId === ROLE.ADMIN,
          verified: member.verified ?? false
        }));

        // Update both API state and store
        this.teamMembers = mappedTeam;
      }
    });
  }

  /**
   * Gets organization audience (students)
   * @param orgId Organization ID
   * @returns Audience array
   */
  async getOrgAudience(orgId?: string) {
    if (!orgId) return;

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
   * Creates a new organization with the current user as owner
   * @param fields Organization creation data (name, siteName)
   */
  async create(fields: TCreateOrganization) {
    const result = ZCreateOrganization.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'organization');
      return;
    }

    await this.execute<typeof classroomio.organization.$post>({
      requestFn: () =>
        classroomio.organization.$post({
          json: result.data
        }),
      logContext: 'creating organization',
      onSuccess: (response) => {
        if (!response.data) {
          return;
        }

        const { organization, organizations } = response.data;

        // Update stores
        orgs.set(organizations);
        const createdOrg = organizations.find((org) => org.id === organization.id);
        if (createdOrg) {
          currentOrg.set(createdOrg);
        }

        snackbar.success('snackbar.success_update');

        goto(resolve(`/org/${organization.siteName}`, {}));
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error(result);
          return;
        }
        if ('error' in result && 'field' in result) {
          // Field-specific error automatically mapped to this.errors[field]
          this.errors[result.field as string] = result.error;
        } else if ('error' in result) {
          this.errors.general = result.error;
        }
      }
    });
  }

  /**
   * Updates an organization
   * @param orgId Organization ID
   * @param fields Organization update data (name, avatar, theme, landingpage)
   */
  async update(orgId: string, fields: TOrgUpdateForm) {
    const result = ZUpdateOrganization.safeParse(fields);

    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'organization');
      return;
    }

    this.isLoading = true;

    // Handle avatar upload if provided
    let avatarUrl: string | undefined;
    if (fields.avatar instanceof File) {
      avatarUrl = await uploadImage(fields.avatar);
    } else if (typeof fields.avatar === 'string') {
      avatarUrl = fields.avatar;
    }

    // Build update payload
    fields.avatar = undefined;
    const updates: TUpdateOrganization = {
      ...fields,
      avatarUrl
    };

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

  /**
   * Invites team members to the organization
   * @param orgId Organization ID
   * @param emails Array of email addresses
   * @param roleId Role ID (ADMIN or TUTOR)
   */
  async inviteTeamMembers(orgId: string, emails: string[], roleId: number) {
    return this.execute<InviteTeamResponse>({
      requestFn: () =>
        classroomio.organization[':orgId'].team.invite.$post({
          param: { orgId },
          // @ts-expect-error - the json type is not inferred correctly
          json: { emails, roleId }
        }),
      logContext: 'inviting team members',
      onSuccess: () => {
        this.getOrgTeam(orgId);
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error(result);
          return;
        }
        if ('error' in result && 'field' in result) {
          this.errors[result.field as string] = result.error;
        }
      }
    });
  }

  /**
   * Removes a team member from the organization
   * @param orgId Organization ID
   * @param memberId Member ID to remove
   */
  async removeTeamMember(orgId: string, memberId: number) {
    return this.execute<DeleteTeamResponse>({
      requestFn: () =>
        classroomio.organization[':orgId'].team[':memberId'].$delete({
          param: { orgId, memberId: memberId.toString() }
        }),
      logContext: 'removing team member',
      onSuccess: () => {
        this.getOrgTeam(orgId);
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error(result);
        }
      }
    });
  }
}

export const orgApi = new OrgApi();
