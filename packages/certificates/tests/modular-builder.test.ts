import { describe, expect, it } from 'vitest';
import { renderCertificateDocument, resolveCertificateDesign } from '../src/render';
import type { CertificateDesign, CertificateRenderData } from '../src/types';

const renderData: CertificateRenderData = {
  recipientName: 'Ada Lovelace',
  courseName: 'Analytical Engines',
  courseDescription: 'For completing the course.',
  orgName: 'Royal Academy',
  date: 'September 28, 2026',
  certificateId: 'CERT-0042'
};

function createDesign(overrides: Partial<CertificateDesign> = {}): CertificateDesign {
  return {
    rendererTemplateId: 'modular',
    templateId: 'classique',
    accentColor: '#D4AF37',
    signatories: [],
    ...overrides
  };
}

describe('modular certificate renderer', () => {
  it('renders independently positioned subtitle and description elements', () => {
    const html = renderCertificateDocument(
      createDesign({
        elements: {
          subtitle: { positionMode: 'custom', x: 100, y: 140, width: 500, height: 30 },
          description: { positionMode: 'custom', x: 160, y: 390, width: 680, height: 60 }
        }
      }),
      renderData
    );

    expect(html).toContain('data-certificate-element="subtitle" data-position-mode="custom"');
    expect(html).toContain('data-certificate-element="description" data-position-mode="custom"');
    expect(html).toContain('left: 100px; top: 140px');
    expect(html).toContain('left: 160px; top: 390px');
  });

  it('keeps required fields visible and balances up to three signatories', () => {
    const html = renderCertificateDocument(
      createDesign({
        elements: {
          recipient: { enabled: false },
          course: { enabled: false }
        },
        signatories: [
          { id: 'one', name: 'Signer One', role: 'Dean', enabled: true },
          { id: 'two', name: 'Signer Two', role: 'Director', enabled: true },
          { id: 'three', name: 'Signer Three', role: 'Instructor', enabled: true }
        ]
      }),
      renderData
    );

    expect(html).toContain('Ada Lovelace');
    expect(html).toContain('Analytical Engines');
    expect(html).toContain('footer-three-sig');
    expect(html).toContain('Signer One');
    expect(html).toContain('Signer Two');
    expect(html).toContain('Signer Three');
  });

  it('preserves an explicitly empty signatory list', () => {
    const resolved = resolveCertificateDesign({
      design: {
        rendererTemplateId: 'modular',
        templateId: 'classique',
        accentColor: '#D4AF37',
        signatories: []
      }
    });
    const html = renderCertificateDocument(resolved, renderData);

    expect(resolved.signatories).toEqual([]);
    expect(html).not.toContain('class="sig-col"');
  });

  it('normalizes modular records without losing their base template or legacy visibility', () => {
    const resolved = resolveCertificateDesign({
      design: {
        rendererTemplateId: 'modular',
        templateId: 'poster',
        accentColor: '#D4AF37',
        signatories: [
          {
            id: 'signer-one',
            name: 'Signer One',
            role: 'Dean',
            signatureAssetId: '11111111-1111-4111-8111-111111111111'
          }
        ],
        badge: { style: 'none' },
        qrCode: { enabled: false },
        layout: { titleOffsetY: 12 }
      }
    });

    expect(resolved.rendererTemplateId).toBe('modular');
    expect(resolved.templateId).toBe('poster');
    expect(resolved.signatories[0].signatureAssetId).toBe('11111111-1111-4111-8111-111111111111');
    expect(resolved.elements?.badge?.enabled).toBe(false);
    expect(resolved.elements?.qrCode?.enabled).toBe(false);
    expect(resolved.layout?.titleOffsetY).toBe(12);
  });

  it('requires both legacy and element visibility settings for badges and references', () => {
    const html = renderCertificateDocument(
      createDesign({
        elements: {
          badge: { enabled: true },
          qrCode: { enabled: true }
        },
        badge: { style: 'none' },
        qrCode: { enabled: false }
      }),
      renderData
    );

    expect(html).not.toContain('class="modular-seal"');
    expect(html).not.toContain('class="modular-qr"');
  });

  it('does not render raw SVG or unsafe image schemes', () => {
    const maliciousDesign = createDesign({
      copy: {
        title: '<img src=x onerror="alert(1)">'
      },
      border: {
        style: 'custom_image',
        customImageUrl: 'javascript:alert(1)',
        ...({ customSvg: '<svg><script>alert(1)</script></svg>' } as Record<string, string>)
      },
      badge: {
        style: 'custom',
        customImageUrl: 'data:image/svg+xml,<svg onload="alert(1)"></svg>'
      },
      signatories: [
        {
          name: 'Unsafe signer',
          role: 'Tester',
          enabled: true,
          signatureUrl: 'javascript:alert(1)'
        }
      ]
    });
    const html = renderCertificateDocument(maliciousDesign, renderData);

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).not.toContain('<img src=x onerror=');
    expect(html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    expect(html).not.toContain('javascript:alert(1)');
    expect(html).not.toContain('data:image/svg+xml');
  });

  it('uses author copy before runtime labels and emits a restrictive CSP', () => {
    const html = renderCertificateDocument(
      createDesign({
        copy: {
          completion: 'AUTHOR COMPLETION LABEL',
          verifiedCredentialLabel: 'AUTHOR REFERENCE LABEL'
        }
      }),
      {
        ...renderData,
        labels: {
          completionLabel: 'RUNTIME COMPLETION LABEL',
          verifiedCredentialLabel: 'RUNTIME REFERENCE LABEL'
        }
      }
    );

    expect(html).toContain('AUTHOR COMPLETION LABEL');
    expect(html).not.toContain('RUNTIME COMPLETION LABEL');
    expect(html).toContain('AUTHOR REFERENCE LABEL');
    expect(html).toContain('Content-Security-Policy');
    expect(html).toContain("default-src 'none'");
  });

  it('renders organization logo seal with image when orgLogoUrl is provided and monogram fallback when omitted', () => {
    const withLogoHtml = renderCertificateDocument(
      createDesign({
        badge: { style: 'org_logo', foilColor: '#D4AF37' }
      }),
      {
        ...renderData,
        orgLogoUrl: 'https://example.com/org-logo.png'
      }
    );

    expect(withLogoHtml).toContain('class="modular-seal modular-org-logo-seal"');
    expect(withLogoHtml).toContain('src="https://example.com/org-logo.png"');
    expect(withLogoHtml).toContain('alt="Royal Academy"');

    const monogramHtml = renderCertificateDocument(
      createDesign({
        badge: { style: 'org_logo', foilColor: '#D4AF37' }
      }),
      renderData
    );

    expect(monogramHtml).toContain('class="modular-seal modular-org-logo-seal"');
    expect(monogramHtml).toContain('>R<');
    expect(monogramHtml).toContain('SEAL');
  });
});
