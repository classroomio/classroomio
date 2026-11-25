import { describe, expect, it } from 'vitest';

import { buildLoginInsteadHref, isExistingAccountError } from './auth-errors';

describe('isExistingAccountError', () => {
  it('matches both better-auth duplicate-user codes', () => {
    expect(isExistingAccountError({ code: 'USER_ALREADY_EXISTS' })).toBe(true);
    expect(isExistingAccountError({ code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL', status: 422 })).toBe(true);
  });

  it('ignores other errors', () => {
    expect(isExistingAccountError({ code: 'INVALID_EMAIL' })).toBe(false);
    expect(isExistingAccountError(new Error('User already exists'))).toBe(false);
    expect(isExistingAccountError(null)).toBe(false);
    expect(isExistingAccountError('USER_ALREADY_EXISTS')).toBe(false);
  });
});

describe('buildLoginInsteadHref', () => {
  it('keeps the existing query and pre-fills the email', () => {
    expect(buildLoginInsteadHref('?redirect=%2Finvite%2Fabc', ' me@example.com ')).toBe(
      '/login?redirect=%2Finvite%2Fabc&email=me%40example.com'
    );
  });

  it('replaces a stale email in the query', () => {
    expect(buildLoginInsteadHref('?email=old%40example.com', 'new@example.com')).toBe('/login?email=new%40example.com');
  });

  it('falls back to a bare login path', () => {
    expect(buildLoginInsteadHref('', '')).toBe('/login');
  });
});
