const {
  TRUSTED_ORIGINS: TRUSTED_ORIGINS_STRING,
  PUBLIC_SERVER_URL,
  AUTH_COOKIE_DOMAIN: AUTH_COOKIE_DOMAIN_STRING,
  DASHBOARD_ORIGIN: DASHBOARD_ORIGIN_STRING
} = process.env;

const DEFAULT_TRUSTED_ORIGINS = [
  'http://localhost:5173',
  'http://*.classroomio.*',
  // Common OIDC IdP discovery origins (SSO registration fetches .well-known/openid-configuration)
  'https://accounts.google.com',
  'https://account.google.com', // common typo for Google
  'https://oauth2.googleapis.com', // Google token endpoint (from discovery)
  'https://openidconnect.googleapis.com', // Google userinfo endpoint (from discovery)
  'https://www.googleapis.com', // Google jwks_uri (from discovery)
  'https://login.microsoftonline.com',
  'https://login.live.com',
  'https://auth0.com',
  'https://login.okta.com'
];

export const TRUSTED_ORIGINS = TRUSTED_ORIGINS_STRING
  ? [
      ...DEFAULT_TRUSTED_ORIGINS,
      ...TRUSTED_ORIGINS_STRING.split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    ]
  : DEFAULT_TRUSTED_ORIGINS;

export const BASE_URL = PUBLIC_SERVER_URL || 'http://localhost:3002';

function getAuthCookieDomain(): string | undefined {
  const explicit = AUTH_COOKIE_DOMAIN_STRING?.trim();
  if (explicit) return explicit;

  if (!DASHBOARD_ORIGIN_STRING?.trim()) return undefined;

  try {
    const url = new URL(DASHBOARD_ORIGIN_STRING.trim());
    return url.hostname || undefined;
  } catch {
    return undefined;
  }
}

export const AUTH_COOKIE_DOMAIN = getAuthCookieDomain();
