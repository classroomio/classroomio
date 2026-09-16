import { describe, expect, it } from 'vitest';
import { buildLinkedInCertificationUrl } from '../utils/linkedin-url';

describe('buildLinkedInCertificationUrl', () => {
  it('builds valid URL with all parameters provided', () => {
    const urlString = buildLinkedInCertificationUrl({
      courseTitle: 'Advanced TypeScript & Architecture',
      orgName: 'Acme Academy',
      earnedAt: '2026-09-15T10:00:00.000Z',
      certificateId: 'CLS-CERT-2026-9842',
      verificationUrl: 'https://app.classroomio.com/verify/CLS-CERT-2026-9842'
    });

    const url = new URL(urlString);
    expect(url.origin).toBe('https://www.linkedin.com');
    expect(url.pathname).toBe('/profile/add');
    expect(url.searchParams.get('startTask')).toBe('CERTIFICATION_NAME');
    expect(url.searchParams.get('name')).toBe('Advanced TypeScript & Architecture');
    expect(url.searchParams.get('organizationName')).toBe('Acme Academy');
    expect(url.searchParams.get('issueYear')).toBe('2026');
    expect(url.searchParams.get('issueMonth')).toBe('9');
    expect(url.searchParams.get('certId')).toBe('CLS-CERT-2026-9842');
    expect(url.searchParams.get('certUrl')).toBe('https://app.classroomio.com/verify/CLS-CERT-2026-9842');
  });

  it('handles empty/missing optional parameters gracefully', () => {
    const urlString = buildLinkedInCertificationUrl({
      courseTitle: 'Intro to Programming',
      orgName: 'Code Lab'
    });

    const url = new URL(urlString);
    expect(url.searchParams.get('name')).toBe('Intro to Programming');
    expect(url.searchParams.get('organizationName')).toBe('Code Lab');
    expect(url.searchParams.has('certId')).toBe(false);
    expect(url.searchParams.has('certUrl')).toBe(false);
    expect(url.searchParams.get('issueYear')).toBe(String(new Date().getFullYear()));
  });

  it('correctly maps Date object to 1-indexed month', () => {
    // January is month index 0 in JS, but LinkedIn expects 1
    const janDate = new Date(2025, 0, 15);
    const urlString = buildLinkedInCertificationUrl({
      courseTitle: 'Winter Bootcamp',
      orgName: 'Academy',
      earnedAt: janDate
    });

    const url = new URL(urlString);
    expect(url.searchParams.get('issueYear')).toBe('2025');
    expect(url.searchParams.get('issueMonth')).toBe('1');
  });
});
