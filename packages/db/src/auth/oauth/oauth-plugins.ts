import type { BetterAuthPlugin } from 'better-auth';
import { APIError } from 'better-auth/api';
import { jwt } from 'better-auth/plugins';
import { oauthProvider } from '@better-auth/oauth-provider';

import { MCP_RESOURCE_IDENTIFIERS, OAUTH_ISSUER, OAUTH_TRUSTED_CLIENT_IDS, PUBLIC_API_RESOURCE } from '@db/constants';
import { getOAuthOrganizationSelection, isActiveOrganizationAdmin } from '@db/queries/auth/oauth';
import { OAUTH_SCOPES } from './oauth-scopes';

export const OAUTH_LOGIN_PAGE = '/login';
export const OAUTH_CONSENT_PAGE = '/oauth/consent';

const ACCESS_TOKEN_TTL_SECONDS = 10 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 90 * 24 * 60 * 60;
const REFRESH_TOKEN_REUSE_INTERVAL_SECONDS = 60;

export function buildOAuthPlugins(): BetterAuthPlugin[] {
  return [
    jwt({ jwt: { issuer: OAUTH_ISSUER } }),
    oauthProvider({
      loginPage: OAUTH_LOGIN_PAGE,
      consentPage: OAUTH_CONSENT_PAGE,
      scopes: OAUTH_SCOPES,
      grantTypes: ['authorization_code', 'refresh_token'],
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
      clientRegistrationDefaultApplicationType: 'infer',
      resources: [...MCP_RESOURCE_IDENTIFIERS, PUBLIC_API_RESOURCE],
      enforcePerClientResources: false,
      accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
      refreshTokenExpiresIn: REFRESH_TOKEN_TTL_SECONDS,
      // Zapier refreshes from parallel tasks; without a reuse window the losing refresh is treated as token theft.
      refreshTokenReuseInterval: REFRESH_TOKEN_REUSE_INTERVAL_SECONDS,
      cachedTrustedClients: new Set(OAUTH_TRUSTED_CLIENT_IDS),
      postLogin: {
        page: OAUTH_CONSENT_PAGE,
        shouldRedirect: async ({ session }) => {
          const organizationId = await getOAuthOrganizationSelection(session.id);

          return !organizationId;
        },
        consentReferenceId: async ({ user, session }) => {
          const organizationId = await getOAuthOrganizationSelection(session.id);

          if (!organizationId) {
            throw new APIError('BAD_REQUEST', {
              error: 'invalid_request',
              error_description: 'An organization must be selected before granting access'
            });
          }

          if (!(await isActiveOrganizationAdmin(user.id, organizationId))) {
            throw new APIError('FORBIDDEN', {
              error: 'access_denied',
              error_description: 'Only workspace admins can connect apps'
            });
          }

          return organizationId;
        }
      },
      customAccessTokenClaims: ({ referenceId }) => ({ org_id: referenceId })
    })
  ];
}
