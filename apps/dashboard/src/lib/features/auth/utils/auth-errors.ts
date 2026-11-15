const EXISTING_ACCOUNT_ERROR_CODES = new Set(['USER_ALREADY_EXISTS', 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL']);

/** True when better-auth rejected an email sign-up because an account already uses that email. */
export function isExistingAccountError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return false;
  }

  return typeof error.code === 'string' && EXISTING_ACCOUNT_ERROR_CODES.has(error.code);
}

/** Login URL that keeps the sign-up page's query (redirects, invites) and pre-fills the email. */
export function buildLoginInsteadHref(search: string, email: string): string {
  const params = new URLSearchParams(search);
  const trimmedEmail = email.trim();

  if (trimmedEmail) {
    params.set('email', trimmedEmail);
  }

  const query = params.toString();

  return query ? `/login?${query}` : '/login';
}
