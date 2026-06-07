const {
  DASHBOARD_ORIGIN,
  PUBLIC_IS_SELFHOSTED,
  PUBLIC_SERVER_URL,
  TRUSTED_ORIGINS: TRUSTED_ORIGINS_STRING
} = process.env;

const dashboardOrigin = DASHBOARD_ORIGIN?.trim().replace(/\/$/, '');

const DEFAULT_TRUSTED_ORIGINS = [
  'http://localhost:5173',
  'https://*.classroomio.com',
  'https://*.myclassroomio.com',
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

export const TRUSTED_ORIGINS = [
  ...DEFAULT_TRUSTED_ORIGINS,
  ...(TRUSTED_ORIGINS_STRING
    ? TRUSTED_ORIGINS_STRING.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : []),
  ...(dashboardOrigin ? [dashboardOrigin] : [])
];

export const BASE_URL =
  PUBLIC_IS_SELFHOSTED === 'true' && dashboardOrigin ? dashboardOrigin : PUBLIC_SERVER_URL || 'http://localhost:3002';
