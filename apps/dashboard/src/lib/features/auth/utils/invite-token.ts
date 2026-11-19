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

  const queryStart = redirectUrl.indexOf('?');

  if (queryStart === -1) {
    return null;
  }

  return new URLSearchParams(redirectUrl.slice(queryStart + 1)).get('invite_token');
}
