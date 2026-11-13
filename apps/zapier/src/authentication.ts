import type { Authentication, Bundle, ZObject } from 'zapier-platform-core';
import { canOAuthScopesChangeData } from '@cio/utils/constants/oauth-scopes';
import { ZAPIER_OAUTH_SCOPES } from '@cio/utils/constants/zapier';
import type { TPublicApiMeResponse } from '@cio/utils/validation/public-api';

import { oauthTokenUrl, publicApiResource } from './lib/config';

const SCOPE = ZAPIER_OAUTH_SCOPES.join(' ');

async function getConnectionLabel(_z: ZObject, bundle: Bundle): Promise<string> {
  const meResponse = bundle.inputData as { data?: Partial<TPublicApiMeResponse> } | undefined;
  const organization = meResponse?.data?.organization;
  const organizationLabel = organization?.name?.trim() || organization?.siteName?.trim() || '';
  const grantedScopes = meResponse?.data?.connection?.scopes;
  const isReadOnly = Boolean(grantedScopes) && !canOAuthScopesChangeData(grantedScopes ?? []);

  if (!organizationLabel || !isReadOnly) return organizationLabel;

  return `${organizationLabel} (read-only)`;
}

export const authentication: Authentication = {
  type: 'oauth2',
  oauth2Config: {
    authorizeUrl: {
      url: '{{process.env.CIO_APP_ORIGIN}}/api/auth/oauth2/authorize',
      params: {
        client_id: '{{process.env.CLIENT_ID}}',
        redirect_uri: '{{bundle.inputData.redirect_uri}}',
        response_type: 'code',
        state: '{{bundle.inputData.state}}',
        scope: SCOPE,
        // Reconnects must also land on the consent screen: better-auth skips it when the stored grant already covers the request.
        prompt: 'consent',
        resource: '{{process.env.CIO_API_ORIGIN}}/public-api/v1'
      }
    },
    getAccessToken: async (z, bundle) => {
      const response = await z.request({
        url: oauthTokenUrl(),
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: {
          grant_type: 'authorization_code',
          code: bundle.inputData.code,
          redirect_uri: bundle.inputData.redirect_uri,
          code_verifier: bundle.inputData.code_verifier,
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          resource: publicApiResource()
        }
      });

      return { access_token: response.data.access_token, refresh_token: response.data.refresh_token };
    },
    refreshAccessToken: async (z, bundle) => {
      const response = await z.request({
        url: oauthTokenUrl(),
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: {
          grant_type: 'refresh_token',
          refresh_token: bundle.authData.refresh_token,
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          resource: publicApiResource()
        }
      });

      return { access_token: response.data.access_token, refresh_token: response.data.refresh_token };
    },
    scope: SCOPE,
    autoRefresh: true,
    enablePkce: true
  },
  test: { url: '{{process.env.CIO_API_ORIGIN}}/public-api/v1/me' },
  connectionLabel: getConnectionLabel
};
