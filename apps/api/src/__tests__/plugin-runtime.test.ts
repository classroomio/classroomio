import { describe, expect, it } from 'vitest';
import { definePlugin } from '@cio/sdk';
import { initializePluginRuntime } from '@api/services/plugin/runtime';
import { getCertificateTemplate } from '@cio/certificates';

describe('API plugin runtime bootstrap', () => {
  it('registers configured certificate templates from plugins', () => {
    const plugin = definePlugin({
      id: 'certificate_runtime_test',
      name: 'Runtime test certificate',
      version: '1.0.0',
      category: 'certificate',
      description: 'Verifies API plugin bootstrap.',
      certificateTemplates: [
        {
          id: 'runtime_test_template',
          label: 'Runtime Test Template',
          renderHtml: () => '<div>Test</div>'
        }
      ]
    });

    initializePluginRuntime([plugin]);
    const template = getCertificateTemplate('runtime_test_template');

    expect(template).toBeDefined();
    expect(template?.label).toBe('Runtime Test Template');
  });
});
