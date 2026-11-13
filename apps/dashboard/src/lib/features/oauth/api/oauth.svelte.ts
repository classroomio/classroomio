import type {
  GetOAuthClientTrustRequest,
  GetOAuthOrganizationSelectionRequest,
  ListOAuthOrganizationsRequest,
  OAuthClientInfo,
  OAuthClientTrust,
  OAuthOrganization,
  OAuthRedirectResponse,
  OAuthSelectedOrganization,
  SelectOAuthOrganizationRequest
} from '$features/oauth/utils/types';
import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { authClient, nonNavigatingAuthClient } from '$lib/utils/services/auth/client';

class OAuthApi extends BaseApiWithErrors {
  organizations = $state<OAuthOrganization[] | null>(null);
  selectedOrganization = $state<OAuthSelectedOrganization>(null);
  client = $state<OAuthClientInfo | null>(null);
  clientTrust = $state<OAuthClientTrust | null>(null);

  async listOrganizations(resource?: string) {
    return this.execute<ListOAuthOrganizationsRequest>({
      requestFn: () => classroomio.oauth.organizations.$get({ query: resource ? { resource } : {} }),
      logContext: 'listing OAuth organizations',
      onSuccess: (response) => {
        this.organizations = response.data;
      }
    });
  }

  async loadClientTrust(clientId: string) {
    return this.execute<GetOAuthClientTrustRequest>({
      requestFn: () => classroomio.oauth.clients[':clientId'].$get({ param: { clientId } }),
      logContext: 'loading OAuth client trust',
      onSuccess: (response) => {
        this.clientTrust = response.data;
      }
    });
  }

  async loadSelectedOrganization() {
    return this.execute<GetOAuthOrganizationSelectionRequest>({
      requestFn: () => classroomio.oauth['organization-selection'].$get(),
      logContext: 'reading OAuth organization selection',
      onSuccess: (response) => {
        this.selectedOrganization = response.data;
      }
    });
  }

  async selectOrganization(organizationId: string) {
    return this.execute<SelectOAuthOrganizationRequest>({
      requestFn: () => classroomio.oauth['organization-selection'].$post({ json: { organizationId } }),
      logContext: 'selecting OAuth organization',
      onSuccess: () => {
        this.selectedOrganization =
          this.organizations?.find((organization) => organization.id === organizationId) ?? null;
      }
    });
  }

  async loadClient(clientId: string): Promise<boolean> {
    try {
      const { data } = await authClient.$fetch<OAuthClientInfo>('/oauth2/public-client', {
        method: 'GET',
        query: { client_id: clientId }
      });

      this.client = data ?? null;

      return Boolean(data);
    } catch (error) {
      console.error('Error loading OAuth client:', error);
      this.client = null;

      return false;
    }
  }

  async continueAfterOrganization(oauthQuery: string): Promise<string | null> {
    return this.postAuthorizationStep('/oauth2/continue', { postLogin: true, oauth_query: oauthQuery });
  }

  /**
   * Sends the admin's decision. `grantedScopes`, when set, narrows the grant to a subset of the requested scopes.
   */
  async submitConsent(accept: boolean, oauthQuery: string, grantedScopes?: string[]): Promise<string | null> {
    const body: Record<string, unknown> = { accept, oauth_query: oauthQuery };

    if (grantedScopes) {
      body.scope = grantedScopes.join(' ');
    }

    return this.postAuthorizationStep('/oauth2/consent', body);
  }

  private async postAuthorizationStep(path: string, body: Record<string, unknown>): Promise<string | null> {
    this.isLoading = true;
    this.error = null;

    try {
      const { data, error } = await nonNavigatingAuthClient.$fetch<OAuthRedirectResponse>(path, {
        method: 'POST',
        body
      });

      if (error || !data?.url) {
        this.error = 'oauth.error.generic';

        return null;
      }

      return data.url;
    } catch (error) {
      console.error('Error in OAuth authorization step:', error);
      this.error = 'oauth.error.generic';

      return null;
    } finally {
      this.isLoading = false;
    }
  }
}

export const oauthApi = new OAuthApi();
