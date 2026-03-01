import { classroomio, type InferResponseType } from '$lib/utils/services/api';

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

export type OrganizationAudience = OrganizationAudienceSuccess['data'];

// Org Public Courses  types
export type GetOrgPublicCoursesRequest = typeof classroomio.organization.courses.public.$get;
export type OrgPublicCoursesResponse = InferResponseType<GetOrgPublicCoursesRequest> | null;
export type OrgPublicCoursesSuccess = Extract<InferResponseType<GetOrgPublicCoursesRequest>, { success: true }>;
export type OrgPublicCourses = OrgPublicCoursesSuccess['data'];

// dashboard analytics types
export type GetDashStatsRequest = typeof classroomio.dash.stats.$get;
export type DashStatsResponse = InferResponseType<GetDashStatsRequest> | null;
export type DashStatsSuccess = Extract<InferResponseType<GetDashStatsRequest>, { success: true }>;

// invite team types
export type InviteTeamRequest = (typeof classroomio.organization)['team']['invite']['$post'];
export type InviteTeamSuccess = Extract<InferResponseType<InviteTeamRequest>, { success: true }>;
export type InviteTeamData = InviteTeamSuccess['data'];

export type DeleteTeamRequest = (typeof classroomio.organization)['team'][':memberId']['$delete'];
export type DeleteTeamSuccess = Extract<InferResponseType<DeleteTeamRequest>, { success: true }>;

// update organization types
export type UpdateOrganizationRequest = (typeof classroomio.organization)['$put'];
export type UpdateOrganizationResponse = InferResponseType<UpdateOrganizationRequest>;
export type UpdateOrganizationSuccess = Extract<UpdateOrganizationResponse, { success: true }>;

// domain request types
export type DomainRequestRequest = typeof classroomio.domain.$post;
export type DomainRequestResponse = InferResponseType<DomainRequestRequest>;
export type DomainRequestSuccess = Extract<DomainRequestResponse, { success: true }>;

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

// Token auth types
export type CreateTokenAuthRequest = (typeof classroomio.organization)['token-auth']['$post'];
export type GetTokenAuthRequest = (typeof classroomio.organization)['token-auth']['$get'];
export type RotateTokenAuthRequest = (typeof classroomio.organization)['token-auth']['rotate']['$post'];
export type DeleteTokenAuthRequest = (typeof classroomio.organization)['token-auth']['$delete'];
export type ActivateTokenAuthRequest = (typeof classroomio.organization)['token-auth']['activate']['$put'];
