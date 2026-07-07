import type {
  AssignAudienceCoursesRequest,
  CreateLinkInviteRequest,
  DeleteAudienceMemberRequest,
  DeleteTeamRequest,
  DomainRequestRequest,
  GetAudienceRequest,
  GetLinkInviteRequest,
  GetOrgPublicCoursesRequest,
  ImportAudienceRequest,
  InviteTeamRequest,
  OrgLinkInvite,
  OrgPublicCourses,
  OrganizationAudience,
  OrganizationAudiencePagination,
  OrganizationAudienceQuery,
  OrganizationTeamMembers,
  ResendAudienceInviteRequest,
  RevokeAudienceInviteRequest,
  ToggleLinkInviteRequest
} from '../utils/types';
import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  TAssignAudienceCourses,
  TAudienceInviteByEmail,
  TCreateOrganization,
  TGetOrganizations,
  TImportAudienceMembers,
  TUpdateOrganization
} from '@cio/utils/validation/organization';
import { ZCreateOrganization, ZUpdateOrganization } from '@cio/utils/validation/organization';
import { currentOrg, mergeAccountOrgFromServer, orgs } from '$lib/utils/store/org';

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
import { DEFAULT_ORG_AUDIENCE_QUERY, toAudienceRequestQuery } from '../utils/audience-query-utils';

export interface TOrgUpdateForm {
  name?: string;
  avatar?: string | File | undefined;
  favicon?: string | File | null | undefined;
  theme?: string;
  landingpage?: AccountOrg['landingpage'];
  siteName?: string;
  customDomain?: string | null;
  isCustomDomainVerified?: boolean;
  customization?: AccountOrg['customization'];
  disableSignup?: boolean;
  disableSignupMessage?: string;
  disableEmailPassword?: boolean;
  disableGoogleAuth?: boolean;
  settings?: { signup?: { inviteOnly?: boolean } };
}

/**
 * API class for organization operations
 */
class OrgApi extends BaseApiWithErrors {
  teamMembers = $state<OrganizationTeamMembers>([]);
  audience = $state<OrganizationAudience>([]);
  audiencePagination = $state<OrganizationAudiencePagination | null>(null);
  publicCourses: OrgPublicCourses = $state([]);
  hasMorePublicCourses = $state(false);
  publicCoursesLoadedSiteName: string | null = $state(null);

  isFetchingOrgPublicCourses = $state(false);
  private activePublicCoursesFetch: Promise<void> | null = null;
  private activePublicCoursesFetchSiteName: string | null = null;
  private activeAudienceRequestController: AbortController | null = null;

  cancelAudienceRequest() {
    this.activeAudienceRequestController?.abort();
    this.activeAudienceRequestController = null;
  }

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
  async getOrgAudience(
    orgId?: string,
    query?: Partial<OrganizationAudienceQuery>,
    options: { abortPrevious?: boolean; signal?: AbortSignal } = {}
  ) {
    if (!orgId) return;

    const requestQuery = toAudienceRequestQuery({
      ...DEFAULT_ORG_AUDIENCE_QUERY,
      ...query
    });

    let requestSignal = options.signal;
    let requestController: AbortController | null = null;

    if (options.abortPrevious) {
      this.cancelAudienceRequest();
      requestController = new AbortController();
      this.activeAudienceRequestController = requestController;
      requestSignal = requestController.signal;
    }

    const response = await this.execute<GetAudienceRequest>({
      requestFn: () =>
        classroomio.organization.audience.$get(
          {
            query: requestQuery!
          },
          {
            init: {
              signal: requestSignal
            }
          }
        ),
      logContext: 'fetching organization audience',
      onSuccess: (response) => {
        this.audience = response.data;
        this.audiencePagination = response.pagination;
      }
    });

    if (requestController && this.activeAudienceRequestController === requestController) {
      this.activeAudienceRequestController = null;
    }

    return response;
  }

  invalidatePublicCourses() {
    this.publicCoursesLoadedSiteName = null;
  }

