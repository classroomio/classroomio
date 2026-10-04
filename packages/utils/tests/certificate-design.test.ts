import { describe, expect, it } from 'vitest';
import { ZCertificateDesign } from '../src/validation/course';
import { ZCreateOrgCertificatePreset, ZUpdateOrgCertificatePreset } from '../src/validation/plugins';

describe('ZCertificateDesign validation', () => {
  it('validates a minimal certificate design with default signatories', () => {
    const parsed = ZCertificateDesign.parse({
      rendererTemplateId: 'modular',
      templateId: 'classique',
      accentColor: '#D4AF37'
    });

    expect(parsed.rendererTemplateId).toBe('modular');
    expect(parsed.signatories).toEqual([]);
  });

  it('validates 0, 1, 2, or 3 signatories', () => {
    // 0 signatories
    const zero = ZCertificateDesign.parse({
      rendererTemplateId: 'modular',
      accentColor: '#D4AF37',
      signatories: []
    });
    expect(zero.signatories).toHaveLength(0);

    // 1 signatory
    const one = ZCertificateDesign.parse({
      rendererTemplateId: 'modular',
      accentColor: '#D4AF37',
      signatories: [{ name: 'Alice', role: 'Director', enabled: true }]
    });
    expect(one.signatories).toHaveLength(1);
    expect(one.signatories[0].name).toBe('Alice');

    // 3 signatories
    const three = ZCertificateDesign.parse({
      rendererTemplateId: 'modular',
      accentColor: '#D4AF37',
      signatories: [
        { name: 'Alice', role: 'Director', enabled: true },
        { name: 'Bob', role: 'Instructor', enabled: true },
        { name: 'Charlie', role: 'Facilitator', enabled: false }
      ]
    });
    expect(three.signatories).toHaveLength(3);
  });

  it('rejects more than 3 signatories', () => {
    const invalid = {
      rendererTemplateId: 'modular',
      accentColor: '#D4AF37',
      signatories: [
        { name: 'Alice', role: 'Director', enabled: true },
        { name: 'Bob', role: 'Instructor', enabled: true },
        { name: 'Charlie', role: 'Facilitator', enabled: true },
        { name: 'Dave', role: 'Coordinator', enabled: true }
      ]
    };

    expect(() => ZCertificateDesign.parse(invalid)).toThrow();
  });

  it('validates custom element layouts with coordinates', () => {
    const parsed = ZCertificateDesign.parse({
      rendererTemplateId: 'modular',
      accentColor: '#D4AF37',
      elements: {
        badge: {
          enabled: true,
          positionMode: 'custom',
          x: 450,
          y: 600,
          width: 120,
          height: 120
        },
        qrCode: {
          enabled: false
        },
        'signatory-0': {
          enabled: true,
          positionMode: 'custom',
          x: 180,
          y: 590,
          width: 220,
          height: 110
        },
        background: {
          enabled: true
        }
      }
    });

    expect(parsed.elements?.badge?.positionMode).toBe('custom');
    expect(parsed.elements?.badge?.x).toBe(450);
    expect(parsed.elements?.qrCode?.enabled).toBe(false);
    expect(parsed.elements?.['signatory-0']?.x).toBe(180);
    expect(parsed.elements?.background?.enabled).toBe(true);
  });

  it('validates copy overrides', () => {
    const parsed = ZCertificateDesign.parse({
      rendererTemplateId: 'modular',
      accentColor: '#D4AF37',
      copy: {
        title: 'MASTER OF ARCHITECTURE',
        presentation: 'THIS CREDENTIAL HONORS',
        dateLabel: 'Conferred On:',
        organizationName: 'Global Institute of Design'
      }
    });

    expect(parsed.copy?.title).toBe('MASTER OF ARCHITECTURE');
    expect(parsed.copy?.organizationName).toBe('Global Institute of Design');
  });

  it('rejects unknown and executable nested properties', () => {
    const rawSvgDesign = {
      rendererTemplateId: 'modular',
      accentColor: '#D4AF37',
      border: {
        style: 'custom_image',
        customSvg: '<svg><script>alert(1)</script></svg>'
      }
    };
    const unknownElementDesign = {
      rendererTemplateId: 'modular',
      accentColor: '#D4AF37',
      elements: {
        arbitraryHtml: { enabled: true }
      }
    };

    expect(() => ZCertificateDesign.parse(rawSvgDesign)).toThrow();
    expect(() => ZCertificateDesign.parse(unknownElementDesign)).toThrow();
  });

  it('rejects unsafe image URLs', () => {
    const unsafeSchemes = ['javascript:alert(1)', 'data:image/svg+xml,<svg></svg>', 'http://example.com/image.png'];

    for (const signatureUrl of unsafeSchemes) {
      expect(() =>
        ZCertificateDesign.parse({
          rendererTemplateId: 'modular',
          accentColor: '#D4AF37',
          signatories: [{ name: 'Signer', role: 'Dean', signatureUrl }]
        })
      ).toThrow();
    }

    expect(() =>
      ZCertificateDesign.parse({
        rendererTemplateId: 'modular',
        accentColor: '#D4AF37',
        signatories: [{ name: 'Signer', role: 'Dean', signatureUrl: 'http://localhost:5173/signature.png' }]
      })
    ).not.toThrow();

    // Custom border/seal URLs remain read-only legacy fields until the
    // organization-owned certificate asset pipeline exists.
    expect(() =>
      ZCertificateDesign.parse({
        rendererTemplateId: 'modular',
        accentColor: '#D4AF37',
        border: { style: 'custom_image', customImageUrl: 'https://example.com/border.png' }
      })
    ).toThrow();
  });

  it('rejects hidden required fields and out-of-bounds layouts', () => {
    expect(() =>
      ZCertificateDesign.parse({
        rendererTemplateId: 'modular',
        accentColor: '#D4AF37',
        elements: { recipient: { enabled: false } }
      })
    ).toThrow();

    expect(() =>
      ZCertificateDesign.parse({
        rendererTemplateId: 'modular',
        accentColor: '#D4AF37',
        elements: { title: { positionMode: 'custom', x: 1101, y: -1 } }
      })
    ).toThrow();

    expect(() =>
      ZCertificateDesign.parse({
        rendererTemplateId: 'modular',
        accentColor: '#D4AF37',
        elements: { title: { positionMode: 'custom', anchor: 'center' } }
      })
    ).toThrow();
  });
});

describe('organization certificate preset validation', () => {
  const design = {
    rendererTemplateId: 'modular',
    templateId: 'classique',
    accentColor: '#D4AF37'
  };

  it('normalizes preset names and descriptions', () => {
    const parsed = ZCreateOrgCertificatePreset.parse({
      name: '  Completion  ',
      description: '  Default certificate  ',
      design
    });

    expect(parsed.name).toBe('Completion');
    expect(parsed.description).toBe('Default certificate');
  });

  it('rejects unknown fields and empty updates', () => {
    expect(() => ZCreateOrgCertificatePreset.parse({ name: 'Completion', design, unexpected: true })).toThrow();
    expect(() => ZUpdateOrgCertificatePreset.parse({})).toThrow();
  });

  it('allows explicitly clearing a preset description', () => {
    expect(ZUpdateOrgCertificatePreset.parse({ description: null })).toEqual({ description: null });
  });
});
