import { describe, expect, it } from 'vitest';

import { getPostJoinRedirect, resolveOrgJoinRedirect } from './org-join-redirect';

const ORIGIN = 'https://academy.example.com';

describe('resolveOrgJoinRedirect', () => {
  it('preserves application-relative destinations', () => {
    expect(resolveOrgJoinRedirect('/courses/123?tab=overview#content', ORIGIN)).toBe(
      '/courses/123?tab=overview#content'
    );
  });

  it('normalizes same-origin absolute destinations', () => {
    expect(resolveOrgJoinRedirect('https://academy.example.com/lms', ORIGIN)).toBe('/lms');
  });

  it.each(['https://attacker.example/phishing', '//attacker.example/phishing', 'javascript:alert(1)'])(
    'falls back for an unsafe destination: %s',
    (redirectTo) => {
      expect(resolveOrgJoinRedirect(redirectTo, ORIGIN)).toBe('/lms');
    }
  );
});

describe('getPostJoinRedirect', () => {
  it('prefers an explicit redirect', () => {
    expect(getPostJoinRedirect({ hasStudentHome: true }, '/lms/certificates')).toBe('/lms/certificates');
    expect(getPostJoinRedirect(null, '/lms')).toBe('/lms');
  });

  it('sends students without a redirect through the student home', () => {
    expect(getPostJoinRedirect({ hasStudentHome: true }, null)).toBe('/');
  });

  it('keeps /lms without a student home', () => {
    expect(getPostJoinRedirect({ hasStudentHome: false }, null)).toBe('/lms');
    expect(getPostJoinRedirect(null, null)).toBe('/lms');
    expect(getPostJoinRedirect(undefined, null)).toBe('/lms');
  });
});
