const RELATIVE_URL_BASE = 'http://localhost';

/** Course invite token from the sign-up URL, either directly or inside its `redirect` target. */
export function getInviteTokenFromSignupUrl(searchParams: URLSearchParams): string | null {
  const directToken = searchParams.get('invite_token');

  if (directToken) {
    return directToken;
  }

  const redirectUrl = searchParams.get('redirect');

  if (!redirectUrl) {
    return null;
  }

  try {
    return new URL(redirectUrl, RELATIVE_URL_BASE).searchParams.get('invite_token');
  } catch {
    return null;
  }
}
