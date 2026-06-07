import { classroomio, type InferRequestType, type InferResponseType } from '$lib/utils/services/api';

export type GetOrganizationRequest = typeof classroomio.organization.$get;
export type GetOrganizationResponse = InferResponseType<GetOrganizationRequest> | null;
export type GetOrganizationSuccess = Extract<InferResponseType<GetOrganizationRequest>, { success: true }>;
export type OrganizationRecord = GetOrganizationSuccess['data'][number];

export type GetFirstOrganizationRequest = typeof classroomio.organization.first.$get;
export type GetFirstOrganizationResponse = InferResponseType<GetFirstOrganizationRequest> | null;
export type GetFirstOrganizationSuccess = Extract<InferResponseType<GetFirstOrganizationRequest>, { success: true }>;
export type FirstOrganizationRecord = GetFirstOrganizationSuccess['data'][number];

// Team member types
export type GetTeamRequest = (typeof classroomio.organization)['team']['$get'];
export type OrganizationTeamResponse = InferResponseType<GetTeamRequest> | null;
export type OrganizationTeamSuccess = Extract<InferResponseType<GetTeamRequest>, { success: true }>;

export type OrganizationTeamMembersRaw = OrganizationTeamSuccess['data'];

// Mapped team members with role and isAdmin (mapped in API layer)
export type OrganizationTeamMembers = Array<
  OrganizationTeamMembersRaw[number] & {
    role: string;
    isAdmin: boolean;
    verified: boolean;
  }
>;

// Audience types
export type GetAudienceRequest = (typeof classroomio.organization)['audience']['$get'];
export type OrganizationAudienceResponse = InferResponseType<GetAudienceRequest> | null;
export type OrganizationAudienceSuccess = Extract<InferResponseType<GetAudienceRequest>, { success: true }>;
export type OrganizationAudienceRequestQuery = NonNullable<InferRequestType<GetAudienceRequest>['query']>;
export type OrganizationAudienceSortBy = 'createdAt' | 'name' | 'email';
export type OrganizationAudienceSortOrder = 'asc' | 'desc';
export type OrganizationAudienceQuery = {
  page: number;
  limit: number;
  search?: string;
  sortBy: OrganizationAudienceSortBy;
  sortOrder: OrganizationAudienceSortOrder;
};

export type OrganizationAudience = OrganizationAudienceSuccess['data'];
export type OrganizationAudiencePagination = OrganizationAudienceSuccess['pagination'];
export type OrganizationAudienceMember = OrganizationAudience[number];

// Org Public Courses  types
export type GetOrgPublicCoursesRequest = typeof classroomio.organization.courses.public.$get;
export type OrgPublicCoursesResponse = InferResponseType<GetOrgPublicCoursesRequest> | null;
export type OrgPublicCoursesSuccess = Extract<InferResponseType<GetOrgPublicCoursesRequest>, { success: true }>;
export type OrgPublicCoursesData = OrgPublicCoursesSuccess['data'];
export type OrgPublicCourses = OrgPublicCoursesData['courses'];

// dashboard analytics types
export type GetDashStatsRequest = typeof classroomio.dash.stats.$get;
export type DashStatsResponse = InferResponseType<GetDashStatsRequest> | null;
export type DashStatsSuccess = Extract<InferResponseType<GetDashStatsRequest>, { success: true }>;

export type GetLoginActivityRequest = (typeof classroomio.dash)['login-activity']['$get'];
export type LoginActivitySuccess = Extract<InferResponseType<GetLoginActivityRequest>, { success: true }>;
export type LoginActivityData = LoginActivitySuccess['data'];

// invite team types
export type InviteTeamRequest = (typeof classroomio.organization)['team']['invite']['$post'];
export type InviteTeamSuccess = Extract<InferResponseType<InviteTeamRequest>, { success: true }>;
export type InviteTeamData = InviteTeamSuccess['data'];

export type DeleteTeamRequest = (typeof classroomio.organization)['team'][':memberId']['$delete'];
export type DeleteTeamSuccess = Extract<InferResponseType<DeleteTeamRequest>, { success: true }>;
export type DeleteAudienceMemberRequest = (typeof classroomio.organization)['audience'][':memberId']['$delete'];
export type DeleteAudienceMemberSuccess = Extract<InferResponseType<DeleteAudienceMemberRequest>, { success: true }>;

