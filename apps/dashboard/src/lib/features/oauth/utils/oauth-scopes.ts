import type { OAuthScopeAccess, OAuthScopeGroupKey, OAuthScopeSummary } from './types';

export const OFFLINE_ACCESS_SCOPE = 'offline_access';

const SCOPE_GROUP_PREFIXES: Array<[string, OAuthScopeGroupKey]> = [
  ['course_import:', 'courses'],
  ['course:exercise:', 'exercises'],
  ['course:member:', 'course_members'],
  ['course:student:', 'course_members'],
  ['course:certificate:', 'certificates'],
  ['course:submission:', 'submissions'],
  ['course:', 'courses'],
  ['cohort:', 'cohorts'],
  ['audience:', 'audience'],
  ['team:', 'team'],
  ['organization:', 'organization'],
  ['analytics:', 'analytics'],
  ['media:', 'media']
];

const WRITE_SCOPE_SUFFIXES = [':write', ':create', ':update', ':publish'];

function getScopeGroup(scope: string): OAuthScopeGroupKey | null {
  const match = SCOPE_GROUP_PREFIXES.find(([prefix]) => scope.startsWith(prefix));

  return match ? match[1] : null;
}

function getScopeAccess(scope: string): OAuthScopeAccess {
  return WRITE_SCOPE_SUFFIXES.some((suffix) => scope.endsWith(suffix)) ? 'write' : 'read';
}

/**
 * Collapses raw OAuth scopes into one entry per area, taking the highest access level requested in it.
 */
export function summarizeOAuthScopes(scopes: string[]): OAuthScopeSummary[] {
  const accessByGroup = new Map<OAuthScopeGroupKey, OAuthScopeAccess>();

  for (const scope of scopes) {
    const group = getScopeGroup(scope);

    if (!group) continue;

    const access = getScopeAccess(scope);

    if (accessByGroup.get(group) !== 'write') {
      accessByGroup.set(group, access);
    }
  }

  return Array.from(accessByGroup, ([group, access]) => ({ group, access }));
}

export function parseOAuthScopeParam(scopeParam: string | null): string[] {
  return scopeParam ? scopeParam.split(' ').filter(Boolean) : [];
}

export function hasOfflineAccess(scopes: string[]): boolean {
  return scopes.includes(OFFLINE_ACCESS_SCOPE);
}

export function getOAuthQuery(search: string): string {
  return search.replace(/^\?/, '');
}

export function isOAuthAuthorizationQuery(searchParams: URLSearchParams): boolean {
  return searchParams.has('client_id') && searchParams.has('sig');
}

export function buildOAuthAuthorizeUrl(search: string): string {
  return `/api/auth/oauth2/authorize${search}`;
}
