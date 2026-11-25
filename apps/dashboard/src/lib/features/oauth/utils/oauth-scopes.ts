import { OFFLINE_ACCESS_SCOPE, isOAuthWriteScope } from '@cio/utils/constants/oauth-scopes';

import type { OAuthScopeAccess, OAuthScopeGroupKey, OAuthScopeSummary } from './types';

export { OFFLINE_ACCESS_SCOPE };

const SCOPE_GROUP_PREFIXES: Array<[string, OAuthScopeGroupKey]> = [
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
  ['media:', 'media'],
  ['webhook:', 'webhooks']
];

function getScopeGroup(scope: string): OAuthScopeGroupKey | null {
  const match = SCOPE_GROUP_PREFIXES.find(([prefix]) => scope.startsWith(prefix));

  return match ? match[1] : null;
}

function getScopeAccess(scope: string): OAuthScopeAccess {
  return isOAuthWriteScope(scope) ? 'write' : 'read';
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

export const OAUTH_CONSENT_PAGE_PATH = '/oauth/consent';

/**
 * Returns the signed authorization query when `url` points at the consent page, or `null` when it is any other
 * destination, such as the client's redirect URI carrying an authorization code.
 */
export function getOAuthConsentPageQuery(url: string, baseUrl: string): string | null {
  const parsedUrl = new URL(url, baseUrl);
  const isConsentPage =
    parsedUrl.pathname === OAUTH_CONSENT_PAGE_PATH && isOAuthAuthorizationQuery(parsedUrl.searchParams);

  return isConsentPage ? getOAuthQuery(parsedUrl.search) : null;
}

export function buildOAuthAuthorizeUrl(search: string): string {
  return `/api/auth/oauth2/authorize${search}`;
}

export const OAUTH_RESOURCE_PARAM = 'resource';

export function getOAuthResource(searchParams: URLSearchParams): string | undefined {
  return searchParams.get(OAUTH_RESOURCE_PARAM) ?? undefined;
}
