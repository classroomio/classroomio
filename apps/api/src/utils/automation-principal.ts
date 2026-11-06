import type { TOrganizationApiKey } from '@cio/db/types';

import { AppError, ErrorCodes } from '@api/utils/errors';

export type TAutomationPrincipal = {
  automationKey: TOrganizationApiKey;
  oauthClientId: string | null;
};

export type TOAuthGrantPrincipal = {
  oauthConsentId: string;
  clientId: string;
  keyId: string;
};

export function toAutomationPrincipal(
  automationKey: TOrganizationApiKey | null | undefined,
  oauthClientId: string | null | undefined
): TAutomationPrincipal {
  if (!automationKey) {
    throw new AppError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401);
  }

  return { automationKey, oauthClientId: oauthClientId ?? null };
}

/**
 * Narrows the principal to an OAuth grant. Throws 403 for automation keys.
 */
export function requireOAuthGrant(principal: TAutomationPrincipal): TOAuthGrantPrincipal {
  const { automationKey, oauthClientId } = principal;

  if (!automationKey.oauthConsentId || !oauthClientId) {
    throw new AppError(
      'Only apps connected through OAuth can manage webhook subscriptions',
      ErrorCodes.OAUTH_CONNECTION_REQUIRED,
      403
    );
  }

  return { oauthConsentId: automationKey.oauthConsentId, clientId: oauthClientId, keyId: automationKey.id };
}
