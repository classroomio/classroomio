import { describe, expect, it } from 'vitest';

import {
  buildEmailFromName,
  escapeHtml,
  sanitizeEmailDisplayName,
  sanitizeEmailSubject
} from '../src/utils/functions/email-helpers';

const DEFAULT_FROM = '"Best from ClassroomIO" <notify@mail.classroomio.com>';

describe('escapeHtml', () => {
  it('escapes HTML metacharacters', () => {
    expect(escapeHtml(`Tom & Jerry's "Lab"`)).toBe('Tom &amp; Jerry&#39;s &quot;Lab&quot;');
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert(1)&gt;');
  });
});

describe('sanitizeEmailDisplayName', () => {
  it('strips control characters and trims whitespace', () => {
    expect(sanitizeEmailDisplayName('  Acme\r\nAcademy\u0000  ')).toBe('Acme Academy');
    expect(sanitizeEmailDisplayName('Acme\x01Academy\x7F')).toBe('Acme Academy');
  });

  it('backslash-escapes embedded quotes per RFC 5322 quoted-strings', () => {
    expect(sanitizeEmailDisplayName('Alice "Admin" Academy')).toBe('Alice \\"Admin\\" Academy');
  });

  it('escapes backslashes before quotes', () => {
    expect(sanitizeEmailDisplayName('Acme\\Corp "East"')).toBe('Acme\\\\Corp \\"East\\"');
  });
});

describe('sanitizeEmailSubject', () => {
  it('strips control characters and trims whitespace', () => {
    expect(sanitizeEmailSubject('  Invite to Acme\r\n\rAcademy\u0000  ')).toBe('Invite to Acme Academy');
    expect(sanitizeEmailSubject('Invite\x01to\x7FAcme')).toBe('Invite to Acme');
  });

  it('preserves quotes in subject text', () => {
    expect(sanitizeEmailSubject('Join "Acme" today')).toBe('Join "Acme" today');
  });
});

describe('buildEmailFromName', () => {
  it('returns the default sender when name is missing or empty after sanitization', () => {
    expect(buildEmailFromName()).toBe(DEFAULT_FROM);
    expect(buildEmailFromName('')).toBe(DEFAULT_FROM);
    expect(buildEmailFromName('\r\n\u0000')).toBe(DEFAULT_FROM);
  });

  it('wraps a plain display name in a quoted From header', () => {
    expect(buildEmailFromName('Acme Academy (via ClassroomIO.com)')).toBe(
      '"Acme Academy (via ClassroomIO.com)" <notify@mail.classroomio.com>'
    );
  });

  it('sanitizes embedded quotes in the display name', () => {
    expect(buildEmailFromName('Alice "Admin" Academy (via ClassroomIO.com)')).toBe(
      '"Alice \\"Admin\\" Academy (via ClassroomIO.com)" <notify@mail.classroomio.com>'
    );
  });
});