  /**
   * Refetches public courses for a site, clearing any cached settings preview data.
   */
  async refreshPublicCourses(siteName: string) {
    if (!siteName) {
      return;
    }

    this.invalidatePublicCourses();
    await this.fetchPublicCoursesBySiteName(siteName);
  }

  /**
   * Loads public courses for a site when they have not been fetched yet.
   * Skips the request when courses are already in memory for the same site.
   */
  async loadPublicCoursesIfNeeded(siteName: string) {
    if (!siteName || this.publicCoursesLoadedSiteName === siteName) {
      return;
    }

    await this.fetchPublicCoursesBySiteName(siteName);
  }

  /**
   * Gets public courses by organization siteName (for landing pages)
   * @param siteName Organization site name
   * @returns Published courses array
   */
  async getPublicCoursesBySiteName(siteName: string) {
    this.invalidatePublicCourses();
    await this.fetchPublicCoursesBySiteName(siteName);
  }

  private fetchPublicCoursesBySiteName(siteName: string): Promise<void> {
    if (this.activePublicCoursesFetch && this.activePublicCoursesFetchSiteName === siteName) {
      return this.activePublicCoursesFetch;
    }

    this.isFetchingOrgPublicCourses = true;

    const fetchPromise = this.execute<GetOrgPublicCoursesRequest>({
      requestFn: () =>
        classroomio.organization.courses.public.$get({
          query: { siteName }
        }),
      logContext: 'fetching public courses',
      onSuccess: (response) => {
        this.publicCourses = response.data.courses;
        this.hasMorePublicCourses = response.data.hasMoreCourses;
        this.publicCoursesLoadedSiteName = siteName;
      }
    })
      .then(() => undefined)
      .finally(() => {
        this.isFetchingOrgPublicCourses = false;

        if (this.publicCoursesLoadedSiteName !== siteName) {
          this.publicCourses = [];
          this.hasMorePublicCourses = false;
          this.publicCoursesLoadedSiteName = siteName;
        }

        if (this.activePublicCoursesFetchSiteName === siteName) {
          this.activePublicCoursesFetch = null;
          this.activePublicCoursesFetchSiteName = null;
        }
      });

    this.activePublicCoursesFetch = fetchPromise;
    this.activePublicCoursesFetchSiteName = siteName;

    return fetchPromise;
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

    return result?.data?.[0] ?? null;
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
        orgs.set(organizations.map((org) => mergeAccountOrgFromServer(org)));
        const createdOrg = organizations.find((org) => org.id === organization.id);
        if (createdOrg) {
          currentOrg.set(mergeAccountOrgFromServer(createdOrg));
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

    let favicon: string | null | undefined;
    if (fields.favicon instanceof File) {
      favicon = await uploadImage(fields.favicon);
    } else if (typeof fields.favicon === 'string') {
      favicon = fields.favicon;
    } else if (fields.favicon === null) {
      favicon = null;
    }

    // Build update payload
    fields.avatar = undefined;
    fields.favicon = undefined;
    const updates: TUpdateOrganization = {
      ...fields,
      landingpage: fields.landingpage ?? undefined,
      avatarUrl
    };

    if (favicon !== undefined) {
      updates.favicon = favicon;
    }

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
            favicon: response.data.favicon ?? undefined,
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
              return mergeAccountOrgFromServer({ ...org, ...response.data } as AccountOrg);
            }

            return org;
          })
        );
        const currentOrgData = get(currentOrg);

        if (currentOrgData.id === orgId) {
          currentOrg.update((org) => mergeAccountOrgFromServer({ ...org, ...response.data } as AccountOrg));
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
   * Sends a domain request (connect, refresh, or remove)
   * @param action Domain operation action
   * @param domain Domain name
   * @returns Domain request response data
   */
  async sendDomainRequest(action: 'connect' | 'refresh' | 'remove', domain: string) {
    return this.execute<DomainRequestRequest>({
      requestFn: () =>
        classroomio.domain.$post({
          json: {
            action,
            domain
          }
        }),
      logContext: `processing domain request: ${action}`,
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

  /**
   * Imports users into the organization as students
   */
  async importAudienceMembers(data: TImportAudienceMembers) {
    return this.execute<ImportAudienceRequest>({
      requestFn: () =>
        classroomio.organization.audience.import.$post({
          json: data
        }),
      logContext: 'importing audience members',
      onSuccess: (response) => {
        const d = response.data;
        snackbar.success(
          t.get('audience.import.snackbar_success', {
            imported: d.imported,
            assigned: d.assigned ?? 0,
            pendingInvitesRenewed: d.pendingInvitesRenewed ?? 0,
            emailsSent: d.emailsSent
          })
        );
        this.success = true;
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
   * Assigns existing audience members to courses
   */
  async assignAudienceToCourses(data: TAssignAudienceCourses) {
    return this.execute<AssignAudienceCoursesRequest>({
      requestFn: () =>
        classroomio.organization.audience['assign-courses'].$post({
          json: data
        }),
      logContext: 'assigning audience to courses',
      onSuccess: (response) => {
        const d = response.data;
        snackbar.success(
          t.get('audience.assign.snackbar_success', {
            assigned: d.assigned,
            alreadyEnrolled: d.alreadyEnrolled,
            emailsSent: d.emailsSent
          })
        );
        this.success = true;
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error(result);
          return;
        }
        if ('error' in result) {
          snackbar.error(result.error);
        }
      }
    });
  }

  async resendAudienceInvite(data: TAudienceInviteByEmail) {
    return this.execute<ResendAudienceInviteRequest>({
      requestFn: () =>
        classroomio.organization.audience['resend-invite'].$post({
          json: data
        }),
      logContext: 'resending audience invite',
      onSuccess: (response) => {
        if (response.data.emailSent) {
          snackbar.success('audience.invite.resend_snackbar_success');
        } else {
          snackbar.error('audience.invite.resend_snackbar_email_failed');
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error(result);
        }
      }
    });
  }

  async revokeAudienceInvite(data: TAudienceInviteByEmail) {
    return this.execute<RevokeAudienceInviteRequest>({
      requestFn: () =>
        classroomio.organization.audience['revoke-invite'].$post({
          json: data
        }),
      logContext: 'revoking audience invite',
      onSuccess: () => {
        snackbar.success('audience.invite.revoke_snackbar_success');
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error(result);
        }
      }
    });
  }

  async deleteAudienceMember(memberId: number) {
    return this.execute<DeleteAudienceMemberRequest>({
      requestFn: () =>
        classroomio.organization.audience[':memberId'].$delete({
          param: { memberId: memberId.toString() }
        }),
      logContext: 'removing audience member',
      onSuccess: () => {
        snackbar.success('audience.delete.snackbar_success');
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error(result);
          return;
        }

        snackbar.error('error' in result ? result.error : result.message);
      }
    });
  }

  linkInvite = $state<OrgLinkInvite>(null);

  async getLinkInvite() {
    return this.execute<GetLinkInviteRequest>({
      requestFn: () => classroomio.organization['link-invite'].$get(),
      logContext: 'fetching link invite',
      onSuccess: (response) => {
        this.linkInvite = response.data;
      }
    });
  }

  async generateLinkInvite(roleId: number) {
    return this.execute<CreateLinkInviteRequest>({
      requestFn: () => classroomio.organization['link-invite'].$post({ json: { roleId } }),
      logContext: 'generating link invite',
      onSuccess: (response) => {
        const wasNew = !this.linkInvite;
        this.linkInvite = response.data;

        if (wasNew) {
          snackbar.success('snackbar.link_invite.generated');
        }
      }
    });
  }

  async toggleLinkInvite(isRevoked: boolean) {
    return this.execute<ToggleLinkInviteRequest>({
      requestFn: () => classroomio.organization['link-invite'].$patch({ json: { isRevoked } }),
      logContext: 'toggling link invite',
      onSuccess: (response) => {
        this.linkInvite = response.data;
        snackbar.success(isRevoked ? 'snackbar.link_invite.disabled' : 'snackbar.link_invite.enabled');
      }
    });
  }
}

export const orgApi = new OrgApi();
