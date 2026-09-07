import { describe, expect, it } from 'vitest';

import { isAllowedHref, containsDisallowedHrefs } from '../src/validation/shared/safe-href';

describe('isAllowedHref', () => {
  const allowed = [
    { label: 'https URL', value: 'https://example.com' },
    { label: 'http URL', value: 'http://example.com' },
    { label: 'mailto link', value: 'mailto:user@example.com' },
    { label: 'tel link', value: 'tel:+1234567890' },
    { label: 'fragment anchor', value: '#section' },
    { label: 'empty fragment', value: '#' },
    { label: 'root-relative path', value: '/courses' },
    { label: 'dot-relative path', value: './page' },
    { label: 'parent-relative path', value: '../page' },
    { label: 'query-only string', value: '?tab=overview' },
    { label: 'https with path', value: 'https://example.com/path?q=1' }
  ];

  const blocked = [
    { label: 'javascript:', value: 'javascript:alert(1)' },
    { label: 'data:', value: 'data:text/html,<script>alert(1)</script>' },
    { label: 'vbscript:', value: 'vbscript:MsgBox(1)' },
    { label: 'javascript with tab in scheme', value: 'java\tscript:alert(1)' },
    { label: 'javascript with newline in scheme', value: 'java\nscript:alert(1)' },
    { label: 'javascript with carriage return', value: 'java\rscript:alert(1)' },
    { label: 'leading tab + javascript:', value: '\tjavascript:alert(1)' },
    { label: 'leading space + javascript:', value: ' javascript:alert(1)' },
    { label: 'leading C0 control + javascript:', value: '\x01javascript:alert(1)' },
    { label: 'embedded null byte', value: 'java\x00script:alert(1)' },
    { label: 'about:blank', value: 'about:blank' },
    { label: 'blob:', value: 'blob:https://example.com/id' },
    { label: 'empty string', value: '' },
    { label: 'whitespace only', value: '   ' },
    { label: 'plain text (no scheme)', value: 'Become a Certified AI Engineer' },
    { label: 'plain text with spaces', value: 'Start Learning' }
  ];

  it.each(allowed)('allows $label: $value', ({ value }) => {
    expect(isAllowedHref(value)).toBe(true);
  });

  it.each(blocked)('blocks $label: $value', ({ value }) => {
    expect(isAllowedHref(value)).toBe(false);
  });

  it('returns false for non-string values', () => {
    expect(isAllowedHref(undefined)).toBe(false);
    expect(isAllowedHref(null)).toBe(false);
    expect(isAllowedHref(42)).toBe(false);
    expect(isAllowedHref({})).toBe(false);
  });
});

describe('containsDisallowedHrefs', () => {
  it('returns false for clean objects', () => {
    expect(containsDisallowedHrefs({ href: 'https://example.com' })).toBe(false);
    expect(containsDisallowedHrefs({ href: '/courses' })).toBe(false);
    expect(containsDisallowedHrefs({ href: '#section' })).toBe(false);
  });

  it('returns false for text fields without schemes', () => {
    expect(
      containsDisallowedHrefs({
        heading: 'Become a Certified AI Engineer',
        subheading: 'Master the skills',
        label: 'Start Learning'
      })
    ).toBe(false);
  });

  it('returns false for nested clean objects', () => {
    expect(
      containsDisallowedHrefs({
        hero: { primaryAction: { href: '/login' } },
        navItems: [{ href: '/courses' }]
      })
    ).toBe(false);
  });

  it('returns true for javascript: in nested href', () => {
    expect(
      containsDisallowedHrefs({
        hero: { primaryAction: { href: 'javascript:alert(1)' } }
      })
    ).toBe(true);
  });

  it('returns true for javascript: with tab bypass in nested href', () => {
    expect(
      containsDisallowedHrefs({
        navItems: [{ href: 'java\tscript:alert(1)' }]
      })
    ).toBe(true);
  });

  it('returns true for data: in deeply nested value', () => {
    expect(
      containsDisallowedHrefs({
        footer: {
          columns: [{ links: [{ href: 'data:text/html,<script>alert(1)</script>' }] }]
        }
      })
    ).toBe(true);
  });

  it('returns false for arrays of clean values', () => {
    expect(containsDisallowedHrefs(['/a', '/b', 'https://example.com'])).toBe(false);
  });

  it('returns true for arrays containing a bad value', () => {
    expect(containsDisallowedHrefs(['/a', 'javascript:evil()'])).toBe(true);
  });

  it('returns false for non-string primitives', () => {
    expect(containsDisallowedHrefs(42)).toBe(false);
    expect(containsDisallowedHrefs(true)).toBe(false);
    expect(containsDisallowedHrefs(null)).toBe(false);
  });

  it('returns false for mixed text and safe hrefs', () => {
    expect(
      containsDisallowedHrefs({
        theme: 'quartz',
        hero: {
          heading: 'Become a Certified AI Engineer',
          subheading: 'Master the skills',
          primaryAction: { label: 'Start Learning', href: '/login' },
          secondaryAction: { label: 'Browse', href: '/courses' }
        },
        navItems: [{ label: 'Courses', href: '/courses' }]
      })
    ).toBe(false);
  });
});
