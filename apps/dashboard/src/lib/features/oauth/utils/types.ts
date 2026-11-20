import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type ListOAuthOrganizationsRequest = typeof classroomio.oauth.organizations.$get;
export type GetOAuthOrganizationSelectionRequest = (typeof classroomio.oauth)['organization-selection']['$get'];
export type SelectOAuthOrganizationRequest = (typeof classroomio.oauth)['organization-selection']['$post'];

export type ListOAuthOrganizationsSuccess = Extract<
  InferResponseType<ListOAuthOrganizationsRequest>,
  { success: true }
>;
export type GetOAuthOrganizationSelectionSuccess = Extract<
  InferResponseType<GetOAuthOrganizationSelectionRequest>,
  { success: true }
>;

export type OAuthOrganization = ListOAuthOrganizationsSuccess['data'][number];

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
  | 'media';

export type OAuthScopeSummary = {
  group: OAuthScopeGroupKey;
  access: OAuthScopeAccess;
};
