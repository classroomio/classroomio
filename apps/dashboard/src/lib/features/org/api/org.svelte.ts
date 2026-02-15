import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  DeleteTeamRequest,
  DomainRequestRequest,
  GetAudienceRequest,
  GetOrgPublicCoursesRequest,
  InviteTeamRequest,
  OrgPublicCourses,
  OrganizationAudience,
  OrganizationTeamMembers
} from '../utils/types';
import type { TCreateOrganization, TGetOrganizations, TUpdateOrganization } from '@cio/utils/validation/organization';
import { ZCreateOrganization, ZUpdateOrganization } from '@cio/utils/validation/organization';
import { currentOrg, orgs } from '$lib/utils/store/org';

import type { AccountOrg } from '$features/app/types';
import type { GetTeamRequest } from '../utils/types';
import { ROLE } from '@cio/utils/constants';
import { ROLE_LABEL } from '$lib/utils/constants/roles';
import type { UpdateOrganizationRequest } from '../utils/types';
import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { resolve } from '$app/paths';
import { snackbar } from '$features/ui/snackbar/store';
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
  publicCourses: OrgPublicCourses = $state([]);

  isFetchingOrgPublicCourses = $state(false);

  /**
   * Gets organization team members (non-students)
   * @returns Team members array
   */
  async getOrgTeam() {
    return this.execute<GetTeamRequest>({
      requestFn: () => classroomio.organization.team.$get(),
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

    return this.execute<GetAudienceRequest>({
      requestFn: () => classroomio.organization.audience.$get(),
      logContext: 'fetching organization audience',
      onSuccess: (response) => {
        this.audience = response.data;
      }
    });
  }

  /**
   * Gets public courses by organization siteName (for landing pages)
   * @param siteName Organization site name
   * @returns Published courses array
   */
  async getPublicCoursesBySiteName(siteName: string) {
    this.isFetchingOrgPublicCourses = true;

    await this.execute<GetOrgPublicCoursesRequest>({
      requestFn: () =>
        classroomio.organization.courses.public.$get({
          query: { siteName }
        }),
      logContext: 'fetching public courses',
      onSuccess: (response) => {
        this.publicCourses = response.data;
      }
    });

    this.isFetchingOrgPublicCourses = false;
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
   * @param options Options for the update operation
   * @param options.onSuccess Callback function to be called on success
   */
  async update(
    orgId: string,
    fields: TOrgUpdateForm,
    options: { onSuccess?: (data: TUpdateOrganization) => void } = {}
  ) {
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
      landingpage: fields.landingpage ?? undefined,
      avatarUrl
    };

    await this.execute<UpdateOrganizationRequest>({
      requestFn: () =>
        classroomio.organization.$put({
          json: updates
        }),
      logContext: 'updating organization',
      onSuccess: (response) => {
        if (!response.data) {
          return;
        }

        if (options.onSuccess) {
          return options.onSuccess({
            name: response.data.name,
            avatarUrl: response.data.avatarUrl ?? undefined,
            theme: response.data.theme ?? undefined,
            landingpage: response.data.landingpage ?? undefined,
            siteName: response.data.siteName ?? undefined,
            customDomain: response.data.customDomain,
            isCustomDomainVerified: response.data.isCustomDomainVerified ?? undefined,
            customization: response.data.customization ?? undefined
          });
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
   *
   * @param emails Array of email addresses
   * @param roleId Role ID (ADMIN or TUTOR)
   */
  async inviteTeamMembers(emails: string[], roleId: number) {
    return this.execute<InviteTeamRequest>({
      requestFn: () =>
        classroomio.organization.team.invite.$post({
          json: { emails, roleId }
        }),
      logContext: 'inviting team members',
      onSuccess: () => {
        this.getOrgTeam();
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
   *
   * @param memberId Member ID to remove
   */
  async removeTeamMember(memberId: number) {
    return this.execute<DeleteTeamRequest>({
      requestFn: () =>
        classroomio.organization.team[':memberId'].$delete({
          param: { memberId: memberId.toString() }
        }),
      logContext: 'removing team member',
      onSuccess: () => {
        this.getOrgTeam();
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error(result);
        }
      }
    });
  }

  /**
   * Sends a domain request (verify, add, or remove domain)
   * @param key Domain operation key: 'verify_domain', 'add_domain', or 'remove_domain'
   * @param domain Domain name
   * @returns Domain request response data
   */
  async sendDomainRequest(key: 'verify_domain' | 'add_domain' | 'remove_domain', domain: string) {
    return this.execute<DomainRequestRequest>({
      requestFn: () =>
        classroomio.domain.$post({
          json: {
            params: {
              key,
              domain
            }
          }
        }),
      logContext: `processing domain request: ${key}`,
      onSuccess: () => {
        this.success = true;
        this.errors = {};
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
