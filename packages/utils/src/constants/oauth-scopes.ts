const WRITE_SCOPE_SUFFIXES = [':write', ':create', ':update', ':publish'] as const;

export const OFFLINE_ACCESS_SCOPE = 'offline_access' as const;

/**
 * Write scopes a read-only connection still holds: subscribing to events changes no workspace data,
 * and without it a read-only connection could not run triggers.
 */
export const READ_ONLY_RETAINED_WRITE_SCOPES = ['webhook:subscription:write'] as const;

export function isOAuthWriteScope(scope: string): boolean {
  return WRITE_SCOPE_SUFFIXES.some((suffix) => scope.endsWith(suffix));
}

/**
 * Whether granting `scope` lets the connected app change workspace data.
 */
export function isOAuthDataChangeScope(scope: string): boolean {
  return isOAuthWriteScope(scope) && !(READ_ONLY_RETAINED_WRITE_SCOPES as readonly string[]).includes(scope);
}

/**
 * The scopes of `requestedScopes` that a read-only connection keeps.
 */
export function getReadOnlyOAuthScopes(requestedScopes: readonly string[]): string[] {
  return requestedScopes.filter((scope) => !isOAuthDataChangeScope(scope));
}

export function canOAuthScopesChangeData(scopes: readonly string[]): boolean {
  return scopes.some(isOAuthDataChangeScope);
}
