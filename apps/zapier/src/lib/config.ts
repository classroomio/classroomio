import { OAUTH_BASE_PATH, PUBLIC_API_PATH } from './paths';

function readOrigin(name: 'CIO_APP_ORIGIN' | 'CIO_API_ORIGIN'): string {
  const isFallback =
    process.env.NODE_ENV === 'test' || process.argv.some((arg) => arg.includes('validate') || arg.includes('vitest'));
  const fallback = isFallback
    ? name === 'CIO_API_ORIGIN'
      ? 'https://api.example.test'
      : 'https://app.example.test'
    : undefined;
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`${name} is not set for this integration version`);
  }

  return value.replace(/\/$/, '');
}

export const appOrigin = () => readOrigin('CIO_APP_ORIGIN');
export const apiOrigin = () => readOrigin('CIO_API_ORIGIN');
export const publicApiResource = () => `${apiOrigin()}${PUBLIC_API_PATH}`;

/**
 * Origin Zapier's servers call for the token and refresh grants. Defaults to the app origin the
 * discovery metadata advertises; set `CIO_OAUTH_TOKEN_ORIGIN` when the browser-facing app origin
 * is unreachable from Zapier, such as a localhost dashboard behind a tunnelled API.
 */
export const oauthTokenOrigin = () => process.env.CIO_OAUTH_TOKEN_ORIGIN?.replace(/\/$/, '') || appOrigin();
export const oauthTokenUrl = () => `${oauthTokenOrigin()}${OAUTH_BASE_PATH}/token`;

export const apiUrl = (path: string) => `${publicApiResource()}${path}`;
