import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type ListOAuthOrganizationsRequest = typeof classroomio.oauth.organizations.$get;
export type GetOAuthOrganizationSelectionRequest = (typeof classroomio.oauth)['organization-selection']['$get'];
export type SelectOAuthOrganizationRequest = (typeof classroomio.oauth)['organization-selection']['$post'];
export type GetOAuthClientTrustRequest = (typeof classroomio.oauth)['clients'][':clientId']['$get'];

export type ListOAuthOrganizationsSuccess = Extract<
  InferResponseType<ListOAuthOrganizationsRequest>,
  { success: true }
>;
export type GetOAuthOrganizationSelectionSuccess = Extract<
  InferResponseType<GetOAuthOrganizationSelectionRequest>,
  { success: true }
>;
export type GetOAuthClientTrustSuccess = Extract<InferResponseType<GetOAuthClientTrustRequest>, { success: true }>;

export type OAuthOrganization = ListOAuthOrganizationsSuccess['data'][number];
export type OAuthSelectedOrganization = GetOAuthOrganizationSelectionSuccess['data'];
export type OAuthClientTrust = GetOAuthClientTrustSuccess['data'];

export type OAuthRedirectResponse = {
  redirect: boolean;
  url: string;
};

export type OAuthClientInfo = {
  client_id: string;
  client_name?: string;
  client_uri?: string;
  logo_uri?: string;
};

export type OAuthScopeAccess = 'read' | 'write';

export type OAuthScopeGroupKey =
  | 'courses'
  | 'exercises'
  | 'course_members'
  | 'certificates'
  | 'submissions'
  | 'cohorts'
  | 'audience'
  | 'team'
  | 'organization'
  | 'analytics'
  | 'media'
  | 'webhooks';

export type OAuthScopeSummary = {
  group: OAuthScopeGroupKey;
  access: OAuthScopeAccess;
};
