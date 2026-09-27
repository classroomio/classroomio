import { describe, expect, it } from 'vitest';
import {
  defineCertificateTemplate,
  defineConfig,
  definePlugin,
  resolveConfig,
  type CertificateTemplateDefinition
} from '@cio/sdk';

function template(id = 'sample_template') {
  return defineCertificateTemplate({
    id,
    label: 'Sample Template',
    description: 'A data-only certificate template.',
    body: '<div>{{recipientName}}</div>',
    styles: '.certificate { color: {{accentColor}}; }'
  });
}

describe('defineCertificateTemplate', () => {
  it('accepts a declarative template and aggregates it through resolveConfig', () => {
    const certificateTemplate = template();
    const plugin = definePlugin({
      id: 'certificate_sample',
      name: 'Sample Certificate',
      version: '1.0.0',
      category: 'certificate',
      description: 'Sample certificates.',
      certificateTemplates: [certificateTemplate]
    });
    const resolved = resolveConfig(defineConfig({ plugins: [plugin] }));

    expect(resolved.certificateTemplates.sample_template).toBe(certificateTemplate);
  });

  it('rejects raw template objects that bypass the helper', () => {
    const rawTemplate: CertificateTemplateDefinition = {
      id: 'sample_template',
      label: 'Sample Template',
      description: 'Raw template.',
      body: '<div></div>',
      styles: '.certificate {}'
    };

    expect(() =>
      definePlugin({
        id: 'certificate_sample',
        name: 'Sample Certificate',
        version: '1.0.0',
        category: 'certificate',
        description: 'Sample certificates.',
        certificateTemplates: [rawTemplate]
      })
    ).toThrow(/defineCertificateTemplate/i);
  });

  it.each([
    { body: '<script>alert(1)</script>', styles: '.certificate {}' },
    { body: '<div onclick="alert(1)"></div>', styles: '.certificate {}' },
    { body: '<div></div>', styles: '@import "https://example.com/evil.css";' }
  ])('rejects executable markup and remote-loading CSS', ({ body, styles }) => {
    expect(() =>
      defineCertificateTemplate({
        id: 'unsafe_template',
        label: 'Unsafe',
        description: 'Unsafe template.',
        body,
        styles
      })
    ).toThrow(/unsafe|executable|remote-loading/i);
  });

  it('rejects unknown placeholders', () => {
    expect(() =>
      defineCertificateTemplate({
        id: 'unknown_token',
        label: 'Unknown token',
        description: 'Uses an unsupported token.',
        body: '<div>{{password}}</div>',
        styles: '.certificate {}'
      })
    ).toThrow(/unknown placeholder/i);
  });

  it('rejects duplicate template ids across plugins', () => {
    const first = definePlugin({
      id: 'certificate_first',
      name: 'First',
      version: '1.0.0',
      category: 'certificate',
      description: 'First template.',
      certificateTemplates: [template('shared_template')]
    });
    const second = definePlugin({
      id: 'certificate_second',
      name: 'Second',
      version: '1.0.0',
      category: 'certificate',
      description: 'Second template.',
      certificateTemplates: [template('shared_template')]
    });

    expect(() => resolveConfig(defineConfig({ plugins: [first, second] }))).toThrow(/collision/i);
  });
});
