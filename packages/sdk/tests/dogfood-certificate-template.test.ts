import { describe, expect, it } from 'vitest';
import { defineConfig, resolveConfig } from '@cio/sdk';
import {
  resolveTemplateId,
  renderCertificate,
  CERTIFICATE_TEMPLATES,
  registerCertificateTemplates
} from '@cio/certificates';
import { modernGoldCertificate } from '@cio/plugins';

function resolveAndRegisterModernGold() {
  const config = defineConfig({
    plugins: [modernGoldCertificate()]
  });
  const resolved = resolveConfig(config);
  registerCertificateTemplates(Object.values(resolved.certificateTemplates));

  return resolved;
}

describe('Dogfood: Certificate Modern Gold Plugin', () => {
  it('registers clean plugin manifest via resolveConfig', () => {
    const resolved = resolveAndRegisterModernGold();

    expect(resolved.plugins).toHaveLength(1);
    expect(resolved.plugins[0].id).toBe('certificate_modern_gold');
    expect(resolved.plugins[0].category).toBe('certificate');
    expect(resolved.slots['certificate.template']).toBeUndefined();
    expect(resolved.certificateTemplates.modern_gold).toMatchObject({
      id: 'modern_gold',
      label: 'Modern Gold'
    });
  });

  it('registers custom template in @cio/certificates engine', () => {
    resolveAndRegisterModernGold();
    const templateId = resolveTemplateId('modern_gold');
    expect(templateId).toBe('modern_gold');

    const foundMeta = CERTIFICATE_TEMPLATES.find((t) => t.id === ('modern_gold' as any));
    expect(foundMeta).toBeDefined();
    expect(foundMeta?.label).toBe('Modern Gold');
  });

  it('does not let callers bypass SDK template validation at the host registry', () => {
    expect(() =>
      registerCertificateTemplates([
        {
          id: 'raw_template',
          label: 'Raw',
          description: 'Bypasses the SDK helper.',
          body: '<script>alert(1)</script>',
          styles: '.raw {}'
        }
      ])
    ).toThrow(/defineCertificateTemplate/i);
  });

  it('renders certificate HTML and styles using the modern gold renderer', () => {
    resolveAndRegisterModernGold();
    const { html, styles } = renderCertificate(
      {
        templateId: 'modern_gold' as any,
        accentColor: '#d4af37',
        signatories: [
          { name: 'Dr. Jane Smith', role: 'Head Instructor', enabled: true },
          { name: 'Prof. Alan Turing', role: 'Academic Dean', enabled: true }
        ]
      },
      {
        recipientName: 'Alice Developer',
        courseName: 'Distributed Systems & Cloud Computing',
        courseDescription: 'Mastery in building resilient systems.',
        orgName: 'Tech Academy',
        date: 'September 15, 2026',
        certificateId: 'CLS-CERT-2026-9999'
      }
    );

    expect(html).toContain('CERTIFICATE OF COMPLETION');
    expect(html).toContain('Alice Developer');
    expect(html).toContain('Distributed Systems &amp; Cloud Computing');
    expect(html).toContain('CLS-CERT-2026-9999');
    expect(styles).toContain('.t-modern-gold');
  });

  it('escapes user-controlled values before interpolating the declarative template', () => {
    resolveAndRegisterModernGold();
    const { html } = renderCertificate(
      {
        templateId: 'modern_gold',
        accentColor: '#d4af37',
        signatories: [
          { name: 'Instructor', role: 'Teacher', enabled: true },
          { name: 'Director', role: 'Lead', enabled: true }
        ]
      },
      {
        recipientName: '<script>alert(1)</script>',
        courseName: 'Security',
        courseDescription: 'Safe rendering',
        orgName: 'Academy',
        date: 'September 16, 2026',
        certificateId: 'CERT-1'
      }
    );

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});
