import { describe, expect, it } from 'vitest';

import { ZLoginLinkQuery } from '../src/validation/organization/login-link';
import { ZTokenExchangeQuery } from '../src/validation/organization/token-auth';
import { isSafeRelativePath, toSafeRelativePath } from '../src/validation/shared/safe-redirect';

const accepted = [
  '/',
  '/lms',
  '/courses/123/lessons?next=true',
  '/courses/123#section',
  '/search?q=a%2F%2Fb',
  '/%2F%2Fevil.com',
  '/a//b',
  '/a/../b'
];

const rejected: Array<{ label: string; value: unknown }> = [
  { label: 'protocol-relative', value: '//evil.com' },
  { label: 'protocol-relative with path', value: '//evil.com/lms' },
  { label: 'slash backslash', value: '/\\evil.com' },
  { label: 'backslash slash', value: '\\/evil.com' },
  { label: 'backslash in path', value: '/lms\\..\\x' },
  { label: 'tab between slashes', value: '/\t/evil.com' },
  { label: 'newline between slashes', value: '/\n/evil.com' },
  { label: 'carriage return', value: '/\r/evil.com' },
  { label: 'null byte', value: '/lms\u0000' },
  { label: 'delete character', value: '/lms\u007f' },
  { label: 'absolute https URL', value: 'https://evil.com' },
  { label: 'javascript scheme', value: 'javascript:alert(1)' },
  { label: 'scheme-relative with leading space', value: ' //evil.com' },
  { label: 'dot-relative path', value: './lms' },
  { label: 'bare path', value: 'lms' },
  { label: 'empty string', value: '' },
  { label: 'undefined', value: undefined },
  { label: 'non-string', value: 42 }
];

describe('isSafeRelativePath', () => {
  it.each(accepted)('accepts %j', (value) => {
    expect(isSafeRelativePath(value)).toBe(true);
  });

  it.each(rejected)('rejects $label', ({ value }) => {
    expect(isSafeRelativePath(value)).toBe(false);
  });
});

describe('toSafeRelativePath', () => {
  it('keeps a safe path', () => {
    expect(toSafeRelativePath('/courses/1')).toBe('/courses/1');
  });

  it('falls back to / for an off-origin path', () => {
    expect(toSafeRelativePath('//evil.com')).toBe('/');
  });

  it('uses the given fallback', () => {
    expect(toSafeRelativePath('/\\evil.com', '/lms')).toBe('/lms');
  });
});

describe.each([
  { name: 'ZLoginLinkQuery', schema: ZLoginLinkQuery },
  { name: 'ZTokenExchangeQuery', schema: ZTokenExchangeQuery }
])('$name redirect', ({ schema }) => {
  it('keeps a same-origin path', () => {
    const parsed = schema.parse({ token: 't', redirect: '/courses/1/lessons?next=true' });

    expect(parsed.redirect).toBe('/courses/1/lessons?next=true');
  });

  it('defaults a missing redirect to /', () => {
    expect(schema.parse({ token: 't' }).redirect).toBe('/');
  });

  it.each(['//evil.com', '/\\evil.com', '/\t/evil.com', 'https://evil.com'])('replaces %j with /', (redirect) => {
    expect(schema.parse({ token: 't', redirect }).redirect).toBe('/');
  });
});
