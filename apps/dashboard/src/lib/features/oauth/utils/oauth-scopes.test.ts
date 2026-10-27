import { describe, expect, it } from 'vitest';

import {
  buildOAuthAuthorizeUrl,
  getOAuthQuery,
  hasOfflineAccess,
  isOAuthAuthorizationQuery,
  parseOAuthScopeParam,
  summarizeOAuthScopes
} from './oauth-scopes';

describe('summarizeOAuthScopes', () => {
  it('collapses scopes of the same area and keeps the highest access', () => {
    const summary = summarizeOAuthScopes([
      'course:read',
      'course:write',
      'course:tag:write',
      'course_import:draft:read'
    ]);

    expect(summary).toEqual([{ group: 'courses', access: 'write' }]);
  });

  it('reports read-only areas as read', () => {
    expect(summarizeOAuthScopes(['team:read', 'analytics:read'])).toEqual([
      { group: 'team', access: 'read' },
      { group: 'analytics', access: 'read' }
    ]);
  });

  it('keeps nested course areas apart from the course scopes', () => {
    const summary = summarizeOAuthScopes([
      'course:read',
      'course:exercise:write',
      'course:member:read',
      'course:student:write',
      'course:certificate:read',
      'course:submission:read'
    ]);

    expect(summary).toEqual([
      { group: 'courses', access: 'read' },
      { group: 'exercises', access: 'write' },
      { group: 'course_members', access: 'write' },
      { group: 'certificates', access: 'read' },
      { group: 'submissions', access: 'read' }
    ]);
  });

  it('ignores scopes that are not an area, such as offline_access', () => {
    expect(summarizeOAuthScopes(['offline_access', 'openid'])).toEqual([]);
  });
});

describe('oauth query helpers', () => {
  it('splits the scope parameter on spaces', () => {
    expect(parseOAuthScopeParam('course:read offline_access')).toEqual(['course:read', 'offline_access']);
    expect(parseOAuthScopeParam(null)).toEqual([]);
  });

  it('detects offline access', () => {
    expect(hasOfflineAccess(['offline_access'])).toBe(true);
    expect(hasOfflineAccess(['course:read'])).toBe(false);
  });

  it('only treats signed authorization queries as OAuth requests', () => {
    expect(isOAuthAuthorizationQuery(new URLSearchParams('client_id=abc&sig=xyz'))).toBe(true);
    expect(isOAuthAuthorizationQuery(new URLSearchParams('client_id=abc'))).toBe(false);
    expect(isOAuthAuthorizationQuery(new URLSearchParams('redirect=/courses'))).toBe(false);
  });

  it('rebuilds the authorize URL from the current query', () => {
    expect(getOAuthQuery('?client_id=abc&sig=xyz')).toBe('client_id=abc&sig=xyz');
    expect(buildOAuthAuthorizeUrl('?client_id=abc&sig=xyz')).toBe('/api/auth/oauth2/authorize?client_id=abc&sig=xyz');
  });
});
