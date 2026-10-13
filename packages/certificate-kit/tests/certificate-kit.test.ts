import { describe, expect, it } from 'vitest';
import {
  BUILTIN_CERTIFICATE_TEMPLATE_IDS,
  normalizeCertificateDesign,
  renderCertificatePreview,
  renderCertificatePreviewDocument,
  resolveTemplateId,
  STARTER_TEMPLATES,
  ZCertificateDesignV1
} from '../src';

describe('@classroomio/certificate-kit contract tests', () => {
  it('validates every built-in template and starter template', () => {
    for (const id of BUILTIN_CERTIFICATE_TEMPLATE_IDS) {
      expect(resolveTemplateId(id)).toBe(id);
      const normalized = normalizeCertificateDesign({ templateId: id });
      expect(normalized.templateId).toBe(id);
      expect(ZCertificateDesignV1.safeParse(normalized).success).toBe(true);
      expect(renderCertificatePreview(normalized).html).toContain('data-certificate-root');
    }

    for (const starter of STARTER_TEMPLATES) {
      expect(ZCertificateDesignV1.safeParse(starter.initialDesign).success).toBe(true);
      const preview = renderCertificatePreview(starter.initialDesign);
      expect(preview.html).toContain(starter.initialDesign.title);
      expect(preview.html).toContain(starter.initialDesign.accentColor);
    }
  });

  it('normalizes valid donor designs with element positioning, border, and badge', () => {
    const donorDesign = {
      templateId: 'classique',
      accentColor: '#D4AF37',
      title: 'Master of Engineering',
      subtitle: 'Awarded to',
      descriptionOverride: 'Excellence in distributed cloud infrastructure.',
      signatories: [
        { id: 'dean', name: 'Dr. Smith', role: 'Dean', enabled: true },
        { id: 'chair', name: 'Prof. Jones', role: 'Department Chair', enabled: true }
      ],
      border: {
        style: 'victorian',
        width: 14,
        primaryColor: '#D4AF37'
      },
      badge: {
        style: 'gold_seal',
        label: 'HONORS'
      },
      elements: {
        header: { enabled: true, positionMode: 'custom', x: 100, y: 50 },
        recipient: { enabled: true, positionMode: 'auto' }
      }
    };

    const normalized = normalizeCertificateDesign(donorDesign);
    expect(normalized.title).toBe('Master of Engineering');
    expect(normalized.signatories).toHaveLength(2);
    expect(normalized.border?.style).toBe('victorian');
    expect(normalized.badge?.label).toBe('HONORS');
    expect(normalized.elements?.header?.x).toBe(100);
  });

  it('safely handles unknown fields, malformed colors, and invalid URLs', () => {
    const malformed = {
      templateId: 'unknown-custom-tpl',
      accentColor: 'not-a-color-red',
      title: 'Test',
      unknownExtraField: 'should be stripped or ignored',
      signatories: [{ id: '1', name: 'A', role: 'R', enabled: true, signatureUrl: 'javascript:alert(1)' }]
    };

    const normalized = normalizeCertificateDesign(malformed);
    expect(normalized.accentColor).toBe('#d4af37');
    expect(normalized.signatories[0].signatureUrl).toBeUndefined();
    expect((normalized as any).unknownExtraField).toBeUndefined();
  });

  it('enforces maximum collection limits (signatories capped at 3)', () => {
    const overloaded = {
      templateId: 'classique',
      signatories: [
        { id: '1', name: 'One', role: 'R1' },
        { id: '2', name: 'Two', role: 'R2' },
        { id: '3', name: 'Three', role: 'R3' },
        { id: '4', name: 'Four', role: 'R4' },
        { id: '5', name: 'Five', role: 'R5' }
      ]
    };

    const normalized = normalizeCertificateDesign(overloaded);
    expect(normalized.signatories).toHaveLength(3);
  });

  it('renders a browser-safe document with CSP headers and Google Fonts link', () => {
    const design = STARTER_TEMPLATES[0].initialDesign;
    const documentHtml = renderCertificatePreviewDocument(design, {
      recipientName: 'Alice Developer',
      courseName: 'Kernel Engineering'
    });

    expect(documentHtml).toContain('<!DOCTYPE html>');
    expect(documentHtml).toContain('Content-Security-Policy');
    expect(documentHtml).toContain('Alice Developer');
    expect(documentHtml).toContain('Kernel Engineering');
    expect(documentHtml).toContain('fonts.googleapis.com');
    expect(documentHtml).toContain('data-certificate-root');
    expect(documentHtml).not.toContain('<script>');
  });

  it('renders the modular studio surface with selectable element metadata', () => {
    const design = normalizeCertificateDesign({
      ...STARTER_TEMPLATES[0].initialDesign,
      rendererTemplateId: 'modular',
      elements: {
        course: { positionMode: 'custom', x: 393, y: 270, width: 337, height: 64 }
      }
    });
    const preview = renderCertificatePreview(design);

    expect(preview.html).toContain('class="cert t-modular"');
    expect(preview.html).toContain('data-certificate-element="course"');
    expect(preview.html).toContain('data-position-mode="custom"');
    expect(preview.html).toContain('left:393px');
  });

  it('renders independently selectable and positioned signatories', () => {
    const design = normalizeCertificateDesign({
      ...STARTER_TEMPLATES[0].initialDesign,
      rendererTemplateId: 'modular',
      signatories: [
        { id: 'first', name: 'First Signer', role: 'Director', enabled: true },
        { id: 'second', name: 'Second Signer', role: 'Instructor', enabled: true }
      ],
      elements: {
        'signatory-0': { positionMode: 'custom', x: 120, y: 620, width: 230, height: 80 }
      }
    });
    const preview = renderCertificatePreview(design);

    expect(preview.html).toContain('data-certificate-element="signatory-0"');
    expect(preview.html).toContain('data-certificate-element="signatory-1"');
    expect(preview.html).toContain('left:120px');
  });

  it('applies modular border, background, badge, and credential variants', () => {
    const design = normalizeCertificateDesign({
      ...STARTER_TEMPLATES[0].initialDesign,
      rendererTemplateId: 'modular',
      border: { style: 'double_gold', width: 10 },
      background: { style: 'gradient', primaryColor: '#ffffff', secondaryColor: '#f3ede0' },
      badge: { style: 'wax_stamp', label: 'Verified' },
      qrCode: { enabled: true, position: 'top_right' }
    });
    const preview = renderCertificatePreview(design);

    expect(preview.html).toContain('modular-border-double_gold');
    expect(preview.html).toContain('modular-badge-wax_stamp');
    expect(preview.html).toContain('modular-credential-top_right');
    expect(preview.html).toContain('linear-gradient(135deg,#ffffff,#f3ede0)');
  });
});
