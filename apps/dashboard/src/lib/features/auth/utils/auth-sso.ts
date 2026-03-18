/**
 * Shared SSO auth state and helpers for login/signup flows.
 * Used by (auth)/login and (auth)/signup to avoid duplicating SSO logic.
 */

export type SsoAuthState = {
  checking: boolean;
  required: boolean;
  available: boolean;
  redirectUrl: string | null;
  providerName: string | null;
  providerId: string | null;
};

export const INITIAL_SSO_AUTH_STATE: SsoAuthState = {
  checking: false,
  required: false,
  available: false,
  redirectUrl: null,
  providerName: null,
  providerId: null
};

/** Shape returned by getOrgSsoInfo (avoids importing org types here). */
export type OrgSsoInfoShape = {
  hasSso: boolean;
  ssoRequired?: boolean;
  redirectUrl?: string | null;
  providerName?: string | null;
  providerId?: string | null;
} | null;

/** Shape returned by discoverSso (avoids importing org types here). */
export type SsoDiscoveryResultShape = {
  ssoRequired?: boolean;
  ssoAvailable?: boolean;
  redirectUrl?: string | null;
  providerName?: string | null;
  providerId?: string | null;
} | null;

export function ssoStateFromOrgInfo(orgInfo: OrgSsoInfoShape): SsoAuthState {
  if (!orgInfo) return INITIAL_SSO_AUTH_STATE;
  return {
    checking: false,
    required: orgInfo.ssoRequired ?? false,
    available: orgInfo.hasSso ?? false,
    redirectUrl: orgInfo.redirectUrl ?? null,
    providerName: orgInfo.providerName ?? null,
    providerId: orgInfo.providerId ?? null
  };
}

export function ssoStateFromDiscovery(result: SsoDiscoveryResultShape): SsoAuthState {
  if (!result) return INITIAL_SSO_AUTH_STATE;
  return {
    checking: false,
    required: result.ssoRequired ?? false,
    available: result.ssoAvailable ?? false,
    redirectUrl: result.redirectUrl ?? null,
    providerName: result.providerName ?? null,
    providerId: result.providerId ?? null
  };
}

export function buildSsoRedirectUrl(redirectParam: string | null): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const path = redirectParam && redirectParam.startsWith('/') ? redirectParam : '';
  return `${base}${path}`;
}

const SSO_EMAIL_DEBOUNCE_MS = 500;

export function createSsoEmailChecker(options: {
  getEmail: () => string;
  getOrgSupportsSso: () => boolean;
  discoverSso: (email: string) => Promise<SsoDiscoveryResultShape>;
  onChecking: () => void;
  onResult: (state: SsoAuthState) => void;
  onClear: () => void;
}) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return function handleEmailChange() {
    options.onClear();
    if (!options.getOrgSupportsSso()) return;

    clearTimeout(timeoutId);
    const email = options.getEmail();
    if (!email || !email.includes('@')) {
      options.onResult(INITIAL_SSO_AUTH_STATE);
      return;
    }

    options.onChecking();
    timeoutId = setTimeout(async () => {
      const result = await options.discoverSso(email);
      options.onResult(ssoStateFromDiscovery(result));
    }, SSO_EMAIL_DEBOUNCE_MS);
  };
}
