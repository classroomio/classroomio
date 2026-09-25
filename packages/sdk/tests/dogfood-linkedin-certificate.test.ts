import { describe, expect, it } from 'vitest';
import { defineConfig, resolveConfig } from '@cio/sdk';
import { linkedinCertificate } from '@cio/plugins';
import { buildLinkedInCertificationUrl } from '../../../plugins/integration/linkedin-certificate/utils/linkedin-url';

describe('Dogfood: LinkedIn Certificate Integration Plugin', () => {
  it('validates and registers the plugin cleanly with resolveConfig via factory function', () => {
    const config = defineConfig({
      plugins: [linkedinCertificate()]
    });
    const resolved = resolveConfig(config);

    expect(resolved.plugins).toHaveLength(1);
    expect(resolved.plugins[0].id).toBe('integration_linkedin_certificate');
    expect(resolved.plugins[0].category).toBe('integration');
    expect(resolved.slots['certificate.actions']).toBeDefined();
  });

  it('builds complete official LinkedIn certification deep-link URL', () => {
    const urlString = buildLinkedInCertificationUrl({
      courseTitle: 'Advanced TypeScript & System Architecture',
      orgName: 'Acme Academy',
      earnedAt: '2026-09-15T12:00:00.000Z',
      certificateId: 'CLS-CERT-2026-9842',
      verificationUrl: 'https://app.classroomio.com/verify/CLS-CERT-2026-9842'
    });

    const url = new URL(urlString);
    expect(url.origin).toBe('https://www.linkedin.com');
    expect(url.pathname).toBe('/profile/add');
    expect(url.searchParams.get('startTask')).toBe('CERTIFICATION_NAME');
    expect(url.searchParams.get('name')).toBe('Advanced TypeScript & System Architecture');
    expect(url.searchParams.get('organizationName')).toBe('Acme Academy');
    expect(url.searchParams.get('issueYear')).toBe('2026');
    expect(url.searchParams.get('issueMonth')).toBe('9');
    expect(url.searchParams.get('certId')).toBe('CLS-CERT-2026-9842');
    expect(url.searchParams.get('certUrl')).toBe('https://app.classroomio.com/verify/CLS-CERT-2026-9842');
  });

  it('handles edge cases in URL builder gracefully', () => {
    const urlString = buildLinkedInCertificationUrl({
      courseTitle: 'Intro to SQL',
      orgName: 'Data University',
      earnedAt: null,
      certificateId: undefined,
      verificationUrl: undefined
    });

    const url = new URL(urlString);
    expect(url.searchParams.get('name')).toBe('Intro to SQL');
    expect(url.searchParams.get('organizationName')).toBe('Data University');
    expect(url.searchParams.get('issueYear')).toBe(String(new Date().getFullYear()));
    expect(url.searchParams.has('certId')).toBe(false);
    expect(url.searchParams.has('certUrl')).toBe(false);
  });
});
