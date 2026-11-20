import { describe, expect, it } from 'vitest';

import { isPublicOAuthPath } from './cors';

describe('isPublicOAuthPath', () => {
  it.each([
    '/.well-known/oauth-authorization-server',
    '/api/auth/.well-known/oauth-authorization-server',
    '/api/auth/.well-known/openid-configuration',
    '/api/auth/oauth2/token',
    '/api/auth/jwks'
  ])('treats %s as public', (path) => {
    expect(isPublicOAuthPath(path)).toBe(true);
  });

  it('keeps session routes private', () => {
    expect(isPublicOAuthPath('/api/auth/sign-in/email')).toBe(false);
  });
});
