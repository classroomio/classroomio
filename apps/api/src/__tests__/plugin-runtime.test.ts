import { describe, expect, it } from 'vitest';
import { definePlugin, defineCertificateTemplate } from '@cio/sdk';
import { initializePluginRuntime } from '@api/services/plugin/runtime';
import { CERTIFICATE_TEMPLATES } from '@cio/certificates';

describe('API plugin runtime bootstrap', () => {
  it('registers configured certificate templates from plugins', () => {
    const plugin = definePlugin({
      id: 'certificate_runtime_test',
      name: 'Runtime test certificate',
      version: '1.0.0',
      category: 'certificate',
      description: 'Verifies API plugin bootstrap.',
      certificateTemplates: [
        defineCertificateTemplate({
          id: 'runtime_test_template',
          label: 'Runtime Test Template',
          description: 'A test template for runtime registration',
          body: '<div>Test</div>',
          styles: '.test { color: red; }'
        })
      ]
    });

    initializePluginRuntime([plugin]);
    const template = CERTIFICATE_TEMPLATES.find((t) => t.id === 'runtime_test_template');

    expect(template).toBeDefined();
    expect(template?.label).toBe('Runtime Test Template');
  });
});
