import type {
  GetOAuthOrganizationSelectionRequest,
  ListOAuthOrganizationsRequest,
  OAuthClientInfo,
  OAuthOrganization,
  OAuthRedirectResponse,
  SelectOAuthOrganizationRequest
} from '$features/oauth/utils/types';
import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { authClient } from '$lib/utils/services/auth/client';

class OAuthApi extends BaseApiWithErrors {
  organizations = $state<OAuthOrganization[] | null>(null);
  selectedOrganization = $state<OAuthOrganization | null>(null);
  client = $state<OAuthClientInfo | null>(null);

  async listOrganizations() {
    return this.execute<ListOAuthOrganizationsRequest>({
      requestFn: () => classroomio.oauth.organizations.$get(),
      logContext: 'listing OAuth organizations',
      onSuccess: (response) => {
        this.organizations = response.data;
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
      logContext: 'selecting OAuth organization'
    });
  }

  async loadClient(clientId: string) {
    try {
      const { data } = await authClient.$fetch<OAuthClientInfo>('/oauth2/public-client', {
        method: 'GET',
        query: { client_id: clientId }
      });

      this.client = data ?? null;
    } catch (error) {
      console.error('Error loading OAuth client:', error);
      this.client = null;
    }
  }

  async continueAfterOrganization(oauthQuery: string): Promise<string | null> {
    return this.postAuthorizationStep('/oauth2/continue', { postLogin: true, oauth_query: oauthQuery });
  }

  async submitConsent(accept: boolean, oauthQuery: string): Promise<string | null> {
    return this.postAuthorizationStep('/oauth2/consent', { accept, oauth_query: oauthQuery });
  }

  private async postAuthorizationStep(path: string, body: Record<string, unknown>): Promise<string | null> {
    this.isLoading = true;
    this.error = null;

    try {
      const { data, error } = await authClient.$fetch<OAuthRedirectResponse>(path, { method: 'POST', body });

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
