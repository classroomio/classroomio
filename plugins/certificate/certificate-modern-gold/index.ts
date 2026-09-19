import { definePlugin, type PluginDefinition } from '@cio/sdk';
import { createModernGoldTemplate } from './template.js';

export interface ModernGoldCertificateOptions {
  label?: string;
  description?: string;
}

/**
 * Modern Gold Certificate Plugin.
 * Registers the prestigious dark slate and gold certificate template.
 */
export function modernGoldCertificate(options: ModernGoldCertificateOptions = {}): PluginDefinition {
  return definePlugin({
    id: 'certificate_modern_gold',
    name: 'Modern Gold Certificate',
    version: '1.0.0',
    category: 'certificate',
    description:
      options.description ??
      'A prestigious dark slate and gold certificate template with custom typography and official seal.',
    certificateTemplates: [createModernGoldTemplate(options)]
  });
}

export default modernGoldCertificate;
