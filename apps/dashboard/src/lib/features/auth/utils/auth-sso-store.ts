/**
 * Global SSO auth state for the current org. Shared by login and signup
 * so we don't re-fetch when navigating between them.
 */

import { get, writable } from 'svelte/store';
import { INITIAL_SSO_AUTH_STATE, ssoStateFromOrgInfo, type OrgSsoInfoShape, type SsoAuthState } from './auth-sso';

export type AuthSsoStore = {
  /** Org we loaded SSO info for; when nav changes org we re-fetch */
  loadedForOrgId: string | null;
  /** Org-level SSO state from getOrgSsoInfo */
  ssoState: SsoAuthState;
  orgSupportsSso: boolean;
};

const initial: AuthSsoStore = {
  loadedForOrgId: null,
  ssoState: INITIAL_SSO_AUTH_STATE,
  orgSupportsSso: false
};

export const authSsoStore = writable<AuthSsoStore>(initial);

/**
 * Ensures SSO info for the given org is loaded. If we already have data for
 * this orgId, does nothing. Otherwise fetches and updates the store.
 */
export async function ensureSsoInfoLoaded(
  orgId: string,
  fetchOrgSsoInfo: (id: string) => Promise<OrgSsoInfoShape>
): Promise<void> {
  const current = get(authSsoStore);
  if (current.loadedForOrgId === orgId) return;

  const orgInfo = await fetchOrgSsoInfo(orgId);
  const ssoState = ssoStateFromOrgInfo(orgInfo);

  authSsoStore.set({
    loadedForOrgId: orgId,
    ssoState,
    orgSupportsSso: orgInfo?.hasSso ?? false
  });
}