// update organization types
export type UpdateOrganizationRequest = (typeof classroomio.organization)['$put'];
export type UpdateOrganizationResponse = InferResponseType<UpdateOrganizationRequest>;
export type UpdateOrganizationSuccess = Extract<UpdateOrganizationResponse, { success: true }>;

// domain request types
export type DomainRequestRequest = typeof classroomio.domain.$post;
export type DomainRequestResponse = InferResponseType<DomainRequestRequest>;
export type DomainRequestSuccess = Extract<DomainRequestResponse, { success: true }>;
export type DomainRequestData = DomainRequestSuccess['data'];
export type DomainRequestStatus = DomainRequestData['status'];

// SSO types
export type GetSsoConfigRequest = (typeof classroomio.organization)['sso']['$get'];
export type CreateSsoConnectionRequest = (typeof classroomio.organization)['sso']['$post'];
export type UpdateSsoConnectionRequest = (typeof classroomio.organization)['sso']['$put'];
export type DeleteSsoConnectionRequest = (typeof classroomio.organization)['sso']['$delete'];
export type ActivateSsoConnectionRequest = (typeof classroomio.organization)['sso']['activate']['$post'];
export type GetSsoPolicyRequest = (typeof classroomio.organization)['sso']['policy']['$get'];
export type UpdateSsoPolicyRequest = (typeof classroomio.organization)['sso']['policy']['$put'];

export type SsoDiscoveryRequest = typeof classroomio.sso.discover.$get;
export type GetOrgSsoInfoRequest = (typeof classroomio.sso)['org'][':orgId']['$get'];

export type GetSsoConfigSuccess = Extract<InferResponseType<GetSsoConfigRequest>, { success: true }>;
type SsoConfigData = NonNullable<GetSsoConfigSuccess['data']>;
type NormalizedPolicy = SsoConfigData extends { policy: infer P }
  ? P extends object
    ? Omit<P, 'roleMapping'> & { roleMapping: Record<string, number> }
    : null
  : null;
/** Normalized SSO config: API returns policy.roleMapping as JSONValue; this uses Record<string, number>. */
export type SsoConfig = {
  config: SsoConfigData['config'] | null;
  policy: NormalizedPolicy;
};

export type GetSsoDiscoverySuccess = Extract<InferResponseType<SsoDiscoveryRequest>, { success: true }>;
export type SsoDiscoveryResult = GetSsoDiscoverySuccess['data'];

export type GetOrgSsoInfoSuccess = Extract<InferResponseType<GetOrgSsoInfoRequest>, { success: true }>;
export type OrgSsoInfo = GetOrgSsoInfoSuccess['data'];

// Audience import types
export type ImportAudienceRequest = (typeof classroomio.organization)['audience']['import']['$post'];
export type ImportAudienceSuccess = Extract<InferResponseType<ImportAudienceRequest>, { success: true }>;
export type ImportAudienceData = ImportAudienceSuccess['data'];

// Audience assign courses types
export type AssignAudienceCoursesRequest = (typeof classroomio.organization)['audience']['assign-courses']['$post'];
export type AssignAudienceCoursesSuccess = Extract<InferResponseType<AssignAudienceCoursesRequest>, { success: true }>;
export type AssignAudienceCoursesData = AssignAudienceCoursesSuccess['data'];

// Audience invite actions
export type ResendAudienceInviteRequest = (typeof classroomio.organization)['audience']['resend-invite']['$post'];
export type RevokeAudienceInviteRequest = (typeof classroomio.organization)['audience']['revoke-invite']['$post'];

// Link invite types
export type GetLinkInviteRequest = (typeof classroomio.organization)['link-invite']['$get'];
export type CreateLinkInviteRequest = (typeof classroomio.organization)['link-invite']['$post'];
export type ToggleLinkInviteRequest = (typeof classroomio.organization)['link-invite']['$patch'];

export type GetLinkInviteSuccess = Extract<InferResponseType<GetLinkInviteRequest>, { success: true }>;
export type OrgLinkInvite = GetLinkInviteSuccess['data'];

// Token auth types
export type CreateTokenAuthRequest = (typeof classroomio.organization)['token-auth']['$post'];
export type GetTokenAuthRequest = (typeof classroomio.organization)['token-auth']['$get'];
export type RotateTokenAuthRequest = (typeof classroomio.organization)['token-auth']['rotate']['$post'];
export type DeleteTokenAuthRequest = (typeof classroomio.organization)['token-auth']['$delete'];
export type ActivateTokenAuthRequest = (typeof classroomio.organization)['token-auth']['activate']['$put'];
