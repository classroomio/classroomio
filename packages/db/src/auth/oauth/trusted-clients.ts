import { OAUTH_TRUSTED_CLIENT_IDS } from '@db/constants';

export function isTrustedOAuthClient(clientId: string): boolean {
  return OAUTH_TRUSTED_CLIENT_IDS.includes(clientId);
}
